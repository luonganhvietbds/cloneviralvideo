import type { GeneratedPrompt, VoiceoverScript, GlobalStyleTokenPRO, ExportOptions, LanguageCode } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/types";

interface ExportData {
    prompts: GeneratedPrompt[];
    voiceovers: VoiceoverScript[];
    globalStyle: GlobalStyleTokenPRO;
    metadata: {
        fileName: string;
        duration: number;
        totalScenes: number;
    };
    voiceoverLanguage: LanguageCode;
}

/**
 * Generate export content in TXT format
 */
export function generateTxtExport(data: ExportData): string {
    const { prompts, voiceovers, globalStyle, metadata, voiceoverLanguage } = data;
    const langInfo = SUPPORTED_LANGUAGES[voiceoverLanguage];

    let content = `================================================================================
VEO3 REPLICATOR ELITE — ULTRA MODE v3.7
================================================================================
Source: ${metadata.fileName}
Duration: ${metadata.duration}s
Total Scenes: ${metadata.totalScenes}
Voiceover Language: ${langInfo.name} (${langInfo.native})
Global Style Token: ${globalStyle.tokenString}
Generated: ${new Date().toISOString()}
================================================================================

`;

    // Add each scene
    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const voiceover = voiceovers.find((v) => v.sceneIndex === prompt.sceneIndex);

        content += `--- SCENE ${prompt.sceneIndex + 1} | ${prompt.timeRange} | ${prompt.shotType} ---

[IMAGE PROMPT]
${prompt.imagePrompt}

[VIDEO PROMPT]
${prompt.videoPrompt}

[VOICEOVER - ${langInfo.native}]
${voiceover?.script || "(No voiceover)"}

================================================================================

`;
    }

    return content;
}

/**
 * Generate export content in JSON format
 */
export function generateJsonExport(data: ExportData): string {
    const { prompts, voiceovers, globalStyle, metadata, voiceoverLanguage } = data;

    const exportObj = {
        version: "3.7",
        generatedAt: new Date().toISOString(),
        metadata: {
            source: metadata.fileName,
            duration: metadata.duration,
            totalScenes: metadata.totalScenes,
            voiceoverLanguage,
        },
        globalStyleToken: {
            tokenString: globalStyle.tokenString,
            artStyle: globalStyle.artStyle,
            renderQuality: globalStyle.renderQuality,
            colorPalette: globalStyle.colorPalette,
            cameraStyle: globalStyle.cameraStyle,
            motionStyle: globalStyle.motionStyle,
        },
        scenes: prompts.map((prompt) => {
            const voiceover = voiceovers.find((v) => v.sceneIndex === prompt.sceneIndex);
            return {
                index: prompt.sceneIndex + 1,
                timeRange: prompt.timeRange,
                shotType: prompt.shotType,
                imagePrompt: prompt.imagePrompt,
                videoPrompt: prompt.videoPrompt,
                voiceover: voiceover
                    ? {
                        language: voiceover.language,
                        script: voiceover.script,
                        wordCount: voiceover.wordCount,
                        tone: voiceover.tone,
                    }
                    : null,
                qualityScore: prompt.qualityScore,
                ocrText: prompt.ocrText,
            };
        }),
    };

    return JSON.stringify(exportObj, null, 2);
}

/**
 * Generate export content in CSV format
 */
export function generateCsvExport(data: ExportData): string {
    const { prompts, voiceovers, voiceoverLanguage } = data;
    const langInfo = SUPPORTED_LANGUAGES[voiceoverLanguage];

    // CSV header
    let csv = "Scene,TimeRange,ShotType,ImagePrompt,VideoPrompt,VoiceoverLanguage,VoiceoverScript\n";

    // CSV rows
    for (const prompt of prompts) {
        const voiceover = voiceovers.find((v) => v.sceneIndex === prompt.sceneIndex);
        const row = [
            prompt.sceneIndex + 1,
            prompt.timeRange,
            prompt.shotType,
            `"${escapeCSV(prompt.imagePrompt)}"`,
            `"${escapeCSV(prompt.videoPrompt)}"`,
            langInfo.name,
            `"${escapeCSV(voiceover?.script || "")}"`,
        ];
        csv += row.join(",") + "\n";
    }

    return csv;
}

/**
 * Escape special characters for CSV
 */
function escapeCSV(str: string): string {
    return str.replace(/"/g, '""').replace(/\n/g, " ");
}

/**
 * Download content as file
 */
export async function downloadAsFile(
    content: string,
    filename: string,
    mimeType: string = "text/plain"
): Promise<void> {
    // Try File System Access API for modern browsers
    if ("showSaveFilePicker" in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: "Export File",
                        accept: { [mimeType]: [`.${filename.split(".").pop()}`] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            return;
        } catch (e) {
            // User cancelled or API not available
        }
    }

    // Fallback to download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export with options
 */
export async function exportPrompts(
    data: ExportData,
    options: ExportOptions
): Promise<void> {
    const baseFilename = data.metadata.fileName.replace(/\.[^/.]+$/, "") || "veo3_prompts";

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
        case "json":
            content = generateJsonExport(data);
            filename = `${baseFilename}.json`;
            mimeType = "application/json";
            break;
        case "csv":
            content = generateCsvExport(data);
            filename = `${baseFilename}.csv`;
            mimeType = "text/csv";
            break;
        case "txt":
        default:
            content = generateTxtExport(data);
            filename = `${baseFilename}.txt`;
            mimeType = "text/plain";
            break;
    }

    await downloadAsFile(content, filename, mimeType);
}
