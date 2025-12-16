"use client";

import { useCallback, useRef } from "react";
import { Upload, Video, FileVideo } from "lucide-react";

interface VideoUploaderProps {
    onUpload: (file: File) => void;
    isUploading?: boolean;
    maxSize?: number; // MB
}

const ACCEPTED_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_SIZE_MB = 100;

export function VideoUploader({
    onUpload,
    isUploading = false,
    maxSize = MAX_SIZE_MB,
}: VideoUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const validateFile = useCallback(
        (file: File): string | null => {
            if (!ACCEPTED_FORMATS.includes(file.type)) {
                return "Định dạng không hỗ trợ. Vui lòng upload MP4, WebM hoặc MOV.";
            }
            if (file.size > maxSize * 1024 * 1024) {
                return `File quá lớn. Giới hạn ${maxSize}MB.`;
            }
            return null;
        },
        [maxSize]
    );

    const handleFile = useCallback(
        (file: File) => {
            const error = validateFile(file);
            if (error) {
                alert(error);
                return;
            }
            onUpload(file);
        },
        [validateFile, onUpload]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dropRef.current?.classList.remove("dragging");

            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dropRef.current?.classList.add("dragging");
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dropRef.current?.classList.remove("dragging");
    }, []);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    return (
        <div
            ref={dropRef}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
        drop-zone relative flex flex-col items-center justify-center
        min-h-[300px] p-8 cursor-pointer
        transition-all duration-200 select-none
        ${isUploading ? "opacity-50 pointer-events-none" : "hover:border-primary"}
      `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_FORMATS.join(",")}
                onChange={handleInputChange}
                className="hidden"
            />

            {/* Icon */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative p-4 rounded-2xl bg-surface-2 border border-border">
                    {isUploading ? (
                        <Video className="w-12 h-12 text-primary animate-pulse" />
                    ) : (
                        <Upload className="w-12 h-12 text-primary" />
                    )}
                </div>
            </div>

            {/* Text */}
            <h3 className="text-xl font-semibold mb-2">
                {isUploading ? "Đang xử lý..." : "Kéo thả video vào đây"}
            </h3>
            <p className="text-sm text-foreground/60 mb-4">
                hoặc click để chọn file
            </p>

            {/* Supported formats */}
            <div className="flex items-center gap-3 text-xs text-foreground/40">
                <span className="flex items-center gap-1">
                    <FileVideo className="w-3 h-3" />
                    MP4
                </span>
                <span>•</span>
                <span>WebM</span>
                <span>•</span>
                <span>MOV</span>
                <span>•</span>
                <span>Max {maxSize}MB</span>
            </div>

            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-pink/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
