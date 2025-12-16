import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;
let currentApiKey: string | null = null;

const MODEL_NAME = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash-preview-05-20";

/**
 * Initialize Gemini client with API key
 * @param apiKey - The Gemini API key
 * @returns The GenerativeModel instance
 */
export function initGemini(apiKey: string): GenerativeModel {
    // Only reinitialize if key changed
    if (currentApiKey === apiKey && model) {
        return model;
    }

    client = new GoogleGenerativeAI(apiKey);
    model = client.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
        },
    });

    currentApiKey = apiKey;
    console.log(`[Gemini] Initialized with model: ${MODEL_NAME}`);

    return model;
}

/**
 * Get the current Gemini model instance
 * @throws Error if not initialized
 */
export function getModel(): GenerativeModel {
    if (!model) {
        throw new Error("Gemini not initialized. Call initGemini() first.");
    }
    return model;
}

/**
 * Check if Gemini is initialized
 */
export function isGeminiInitialized(): boolean {
    return model !== null;
}

/**
 * Send content to Gemini with images
 * @param textPrompt - The text prompt
 * @param images - Array of base64 image data URLs
 * @returns Promise<string> - The response text
 */
export async function generateWithImages(
    textPrompt: string,
    images: string[]
): Promise<string> {
    const model = getModel();

    // Convert data URLs to inline data parts
    const imageParts = images.map((dataUrl) => {
        // Extract base64 data and mime type
        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            throw new Error("Invalid image data URL format");
        }

        return {
            inlineData: {
                mimeType: matches[1],
                data: matches[2],
            },
        };
    });

    const result = await model.generateContent([
        { text: textPrompt },
        ...imageParts,
    ]);

    const response = result.response;
    return response.text();
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 */
export function parseJsonResponse<T>(text: string): T {
    // Remove markdown code blocks if present
    let jsonText = text.trim();

    if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
    }

    if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
    }

    return JSON.parse(jsonText.trim());
}
