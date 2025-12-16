"use client";

import { Check, Circle, Loader2, AlertCircle } from "lucide-react";
import type { AnalysisState } from "@/types";

interface ProgressTrackerProps {
    state: AnalysisState;
    currentBatch: number;
    totalBatches: number;
    currentScene: number;
    totalScenes: number;
}

interface Step {
    id: AnalysisState[];
    label: string;
    detail?: string;
}

export function ProgressTracker({
    state,
    currentBatch,
    totalBatches,
    currentScene,
    totalScenes,
}: ProgressTrackerProps) {
    const steps: Step[] = [
        { id: ['UPLOADING'], label: 'Upload video' },
        { id: ['EXTRACTING_METADATA'], label: 'Trích xuất metadata' },
        { id: ['AWAITING_CONFIRMATION'], label: 'Chờ xác nhận ngôn ngữ' },
        { id: ['EXTRACTING_FRAMES'], label: 'Trích xuất frames' },
        { id: ['DETECTING_STYLE'], label: 'Phát hiện Global Style Token' },
        { id: ['GENERATING_PROMPTS'], label: 'Generate prompts', detail: `${currentScene}/${totalScenes}` },
        { id: ['GENERATING_VOICEOVERS'], label: 'Generate voiceovers', detail: `${currentScene}/${totalScenes}` },
        { id: ['VALIDATING'], label: 'Kiểm tra chất lượng' },
        { id: ['COMPLETE'], label: 'Hoàn thành!' },
    ];

    const getStepStatus = (step: Step): 'pending' | 'active' | 'complete' | 'error' => {
        if (state === 'ERROR') {
            const currentIndex = steps.findIndex(s => s.id.includes(state));
            const stepIndex = steps.indexOf(step);
            if (stepIndex < currentIndex) return 'complete';
            if (stepIndex === currentIndex) return 'error';
            return 'pending';
        }

        if (step.id.includes(state)) return 'active';

        const stateOrder = [
            'IDLE', 'UPLOADING', 'EXTRACTING_METADATA', 'AWAITING_CONFIRMATION',
            'EXTRACTING_FRAMES', 'DETECTING_STYLE', 'GENERATING_PROMPTS',
            'GENERATING_VOICEOVERS', 'VALIDATING', 'COMPLETE'
        ];

        const currentIndex = stateOrder.indexOf(state);
        const stepStateIndex = Math.min(...step.id.map(s => stateOrder.indexOf(s)));

        if (stepStateIndex < currentIndex) return 'complete';
        return 'pending';
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4">Tiến trình xử lý</h3>

            <div className="space-y-3">
                {steps.map((step, index) => {
                    const status = getStepStatus(step);

                    return (
                        <div key={index} className="flex items-center gap-3">
                            {/* Icon */}
                            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${status === 'complete' ? 'bg-success/20 text-success' : ''}
                ${status === 'active' ? 'bg-primary/20 text-primary' : ''}
                ${status === 'pending' ? 'bg-surface-2 text-foreground/30' : ''}
                ${status === 'error' ? 'bg-error/20 text-error' : ''}
              `}>
                                {status === 'complete' && <Check className="w-4 h-4" />}
                                {status === 'active' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {status === 'pending' && <Circle className="w-4 h-4" />}
                                {status === 'error' && <AlertCircle className="w-4 h-4" />}
                            </div>

                            {/* Label */}
                            <div className="flex-1">
                                <div className={`
                  text-sm font-medium
                  ${status === 'complete' ? 'text-success' : ''}
                  ${status === 'active' ? 'text-foreground' : ''}
                  ${status === 'pending' ? 'text-foreground/40' : ''}
                  ${status === 'error' ? 'text-error' : ''}
                `}>
                                    {step.label}
                                </div>
                                {status === 'active' && step.detail && (
                                    <div className="text-xs text-foreground/50">{step.detail}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            {state !== 'IDLE' && state !== 'ERROR' && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between text-xs text-foreground/50 mb-2">
                        <span>Batch {currentBatch}/{totalBatches}</span>
                        <span>{Math.round((currentScene / totalScenes) * 100)}%</span>
                    </div>
                    <div className="progress-bar h-2">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${(currentScene / totalScenes) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
