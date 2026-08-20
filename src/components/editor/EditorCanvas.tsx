"use client";

import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/stores/editorStore";

interface EditorCanvasProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  backgroundImageUrl?: string;
  onReady?: () => void;
}

type EditorObject = fabric.FabricObject & {
  id?: string;
  layerName?: string;
  elementType?: string;
};

export function EditorCanvas({
  canvasRef,
  backgroundImageUrl,
  onReady,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);

  const setSelectedObjectIds = useEditorStore(
    (state) => state.setSelectedObjectIds
  );

  const canvasSize = useEditorStore(
    (state) => state.canvasSize
  );

  // ============================================
  // Initialize Fabric
  // ============================================

  useEffect(() => {
    if (
      !canvasElementRef.current ||
      !containerRef.current
    ) {
      return;
    }

    // Prevent duplicate canvas
    if (canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(
      canvasElementRef.current,
      {
        width: canvasSize.width,
        height: canvasSize.height,

        preserveObjectStacking: true,

        selection: true,

        backgroundColor: "#f1f5f9",

        // Better interaction
        selectionKey: "shiftKey",

        uniformScaling: false,
      }
    );

    canvasRef.current = canvas;

    useEditorStore.getState().setIsCanvasMounted(true);

    // ============================================
    // Selection
    // ============================================

    const syncSelection = () => {
      const activeObjects =
        canvas.getActiveObjects();

      const ids = activeObjects
        .map((obj) => {
          const editorObj =
            obj as EditorObject;

          return editorObj.id ?? "";
        })
        .filter(Boolean);

      setSelectedObjectIds(ids);
    };

    canvas.on(
      "selection:created",
      syncSelection
    );

    canvas.on(
      "selection:updated",
      syncSelection
    );

    canvas.on(
      "selection:cleared",
      syncSelection
    );

    // ============================================
    // Constraint: Prevent dragging outside canvas
    // ============================================

    canvas.on("object:moving", (e) => {
      const obj = e.target;
      if (!obj || (obj as EditorObject).layerName === "background") return;

      // Calculate object's logical bounds
      const width = obj.getScaledWidth();
      const height = obj.getScaledHeight();

      let minLeft = 0;
      let maxLeft = canvasSize.width;
      let minTop = 0;
      let maxTop = canvasSize.height;

      if (obj.originX === "center") {
        minLeft = width / 2;
        maxLeft = canvasSize.width - width / 2;
      } else {
        minLeft = 0;
        maxLeft = canvasSize.width - width;
      }

      if (obj.originY === "center") {
        minTop = height / 2;
        maxTop = canvasSize.height - height / 2;
      } else {
        minTop = 0;
        maxTop = canvasSize.height - height;
      }

      // Constrain coordinates (prevent object from overflowing canvas edges)
      let newLeft = obj.left!;
      let newTop = obj.top!;

      if (newLeft < minLeft) newLeft = minLeft;
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop < minTop) newTop = minTop;
      if (newTop > maxTop) newTop = maxTop;

      obj.set({
        left: newLeft,
        top: newTop,
      });
    });

    // ============================================
    // Notify parent
    // ============================================

    requestAnimationFrame(() => {
      onReady?.();
    });

    // ============================================
    // Responsive canvas
    // ============================================

    const resizeObserver =
      new ResizeObserver((entries) => {
        if (
          !entries.length ||
          !containerRef.current
        ) {
          return;
        }

        const {
          width,
          height,
        } = entries[0].contentRect;

        if (
          width <= 0 ||
          height <= 0
        ) {
          return;
        }

        const scale = Math.min(
          width / canvasSize.width,
          height / canvasSize.height
        );

        const zoom = scale * 0.9;

        canvas.setZoom(zoom);

        canvas.setDimensions({
          width: canvasSize.width * zoom,
          height: canvasSize.height * zoom,
        });

        // Reset viewport transform to just the zoom (no panning needed since CSS flex centers it)
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] = 0;
          vpt[5] = 0;
          canvas.setViewportTransform(vpt);
        }

        canvas.requestRenderAll();
      });

    resizeObserver.observe(
      containerRef.current
    );

    // ============================================
    // Cleanup
    // ============================================

    return () => {
      resizeObserver.disconnect();

      canvas.dispose();

      canvasRef.current = null;

      useEditorStore.getState().setIsCanvasMounted(false);
    };
  }, [
    canvasSize.width,
    canvasSize.height,
    canvasRef,
    setSelectedObjectIds,
    onReady,
  ]);

  // ============================================
  // Load generated image
  // ============================================

  useEffect(() => {
    if (!canvasRef.current || !backgroundImageUrl) {
      return;
    }

    let cancelled = false;

    const loadBackground =
      async () => {
        try {
          const img =
            await fabric.FabricImage.fromURL(
              backgroundImageUrl,
              {
                crossOrigin: "anonymous",
              }
            );

          if (cancelled) {
            return;
          }

          // Re-read the ref instead of using a value captured before the
          // await above — if the canvas instance was recreated while the
          // image was loading, we must attach to the *current* one, or the
          // image silently ends up on a disposed, invisible canvas.
          const canvas = canvasRef.current;

          if (!canvas) {
            return;
          }

          // Remove old background
          const existingBackground =
            canvas
              .getObjects()
              .find(
                (obj) =>
                  (obj as EditorObject)
                    .layerName ===
                  "background"
              );

          if (existingBackground) {
            canvas.remove(
              existingBackground
            );
          }

          // ========================================
          // Calculate cover scale
          // ========================================

          const imageWidth =
            img.width || 1;

          const imageHeight =
            img.height || 1;

          const scaleX =
            canvasSize.width /
            imageWidth;

          const scaleY =
            canvasSize.height /
            imageHeight;

          const scale = Math.max(
            scaleX,
            scaleY
          );

          img.set({
            left:
              canvasSize.width / 2,

            top:
              canvasSize.height / 2,

            originX: "center",

            originY: "center",

            scaleX: scale,

            scaleY: scale,

            selectable: false,

            evented: false,
          });

          const editorImage =
            img as EditorObject;

          editorImage.id =
            "background";

          editorImage.layerName =
            "background";

          editorImage.elementType =
            "background";

          // ========================================
          // Add background
          // ========================================

          canvas.add(img);

          canvas.sendObjectToBack(img);

          canvas.requestRenderAll();

          console.log(
            "[Editor] Background loaded"
          );
        } catch (error) {
          console.error(
            "[Editor] Failed to load background:",
            error
          );
        }
      };

    loadBackground();

    return () => {
      cancelled = true;
    };
  }, [
    backgroundImageUrl,
    canvasSize.width,
    canvasSize.height,
    canvasRef,
  ]);

  // ============================================
  // Delete / Backspace to remove selected object
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;

      // Don't hijack Delete/Backspace while the user is typing in a normal
      // HTML input/textarea (e.g. the Properties panel text field).
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const active = canvas.getActiveObject() as
        | (EditorObject & { isEditing?: boolean })
        | null;

      // Don't hijack Delete/Backspace while editing text on the canvas
      // itself — that should delete characters, not the whole textbox.
      if (!active || active.isEditing) return;
      if (active.layerName === "background") return;

      e.preventDefault();

      canvas.getActiveObjects().forEach((obj) => {
        if ((obj as EditorObject).layerName !== "background") {
          canvas.remove(obj);
        }
      });

      canvas.discardActiveObject();
      canvas.requestRenderAll();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvasRef]);

  return (
    <div
      ref={containerRef}
      className="
        relative
        flex
        h-full
        w-full
        items-center
        justify-center
        overflow-hidden
        rounded-2xl
        border
        border-slate-800
        bg-slate-900/50
      "
    >
      <canvas
        ref={canvasElementRef}
      />
    </div>
  );
}