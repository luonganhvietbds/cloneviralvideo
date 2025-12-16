"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, FileJson, Sheet, ChevronDown } from "lucide-react";
import { exportPrompts } from "@/lib/utils/export";
import { useAnalysisStore } from "@/stores/analysisStore";
import type { ExportFormat } from "@/types";

export function ExportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { prompts, voiceovers, globalStyle, metadata, videoFile, voiceoverSettings } = useAnalysisStore();

    const canExport = prompts.length > 0 && globalStyle && metadata;

    const handleExport = async (format: ExportFormat) => {
        if (!canExport) return;

        setIsExporting(true);
        setIsOpen(false);

        try {
            await exportPrompts(
                {
                    prompts,
                    voiceovers,
                    globalStyle,
                    metadata: {
                        fileName: videoFile?.name || "video",
                        duration: metadata.duration,
                        totalScenes: prompts.length,
                    },
                    voiceoverLanguage: voiceoverSettings.defaultLanguage,
                },
                {
                    format,
                    includeVoiceover: true,
                    includeQualityScores: true,
                    includeOCRText: true,
                }
            );

            toast.success(`Đã export ${prompts.length} scenes dạng ${format.toUpperCase()}!`);
        } catch (error) {
            toast.error("Export thất bại: " + (error instanceof Error ? error.message : "Unknown"));
        } finally {
            setIsExporting(false);
        }
    };

    const formats: { id: ExportFormat; label: string; icon: any; desc: string }[] = [
        { id: "txt", label: "Text (.txt)", icon: FileText, desc: "Human-readable format" },
        { id: "json", label: "JSON (.json)", icon: FileJson, desc: "Structured data" },
        { id: "csv", label: "CSV (.csv)", icon: Sheet, desc: "Spreadsheet format" },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={!canExport || isExporting}
                className={`
          btn-primary flex items-center gap-2
          ${!canExport ? "opacity-50 cursor-not-allowed" : ""}
          ${isExporting ? "animate-pulse" : ""}
        `}
            >
                <Download className="w-4 h-4" />
                {isExporting ? "Đang export..." : "Export Prompts"}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && canExport && (
                <div className="absolute top-full right-0 mt-2 w-48 py-2 rounded-lg bg-surface-1 border border-border shadow-xl z-10 animate-fade-in">
                    {formats.map(({ id, label, icon: Icon, desc }) => (
                        <button
                            key={id}
                            onClick={() => handleExport(id)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-2 transition-colors text-left"
                        >
                            <Icon className="w-4 h-4 text-primary" />
                            <div>
                                <div className="text-sm font-medium">{label}</div>
                                <div className="text-xs text-foreground/50">{desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
