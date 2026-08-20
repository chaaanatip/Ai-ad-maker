// ============================================================
// Generation Types (for future job-queue / history phases)
// ============================================================

export type GenerationStatus =
  | "queued"
  | "analyzing"
  | "planning"
  | "generating"
  | "compositing"
  | "completed"
  | "failed";

export interface GenerationJob {
  id: string;
  status: GenerationStatus;
  currentStep: string;
  progress: number; // 0-100
  error?: string;
  resultImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateRequest {
  image: File;
  name: string;
  description?: string;
  scene: string;       // "auto" | "home" | "kitchen" | …
  style: string;       // "auto" | "lifestyle" | "premium" | …
  aspectRatio: string;  // "1:1" | "4:5" | "16:9" | "9:16"
}
