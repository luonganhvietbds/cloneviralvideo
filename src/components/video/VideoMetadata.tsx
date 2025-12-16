"use client";

import { Clock, Film, Layers, Calculator } from "lucide-react";
import type { VideoMetadata } from "@/types";

interface VideoMetadataDisplayProps {
    metadata: VideoMetadata;
}

export function VideoMetadataDisplay({ metadata }: VideoMetadataDisplayProps) {
    const sceneCount = Math.floor(metadata.duration / 8);
    const batchCount = Math.ceil(sceneCount / 5);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    return (
        <div className="card animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" />
                Video Metadata
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                    <div className="flex items-center gap-2 text-foreground/60 text-xs mb-1">
                        <Clock className="w-3 h-3" />
                        TỔNG THỜI GIAN
                    </div>
                    <div className="text-xl font-bold gradient-text">
                        {formatDuration(metadata.duration)}
                    </div>
                    <div className="text-xs text-foreground/40">
                        ({metadata.duration.toFixed(1)}s)
                    </div>
                </div>

                {/* Scene Count */}
                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                    <div className="flex items-center gap-2 text-foreground/60 text-xs mb-1">
                        <Layers className="w-3 h-3" />
                        SỐ LƯỢNG SCENES
                    </div>
                    <div className="text-xl font-bold gradient-text">
                        {sceneCount}
                    </div>
                    <div className="text-xs text-foreground/40">
                        ({batchCount} batches)
                    </div>
                </div>

                {/* Resolution */}
                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                    <div className="text-xs text-foreground/60 mb-1">ĐỘ PHÂN GIẢI</div>
                    <div className="font-semibold">
                        {metadata.width} × {metadata.height}
                    </div>
                </div>

                {/* File Size */}
                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                    <div className="text-xs text-foreground/60 mb-1">DUNG LƯỢNG</div>
                    <div className="font-semibold">
                        {formatFileSize(metadata.fileSize)}
                    </div>
                </div>
            </div>

            {/* Formula explanation */}
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                    <Calculator className="w-4 h-4 text-primary" />
                    <span className="font-medium">CÔNG THỨC VEO3:</span>
                </div>
                <div className="text-xs text-foreground/60 mt-1 font-mono">
                    {metadata.duration.toFixed(1)}s ÷ 8s = {sceneCount} scenes → {sceneCount * 3} prompts (IMAGE + VIDEO + VOICEOVER)
                </div>
            </div>
        </div>
    );
}
