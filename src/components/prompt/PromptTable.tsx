"use client";

import { useState } from "react";
import { Copy, Check, Edit2, Image, Video, Mic, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedPrompt, VoiceoverScript, LanguageCode } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/types";

interface PromptTableProps {
    prompts: GeneratedPrompt[];
    voiceovers: VoiceoverScript[];
    onEditPrompt?: (sceneIndex: number, field: "imagePrompt" | "videoPrompt", value: string) => void;
    onEditVoiceover?: (sceneIndex: number, value: string) => void;
}

export function PromptTable({
    prompts,
    voiceovers,
    onEditPrompt,
    onEditVoiceover,
}: PromptTableProps) {
    const [expandedScene, setExpandedScene] = useState<number | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = async (text: string, fieldId: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        toast.success("Đã copy!");
        setTimeout(() => setCopiedField(null), 2000);
    };

    const toggleExpand = (index: number) => {
        setExpandedScene(expandedScene === index ? null : index);
    };

    if (prompts.length === 0) {
        return (
            <div className="card flex items-center justify-center min-h-[200px]">
                <p className="text-foreground/40">Chưa có prompts. Bắt đầu phân tích video!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    Generated Prompts ({prompts.length} scenes)
                </h3>
            </div>

            <div className="space-y-3">
                {prompts.map((prompt, index) => {
                    const voiceover = voiceovers.find((v) => v.sceneIndex === prompt.sceneIndex);
                    const isExpanded = expandedScene === index;

                    return (
                        <div
                            key={prompt.sceneIndex}
                            className="card border border-border hover:border-border-hover transition-colors"
                        >
                            {/* Header */}
                            <button
                                onClick={() => toggleExpand(index)}
                                className="w-full flex items-center justify-between p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary font-bold">
                                        {prompt.sceneIndex + 1}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium">{prompt.timeRange}</div>
                                        <div className="text-sm text-foreground/50">{prompt.shotType}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {prompt.qualityScore > 0 && (
                                        <div className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${prompt.qualityScore >= 80 ? 'bg-success/20 text-success' :
                                                prompt.qualityScore >= 50 ? 'bg-warning/20 text-warning' :
                                                    'bg-error/20 text-error'}
                    `}>
                                            {prompt.qualityScore}%
                                        </div>
                                    )}
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                                    {/* IMAGE PROMPT */}
                                    <PromptSection
                                        icon={Image}
                                        title="IMAGE PROMPT"
                                        subtitle="PRO MAX — Keyframe Reference"
                                        content={prompt.imagePrompt}
                                        fieldId={`image-${prompt.sceneIndex}`}
                                        copiedField={copiedField}
                                        onCopy={handleCopy}
                                        onEdit={onEditPrompt ? (value) => onEditPrompt(prompt.sceneIndex, "imagePrompt", value) : undefined}
                                    />

                                    {/* VIDEO PROMPT */}
                                    <PromptSection
                                        icon={Video}
                                        title="VIDEO PROMPT"
                                        subtitle="PRO MAX — Motion Shot"
                                        content={prompt.videoPrompt}
                                        fieldId={`video-${prompt.sceneIndex}`}
                                        copiedField={copiedField}
                                        onCopy={handleCopy}
                                        onEdit={onEditPrompt ? (value) => onEditPrompt(prompt.sceneIndex, "videoPrompt", value) : undefined}
                                    />

                                    {/* VOICEOVER */}
                                    {voiceover && (
                                        <PromptSection
                                            icon={Mic}
                                            title="VOICEOVER"
                                            subtitle={`${SUPPORTED_LANGUAGES[voiceover.language].native} • ${voiceover.wordCount} words • ${voiceover.tone}`}
                                            content={voiceover.script}
                                            fieldId={`voice-${prompt.sceneIndex}`}
                                            copiedField={copiedField}
                                            onCopy={handleCopy}
                                            onEdit={onEditVoiceover ? (value) => onEditVoiceover(prompt.sceneIndex, value) : undefined}
                                        />
                                    )}

                                    {/* OCR Text if any */}
                                    {prompt.ocrText && prompt.ocrText.length > 0 && (
                                        <div className="p-3 rounded-lg bg-surface-2 border border-border">
                                            <div className="text-xs text-foreground/50 mb-2">OCR DETECTED TEXT</div>
                                            <div className="flex flex-wrap gap-2">
                                                {prompt.ocrText.map((ocr, i) => (
                                                    <span key={i} className="px-2 py-1 bg-surface-3 rounded text-sm font-mono">
                                                        {ocr.text}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface PromptSectionProps {
    icon: any;
    title: string;
    subtitle: string;
    content: string;
    fieldId: string;
    copiedField: string | null;
    onCopy: (text: string, fieldId: string) => void;
    onEdit?: (value: string) => void;
}

function PromptSection({
    icon: Icon,
    title,
    subtitle,
    content,
    fieldId,
    copiedField,
    onCopy,
    onEdit,
}: PromptSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(content);

    const handleSave = () => {
        onEdit?.(editValue);
        setIsEditing(false);
        toast.success("Đã lưu!");
    };

    return (
        <div className="p-3 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{title}</span>
                    <span className="text-xs text-foreground/40">({subtitle})</span>
                </div>
                <div className="flex items-center gap-1">
                    {onEdit && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded hover:bg-surface-3 transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => onCopy(content, fieldId)}
                        className="p-1.5 rounded hover:bg-surface-3 transition-colors"
                        title="Copy"
                    >
                        {copiedField === fieldId ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full h-32 p-2 rounded bg-surface-1 border border-border text-sm resize-none focus:border-primary focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 text-sm rounded bg-surface-3 hover:bg-surface-2"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 text-sm rounded bg-primary text-white hover:bg-primary-hover"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-foreground/80 leading-relaxed">{content}</p>
            )}
        </div>
    );
}
