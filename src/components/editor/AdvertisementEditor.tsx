"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "fabric";

import { EditorCanvas } from "./EditorCanvas";
import { EditorToolbar } from "./EditorToolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";
import { useEditorStore } from "@/stores/editorStore";

import { renderSchemaToCanvas } from "@/lib/editor/adapter";
import type { AdvertisementDesignSchema } from "@/lib/editor/schema";

interface AdvertisementEditorProps {
  baseImage: string;
  name: string;
  price: string;
  aspectRatio?: string;
  initialDesign?: AdvertisementDesignSchema;
}

export function AdvertisementEditor({
  baseImage,
  name,
  price,
  aspectRatio,
  initialDesign,
}: AdvertisementEditorProps) {
  const canvasRef = useRef<Canvas | null>(null);
  const renderedRef = useRef(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Side panels default open on desktop; toggle buttons in the toolbar let
  // the user hide them to reclaim canvas space when they just want to
  // focus on the image.
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  // Stable reference so EditorCanvas's init effect doesn't see a "new" prop
  // on every render and tear down/recreate the Fabric canvas mid-load.
  const handleCanvasReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  const setCanvasSize = useEditorStore((state) => state.setCanvasSize);
  const currentCanvasSize = useEditorStore((state) => state.canvasSize);

  const targetSize = React.useMemo(() => {
    switch (aspectRatio) {
      case "4:5": return { width: 1080, height: 1350 };
      case "16:9": return { width: 1920, height: 1080 };
      case "9:16": return { width: 1080, height: 1920 };
      case "1:1":
      default: return { width: 1080, height: 1080 };
    }
  }, [aspectRatio]);

  const sizeMatches = currentCanvasSize.width === targetSize.width && currentCanvasSize.height === targetSize.height;

  useEffect(() => {
    if (!sizeMatches) {
      setCanvasSize(targetSize);
    }
  }, [targetSize, sizeMatches, setCanvasSize]);

  useEffect(() => {
    if (!canvasReady) return;
    if (!canvasRef.current) return;
    if (renderedRef.current) return;

    const canvas = canvasRef.current;

    const schema: AdvertisementDesignSchema =
      initialDesign ?? {
        version: "1.0",

        canvas: {
          width: targetSize.width,
          height: targetSize.height,
        },

        elements: [
          {
            id: "title-1",
            type: "text",
            content: name,
            x: 540,
            y: 120,
            fontSize: 64,
            fontFamily: "Kanit",
            color: "#ffffff",
            textAlign: "center",
          },

          {
            id: "price-1",
            type: "price",
            style: "shopee_promo",
            x: 540,
            y: 820,
            content: {
              price,
              leftMain: "ลดกระหน่ำ",
            },
          },
        ],
      };

    renderSchemaToCanvas(
      canvas,
      schema.elements
    );

    renderedRef.current = true;

    canvas.requestRenderAll();
  }, [initialDesign, name, price, targetSize]);

  if (!sizeMatches) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border bg-background">
        <p className="text-muted-foreground text-sm">กำลังปรับขนาดพื้นที่ทำงาน...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background">

      {/* Toolbar */}
      <EditorToolbar
        canvasRef={canvasRef}
        fileName={name}
        price={price}
        showLayers={showLayers}
        onToggleLayers={() => setShowLayers((v) => !v)}
        showProperties={showProperties}
        onToggleProperties={() => setShowProperties((v) => !v)}
      />

      <div className="flex min-h-0 flex-1">

        {/* Layers */}
        {showLayers && (
          <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:flex md:flex-col overflow-y-auto">
            <LayersPanel
              canvasRef={canvasRef}
            />
          </aside>
        )}

        {/* Canvas */}
        <main className="min-w-0 flex-1 bg-background/50 p-4">
          <EditorCanvas
            canvasRef={canvasRef}
            backgroundImageUrl={baseImage}
            onReady={handleCanvasReady}
          />
        </main>

        {/* Properties */}
        {showProperties && (
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l bg-muted/30 lg:flex lg:flex-col">
            <PropertiesPanel
              canvasRef={canvasRef}
            />
          </aside>
        )}

      </div>
    </div>
  );
}