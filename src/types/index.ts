// ============================================
// VEO3 REPLICATOR ELITE — TYPE DEFINITIONS
// ============================================

// Supported voiceover languages
export type LanguageCode =
    | 'en' | 'vi' | 'zh' | 'ja' | 'ko'
    | 'es' | 'fr' | 'de' | 'pt' | 'th';

export const SUPPORTED_LANGUAGES: Record<LanguageCode, { name: string; native: string }> = {
    en: { name: 'English', native: 'English' },
    vi: { name: 'Vietnamese', native: 'Tiếng Việt' },
    zh: { name: 'Chinese', native: '中文' },
    ja: { name: 'Japanese', native: '日本語' },
    ko: { name: 'Korean', native: '한국어' },
    es: { name: 'Spanish', native: 'Español' },
    fr: { name: 'French', native: 'Français' },
    de: { name: 'German', native: 'Deutsch' },
    pt: { name: 'Portuguese', native: 'Português' },
    th: { name: 'Thai', native: 'ไทย' },
};

// Video metadata
export interface VideoMetadata {
    duration: number;       // seconds
    width: number;
    height: number;
    fps: number;
    format: string;
    fileName: string;
    fileSize: number;       // bytes
}

// Extracted frame
export interface ExtractedFrame {
    sceneIndex: number;     // 0-based
    timestamp: number;      // seconds
    timeRange: string;      // "00:00-00:08"
    dataUrl: string;        // base64 image
}

// 14-Factor Visual Fidelity Elements
export interface FidelityElement {
    factor: string;
    description: string;
    value: string;
}

// Global Style Token PRO+
export interface GlobalStyleTokenPRO {
    // Art & Rendering Identity
    artStyle: string;
    renderQuality: string;

    // Line Identity
    lineWeight: string;
    lineStyle: string;

    // Color Identity
    colorPalette: string[];
    colorHarmony: string;

    // Shading Identity
    shadingStyle: string;
    contrastLevel: string;

    // Camera Identity
    cameraStyle: string;
    lensCharacter: string;

    // Motion Physics Identity
    motionStyle: string;
    physicsRealism: string;

    // Background Identity
    backgroundStyle: string;
    depthTreatment: string;

    // Text-Overlay Grammar
    textStyle: string;
    textAnimation: string;

    // Raw token string
    tokenString: string;

    // 14 Deep Fidelity Elements
    fidelityElements: FidelityElement[];
}

// OCR Text detection result
export interface OCRTextResult {
    text: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style: {
        fontStyle: string;
        fontSize: string;
        color: string;
    };
}

// Generated prompt for a scene
export interface GeneratedPrompt {
    sceneIndex: number;
    timeRange: string;

    // IMAGE PROMPT (PRO MAX — Keyframe Reference)
    imagePrompt: string;

    // VIDEO PROMPT (PRO MAX — Motion Shot)
    videoPrompt: string;

    // Shot metadata
    shotType: string;

    // OCR detected text
    ocrText: OCRTextResult[];

    // Quality validation score
    qualityScore: number;
    missingFactors: string[];
}

// Voiceover script
export interface VoiceoverScript {
    sceneIndex: number;
    timeRange: string;
    language: LanguageCode;
    script: string;
    wordCount: number;
    estimatedDuration: number;
    tone: 'narrative' | 'dramatic' | 'informative' | 'conversational';
}

// Voiceover settings
export type VoiceoverLanguageMode = 'global' | 'per-scene';

export interface VoiceoverSettings {
    mode: VoiceoverLanguageMode;
    defaultLanguage: LanguageCode;
    sceneOverrides: Record<number, LanguageCode>; // Scene index → Language
}

// Complete scene data
export interface SceneData {
    index: number;
    timeRange: string;
    frame: ExtractedFrame;
    prompt: GeneratedPrompt;
    voiceover: VoiceoverScript;
}

// Batch result
export interface BatchResult {
    batchIndex: number;
    startTime: number;
    endTime: number;
    scenes: SceneData[];
}

// Analysis state machine
export type AnalysisState =
    | 'IDLE'
    | 'UPLOADING'
    | 'EXTRACTING_METADATA'
    | 'AWAITING_CONFIRMATION'    // Wait for user to select voiceover language
    | 'EXTRACTING_FRAMES'
    | 'DETECTING_STYLE'
    | 'GENERATING_PROMPTS'
    | 'GENERATING_VOICEOVERS'
    | 'VALIDATING'
    | 'COMPLETE'
    | 'ERROR';

// Session state for recovery
export interface SessionState {
    sessionId: string;
    videoFileHash: string;
    lastProcessedScene: number;
    totalScenes: number;
    timestamp: number;
    globalStyleToken: GlobalStyleTokenPRO | null;
    completedScenes: SceneData[];
    voiceoverSettings: VoiceoverSettings;
}

// API Key configuration
export interface APIKeyConfig {
    key: string;
    requestCount: number;
    lastUsed: number;
    isActive: boolean;
    errorCount: number;
    rateLimitedUntil: number | null;
}

// Export formats
export type ExportFormat = 'txt' | 'json' | 'csv';

// Export options
export interface ExportOptions {
    format: ExportFormat;
    includeVoiceover: boolean;
    includeQualityScores: boolean;
    includeOCRText: boolean;
}
