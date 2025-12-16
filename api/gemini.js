// Vercel Serverless Function for Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { apiKey, prompt, images, systemInstruction, model } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: "API key is required" });
        }

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
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

        return res.status(200).json({ text });
    } catch (error) {
        console.error("[Gemini API] Error:", error);
        return res.status(500).json({
            error: error.message || "Failed to generate content",
        });
    }
}
