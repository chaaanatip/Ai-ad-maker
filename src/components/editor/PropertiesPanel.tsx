'use client';

import React, { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { Trash2, Copy, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';

type EditorObject = fabric.FabricObject & {
  id?: string;
  layerName?: string;
  elementType?: string;
};

// Helper to convert hex to rgba
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-3 pb-5 border-b">
    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

export function PropertiesPanel({ canvasRef }: { canvasRef: React.MutableRefObject<fabric.Canvas | null> }) {
  const selectedObjectIds = useEditorStore(state => state.selectedObjectIds);
  const isCanvasMounted = useEditorStore(state => state.isCanvasMounted);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);

  // General
  const [opacity, setOpacity] = useState<number>(1);
  const [fillColor, setFillColor] = useState<string>('#ffffff');
  
  // Text specific
  const [textContent, setTextContent] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(40);
  const [fontFamily, setFontFamily] = useState<string>('Kanit');
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<string>('left');
  
  // Stroke
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(0);

  // Shadow
  const [hasShadow, setHasShadow] = useState<boolean>(false);
  const [shadowColor, setShadowColor] = useState<string>('#000000');
  const [shadowBlur, setShadowBlur] = useState<number>(10);
  const [shadowOffsetX, setShadowOffsetX] = useState<number>(5);
  const [shadowOffsetY, setShadowOffsetY] = useState<number>(5);

  // Gradient
  const [isGradient, setIsGradient] = useState<boolean>(false);
  const [gradientColor1, setGradientColor1] = useState<string>('#ff0000');
  const [gradientColor2, setGradientColor2] = useState<string>('#0000ff');

  useEffect(() => {
    if (!canvasRef.current) return;
    const active = canvasRef.current.getActiveObject();
    setActiveObject(active || null);

    if (active) {
      setOpacity(active.opacity ?? 1);
      setStrokeColor((active.stroke as string) || '#000000');
      setStrokeWidth(active.strokeWidth || 0);

      // Shadow extraction
      if (active.shadow) {
        setHasShadow(true);
        const shadow = active.shadow as fabric.Shadow;
        setShadowColor(shadow.color || '#000000');
        setShadowBlur(shadow.blur || 0);
        setShadowOffsetX(shadow.offsetX || 0);
        setShadowOffsetY(shadow.offsetY || 0);
      } else {
        setHasShadow(false);
      }

      // Fill extraction (Solid vs Gradient)
      if (active.fill && typeof active.fill === 'object' && 'colorStops' in active.fill) {
        setIsGradient(true);
        const grad = active.fill as fabric.Gradient<"linear">;
        setGradientColor1(grad.colorStops![0].color || '#ff0000');
        setGradientColor2(grad.colorStops![1].color || '#0000ff');
      } else {
        setIsGradient(false);
        setFillColor((active.fill as string) || '#ffffff');
      }

      // Text properties
      if (active.type === 'textbox' || active.type === 'text') {
        const textObj = active as fabric.Textbox;
        setTextContent(textObj.text || '');
        setFontSize(textObj.fontSize || 40);
        setFontFamily((textObj.fontFamily as string) || 'Kanit');
        setIsBold(textObj.fontWeight === 'bold' || textObj.fontWeight === 700 || textObj.fontWeight === '700' || textObj.fontWeight === 800 || textObj.fontWeight === '800');
        setIsItalic(textObj.fontStyle === 'italic');
        setIsUnderline(!!textObj.underline);
        setTextAlign(textObj.textAlign || 'left');
      }
    }
  }, [selectedObjectIds, canvasRef, isCanvasMounted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeObject) return;

    const handleTextChanged = (e: { target?: fabric.Object }) => {
      if (e.target === activeObject) {
        setTextContent((activeObject as fabric.Textbox).text || '');
      }
    };

    canvas.on('text:changed', handleTextChanged);
    return () => {
      canvas.off('text:changed', handleTextChanged);
    };
  }, [canvasRef, activeObject]);

  const updateActiveObject = (key: string, value: any) => {
    if (activeObject) {
      activeObject.set(key as any, value);
      canvasRef.current?.requestRenderAll();
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setOpacity(val);
    updateActiveObject('opacity', val);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFillColor(val);
    if (!isGradient) {
      updateActiveObject('fill', val);
    }
  };

  const applyGradient = (c1: string, c2: string) => {
    if (!activeObject) return;
    
    // A simple linear gradient from top-left to bottom-right
    const width = activeObject.width || 100;
    const height = activeObject.height || 100;
    
    const gradient = new fabric.Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: width, y2: height },
      colorStops: [
        { offset: 0, color: c1 },
        { offset: 1, color: c2 }
      ]
    });
    
    updateActiveObject('fill', gradient);
  };

  const toggleGradient = (useGradient: boolean) => {
    setIsGradient(useGradient);
    if (useGradient) {
      applyGradient(gradientColor1, gradientColor2);
    } else {
      updateActiveObject('fill', fillColor);
    }
  };

  const handleStrokeChange = (type: 'color' | 'width', val: any) => {
    if (type === 'color') {
      setStrokeColor(val);
      updateActiveObject('stroke', val);
    } else {
      setStrokeWidth(Number(val));
      updateActiveObject('strokeWidth', Number(val));
    }
  };

  const applyShadow = (enabled: boolean, color: string, blur: number, ox: number, oy: number) => {
    setHasShadow(enabled);
    if (enabled) {
      const shadow = new fabric.Shadow({
        color: color,
        blur: blur,
        offsetX: ox,
        offsetY: oy
      });
      updateActiveObject('shadow', shadow);
    } else {
      updateActiveObject('shadow', null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextContent(val);
    updateActiveObject('text', val);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setFontSize(val);
    updateActiveObject('fontSize', val);
  };

  const FONT_OPTIONS = [
    { label: 'Kanit', value: 'Kanit' },
    { label: 'Prompt', value: 'Prompt' },
    { label: 'Sans-serif (ทั่วไป)', value: 'sans-serif' },
    { label: 'Serif', value: 'serif' },
  ];

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFontFamily(val);
    updateActiveObject('fontFamily', val);
  };

  const toggleBold = () => {
    const next = !isBold;
    setIsBold(next);
    updateActiveObject('fontWeight', next ? '700' : 'normal');
  };

  const toggleItalic = () => {
    const next = !isItalic;
    setIsItalic(next);
    updateActiveObject('fontStyle', next ? 'italic' : 'normal');
  };

  const toggleUnderline = () => {
    const next = !isUnderline;
    setIsUnderline(next);
    updateActiveObject('underline', next);
  };

  const handleTextAlignChange = (align: string) => {
    setTextAlign(align);
    updateActiveObject('textAlign', align);
  };

  const handleDelete = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeObject) return;

    const editorObj = activeObject as EditorObject;
    if (editorObj.layerName === 'background') return; // never delete background

    canvas.remove(activeObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setActiveObject(null);
  };

  const handleDuplicate = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeObject) return;

    const editorObj = activeObject as EditorObject;
    if (editorObj.layerName === 'background') return;

    const cloned = (await activeObject.clone()) as EditorObject;
    cloned.set({
      left: (activeObject.left || 0) + 24,
      top: (activeObject.top || 0) + 24,
    });
    cloned.id = `${editorObj.id || 'obj'}-copy-${Date.now()}`;
    cloned.layerName = editorObj.layerName ? `${editorObj.layerName} (สำเนา)` : cloned.layerName;
    cloned.elementType = editorObj.elementType;

    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
  };

  if (selectedObjectIds.length === 0 || !activeObject) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center gap-2">
        <p>เลือกวัตถุบนภาพเพื่อแก้ไข</p>
        <p className="text-xs">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข หรือใช้แถบเครื่องมือด้านบนเพื่อเพิ่มวัตถุใหม่
        </p>
      </div>
    );
  }

  const isText = activeObject.type === 'textbox' || activeObject.type === 'text';
  const isImage = activeObject.type === 'image';
  const isBackground = (activeObject as EditorObject).layerName === 'background';



  return (
    <div className="p-5 flex flex-col gap-5 overflow-y-auto h-[calc(100vh-100px)] no-scrollbar">
      
      {/* TEXT PROPERTIES */}
      {isText && (
        <Section title="ข้อความ">
          <div className="space-y-2">
            <input
              type="text"
              value={textContent}
              onChange={handleTextChange}
              className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-foreground">ฟอนต์ (Font)</label>
            <select
              value={fontFamily}
              onChange={handleFontFamilyChange}
              className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontFamily }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-foreground">รูปแบบตัวอักษร</label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleBold}
                title="ตัวหนา"
                className={`p-2 rounded-md transition-colors ${isBold ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={toggleItalic}
                title="ตัวเอียง"
                className={`p-2 rounded-md transition-colors ${isItalic ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={toggleUnderline}
                title="ขีดเส้นใต้"
                className={`p-2 rounded-md transition-colors ${isUnderline ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={() => handleTextAlignChange('left')}
                title="ชิดซ้าย"
                className={`p-2 rounded-md transition-colors ${textAlign === 'left' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleTextAlignChange('center')}
                title="กึ่งกลาง"
                className={`p-2 rounded-md transition-colors ${textAlign === 'center' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleTextAlignChange('right')}
                title="ชิดขวา"
                className={`p-2 rounded-md transition-colors ${textAlign === 'right' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-foreground">ขนาดตัวอักษร</label>
              <span className="text-xs font-mono text-muted-foreground">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={200}
              value={fontSize}
              onChange={handleFontSizeChange}
              className="w-full accent-primary"
            />
          </div>
        </Section>
      )}

      {/* APPEARANCE (Color/Gradient/Opacity) */}
      {!isImage && (
        <Section title="สีพื้น (Fill)">
          <div className="flex bg-muted rounded-lg p-1 border">
            <button 
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${!isGradient ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => toggleGradient(false)}
            >
              สีเดียว (Solid)
            </button>
            <button 
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${isGradient ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => toggleGradient(true)}
            >
              ไล่สี (Gradient)
            </button>
          </div>

          {!isGradient ? (
            <div className="flex items-center gap-3 mt-3">
              <input 
                type="color" 
                value={fillColor}
                onChange={handleColorChange}
                className="w-8 h-8 rounded cursor-pointer bg-background border-0 p-0"
              />
              <span className="text-xs font-mono text-muted-foreground">{fillColor}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={gradientColor1}
                  onChange={(e) => {
                    setGradientColor1(e.target.value);
                    applyGradient(e.target.value, gradientColor2);
                  }}
                  className="w-8 h-8 rounded cursor-pointer bg-background border-0 p-0"
                />
              </div>
              <span className="text-muted-foreground text-xs">→</span>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={gradientColor2}
                  onChange={(e) => {
                    setGradientColor2(e.target.value);
                    applyGradient(gradientColor1, e.target.value);
                  }}
                  className="w-8 h-8 rounded cursor-pointer bg-background border-0 p-0"
                />
              </div>
            </div>
          )}
        </Section>
      )}

      {/* OPACITY */}
      <Section title="ความโปร่งใส (Opacity)">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Opacity</label>
            <span className="text-xs font-mono text-muted-foreground">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={handleOpacityChange}
            className="w-full accent-primary"
          />
        </div>
      </Section>

      {/* STROKE */}
      {!isImage && (
        <Section title="เส้นขอบ (Stroke)">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={strokeColor}
                onChange={(e) => handleStrokeChange('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-background border-0 p-0"
              />
              <span className="text-xs font-mono text-muted-foreground">{strokeColor}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-foreground">ความหนา (Width)</label>
                <span className="text-xs font-mono text-muted-foreground">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={strokeWidth}
                onChange={(e) => handleStrokeChange('width', e.target.value)}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </Section>
      )}

      {/* SHADOW */}
      <Section title="เงา (Drop Shadow)">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input 
            type="checkbox" 
            checked={hasShadow}
            onChange={(e) => applyShadow(e.target.checked, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY)}
            className="rounded border-border bg-background text-primary focus:ring-primary/20"
          />
          <span className="text-xs text-foreground">เปิดใช้งานเงา</span>
        </label>

        {hasShadow && (
          <div className="space-y-4 pt-2 pl-1 border-l-2 border-border ml-2">
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={shadowColor}
                onChange={(e) => {
                  setShadowColor(e.target.value);
                  applyShadow(true, e.target.value, shadowBlur, shadowOffsetX, shadowOffsetY);
                }}
                className="w-6 h-6 rounded cursor-pointer bg-background border-0 p-0"
              />
              <span className="text-[11px] text-muted-foreground">สีของเงา</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between"><label className="text-[11px] text-muted-foreground">ความเบลอ (Blur)</label><span className="text-[10px] text-muted-foreground">{shadowBlur}</span></div>
              <input type="range" min={0} max={50} value={shadowBlur} onChange={(e) => { setShadowBlur(Number(e.target.value)); applyShadow(true, shadowColor, Number(e.target.value), shadowOffsetX, shadowOffsetY); }} className="w-full accent-primary h-1" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between"><label className="text-[11px] text-muted-foreground">แกน X (Offset X)</label><span className="text-[10px] text-muted-foreground">{shadowOffsetX}</span></div>
              <input type="range" min={-50} max={50} value={shadowOffsetX} onChange={(e) => { setShadowOffsetX(Number(e.target.value)); applyShadow(true, shadowColor, shadowBlur, Number(e.target.value), shadowOffsetY); }} className="w-full accent-primary h-1" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between"><label className="text-[11px] text-muted-foreground">แกน Y (Offset Y)</label><span className="text-[10px] text-muted-foreground">{shadowOffsetY}</span></div>
              <input type="range" min={-50} max={50} value={shadowOffsetY} onChange={(e) => { setShadowOffsetY(Number(e.target.value)); applyShadow(true, shadowColor, shadowBlur, shadowOffsetX, Number(e.target.value)); }} className="w-full accent-primary h-1" />
            </div>
          </div>
        )}
      </Section>

      {/* ACTIONS */}
      {!isBackground && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleDuplicate}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors border"
          >
            <Copy className="w-3.5 h-3.5" /> ทำสำเนา
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/20"
          >
            <Trash2 className="w-3.5 h-3.5" /> ลบ
          </button>
        </div>
      )}
    </div>
  );
}
