"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Maximize2, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
    src: string;
    onTimeUpdate?: (time: number) => void;
    onDurationChange?: (duration: number) => void;
    onLoadedMetadata?: (metadata: { duration: number; width: number; height: number }) => void;
}

export function VideoPlayer({
    src,
    onTimeUpdate,
    onDurationChange,
    onLoadedMetadata,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handlePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        setCurrentTime(video.currentTime);
        onTimeUpdate?.(video.currentTime);
    }, [onTimeUpdate]);

    const handleLoadedMetadata = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        setDuration(video.duration);
        onDurationChange?.(video.duration);
        onLoadedMetadata?.({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
        });
    }, [onDurationChange, onLoadedMetadata]);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const container = e.currentTarget;
        if (!video) return;

        const rect = container.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * duration;
    }, [duration]);

    const handleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(!isMuted);
    }, [isMuted]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden bg-black group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Video element */}
            <video
                ref={videoRef}
                src={src}
                className="w-full aspect-video object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Overlay controls */}
            <div
                className={`
          absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
          flex flex-col justify-end p-4
          transition-opacity duration-200
          ${isHovered || !isPlaying ? "opacity-100" : "opacity-0"}
        `}
            >
                {/* Progress bar */}
                <div
                    className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/progress"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-primary rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <button
                            onClick={handlePlayPause}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-white" />
                            ) : (
                                <Play className="w-5 h-5 text-white" />
                            )}
                        </button>

                        {/* Mute */}
                        <button
                            onClick={toggleMute}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            {isMuted ? (
                                <VolumeX className="w-4 h-4 text-white" />
                            ) : (
                                <Volume2 className="w-4 h-4 text-white" />
                            )}
                        </button>

                        {/* Time */}
                        <span className="text-sm text-white/80 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Fullscreen */}
                    <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* Play button overlay when paused */}
            {!isPlaying && (
                <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="p-6 rounded-full bg-primary/80 hover:bg-primary transition-colors glow-primary">
                        <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                </button>
            )}
        </div>
    );
}
