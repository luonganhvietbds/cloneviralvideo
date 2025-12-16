import { generateWithImages, parseJsonResponse } from "../gemini/client";
import { STYLE_EXTRACTION_PROMPT } from "../gemini/prompts";
import type { GlobalStyleTokenPRO, FidelityElement } from "@/types";

/**
 * Extract Global Style Token PRO+ from sample frames
 * @param sampleFrames - Array of base64 data URLs (3-5 frames recommended)
 * @returns Promise<GlobalStyleTokenPRO>
 */
export async function extractGlobalStyle(
    sampleFrames: string[]
): Promise<GlobalStyleTokenPRO> {
    if (sampleFrames.length === 0) {
        throw new Error("At least one sample frame is required");
    }

    console.log(`[StyleExtractor] Analyzing ${sampleFrames.length} frames...`);

    try {
        const responseText = await generateWithImages(
            STYLE_EXTRACTION_PROMPT,
            sampleFrames
        );

        const parsed = parseJsonResponse<RawStyleResponse>(responseText);

        // Validate and transform response
        const globalStyle: GlobalStyleTokenPRO = {
            artStyle: parsed.artStyle || "Cinematic",
            renderQuality: parsed.renderQuality || "4K",
            lineWeight: parsed.lineWeight || "sharp",
            lineStyle: parsed.lineStyle || "photographic",
            colorPalette: parsed.colorPalette || [],
            colorHarmony: parsed.colorHarmony || "complementary",
            shadingStyle: parsed.shadingStyle || "soft volumetric",
            contrastLevel: parsed.contrastLevel || "high",
            cameraStyle: parsed.cameraStyle || "stabilized",
            lensCharacter: parsed.lensCharacter || "35mm",
            motionStyle: parsed.motionStyle || "smooth",
            physicsRealism: parsed.physicsRealism || "realistic",
            backgroundStyle: parsed.backgroundStyle || "detailed",
            depthTreatment: parsed.depthTreatment || "shallow DOF",
            textStyle: parsed.textStyle || "",
            textAnimation: parsed.textAnimation || "",
            tokenString: parsed.tokenString || buildTokenString(parsed),
            fidelityElements: parsed.fidelityElements || generateDefaultFidelityElements(),
        };

        console.log("[StyleExtractor] Extracted token:", globalStyle.tokenString);
        return globalStyle;

    } catch (error) {
        console.error("[StyleExtractor] Error:", error);
        throw error;
    }
}

interface RawStyleResponse {
    artStyle?: string;
    renderQuality?: string;
    lineWeight?: string;
    lineStyle?: string;
    colorPalette?: string[];
    colorHarmony?: string;
    shadingStyle?: string;
    contrastLevel?: string;
    cameraStyle?: string;
    lensCharacter?: string;
    motionStyle?: string;
    physicsRealism?: string;
    backgroundStyle?: string;
    depthTreatment?: string;
    textStyle?: string | null;
    textAnimation?: string | null;
    tokenString?: string;
    fidelityElements?: FidelityElement[];
}

/**
 * Build token string from parsed response
 */
function buildTokenString(parsed: RawStyleResponse): string {
    const parts = [
        parsed.artStyle,
        parsed.renderQuality,
        parsed.cameraStyle,
        parsed.lensCharacter,
        parsed.shadingStyle,
        parsed.contrastLevel + " contrast",
        parsed.motionStyle + " motion",
    ].filter(Boolean);

    return parts.join(", ");
}

/**
 * Generate default fidelity elements if not provided
 */
function generateDefaultFidelityElements(): FidelityElement[] {
    return [
        { factor: "Character Anatomy", description: "Body proportions and pose", value: "natural proportions" },
        { factor: "Facial Construction", description: "Face structure rules", value: "realistic features" },
        { factor: "Material Surface", description: "Texture behavior", value: "physically accurate" },
        { factor: "Lighting Temperature", description: "Color temperature", value: "neutral to warm" },
        { factor: "Shadow Behavior", description: "Shadow casting", value: "soft diffused" },
        { factor: "Highlight Behavior", description: "Specular/reflection", value: "natural highlights" },
        { factor: "Geometry Simplification", description: "Detail level", value: "high detail" },
        { factor: "Perspective Rules", description: "Camera perspective", value: "natural perspective" },
        { factor: "Background Density", description: "Background complexity", value: "contextual" },
        { factor: "Object Interaction", description: "Physics of contact", value: "realistic" },
        { factor: "Transition Language", description: "Scene transitions", value: "smooth cuts" },
        { factor: "Timing Rhythm", description: "Motion pacing", value: "natural timing" },
        { factor: "Secondary Motion", description: "Subsidiary movement", value: "subtle" },
        { factor: "Continuity Rules", description: "Cross-scene consistency", value: "maintained" },
    ];
}
