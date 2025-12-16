// Netlify Function for Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async (req, context) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { apiKey, prompt, images, systemInstruction, model } = await req.json();

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "API key is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
            model: model || "gemini-2.5-flash-preview-05-20",
            systemInstruction: systemInstruction || undefined,
        });

        // Build content parts
        const parts = [];

        // Add images if provided (base64 data URLs)
        if (images && Array.isArray(images)) {
            for (const imageDataUrl of images) {
                if (imageDataUrl.startsWith("data:")) {
                    const [meta, base64] = imageDataUrl.split(",");
                    const mimeType = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
                    parts.push({
                        inlineData: {
                            mimeType,
                            data: base64,
                        },
                    });
                }
            }
        }

        // Add text prompt
        parts.push({ text: prompt });

        const result = await geminiModel.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("[Gemini API] Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to generate content" }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
};

export const config = {
    path: "/api/gemini",
};
