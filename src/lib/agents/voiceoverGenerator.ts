import { generateWithImages, parseJsonResponse } from "../gemini/client";
import { generateVoiceoverBatchPrompt } from "../gemini/prompts";
import { SUPPORTED_LANGUAGES, type LanguageCode, type VoiceoverScript } from "@/types";

interface RawVoiceoverResponse {
    sceneIndex: number;
    script: string;
    wordCount: number;
    estimatedDuration: number;
    tone: "narrative" | "dramatic" | "informative" | "conversational";
}

/**
 * Generate voiceover scripts for a batch of scenes
 * @param frames - Array of base64 frame data URLs
 * @param language - Target language code
 * @param startSceneIndex - Starting scene index
 * @returns Promise<VoiceoverScript[]>
 */
export async function generateVoiceoverBatch(
    frames: string[],
    language: LanguageCode,
    startSceneIndex: number = 0
): Promise<VoiceoverScript[]> {
    if (frames.length === 0) {
        throw new Error("At least one frame is required");
    }

    const langInfo = SUPPORTED_LANGUAGES[language];
    console.log(`[VoiceoverGenerator] Generating ${frames.length} voiceovers in ${langInfo.name}...`);

    try {
        const batchPrompt = generateVoiceoverBatchPrompt(
            frames.length,
            langInfo.name,
            language
        );

        const responseText = await generateWithImages(batchPrompt, frames);
        const parsed = parseJsonResponse<RawVoiceoverResponse[]>(responseText);

        // Transform responses
        const voiceovers: VoiceoverScript[] = parsed.map((raw, index) => {
            const sceneIndex = startSceneIndex + index;

            return {
                sceneIndex,
                timeRange: formatTimeRange(sceneIndex * 8, (sceneIndex + 1) * 8),
                language,
                script: raw.script || "",
                wordCount: raw.wordCount || countWords(raw.script),
                estimatedDuration: raw.estimatedDuration || 8,
                tone: raw.tone || "narrative",
            };
        });

        console.log(`[VoiceoverGenerator] Generated ${voiceovers.length} voiceovers`);
        return voiceovers;

    } catch (error) {
        console.error("[VoiceoverGenerator] Error:", error);
        throw error;
    }
}

/**
 * Generate a single voiceover script
 */
export async function generateSingleVoiceover(
    frame: string,
    language: LanguageCode,
    sceneIndex: number,
    previousScript?: string
): Promise<VoiceoverScript> {
    const langInfo = SUPPORTED_LANGUAGES[language];

    let prompt = `Generate an 8-second voiceover script in ${langInfo.name} for this video frame.

RULES:
- Script length: approximately 20-30 words
- Duration: 8 seconds when spoken
- Tone: Match the visual mood
- DO NOT describe what's visible - provide context/story`;

    if (previousScript) {
        prompt += `\n\nPrevious scene script (for continuity):
"${previousScript}"`;
    }

    prompt += `\n
OUTPUT FORMAT (JSON):
{
  "script": "8-second script in ${langInfo.name}",
  "wordCount": number,
  "tone": "narrative|dramatic|informative|conversational"
}`;

    const responseText = await generateWithImages(prompt, [frame]);
    const parsed = parseJsonResponse<{
        script: string;
        wordCount: number;
        tone: "narrative" | "dramatic" | "informative" | "conversational";
    }>(responseText);

    return {
        sceneIndex,
        timeRange: formatTimeRange(sceneIndex * 8, (sceneIndex + 1) * 8),
        language,
        script: parsed.script,
        wordCount: parsed.wordCount || countWords(parsed.script),
        estimatedDuration: 8,
        tone: parsed.tone || "narrative",
    };
}

/**
 * Count words in a string
 */
function countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
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
