"use client";

import { useState } from "react";
import { Settings, Key, Github, Moon, Sun, X, Plus } from "lucide-react";
import { useSettingsStore } from "@/stores/analysisStore";

export function Header() {
    const [showApiModal, setShowApiModal] = useState(false);
    const [newKey, setNewKey] = useState("");
    const { apiKeys, addApiKey, removeApiKey } = useSettingsStore();

    const handleAddKey = () => {
        if (newKey.trim()) {
            addApiKey(newKey.trim());
            setNewKey("");
        }
    };

    return (
        <>
            <header className="glass sticky top-0 z-50 px-6 py-4">
                <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center">
                                <span className="text-white font-bold text-sm">V3</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold gradient-text">
                                VEO3 Replicator Elite
                            </h1>
                            <p className="text-xs text-foreground/50">ULTRA MODE v3.7</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* API Key indicator */}
                        <button
                            onClick={() => setShowApiModal(true)}
                            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                transition-colors
                ${apiKeys.length > 0
                                    ? "bg-success/10 text-success border border-success/30"
                                    : "bg-warning/10 text-warning border border-warning/30"
                                }
              `}
                        >
                            <Key className="w-4 h-4" />
                            <span className="text-sm">
                                {apiKeys.length > 0 ? `${apiKeys.length} key(s)` : "Add API Key"}
                            </span>
                        </button>

                        {/* GitHub link */}
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-surface-2 border border-border hover:border-border-hover transition-colors"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </header>

            {/* API Key Modal */}
            {showApiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="card w-full max-w-md mx-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Key className="w-5 h-5 text-primary" />
                                Gemini API Keys
                            </h2>
                            <button
                                onClick={() => setShowApiModal(false)}
                                className="p-1 rounded-lg hover:bg-surface-2 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-foreground/60 mb-4">
                            Thêm API keys từ Google AI Studio. Hệ thống sẽ tự động rotate để tránh rate limit.
                        </p>

                        {/* Add new key */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="password"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-border focus:border-primary focus:outline-none text-sm"
                            />
                            <button
                                onClick={handleAddKey}
                                className="btn-primary px-4"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Existing keys */}
                        {apiKeys.length > 0 && (
                            <div className="space-y-2">
                                {apiKeys.map((key, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border"
                                    >
                                        <span className="text-sm font-mono">
                                            {key.slice(0, 10)}...{key.slice(-4)}
                                        </span>
                                        <button
                                            onClick={() => removeApiKey(index)}
                                            className="p-1 rounded hover:bg-error/20 text-error transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Help link */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                            >
                                → Lấy API Key từ Google AI Studio
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
