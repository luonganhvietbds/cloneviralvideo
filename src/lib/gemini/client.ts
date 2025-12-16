/**
 * Client-side wrapper for Gemini API calls
 * Calls serverless function instead of SDK directly to avoid CSP issues
 */

const API_ENDPOINT = "/api/gemini";

let currentApiKey: string | null = null;
let currentModel = "gemini-2.5-flash-preview-05-20";

/**
 * Initialize the Gemini client with API key
 */
export function initGemini(apiKey: string): void {
    currentApiKey = apiKey;
    console.log("[Gemini] API key set (will use server-side proxy)");
}

/**
 * Set the model to use
 */
export function setModel(model: string): void {
    currentModel = model;
}

/**
 * Get the current model
 */
export function getModel(): string {
    return currentModel;
}

interface GeminiRequestOptions {
    prompt: string;
    images?: string[];
    systemInstruction?: string;
}

interface GeminiResponse {
    text: string;
}

/**
 * Generate content using the Gemini API via serverless proxy
 */
export async function generateContent(options: GeminiRequestOptions): Promise<string> {
    if (!currentApiKey) {
        throw new Error("API key not set. Call initGemini() first.");
    }

    const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            apiKey: currentApiKey,
            prompt: options.prompt,
            images: options.images,
            systemInstruction: options.systemInstruction,
            model: currentModel,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || `API request failed with status ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    return data.text;
}

/**
 * Generate content with images (for backward compatibility with agents)
 */
export async function generateWithImages(
    prompt: string,
    images: string[],
    systemInstruction?: string
): Promise<string> {
    return generateContent({
        prompt,
        images,
        systemInstruction,
    });
}

/**
 * Generate text without images
 */
export async function generateText(
    prompt: string,
    systemInstruction?: string
): Promise<string> {
    return generateContent({
        prompt,
        systemInstruction,
    });
}

/**
 * Parse JSON response from Gemini with error handling
 */
export function parseJsonResponse<T>(text: string): T {
    // Remove markdown code blocks if present
    let cleanedText = text.trim();

    // Remove ```json and ``` markers
    if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
    }

    if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
    }

    cleanedText = cleanedText.trim();

    try {
        return JSON.parse(cleanedText) as T;
    } catch (error) {
        console.error("[Gemini] Failed to parse JSON response:", cleanedText);
        throw new Error("Failed to parse Gemini response as JSON");
    }
}

/**
 * Analyze images with Gemini Vision (alias for generateWithImages)
 */
export async function analyzeImages(
    images: string[],
    prompt: string,
    systemInstruction?: string
): Promise<string> {
    return generateWithImages(prompt, images, systemInstruction);
}
