'use client';

import React, { useRef } from 'react';
import * as fabric from 'fabric';
import { Download, ZoomIn, ZoomOut, MousePointer2, Type, Square, Circle, Triangle, Image as ImageIcon, PanelLeft, PanelRight, BadgePercent, ListChecks } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';

type EditorObject = fabric.FabricObject & {
  id?: string;
  layerName?: string;
  elementType?: string;
};

const genId = (prefix: string) =>
  `${prefix}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;

const tagObject = (obj: fabric.Object, id: string, layerName: string, elementType: string) => {
  const editorObj = obj as EditorObject;
  editorObj.id = id;
  editorObj.layerName = layerName;
  editorObj.elementType = elementType;
  return obj;
};

interface EditorToolbarProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  fileName: string;
  price?: string;
  showLayers: boolean;
  onToggleLayers: () => void;
  showProperties: boolean;
  onToggleProperties: () => void;
}

export function EditorToolbar({
  canvasRef,
  fileName,
  price,
  showLayers,
  onToggleLayers,
  showProperties,
  onToggleProperties,
}: EditorToolbarProps) {
  const activeTool = useEditorStore(state => state.activeTool);
  const setActiveTool = useEditorStore(state => state.setActiveTool);
  const zoom = useEditorStore(state => state.zoom);
  const setZoom = useEditorStore(state => state.setZoom);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!canvasRef.current) return;
    
    // Calculate multiplier to always export at 2x logical size regardless of display zoom
    const currentZoom = canvasRef.current.getZoom();
    const exportMultiplier = 2 / currentZoom;
    
    const dataUrl = canvasRef.current.toDataURL({
      format: 'png',
      multiplier: exportMultiplier
    });
    const link = document.createElement("a");
    link.download = `${fileName.replace(/\s+/g, "_")}_ad.png`;
    link.href = dataUrl;
    link.click();
  };

  // Objects live in the canvas's fixed logical coordinate space (e.g.
  // 1080x1080), independent of on-screen zoom/pan — so "center" is just
  // half the logical size. The old canvas.getWidth()/(2*zoom) approach was
  // wrong: getWidth() returns the on-screen pixel size after
  // setDimensions(), and it also ignores the panX/panY offset the
  // resize-to-fit logic applies, so it drifted whenever the container's
  // aspect ratio didn't exactly match the canvas's.
  const getCanvasSize = () => useEditorStore.getState().canvasSize;
  const getCenter = () => {
    const size = getCanvasSize();
    return { x: size.width / 2, y: size.height / 2 };
  };

  const handleAddText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setActiveTool('text');
    const { x, y } = getCenter();

    const text = new fabric.Textbox("ข้อความใหม่", {
      left: x,
      top: y,
      originX: "center",
      originY: "center",
      width: 400,
      fontSize: 40,
      fontFamily: "Kanit",
      fill: "#ffffff",
      textAlign: "center",
    });

    tagObject(text, genId("text"), "ข้อความ", "text");

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    
    text.enterEditing();
    text.selectAll();
    setActiveTool('select');
  };

  const handleAddRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setActiveTool('shape');
    const { x, y } = getCenter();

    const rect = new fabric.Rect({
      left: x,
      top: y,
      originX: "center",
      originY: "center",
      width: 200,
      height: 200,
      rx: 12,
      ry: 12,
      fill: "#31007A",
    });

    tagObject(rect, genId("shape-rect"), "สี่เหลี่ยม", "shape");

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
    setActiveTool('select');
  };

  const handleAddCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setActiveTool('shape');
    const { x, y } = getCenter();

    const circle = new fabric.Circle({
      left: x,
      top: y,
      originX: "center",
      originY: "center",
      radius: 100,
      fill: "#D946EF",
    });

    tagObject(circle, genId("shape-circle"), "วงกลม", "shape");

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
    setActiveTool('select');
  };

  const handleAddTriangle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setActiveTool('shape');
    const { x, y } = getCenter();

    const triangle = new fabric.Triangle({
      left: x,
      top: y,
      originX: "center",
      originY: "center",
      width: 200,
      height: 200,
      fill: "#10B981",
    });

    tagObject(triangle, genId("shape-triangle"), "สามเหลี่ยม", "shape");

    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.requestRenderAll();
    setActiveTool('select');
  };

  // Add a promo-style price badge (ribbon + big price + free-shipping tag +
  // bottom bar), built from individually selectable/colorable parts so the
  // person can tweak each piece's text/color from the Properties panel.
  const handleAddPriceBadge = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setActiveTool('badge');
    const size = getCanvasSize();

    // Base dimensions
    const scale = Math.min(1, size.width / 1000) * 1.5;
    const badgeWidth = 460 * scale;
    const badgeHeight = 140 * scale;
    const boxLeft = size.width / 2;
    const boxTop = size.height / 2;

    const uid = Date.now();
    const objectsToAdd: fabric.Object[] = [];

    // 1. Main Purple/Pink Banner (Chevron pointing left)
    const mainBanner = new fabric.Polygon([
      { x: badgeHeight * 0.4, y: 0 },
      { x: badgeWidth, y: 0 },
      { x: badgeWidth, y: badgeHeight },
      { x: badgeHeight * 0.4, y: badgeHeight },
      { x: 0, y: badgeHeight / 2 }
    ], {
      left: boxLeft,
      top: boxTop,
      originX: 'center',
      originY: 'center',
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: badgeWidth, y2: 0 },
        colorStops: [
          { offset: 0, color: '#3b0a7d' }, // Dark purple
          { offset: 1, color: '#d30c8d' }  // Magenta/Pink
        ]
      }),
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.4)", blur: 15, offsetX: 0, offsetY: 8 }),
    });
    tagObject(mainBanner, genId(`badge-${uid}-bg`), "ป้ายราคา: พื้นหลังหลัก", "badge-bg");
    objectsToAdd.push(mainBanner);

    // 2. Yellow Ribbon (Top Left)
    const topRibbonWidth = badgeWidth * 0.55;
    const topRibbonHeight = badgeHeight * 0.45;
    const topRibbon = new fabric.Polygon([
      { x: 0, y: 0 },
      { x: topRibbonWidth, y: 0 },
      { x: topRibbonWidth - topRibbonHeight * 0.3, y: topRibbonHeight },
      { x: 0, y: topRibbonHeight }
    ], {
      left: boxLeft - badgeWidth * 0.15,
      top: boxTop - badgeHeight * 0.70,
      originX: 'center',
      originY: 'center',
      fill: '#FFD700',
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.3)", blur: 8, offsetX: 2, offsetY: 4 }),
    });
    tagObject(topRibbon, genId(`badge-${uid}-top-ribbon`), "ป้ายราคา: ริบบิ้นบนซ้าย", "badge-ribbon");
    objectsToAdd.push(topRibbon);

    // Text on Yellow Ribbon
    const topRibbonText = new fabric.Textbox("พิเศษเพียง", {
      left: topRibbon.left! - topRibbonWidth * 0.05,
      top: topRibbon.top!,
      originX: "center",
      originY: "center",
      width: topRibbonWidth * 0.8,
      fontSize: topRibbonHeight * 0.65,
      fontWeight: "800",
      fontFamily: "Kanit",
      fill: "#111111",
      textAlign: "center",
    });
    tagObject(topRibbonText, genId(`badge-${uid}-top-text`), "ป้ายราคา: ข้อความริบบิ้น", "badge-text");
    objectsToAdd.push(topRibbonText);

    // 3. Black Pill (Top Right)
    const pillWidth = badgeWidth * 0.4;
    const pillHeight = badgeHeight * 0.4;
    const blackPill = new fabric.Rect({
      left: boxLeft + badgeWidth * 0.30,
      top: boxTop - badgeHeight * 0.70,
      originX: 'center',
      originY: 'center',
      width: pillWidth,
      height: pillHeight,
      rx: pillHeight / 2,
      ry: pillHeight / 2,
      fill: "#111111",
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.3)", blur: 8, offsetX: 0, offsetY: 4 }),
    });
    tagObject(blackPill, genId(`badge-${uid}-pill`), "ป้ายราคา: แท็กส่งเร็ว", "badge-pill");
    objectsToAdd.push(blackPill);

    const pillText = new fabric.Textbox("ส่งเร็ว!", {
      left: blackPill.left!,
      top: blackPill.top!,
      originX: "center",
      originY: "center",
      width: pillWidth * 0.8,
      fontSize: pillHeight * 0.6,
      fontWeight: "800",
      fontFamily: "Kanit",
      fill: "#ffffff",
      textAlign: "center",
    });
    tagObject(pillText, genId(`badge-${uid}-pill-text`), "ป้ายราคา: ข้อความส่งเร็ว", "badge-text");
    objectsToAdd.push(pillText);

    // 4. Big Price Text
    const priceText = new fabric.Textbox(price || "129", {
      left: boxLeft + badgeWidth * 0.05,
      top: boxTop,
      originX: "center",
      originY: "center",
      width: badgeWidth * 0.8,
      fontSize: badgeHeight * 0.9,
      fontWeight: "900",
      fontFamily: "Kanit",
      fill: "#ffffff",
      textAlign: "center",
      stroke: "#222222",
      strokeWidth: 4,
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.5)", blur: 10, offsetX: 4, offsetY: 6 }),
    });
    tagObject(priceText, genId(`badge-${uid}-price`), "ป้ายราคา: ตัวเลขราคา", "badge-price");
    objectsToAdd.push(priceText);

    // 5. Yellow Ribbon (Bottom Right)
    const bottomRibbonWidth = badgeWidth * 0.7;
    const bottomRibbonHeight = badgeHeight * 0.35;
    const bottomRibbon = new fabric.Polygon([
      { x: bottomRibbonHeight * 0.3, y: 0 },
      { x: bottomRibbonWidth, y: 0 },
      { x: bottomRibbonWidth, y: bottomRibbonHeight },
      { x: 0, y: bottomRibbonHeight }
    ], {
      left: boxLeft + badgeWidth * 0.15,
      top: boxTop + badgeHeight * 0.63,
      originX: 'center',
      originY: 'center',
      fill: '#FFD700',
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.3)", blur: 8, offsetX: -2, offsetY: 4 }),
    });
    tagObject(bottomRibbon, genId(`badge-${uid}-bottom-ribbon`), "ป้ายราคา: ริบบิ้นล่าง", "badge-ribbon");
    objectsToAdd.push(bottomRibbon);

    const bottomRibbonText = new fabric.Textbox("คุ้มสุดๆ ทั้งลด ทั้งแถม", {
      left: bottomRibbon.left!,
      top: bottomRibbon.top!,
      originX: "center",
      originY: "center",
      width: bottomRibbonWidth * 0.9,
      fontSize: bottomRibbonHeight * 0.6,
      fontWeight: "700",
      fontFamily: "Kanit",
      fill: "#111111",
      textAlign: "center",
    });
    tagObject(bottomRibbonText, genId(`badge-${uid}-bottom-text`), "ป้ายราคา: ข้อความล่าง", "badge-text");
    objectsToAdd.push(bottomRibbonText);

    objectsToAdd.forEach((obj) => canvas.add(obj));
    canvas.setActiveObject(mainBanner);
    canvas.requestRenderAll();

    setActiveTool('select');
  };

  // Add one checklist row (pill + checkmark text). Stacks automatically
  // below any existing checklist rows so clicking repeatedly builds a list,
  // matching the "✅ สินค้ามาตรฐาน  ✅ ราคาถูกคุณภาพดี" style.
  const handleAddChecklistItem = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setActiveTool('checklist');
    const size = getCanvasSize();

    const existingCount = canvas
      .getObjects()
      .filter((o) => (o as EditorObject).elementType === "checklist-bg").length;

    const itemWidth = Math.min(300, size.width * 0.32);
    const itemHeight = 44;
    const rowGap = 14;
    const startTop = size.height * 0.14;
    const left = size.width * 0.05;
    const top = startTop + existingCount * (itemHeight + rowGap);

    const uid = Date.now();

    const bg = new fabric.Rect({
      left,
      top,
      width: itemWidth,
      height: itemHeight,
      rx: itemHeight / 2,
      ry: itemHeight / 2,
      fill: "#ffffff",
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.25)", blur: 6, offsetX: 0, offsetY: 2 }),
    });
    tagObject(bg, genId(`checklist-${uid}-bg`), `เช็คลิสต์ ${existingCount + 1} - พื้นหลัง`, "checklist-bg");

    const label = new fabric.Textbox("✅ รายละเอียดสินค้า", {
      left: left + 16,
      top: top + itemHeight / 2,
      originX: "left",
      originY: "center",
      width: itemWidth - 32,
      fontSize: 18,
      fontWeight: "700",
      fontFamily: "Kanit",
      fill: "#111111",
    });
    tagObject(label, genId(`checklist-${uid}-text`), `เช็คลิสต์ ${existingCount + 1} - ข้อความ`, "checklist-text");

    canvas.add(bg);
    canvas.add(label);
    canvas.setActiveObject(label);
    canvas.requestRenderAll();

    label.enterEditing();
    label.selectAll();

    setActiveTool('select');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (f) => {
      const data = f.target?.result;
      if (typeof data !== 'string') return;

      fabric.FabricImage.fromURL(data).then((img) => {
        const { x, y } = getCenter();
        
        // Scale down if image is too large
        const scale = Math.min(1, 400 / img.width!, 400 / img.height!);
        
        img.set({
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });

        tagObject(img, genId("image"), file.name || "รูปภาพ", "image");

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      }).catch((err) => {
        console.error("Error loading image", err);
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyZoom = (nextZoom: number) => {
    const canvas = canvasRef.current;
    const clamped = Math.min(3, Math.max(0.25, Math.round(nextZoom * 100) / 100));
    setZoom(clamped);

    if (canvas) {
      const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
      canvas.zoomToPoint(center, clamped);
      canvas.requestRenderAll();
    }
  };

  const toolClass = (isActive: boolean) => 
    `p-2 rounded-md transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="h-14 flex-none border-b border-border bg-background flex items-center justify-between px-4">
      {/* Tools */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTool('select')}
          title="เลือก/ย้ายวัตถุ"
          className={toolClass(activeTool === 'select')}
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          onClick={handleAddText}
          title="เพิ่มข้อความ"
          className={toolClass(false)}
        >
          <Type className="w-4 h-4" />
        </button>
        <button
          onClick={handleAddRect}
          title="สี่เหลี่ยม"
          className={toolClass(false)}
        >
          <Square className="w-4 h-4" />
        </button>
        <button
          onClick={handleAddCircle}
          title="วงกลม"
          className={toolClass(false)}
        >
          <Circle className="w-4 h-4" />
        </button>
        <button
          onClick={handleAddTriangle}
          title="สามเหลี่ยม"
          className={toolClass(false)}
        >
          <Triangle className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          onClick={handleAddPriceBadge}
          title="เพิ่มป้ายราคา/โปรโมชั่น"
          className={toolClass(false)}
        >
          <BadgePercent className="w-4 h-4" />
        </button>
        <button
          onClick={handleAddChecklistItem}
          title="เพิ่มรายการเช็คลิสต์ (✅ ข้อความ)"
          className={toolClass(false)}
        >
          <ListChecks className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          onClick={() => fileInputRef.current?.click()}
          title="แทรกรูปภาพ"
          className={toolClass(false)}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="hidden" 
        />
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <button onClick={() => applyZoom(zoom - 0.1)} className="p-1 hover:text-foreground" title="ซูมออก">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => applyZoom(zoom + 0.1)} className="p-1 hover:text-foreground" title="ซูมเข้า">
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLayers}
          title={showLayers ? "ซ่อนแผงเลเยอร์" : "แสดงแผงเลเยอร์"}
          className={`hidden md:flex p-2 rounded-md transition-colors ${showLayers ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleProperties}
          title={showProperties ? "ซ่อนแผงคุณสมบัติ" : "แสดงแผงคุณสมบัติ"}
          className={`hidden lg:flex p-2 rounded-md transition-colors ${showProperties ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <PanelRight className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button 
          onClick={handleExport}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>
    </div>
  );
}
