"use client";

import { Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { SUPPORTED_LANGUAGES, type LanguageCode, type VoiceoverSettings } from "@/types";

interface LanguageSelectorProps {
    settings: VoiceoverSettings;
    totalScenes: number;
    onSettingsChange: (settings: Partial<VoiceoverSettings>) => void;
    onSceneLanguageChange: (sceneIndex: number, language: LanguageCode) => void;
}

export function LanguageSelector({
    settings,
    totalScenes,
    onSettingsChange,
    onSceneLanguageChange,
}: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLang = SUPPORTED_LANGUAGES[settings.defaultLanguage];

    return (
        <div className="card animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Voiceover Language
            </h3>

            {/* Mode selection */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => onSettingsChange({ mode: 'global' })}
                    className={`
            flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
            ${settings.mode === 'global'
                            ? 'bg-primary text-white'
                            : 'bg-surface-2 text-foreground/60 hover:bg-surface-3'
                        }
          `}
                >
                    Global
                </button>
                <button
                    onClick={() => onSettingsChange({ mode: 'per-scene' })}
                    className={`
            flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
            ${settings.mode === 'per-scene'
                            ? 'bg-primary text-white'
                            : 'bg-surface-2 text-foreground/60 hover:bg-surface-3'
                        }
          `}
                >
                    Per-Scene
                </button>
            </div>

            {/* Global language dropdown */}
            <div className="relative mb-4" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border hover:border-border-hover transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">{getLanguageFlag(settings.defaultLanguage)}</span>
                        <div className="text-left">
                            <div className="font-medium">{selectedLang.native}</div>
                            <div className="text-xs text-foreground/50">{selectedLang.name}</div>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-lg bg-surface-1 border border-border shadow-xl z-10 max-h-60 overflow-y-auto">
                        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                            <button
                                key={code}
                                onClick={() => {
                                    onSettingsChange({ defaultLanguage: code as LanguageCode });
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 transition-colors
                  ${code === settings.defaultLanguage ? 'bg-primary/10' : ''}
                `}
                            >
                                <span className="text-lg">{getLanguageFlag(code as LanguageCode)}</span>
                                <div className="flex-1">
                                    <div className="font-medium">{lang.native}</div>
                                    <div className="text-xs text-foreground/50">{lang.name}</div>
                                </div>
                                {code === settings.defaultLanguage && (
                                    <Check className="w-4 h-4 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Per-scene override notice */}
            {settings.mode === 'per-scene' && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                    <p className="text-foreground/80">
                        Sau khi xử lý, bạn có thể thay đổi ngôn ngữ cho từng scene trong bảng kết quả.
                    </p>
                </div>
            )}

            {/* Preview */}
            <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-foreground/50">
                    {settings.mode === 'global' ? (
                        <span>Tất cả {totalScenes} scenes sẽ dùng {selectedLang.native}</span>
                    ) : (
                        <span>Mặc định: {selectedLang.native}, có thể thay đổi từng scene</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function getLanguageFlag(code: LanguageCode): string {
    const flags: Record<LanguageCode, string> = {
        en: '🇺🇸',
        vi: '🇻🇳',
        zh: '🇨🇳',
        ja: '🇯🇵',
        ko: '🇰🇷',
        es: '🇪🇸',
        fr: '🇫🇷',
        de: '🇩🇪',
        pt: '🇧🇷',
        th: '🇹🇭',
    };
    return flags[code] || '🌐';
}
