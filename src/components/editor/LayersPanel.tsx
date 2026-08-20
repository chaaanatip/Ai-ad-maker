"use client";

import React, { useCallback, useEffect, useState } from "react";
import * as fabric from "fabric";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  object: fabric.FabricObject;
}

type EditorObject = fabric.FabricObject & {
  id?: string;
  layerName?: string;
  elementType?: string;
};

interface LayersPanelProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

type LayerEvent =
  | "object:added"
  | "object:removed"
  | "object:modified"
  | "selection:created"
  | "selection:updated"
  | "selection:cleared";

const LAYER_EVENTS: LayerEvent[] = [
  "object:added",
  "object:removed",
  "object:modified",
  "selection:created",
  "selection:updated",
  "selection:cleared",
];

export function LayersPanel({ canvasRef }: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // The canvas is created inside a sibling component (<EditorCanvas>) that
  // mounts *after* this panel in JSX order. Watching this flag (instead of
  // relying only on canvasRef) guarantees we (re-)attach listeners once the
  // canvas instance actually exists, rather than silently no-op'ing forever
  // because canvasRef.current was still null on this panel's first effect run.
  const isCanvasMounted = useEditorStore((state) => state.isCanvasMounted);

  /**
   * Sync Fabric objects -> React layer list
   */
  const syncLayers = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const objects = canvas.getObjects() as EditorObject[];

    const layerData: LayerInfo[] = objects
      .map((obj, index) => ({
        id: obj.id ?? `layer-${index}`,

        name:
          obj.layerName ??
          obj.id ??
          `${obj.type ?? "Object"} ${index + 1}`,

        type:
          obj.elementType ??
          obj.type ??
          "object",

        visible: obj.visible !== false,

        locked:
          obj.selectable === false &&
          obj.evented === false,

        object: obj,
      }))
      .reverse();

    setLayers(layerData);

    const active = canvas.getActiveObject() as EditorObject | null;

    setSelectedId(active?.id ?? null);
  }, [canvasRef]);

  /**
   * Listen to Fabric events
   */
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    syncLayers();

    // Fabric v6 requires keyof CanvasEvents
    LAYER_EVENTS.forEach((event) => {
      canvas.on(event, syncLayers);
    });

    return () => {
      LAYER_EVENTS.forEach((event) => {
        canvas.off(event, syncLayers);
      });
    };
  }, [canvasRef, syncLayers, isCanvasMounted]);

  /**
   * Select layer
   */
  const handleSelect = (layer: LayerInfo) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    // Background is not selectable
    if (layer.locked) return;

    canvas.setActiveObject(layer.object);
    canvas.requestRenderAll();

    setSelectedId(layer.id);
  };

  /**
   * Toggle visibility
   */
  const handleToggleVisibility = (
    e: React.MouseEvent,
    layer: LayerInfo
  ) => {
    e.stopPropagation();

    layer.object.set({
      visible: !layer.visible,
    });

    canvasRef.current?.requestRenderAll();

    syncLayers();
  };

  /**
   * Toggle lock
   */
  const handleToggleLock = (
    e: React.MouseEvent,
    layer: LayerInfo
  ) => {
    e.stopPropagation();

    const canvas = canvasRef.current;

    if (!canvas) return;

    const locked = !layer.locked;

    layer.object.set({
      selectable: !locked,
      evented: !locked,
    });

    if (locked) {
      canvas.discardActiveObject();
      setSelectedId(null);
    }

    canvas.requestRenderAll();

    syncLayers();
  };

  /**
   * Move layer up/down
   */
  const handleMove = (e: React.MouseEvent, layer: LayerInfo, direction: "up" | "down") => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const currIndex = objects.indexOf(layer.object);
    if (currIndex === -1) return;

    // Up in the UI list means higher z-index (forward)
    // Down in the UI list means lower z-index (backward)
    let targetIndex = direction === "up" ? currIndex + 1 : currIndex - 1;

    // Enforce bounds: index 0 is background, don't move below index 1
    if (targetIndex < 1) targetIndex = 1;
    if (targetIndex >= objects.length) targetIndex = objects.length - 1;

    if (currIndex === targetIndex) return;

    if (typeof canvas.moveObjectTo === "function") {
      canvas.moveObjectTo(layer.object, targetIndex);
    } else {
      // Manual array swap fallback for some Fabric versions
      const temp = objects[currIndex];
      objects[currIndex] = objects[targetIndex];
      objects[targetIndex] = temp;
      canvas.fire("object:modified", { target: layer.object });
    }

    canvas.requestRenderAll();
    syncLayers();
  };

  /**
   * Delete layer
   */
  const handleDelete = (
    e: React.MouseEvent,
    layer: LayerInfo
  ) => {
    e.stopPropagation();

    const canvas = canvasRef.current;

    if (!canvas) return;

    const isBackground =
      layer.id === "background" ||
      layer.type === "background" ||
      (layer.object as EditorObject).layerName === "background";

    // Never delete background
    if (isBackground) return;

    canvas.remove(layer.object);
    canvas.discardActiveObject();

    setSelectedId(null);

    canvas.requestRenderAll();

    syncLayers();
  };

  const handleDragStart = (e: React.DragEvent, layer: LayerInfo) => {
    setDraggedId(layer.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetLayer: LayerInfo) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetLayer.id) {
      setDraggedId(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const draggedLayer = layers.find((l) => l.id === draggedId);
    if (!draggedLayer) return;

    const currIndex = objects.indexOf(draggedLayer.object);
    const targetIndex = objects.indexOf(targetLayer.object);

    if (currIndex === -1 || targetIndex === -1) return;

    // Index 0 is always background, prevent moving below it
    const finalTargetIndex = Math.max(1, targetIndex);

    if (typeof canvas.moveObjectTo === "function") {
      canvas.moveObjectTo(draggedLayer.object, finalTargetIndex);
    } else {
      objects.splice(currIndex, 1);
      objects.splice(finalTargetIndex, 0, draggedLayer.object);
      canvas.fire("object:modified", { target: draggedLayer.object });
    }

    canvas.requestRenderAll();
    syncLayers();
    setDraggedId(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <Layers className="h-4 w-4 text-muted-foreground" />

        <h3 className="text-sm font-semibold text-foreground">
          Layers
        </h3>

        <span className="ml-auto text-[10px] text-muted-foreground">
          {layers.length}
        </span>
      </div>

      {/* Layers */}
      <div className="flex-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-600">
            No layers
          </div>
        ) : (
          <div className="space-y-1">
            {layers.map((layer) => {
              const selected = selectedId === layer.id;

              const isBackground =
                layer.id === "background" ||
                layer.type === "background" ||
                (layer.object as EditorObject).layerName ===
                "background";

              return (
                <div
                  key={layer.id}
                  onClick={() => handleSelect(layer)}
                  draggable={!isBackground}
                  onDragStart={(e) => handleDragStart(e, layer)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, layer)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`
                    group
                    flex
                    cursor-pointer
                    items-center
                    gap-2
                    rounded-lg
                    px-2
                    py-2
                    transition-colors
                    ${draggedId === layer.id ? "opacity-50" : ""}
                    ${selected
                      ? "bg-primary/15 ring-1 ring-primary/30"
                      : "hover:bg-muted/70"
                    }
                  `}
                >
                  {/* Object icon */}
                  <div
                    className={`
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded
                      text-[9px]
                      font-semibold
                      uppercase
                      ${selected
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {layer.type.slice(0, 3)}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`
                        truncate text-xs
                        ${selected
                          ? "text-primary"
                          : "text-foreground"
                        }
                      `}
                    >
                      {layer.name}
                    </div>

                    <div className="text-[9px] uppercase text-muted-foreground">
                      {layer.type}
                    </div>
                  </div>

                  {/* Visibility */}
                  <button
                    type="button"
                    onClick={(e) =>
                      handleToggleVisibility(e, layer)
                    }
                    className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title={
                      layer.visible
                        ? "Hide layer"
                        : "Show layer"
                    }
                  >
                    {layer.visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Lock */}
                  <button
                    type="button"
                    onClick={(e) =>
                      handleToggleLock(e, layer)
                    }
                    className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title={
                      layer.locked
                        ? "Unlock layer"
                        : "Lock layer"
                    }
                  >
                    {layer.locked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                  </button>



                  {/* Delete */}
                  {!isBackground && (
                    <button
                      type="button"
                      onClick={(e) =>
                        handleDelete(e, layer)
                      }
                      className="rounded p-1 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                      title="Delete layer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}