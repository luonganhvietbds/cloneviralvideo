import { generateWithImages, parseJsonResponse } from "../gemini/client";
import { IMAGE_PROMPT_SYSTEM, VIDEO_PROMPT_SYSTEM, generateBatchPrompt } from "../gemini/prompts";
import type { GeneratedPrompt, OCRTextResult } from "@/types";

interface RawPromptResponse {
    sceneIndex: number;
    timeRange: string;
    shotType: string;
    imagePrompt: string;
    videoPrompt: string;
    ocrText?: Array<{
        text: string;
        position?: { x: number; y: number; width: number; height: number };
        style?: { fontStyle: string; fontSize: string; color: string };
    }>;
}

/**
 * Generate prompts for a batch of scenes
 * @param frames - Array of base64 frame data URLs
 * @param batchIndex - Current batch index (0-based)
 * @param globalStyleToken - The extracted style token string
 * @param startSceneIndex - Starting scene index for numbering
 * @returns Promise<GeneratedPrompt[]>
 */
export async function generatePromptBatch(
    frames: string[],
    batchIndex: number,
    globalStyleToken: string,
    startSceneIndex: number = 0
): Promise<GeneratedPrompt[]> {
    if (frames.length === 0) {
        throw new Error("At least one frame is required");
    }

    console.log(`[PromptGenerator] Generating batch ${batchIndex + 1} with ${frames.length} frames...`);

    try {
        const batchPrompt = generateBatchPrompt(batchIndex, frames.length, globalStyleToken);

        const responseText = await generateWithImages(batchPrompt, frames);

        const parsed = parseJsonResponse<RawPromptResponse[]>(responseText);

        // Transform and validate responses
        const prompts: GeneratedPrompt[] = parsed.map((raw, index) => {
            const sceneIndex = startSceneIndex + index;
            const timeRange = raw.timeRange || formatTimeRange(sceneIndex * 8, (sceneIndex + 1) * 8);

            // Ensure prompts end with style token
            let imagePrompt = raw.imagePrompt || "";
            let videoPrompt = raw.videoPrompt || "";

            if (!imagePrompt.includes("[Global Style Token PRO+]")) {
                imagePrompt += ` [Global Style Token PRO+]`;
            }
            if (!videoPrompt.includes("[Global Style Token PRO+]")) {
                videoPrompt += ` [Global Style Token PRO+]`;
            }

            // Transform OCR text
            const ocrText: OCRTextResult[] = (raw.ocrText || []).map((t) => ({
                text: t.text,
                position: t.position || { x: 0, y: 0, width: 0, height: 0 },
                style: t.style || { fontStyle: "sans-serif", fontSize: "medium", color: "#ffffff" },
            }));

            return {
                sceneIndex,
                timeRange,
                imagePrompt,
                videoPrompt,
                shotType: raw.shotType || "Medium Shot",
                ocrText,
                qualityScore: 0, // Will be filled by validator
                missingFactors: [],
            };
        });

        console.log(`[PromptGenerator] Generated ${prompts.length} prompts`);
        return prompts;

    } catch (error) {
        console.error("[PromptGenerator] Error:", error);
        throw error;
    }
}

/**
 * Generate a single IMAGE PROMPT for one frame
 */
export async function generateSingleImagePrompt(
    frame: string,
    globalStyleToken: string
): Promise<string> {
    const prompt = `${IMAGE_PROMPT_SYSTEM}

GLOBAL STYLE TOKEN: "${globalStyleToken}"

Analyze this frame and generate the IMAGE PROMPT (one paragraph).
Output ONLY the prompt text, ending with [Global Style Token PRO+].`;

    const response = await generateWithImages(prompt, [frame]);
    let imagePrompt = response.trim();

    if (!imagePrompt.includes("[Global Style Token PRO+]")) {
        imagePrompt += ` [Global Style Token PRO+]`;
    }

    return imagePrompt;
}

/**
 * Generate a single VIDEO PROMPT for one frame
 */
export async function generateSingleVideoPrompt(
    frame: string,
    imagePrompt: string,
    globalStyleToken: string
): Promise<string> {
    const prompt = `${VIDEO_PROMPT_SYSTEM}

GLOBAL STYLE TOKEN: "${globalStyleToken}"

The IMAGE PROMPT for this scene is:
"${imagePrompt}"

Now generate the VIDEO PROMPT describing ONLY the motion (one paragraph).
Output ONLY the prompt text, ending with [Global Style Token PRO+].`;

    const response = await generateWithImages(prompt, [frame]);
    let videoPrompt = response.trim();

    if (!videoPrompt.includes("[Global Style Token PRO+]")) {
        videoPrompt += ` [Global Style Token PRO+]`;
    }

    return videoPrompt;
}

/**
 * Format time range from seconds
 */
function formatTimeRange(startSeconds: number, endSeconds: number): string {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    return `${formatTime(startSeconds)}-${formatTime(endSeconds)}`;
}
