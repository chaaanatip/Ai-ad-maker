"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon, X } from "lucide-react";

interface ProductUploaderProps {
  onImageSelected: (base64: string, file: File) => void;
  previewUrl: string | null;
  onClear: () => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function ProductUploader({
  onImageSelected,
  previewUrl,
  onClear,
}: ProductUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_SIZE_MB} MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageSelected(base64, file);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // --- Preview State ---
  if (previewUrl) {
    return (
      <div className="relative group">
        <div className="rounded-2xl overflow-hidden border-2 border-indigo-500/30 bg-slate-900">
          <img
            src={previewUrl}
            alt="Product preview"
            className="w-full h-64 object-contain bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:20px_20px]"
          />
        </div>
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // --- Drop Zone ---
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center gap-3 p-10
          transition-all duration-200
          ${
            isDragging
              ? "border-indigo-400 bg-indigo-500/10 scale-[1.02]"
              : "border-slate-700 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-900"
          }
        `}
      >
        <div
          className={`p-3 rounded-xl ${
            isDragging ? "bg-indigo-500/20" : "bg-slate-800"
          }`}
        >
          {isDragging ? (
            <ImageIcon className="w-8 h-8 text-indigo-400" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-200">
            {isDragging ? "ปล่อยเพื่ออัปโหลด" : "ลากรูปมาวาง หรือคลิกเลือกไฟล์"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            JPG, PNG, WEBP – สูงสุด {MAX_SIZE_MB} MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
