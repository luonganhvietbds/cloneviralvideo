import { useCallback } from "react";
import { Toaster, toast } from "sonner";
import { Play, Sparkles, RotateCcw, StopCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { VideoUploader } from "@/components/video/VideoUploader";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoMetadataDisplay } from "@/components/video/VideoMetadata";
import { LanguageSelector } from "@/components/voiceover/LanguageSelector";
import { ProgressTracker } from "@/components/analysis/ProgressTracker";
import { PromptTable } from "@/components/prompt/PromptTable";
import { ExportButton } from "@/components/prompt/ExportButton";
import { useVideoAnalysis } from "@/hooks/useVideoAnalysis";
import type { VideoMetadata, VoiceoverSettings, LanguageCode } from "@/types";

function App() {
  const {
    state,
    videoFile,
    videoUrl,
    metadata,
    prompts,
    voiceovers,
    globalStyle,
    currentBatch,
    totalBatches,
    currentScene,
    totalScenes,
    voiceoverSettings,
    error,
    setVideoFile,
    setMetadata,
    setState,
    setVoiceoverSettings,
    setSceneLanguage,
    updatePrompt,
    updateVoiceover,
    startAnalysis,
    stopAnalysis,
    resetAnalysis,
  } = useVideoAnalysis();

  const handleVideoUpload = useCallback((file: File) => {
    setVideoFile(file);
    toast.success(`Đã upload: ${file.name}`);
  }, [setVideoFile]);

  const handleMetadataLoaded = useCallback((data: { duration: number; width: number; height: number }) => {
    const meta: VideoMetadata = {
      duration: data.duration,
      width: data.width,
      height: data.height,
      fps: 30,
      format: videoFile?.type || "video/mp4",
      fileName: videoFile?.name || "video",
      fileSize: videoFile?.size || 0,
    };
    setMetadata(meta);
    setState("AWAITING_CONFIRMATION");
  }, [setMetadata, setState, videoFile]);

  const handleSettingsChange = useCallback((settings: Partial<VoiceoverSettings>) => {
    setVoiceoverSettings(settings);
  }, [setVoiceoverSettings]);

  const handleSceneLanguageChange = useCallback((sceneIndex: number, language: LanguageCode) => {
    setSceneLanguage(sceneIndex, language);
  }, [setSceneLanguage]);

  const handleEditPrompt = useCallback((sceneIndex: number, field: "imagePrompt" | "videoPrompt", value: string) => {
    updatePrompt(sceneIndex, { [field]: value });
  }, [updatePrompt]);

  const handleEditVoiceover = useCallback((sceneIndex: number, value: string) => {
    updateVoiceover(sceneIndex, { script: value });
  }, [updateVoiceover]);

  const showUploader = state === "IDLE" || state === "UPLOADING";
  const isUploading = state === "UPLOADING";
  const showPlayer = videoUrl && state !== "IDLE" && state !== "UPLOADING";
  const showConfirmation = state === "AWAITING_CONFIRMATION";
  const isProcessing = [
    "EXTRACTING_FRAMES",
    "DETECTING_STYLE",
    "GENERATING_PROMPTS",
    "GENERATING_VOICEOVERS",
    "VALIDATING"
  ].includes(state);
  const isComplete = state === "COMPLETE";
  const hasError = state === "ERROR";

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-screen-2xl">
          {/* Hero section when idle */}
          {showUploader && (
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">
                <span className="gradient-text">Reverse-Engineer</span> bất kỳ video nào
              </h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
                Chuyển đổi video thành prompts production-grade cho Google Veo3 với độ chính xác 99-100%
              </p>
            </div>
          )}

          {/* Error banner */}
          {hasError && error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 text-error animate-fade-in">
              <div className="flex items-center justify-between">
                <span>❌ Lỗi: {error}</span>
                <button onClick={resetAnalysis} className="btn-secondary text-sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Thử lại
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left panel - Video */}
            <div className="space-y-6">
              {showUploader ? (
                <VideoUploader
                  onUpload={handleVideoUpload}
                  isUploading={isUploading}
                />
              ) : showPlayer && (
                <>
                  <VideoPlayer
                    src={videoUrl}
                    onLoadedMetadata={handleMetadataLoaded}
                  />
                  {metadata && <VideoMetadataDisplay metadata={metadata} />}

                  {/* Global Style Token display */}
                  {globalStyle && (
                    <div className="card animate-fade-in">
                      <h3 className="text-sm font-semibold mb-2 text-primary">GLOBAL STYLE TOKEN PRO+</h3>
                      <p className="text-sm text-foreground/80 font-mono bg-surface-2 p-3 rounded-lg">
                        {globalStyle.tokenString}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right panel - Settings, Progress & Results */}
            <div className="space-y-6">
              {/* Language selector - show when awaiting confirmation */}
              {showConfirmation && metadata && (
                <div className="space-y-6 animate-fade-in">
                  <LanguageSelector
                    settings={voiceoverSettings}
                    totalScenes={Math.floor(metadata.duration / 8)}
                    onSettingsChange={handleSettingsChange}
                    onSceneLanguageChange={handleSceneLanguageChange}
                  />

                  {/* Confirmation card */}
                  <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-semibold">Sẵn sàng phân tích!</h3>
                    </div>

                    <div className="p-4 rounded-lg bg-surface-2 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-foreground/50">Số scenes:</span>
                          <span className="ml-2 font-medium">{Math.floor(metadata.duration / 8)}</span>
                        </div>
                        <div>
                          <span className="text-foreground/50">Batches:</span>
                          <span className="ml-2 font-medium">{Math.ceil(Math.floor(metadata.duration / 8) / 5)}</span>
                        </div>
                        <div>
                          <span className="text-foreground/50">Voiceover:</span>
                          <span className="ml-2 font-medium">
                            {voiceoverSettings.mode === 'global' ? 'Global' : 'Per-scene'}
                          </span>
                        </div>
                        <div>
                          <span className="text-foreground/50">Ngôn ngữ:</span>
                          <span className="ml-2 font-medium">
                            {voiceoverSettings.defaultLanguage.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={startAnalysis}
                      className="btn-primary w-full flex items-center justify-center gap-2 glow-primary"
                    >
                      <Play className="w-5 h-5" />
                      Bắt đầu phân tích
                    </button>
                  </div>
                </div>
              )}

              {/* Progress tracker - show during processing */}
              {isProcessing && (
                <div className="space-y-4">
                  <ProgressTracker
                    state={state}
                    currentBatch={currentBatch}
                    totalBatches={totalBatches}
                    currentScene={currentScene}
                    totalScenes={totalScenes}
                  />
                  <button
                    onClick={stopAnalysis}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <StopCircle className="w-4 h-4" />
                    Dừng xử lý
                  </button>
                </div>
              )}

              {/* Results - show when complete */}
              {isComplete && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-success">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="font-medium">Hoàn thành!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetAnalysis}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                      <ExportButton />
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state for right panel when extracting metadata */}
              {state === "EXTRACTING_METADATA" && (
                <div className="card flex items-center justify-center min-h-[200px]">
                  <div className="text-center text-foreground/40">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
                    <p>Đang xử lý video...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prompt table - full width below */}
          {(isComplete || prompts.length > 0) && (
            <div className="mt-8">
              <PromptTable
                prompts={prompts}
                voiceovers={voiceovers}
                onEditPrompt={handleEditPrompt}
                onEditVoiceover={handleEditVoiceover}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 text-center text-sm text-foreground/40">
          VEO3 Replicator Elite — ULTRA MODE v3.7 | Powered by Gemini 2.5 Flash
        </footer>
      </div>

      {/* Toast notifications */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />
    </>
  );
}

export default App;
