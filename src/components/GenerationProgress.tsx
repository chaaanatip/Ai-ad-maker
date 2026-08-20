"use client";

import React from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
  "Analyzing product...",
  "Creating advertising concept...",
  "Generating scene...",
  "Placing product...",
  "Matching lighting...",
  "Finishing advertisement...",
];

interface GenerationProgressProps {
  currentStep: string;
}

export default function GenerationProgress({
  currentStep,
}: GenerationProgressProps) {
  const activeIdx = STEPS.findIndex((s) => s === currentStep);
  const progress = activeIdx >= 0 ? ((activeIdx + 1) / STEPS.length) * 100 : 10;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg p-6 space-y-4">
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const isActive = step === currentStep;
          const isDone = activeIdx >= 0 && i < activeIdx;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-sm transition-colors ${
                isActive
                  ? "text-foreground font-medium"
                  : isDone
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              {isActive ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : isDone ? (
                <span className="w-4 h-4 flex items-center justify-center text-primary">
                  ✓
                </span>
              ) : (
                <span className="w-4 h-4 flex items-center justify-center text-muted-foreground/30">
                  •
                </span>
              )}
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
