import { create } from 'zustand';

// Temporary type, will refine later
export type LayerData = {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
};

export type ActiveTool = 'select' | 'text' | 'price' | 'badge' | 'shape' | 'checklist';

interface EditorState {
  // Serializable UI state
  selectedObjectIds: string[];
  layers: LayerData[];
  zoom: number;
  canvasSize: { width: number; height: number };
  activeTool: ActiveTool;
  isDirty: boolean;
  // True once the Fabric canvas instance has actually been created and
  // assigned to canvasRef.current. Sibling panels that need to attach
  // listeners to the canvas should wait for this flag rather than relying
  // on canvasRef alone, since React mounts siblings (and runs their
  // effects) in JSX order — a panel rendered before <EditorCanvas> would
  // otherwise see canvasRef.current as null on its first (and only) run.
  isCanvasMounted: boolean;

  // Actions
  setSelectedObjectIds: (ids: string[]) => void;
  setLayers: (layers: LayerData[]) => void;
  setZoom: (zoom: number) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsCanvasMounted: (mounted: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedObjectIds: [],
  layers: [],
  zoom: 1,
  canvasSize: { width: 1080, height: 1080 },
  activeTool: 'select',
  isDirty: false,
  isCanvasMounted: false,

  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),
  setLayers: (layers) => set({ layers }),
  setZoom: (zoom) => set({ zoom }),
  setCanvasSize: (size) => set({ canvasSize: size }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setIsCanvasMounted: (mounted) => set({ isCanvasMounted: mounted }),
}));
