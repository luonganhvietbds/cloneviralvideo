"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAnalysisStore, useSettingsStore } from "@/stores/analysisStore";
import { initGemini } from "@/lib/gemini/client";
import { extractFrames, loadFFmpeg } from "@/lib/video/frameExtractor";
import { extractGlobalStyle } from "@/lib/agents/styleExtractor";
import { generatePromptBatch } from "@/lib/agents/promptGenerator";
import { generateVoiceoverBatch } from "@/lib/agents/voiceoverGenerator";
import type { LanguageCode } from "@/types";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000; // Delay between batches to avoid rate limiting

export function useVideoAnalysis() {
    const store = useAnalysisStore();
    const { apiKeys, rotateKey } = useSettingsStore();
    const abortRef = useRef(false);

    /**
     * Start the full analysis pipeline
     */
    const startAnalysis = useCallback(async () => {
        if (!store.videoFile) {
            toast.error("Vui lòng upload video trước!");
            return;
        }

        if (apiKeys.length === 0) {
            toast.error("Vui lòng thêm API Key trước!");
            return;
        }

        abortRef.current = false;

        try {
            // Initialize Gemini with first API key
            initGemini(apiKeys[0]);

            // Step 1: Initialize frame extractor (Canvas API - no loading needed)
            store.setState("EXTRACTING_FRAMES");
            await loadFFmpeg(); // No-op for Canvas API

            if (abortRef.current) return;

            // Step 2: Extract frames
            toast.info("Đang trích xuất frames...");
            const frames = await extractFrames(store.videoFile, 8, (progress) => {
                // Update progress in store if needed
                console.log(`Frame extraction: ${progress}%`);
            });
            store.addFrames(frames);

            if (abortRef.current) return;

            // Step 3: Extract Global Style Token
            store.setState("DETECTING_STYLE");
            toast.info("Đang phát hiện Global Style Token...");
            const sampleFrames = frames.slice(0, Math.min(5, frames.length)).map((f) => f.dataUrl);
            const globalStyle = await extractGlobalStyle(sampleFrames);
            store.setGlobalStyle(globalStyle);

            if (abortRef.current) return;

            // Step 4: Generate prompts in batches
            store.setState("GENERATING_PROMPTS");
            toast.info("Đang generate prompts...");
            const totalScenes = frames.length;
            const totalBatches = Math.ceil(totalScenes / BATCH_SIZE);
            store.setProgress(0, totalBatches, "batch");

            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                if (abortRef.current) return;

                const startIdx = batchIndex * BATCH_SIZE;
                const endIdx = Math.min(startIdx + BATCH_SIZE, totalScenes);
                const batchFrames = frames.slice(startIdx, endIdx).map((f) => f.dataUrl);

                try {
                    const prompts = await generatePromptBatch(
                        batchFrames,
                        batchIndex,
                        globalStyle.tokenString,
                        startIdx
                    );

                    prompts.forEach((p) => store.addPrompt(p));
                    store.setProgress(batchIndex + 1, totalBatches, "batch");
                    store.setProgress(endIdx, totalScenes, "scene");

                    // Delay between batches
                    if (batchIndex < totalBatches - 1) {
                        await delay(BATCH_DELAY_MS);
                    }
                } catch (error) {
                    // Try rotating API key on error
                    const newKey = rotateKey();
                    if (newKey) {
                        initGemini(newKey);
                        toast.warning("Đã chuyển sang API key khác");
                        batchIndex--; // Retry this batch
                        await delay(BATCH_DELAY_MS);
                    } else {
                        throw error;
                    }
                }
            }

            if (abortRef.current) return;

            // Step 5: Generate voiceovers
            store.setState("GENERATING_VOICEOVERS");
            toast.info("Đang generate voiceovers...");
            const { voiceoverSettings } = store;

            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                if (abortRef.current) return;

                const startIdx = batchIndex * BATCH_SIZE;
                const endIdx = Math.min(startIdx + BATCH_SIZE, totalScenes);
                const batchFrames = frames.slice(startIdx, endIdx).map((f) => f.dataUrl);

                // Determine language for each scene in batch
                const language = voiceoverSettings.mode === "global"
                    ? voiceoverSettings.defaultLanguage
                    : voiceoverSettings.defaultLanguage; // Per-scene will be handled separately

                try {
                    const voiceovers = await generateVoiceoverBatch(
                        batchFrames,
                        language,
                        startIdx
                    );

                    voiceovers.forEach((v) => store.addVoiceover(v));
                    store.setProgress(batchIndex + 1, totalBatches, "batch");
                    store.setProgress(endIdx, totalScenes, "scene");

                    if (batchIndex < totalBatches - 1) {
                        await delay(BATCH_DELAY_MS);
                    }
                } catch (error) {
                    const newKey = rotateKey();
                    if (newKey) {
                        initGemini(newKey);
                        batchIndex--;
                        await delay(BATCH_DELAY_MS);
                    } else {
                        throw error;
                    }
                }
            }

            // Complete!
            store.setState("COMPLETE");
            toast.success(`Hoàn thành! Đã generate ${totalScenes} scenes.`);

        } catch (error) {
            console.error("[Analysis] Error:", error);
            store.setError(error instanceof Error ? error.message : "Unknown error");
            toast.error("Có lỗi xảy ra: " + (error instanceof Error ? error.message : "Unknown"));
        }
    }, [store, apiKeys, rotateKey]);

    /**
     * Stop the analysis
     */
    const stopAnalysis = useCallback(() => {
        abortRef.current = true;
        toast.info("Đã dừng phân tích");
    }, []);

    /**
     * Reset everything
     */
    const resetAnalysis = useCallback(() => {
        store.reset();
        toast.info("Đã reset");
    }, [store]);

    return {
        ...store,
        startAnalysis,
        stopAnalysis,
        resetAnalysis,
    };
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
