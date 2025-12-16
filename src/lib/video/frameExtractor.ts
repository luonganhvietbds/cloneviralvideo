"use client";

import type { ExtractedFrame } from "@/types";

/**
 * Extract keyframes from video using HTML5 Canvas API
 * This approach doesn't require FFmpeg WASM and has no CSP issues
 * 
 * @param videoFile - The video file to extract frames from
 * @param intervalSeconds - Interval between frames (default 8s for VEO3)
 * @param onProgress - Progress callback (0-100)
 * @returns Promise<ExtractedFrame[]>
 */
export async function extractFrames(
    videoFile: File,
    intervalSeconds: number = 8,
    onProgress?: (progress: number) => void
): Promise<ExtractedFrame[]> {
    const videoUrl = URL.createObjectURL(videoFile);
    const extractedFrames: ExtractedFrame[] = [];

    try {
        // Create video element
        const video = document.createElement("video");
        video.src = videoUrl;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;

        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error("Failed to load video"));
        });

        onProgress?.(10);

        const duration = video.duration;
        const frameCount = Math.floor(duration / intervalSeconds);

        // Create canvas for frame capture
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }

        onProgress?.(20);

        // Extract frames at each interval
        for (let i = 0; i < frameCount; i++) {
            const timestamp = i * intervalSeconds;

            // Seek to timestamp
            video.currentTime = timestamp;

            // Wait for seek to complete
            await new Promise<void>((resolve) => {
                video.onseeked = () => resolve();
            });

            // Draw frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to data URL
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

            extractedFrames.push({
                sceneIndex: i,
                timestamp,
                timeRange: formatTimeRange(timestamp, timestamp + intervalSeconds),
                dataUrl,
            });

            // Update progress
            const progress = 20 + ((i + 1) / frameCount) * 70;
            onProgress?.(Math.round(progress));
        }

        onProgress?.(100);
        return extractedFrames;

    } finally {
        URL.revokeObjectURL(videoUrl);
    }
}

/**
 * Extract a single frame at specific timestamp using Canvas API
 */
export async function extractSingleFrame(
    videoFile: File,
    timestamp: number
): Promise<string> {
    const videoUrl = URL.createObjectURL(videoFile);

    try {
        const video = document.createElement("video");
        video.src = videoUrl;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;

        // Wait for metadata
        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error("Failed to load video"));
        });

        // Seek to timestamp
        video.currentTime = timestamp;
        await new Promise<void>((resolve) => {
            video.onseeked = () => resolve();
        });

        // Create canvas and draw
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.85);

    } finally {
        URL.revokeObjectURL(videoUrl);
    }
}

/**
 * Format time range string
 */
function formatTimeRange(start: number, end: number): string {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    return `${formatTime(start)}-${formatTime(end)}`;
}

/**
 * No-op functions for compatibility (FFmpeg not needed)
 */
export async function loadFFmpeg(): Promise<void> {
    // Canvas API doesn't need loading
    console.log("[FrameExtractor] Using Canvas API - no FFmpeg needed");
}

export function isFFmpegLoading(): boolean {
    return false;
}

export function isFFmpegLoaded(): boolean {
    return true; // Always "loaded" since we use Canvas
}
