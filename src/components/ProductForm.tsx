"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AdTemplateStyle } from "@/types/ai";

// --- Option lists from the spec ---
const TEMPLATE_OPTIONS: AdTemplateStyle[] = [
  "Lifestyle",
  "Premium",
  "Minimal",
  "Promotion",
  "New Arrival",
  "Product Focus",
];

const TEXT_POSITION_OPTIONS = ["Auto", "Left", "Right", "Top", "Bottom"] as const;

const ASPECT_OPTIONS = ["4:5", "1:1", "16:9", "9:16"] as const;

interface ProductFormProps {
  name: string;
  onNameChange: (v: string) => void;
  price: string;
  onPriceChange: (v: string) => void;
  features: string;
  onFeaturesChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  templateStyle: AdTemplateStyle;
  onTemplateStyleChange: (v: AdTemplateStyle) => void;
  textPosition: string;
  onTextPositionChange: (v: string) => void;
  interaction: string;
  onInteractionChange: (v: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (v: string) => void;
}

const INTERACTION_OPTIONS = ["Auto", "Product Only", "In Use", "Human Interaction"] as const;

export default function ProductForm({
  name,
  onNameChange,
  price,
  onPriceChange,
  features,
  onFeaturesChange,
  description,
  onDescriptionChange,
  templateStyle,
  onTemplateStyleChange,
  textPosition,
  onTextPositionChange,
  interaction,
  onInteractionChange,
  aspectRatio,
  onAspectRatioChange,
}: ProductFormProps) {

  return (
    <div className="space-y-5">
      {/* Product Name */}
      <div className="space-y-2">
        <Label>
          ชื่อสินค้า <span className="text-red-400">*</span>
        </Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="เช่น ปั๊มน้ำอัจฉริยะ PUMPKIN Inverter"
        />
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <Label>
          รายละเอียดสินค้า{" "}
          <span className="text-slate-500 font-normal">(ไม่บังคับ)</span>
        </Label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="เช่น ปั๊มน้ำระบบ Inverter สำหรับใช้ภายในบ้าน ช่วยควบคุมแรงดันน้ำให้คงที่"
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Price & Features */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            ราคา <span className="text-slate-500 font-normal">(เช่น 2,990)</span>
          </Label>
          <Input
            type="text"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="2,990"
          />
        </div>
        <div className="space-y-2">
          <Label>
            จุดเด่น <span className="text-slate-500 font-normal">(คั่นด้วยลูกน้ำ)</span>
          </Label>
          <Input
            type="text"
            value={features}
            onChange={(e) => onFeaturesChange(e.target.value)}
            placeholder="ประหยัดไฟ 30%, เสียงเงียบ, IPX5"
          />
        </div>
      </div>

      {/* Template Style + Text Position row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ad Template Style</Label>
          <Select
            value={templateStyle}
            onValueChange={(v) => onTemplateStyleChange(v as AdTemplateStyle)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกสไตล์" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Text Position</Label>
          <Select
            value={textPosition}
            onValueChange={(v) => onTextPositionChange(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ตำแหน่งข้อความ" />
            </SelectTrigger>
            <SelectContent>
              {TEXT_POSITION_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Interaction Mode */}
      <div className="space-y-2">
        <Label>Product Interaction Mode</Label>
        <div className="flex flex-wrap gap-2">
          {INTERACTION_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onInteractionChange(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-1 min-w-24 ${
                interaction === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:border-border hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <Label>Aspect Ratio</Label>
        <div className="flex gap-2">
          {ASPECT_OPTIONS.map((ar) => (
            <button
              key={ar}
              type="button"
              onClick={() => onAspectRatioChange(ar)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                aspectRatio === ar
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:border-border hover:bg-muted"
              }`}
            >
              {ar}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
