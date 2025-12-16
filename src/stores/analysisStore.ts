import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    AnalysisState,
    VideoMetadata,
    ExtractedFrame,
    GlobalStyleTokenPRO,
    GeneratedPrompt,
    VoiceoverScript,
    VoiceoverSettings,
    SceneData,
    LanguageCode,
} from '@/types';

interface AnalysisStore {
    // State
    state: AnalysisState;
    videoFile: File | null;
    videoUrl: string | null;
    metadata: VideoMetadata | null;
    frames: ExtractedFrame[];
    globalStyle: GlobalStyleTokenPRO | null;
    prompts: GeneratedPrompt[];
    voiceovers: VoiceoverScript[];
    scenes: SceneData[];

    // Progress tracking
    currentBatch: number;
    totalBatches: number;
    currentScene: number;
    totalScenes: number;

    // Voiceover settings
    voiceoverSettings: VoiceoverSettings;

    // Error handling
    error: string | null;

    // Actions
    setVideoFile: (file: File) => void;
    setState: (state: AnalysisState) => void;
    setMetadata: (metadata: VideoMetadata) => void;
    addFrames: (frames: ExtractedFrame[]) => void;
    setGlobalStyle: (style: GlobalStyleTokenPRO) => void;
    addPrompt: (prompt: GeneratedPrompt) => void;
    updatePrompt: (sceneIndex: number, prompt: Partial<GeneratedPrompt>) => void;
    addVoiceover: (voiceover: VoiceoverScript) => void;
    updateVoiceover: (sceneIndex: number, voiceover: Partial<VoiceoverScript>) => void;
    setProgress: (current: number, total: number, type: 'batch' | 'scene') => void;
    setVoiceoverSettings: (settings: Partial<VoiceoverSettings>) => void;
    setSceneLanguage: (sceneIndex: number, language: LanguageCode) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const defaultVoiceoverSettings: VoiceoverSettings = {
    mode: 'global',
    defaultLanguage: 'vi',
    sceneOverrides: {},
};

const initialState = {
    state: 'IDLE' as AnalysisState,
    videoFile: null,
    videoUrl: null,
    metadata: null,
    frames: [],
    globalStyle: null,
    prompts: [],
    voiceovers: [],
    scenes: [],
    currentBatch: 0,
    totalBatches: 0,
    currentScene: 0,
    totalScenes: 0,
    voiceoverSettings: defaultVoiceoverSettings,
    error: null,
};

export const useAnalysisStore = create<AnalysisStore>()((set, get) => ({
    ...initialState,

    setVideoFile: (file) => {
        // Revoke previous URL if exists
        const prev = get().videoUrl;
        if (prev) URL.revokeObjectURL(prev);

        set({
            videoFile: file,
            videoUrl: URL.createObjectURL(file),
            state: 'UPLOADING',
            error: null,
        });
    },

    setState: (state) => set({ state }),

    setMetadata: (metadata) => {
        const sceneCount = Math.floor(metadata.duration / 8);
        set({
            metadata,
            totalScenes: sceneCount,
            totalBatches: Math.ceil(sceneCount / 5),
        });
    },

    addFrames: (frames) => set((s) => ({
        frames: [...s.frames, ...frames]
    })),

    setGlobalStyle: (globalStyle) => set({ globalStyle }),

    addPrompt: (prompt) => set((s) => ({
        prompts: [...s.prompts, prompt],
    })),

    updatePrompt: (sceneIndex, update) => set((s) => ({
        prompts: s.prompts.map((p) =>
            p.sceneIndex === sceneIndex ? { ...p, ...update } : p
        ),
    })),

    addVoiceover: (voiceover) => set((s) => ({
        voiceovers: [...s.voiceovers, voiceover],
    })),

    updateVoiceover: (sceneIndex, update) => set((s) => ({
        voiceovers: s.voiceovers.map((v) =>
            v.sceneIndex === sceneIndex ? { ...v, ...update } : v
        ),
    })),

    setProgress: (current, total, type) => {
        if (type === 'batch') {
            set({ currentBatch: current, totalBatches: total });
        } else {
            set({ currentScene: current, totalScenes: total });
        }
    },

    setVoiceoverSettings: (settings) => set((s) => ({
        voiceoverSettings: { ...s.voiceoverSettings, ...settings },
    })),

    setSceneLanguage: (sceneIndex, language) => set((s) => ({
        voiceoverSettings: {
            ...s.voiceoverSettings,
            sceneOverrides: {
                ...s.voiceoverSettings.sceneOverrides,
                [sceneIndex]: language,
            },
        },
    })),

    setError: (error) => set({
        error,
        state: error ? 'ERROR' : get().state
    }),

    reset: () => {
        const prev = get().videoUrl;
        if (prev) URL.revokeObjectURL(prev);
        set(initialState);
    },
}));

// Settings store with persistence
interface SettingsStore {
    apiKeys: string[];
    currentKeyIndex: number;
    autoSaveEnabled: boolean;

    addApiKey: (key: string) => void;
    removeApiKey: (index: number) => void;
    rotateKey: () => string | null;
    setAutoSave: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            apiKeys: [],
            currentKeyIndex: 0,
            autoSaveEnabled: true,

            addApiKey: (key) => set((s) => ({
                apiKeys: [...s.apiKeys, key],
            })),

            removeApiKey: (index) => set((s) => ({
                apiKeys: s.apiKeys.filter((_, i) => i !== index),
                currentKeyIndex: Math.min(s.currentKeyIndex, s.apiKeys.length - 2),
            })),

            rotateKey: () => {
                const { apiKeys, currentKeyIndex } = get();
                if (apiKeys.length === 0) return null;

                const nextIndex = (currentKeyIndex + 1) % apiKeys.length;
                set({ currentKeyIndex: nextIndex });
                return apiKeys[nextIndex];
            },

            setAutoSave: (enabled) => set({ autoSaveEnabled: enabled }),
        }),
        {
            name: 'veo3-settings',
            partialize: (state) => ({
                apiKeys: state.apiKeys,
                autoSaveEnabled: state.autoSaveEnabled,
            }),
        }
    )
);
