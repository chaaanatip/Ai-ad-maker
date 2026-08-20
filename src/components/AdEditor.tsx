"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { Download, Move, Palette, Type, LayoutTemplate } from "lucide-react";
import { toPng } from "html-to-image";
import type { AdTemplateStyle, SceneSpecification } from "@/types/ai";
import { useDraggable } from "@/hooks/useDraggable";

interface AdEditorProps {
  baseImage: string;
  name: string;
  price: string;
  features: string;
  templateStyle: AdTemplateStyle;
  textPosition: string;
  layoutAreas?: Record<string, { x: number; y: number; width: number; height: number }>;
  design?: SceneSpecification["design"];
}

// A dynamic draggable area component
function DraggableArea({
  areaKey,
  initialLayout,
  designElements,
  designDirection,
  name,
  price,
  features,
  templateStyle,
  canvasRef,
  isSelected,
  onSelect,
  customTexts,
}: {
  areaKey: string;
  initialLayout: { x: number; y: number; width: number; height: number };
  designElements: SceneSpecification["design"]["elements"];
  designDirection: SceneSpecification["design"]["direction"];
  name: string;
  price: string;
  features: string;
  templateStyle: AdTemplateStyle;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  onSelect: (id: string) => void;
  customTexts: Record<string, string>;
}) {
  const drag = useDraggable(initialLayout, canvasRef);
  const toPct = (val: number) => `${val * 100}%`;

  const isPromoStyle = designDirection?.card_style === "promo";
  const isPromoPrice = isPromoStyle && areaKey.includes("price");

  const style: React.CSSProperties = {
    position: "absolute",
    left: isPromoPrice ? "0" : toPct(drag.position.x),
    bottom: isPromoPrice ? "0" : undefined,
    top: isPromoPrice ? "auto" : toPct(drag.position.y),
    width: isPromoPrice ? "100%" : toPct(initialLayout.width),
    height: isPromoPrice ? "auto" : toPct(initialLayout.height),
    cursor: isPromoPrice ? "default" : (drag.isDragging ? "grabbing" : "grab"),
    zIndex: isPromoPrice ? 50 : 10,
  };

  const alignClass = drag.position.x > 0.4 ? "items-end text-right" : "items-start text-left";
  const featureList = features.split(",").map((f) => f.trim()).filter(Boolean);

  // Apply typography class based on token
  const getFontClass = (fontType: string) => {
    switch (fontType) {
      case "prompt": return "font-[family-name:var(--font-prompt)]";
      case "kanit": return "font-[family-name:var(--font-kanit)]";
      case "serif": return "font-serif";
      case "mono": return "font-mono";
      default: return "font-sans";
    }
  };
  const fontClass = getFontClass(designDirection?.title_font || "sans");

  return (
    <div 
      className={`flex flex-col p-6 border-2 rounded-xl transition-colors group/area ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent hover:border-indigo-500/50'}`}
      style={style}
      {...drag.bind}
      onClick={(e) => { e.stopPropagation(); onSelect(areaKey); }}
    >
      {!isPromoPrice && (
        <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-1.5 rounded-full opacity-0 group-hover/area:opacity-100 transition-opacity shadow-lg z-10">
          <Move className="w-3 h-3" />
        </div>
      )}

      <div className={`flex flex-col gap-6 w-full h-full pointer-events-none ${alignClass} ${areaKey.includes("price") ? "mt-auto justify-end" : "justify-center"}`}>
        {designElements.map((el) => {
          switch (el.type) {
            case "title":
              const isPromo = designDirection?.card_style === "promo";
              return (
                <div key={el.id} className={`flex flex-col gap-2 ${alignClass} ${isPromo ? 'items-center text-center' : ''}`}>
                  {templateStyle === "New Arrival" && (
                    <div 
                      className="text-[10px] font-bold px-3 py-1 w-max rounded-full tracking-wider uppercase shadow-lg"
                      style={{ backgroundColor: designDirection?.accent_color || "#EF4444", color: "#FFF" }}
                    >
                      New Arrival
                    </div>
                  )}
                  {isPromo && (
                    <h2 
                      className={`text-[5rem] leading-[0.85] font-black tracking-tighter drop-shadow-2xl ${fontClass}`}
                      style={{ 
                        color: "#FFFFFF",
                        WebkitTextStroke: `6px ${designDirection?.primary_color || "#3A2418"}`,
                        paintOrder: "stroke fill",
                      }}
                    >
                      {name.split(" ").map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </h2>
                  )}
                  {!isPromo && (
                    <h2 
                      className={`text-4xl font-black leading-tight drop-shadow-xl ${fontClass}`}
                      style={{ color: designDirection?.primary_text_color || "#FFFFFF" }}
                    >
                      {name.split(" ").map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </h2>
                  )}
                </div>
              );

            case "feature_list":
              if (featureList.length === 0) return null;
              const isPromoFeature = designDirection?.card_style === "promo";
              return (
                <ul key={el.id} className={`drop-shadow-md ${alignClass} ${isPromoFeature ? 'flex flex-row flex-wrap justify-center gap-4 mt-2' : 'space-y-2'}`}>
                  {featureList.map((f, i) => (
                    <li 
                      key={i} 
                      className={`font-medium text-sm flex items-center gap-1.5 ${isPromoFeature ? 'bg-white/90 px-3 py-1 rounded-full text-black shadow-lg font-bold' : alignClass} ${fontClass}`}
                      style={!isPromoFeature ? { color: designDirection?.secondary_text_color || "#E2E8F0" } : {}}
                    >
                      {isPromoFeature ? (
                        <span className="text-red-600 text-base leading-none bg-white rounded-full">✅</span>
                      ) : (
                        <span 
                          className="w-1.5 h-1.5 rounded-full block flex-shrink-0" 
                          style={{ backgroundColor: designDirection?.primary_color || "#818CF8" }}
                        />
                      )}
                      {f}
                    </li>
                  ))}
                </ul>
              );

            case "price_badge":
              if (!price) return null;
              
              if (designDirection?.card_style === "promo") {
                const primaryBg = designDirection?.primary_color || "#31007A";
                const accentBg = designDirection?.accent_color || "#FFD700";
                
                const fontFamilyValue = designDirection?.title_font === 'prompt' 
                  ? 'var(--font-prompt), sans-serif' 
                  : designDirection?.title_font === 'kanit' 
                    ? 'var(--font-kanit), sans-serif' 
                    : 'ui-sans-serif, system-ui, sans-serif';

                return (
                  <div key={el.id} className="relative w-full max-w-[400px] mx-auto drop-shadow-2xl flex justify-center">
                    <svg viewBox="0 0 400 130" className="w-full h-auto" style={{ fontFamily: fontFamilyValue }}>
                      <defs>
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.4"/>
                        </filter>
                      </defs>
                      
                      {/* Top Black Bar */}
                      <path d="M 270 15 L 390 15 C 395 15 400 20 400 25 L 400 45 L 260 45 Z" fill="#000000" />
                      
                      {/* Bottom Yellow Bar */}
                      <path d="M 220 115 L 400 115 C 400 115 400 130 390 130 L 200 130 Z" fill={accentBg} />
                      
                      {/* Ribbon Fold (Dark Yellow) */}
                      <path d="M 30 15 L 40 35 L 10 35 Z" fill="#B39700" />
                      
                      {/* Main Purple Arrow */}
                      <path d="M 80 35 L 400 35 L 400 115 L 60 115 L 30 75 Z" fill={primaryBg} filter="url(#shadow)" />
                      
                      {/* Top Yellow Ribbon */}
                      <path d="M 30 5 L 280 5 L 260 35 L 10 35 Z" fill={accentBg} filter="url(#shadow)" />
                      
                      {/* Left Edge Details */}
                      <rect x="0" y="50" width="30" height="25" fill="#000000" />
                      <rect x="0" y="75" width="30" height="40" fill="#FFFFFF" />
                      <path d="M 5 55 L 25 62 L 5 70 Z" fill="#FFFFFF" />

                      {/* --- NATIVE SVG TEXT --- */}
                      {/* Left Info Text */}
                      <text x="45" y="58" fill="#FFFFFF" fontSize="11" fontWeight="900" letterSpacing="-0.5">{customTexts.shopee_top_left}</text>
                      <text x="45" y="78" fill="#FFFFFF" fontSize="18" fontWeight="900">{customTexts.shopee_left_main}</text>
                      <text x="45" y="94" fill="#DDDDDD" fontSize="9" fontWeight="700">{customTexts.shopee_left_sub}</text>
                      
                      {/* Top Yellow Ribbon Text */}
                      <text x="160" y="27" fill="#000000" fontSize="20" fontWeight="900" fontStyle="italic" textAnchor="middle" transform="skewX(-10)">{customTexts.shopee_ribbon}</text>
                      
                      {/* Top Black Bar Text */}
                      <text x="345" y="35" fill="#FFFFFF" fontSize="18" fontWeight="900" fontStyle="italic" textAnchor="middle" transform="skewX(-10)">{customTexts.shopee_top_right}</text>
                      
                      {/* Massive Price Text */}
                      <text x="385" y="105" fill="#FFFFFF" fontSize="75" fontWeight="900" fontStyle="italic" textAnchor="end" stroke="rgba(255,255,255,0.2)" strokeWidth="2" letterSpacing="-2">{price}</text>
                      
                      {/* Bottom Yellow Bar Text */}
                      <text x="385" y="126" fill="#000000" fontSize="11" fontWeight="900" fontStyle="italic" textAnchor="end">{customTexts.shopee_bottom}</text>
                    </svg>
                  </div>
                );
              }

              const isSolid = designDirection?.card_style === "solid";
              return (
                <div 
                  key={el.id} 
                  className={`p-4 rounded-xl shadow-2xl border ${isSolid ? 'border-transparent' : 'backdrop-blur-md border-white/20'}`}
                  style={{ 
                    backgroundColor: isSolid ? designDirection?.background_color : `${designDirection?.background_color || '#FFFFFF'}22`,
                  }}
                >
                  <p 
                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: designDirection?.secondary_text_color || "#E2E8F0" }}
                  >
                    Special Price
                  </p>
                  <div 
                    className={`text-4xl font-black drop-shadow-lg ${fontClass}`}
                    style={{ color: designDirection?.primary_text_color || "#FFFFFF" }}
                  >
                    ฿{price}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

export default function AdEditor({
  baseImage,
  name,
  price,
  features,
  templateStyle,
  textPosition,
  layoutAreas,
  design,
}: AdEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Editor State initialized from AI
  const [designState, setDesignState] = useState<SceneSpecification["design"]["direction"]>(
    design?.direction || {
      primary_color: "#818CF8",
      secondary_color: "#4F46E5",
      accent_color: "#F59E0B",
      primary_text_color: "#FFFFFF",
      secondary_text_color: "#E2E8F0",
      background_color: "#000000",
      title_font: "sans",
      card_style: "glass",
    }
  );

  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({
    shopee_top_left: "โปรพิเศษ 100 ท่านแรกเท่านั้น",
    shopee_left_main: "ได้เนียนเรียบ",
    shopee_left_sub: "มีบริการเก็บเงินปลายทางถึงหน้าบ้านคุณ",
    shopee_ribbon: "พิเศษเพียง",
    shopee_top_right: "ส่งเร็ว!",
    shopee_bottom: "คุ้มสุดๆ ทั้งลด ทั้งแถม"
  });

  const handleCustomTextChange = (key: string, value: string) => {
    setCustomTexts(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (design?.direction) {
      setDesignState(design.direction);
    }
  }, [design?.direction]);

  const handleDownload = useCallback(async () => {
    if (canvasRef.current === null) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { 
        cacheBust: true, 
        quality: 1.0,
        pixelRatio: 4 // Export at 4x resolution (High-Res)
      });
      const link = document.createElement("a");
      link.download = `ad_${name.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  }, [name]);

  const handleColorChange = (key: keyof typeof designState, value: string) => {
    setDesignState((prev) => ({ ...prev, [key]: value }));
  };

  const hasDynamicLayout = !!(layoutAreas && design?.elements);

  const renderDynamicAreas = () => {
    if (!layoutAreas || !design?.elements) return null;
    
    const elementsByArea = design.elements.reduce((acc, el) => {
      if (!acc[el.area]) acc[el.area] = [];
      acc[el.area].push(el);
      return acc;
    }, {} as Record<string, typeof design.elements>);

    return Object.entries(layoutAreas).map(([areaKey, initialLayout]) => {
      const areaElements = elementsByArea[areaKey] || [];
      if (areaElements.length === 0) return null;

      return (
        <DraggableArea
          key={areaKey}
          areaKey={areaKey}
          initialLayout={initialLayout as any}
          designElements={areaElements}
          designDirection={designState}
          name={name}
          price={price}
          features={features}
          templateStyle={templateStyle}
          canvasRef={canvasRef}
          isSelected={selectedElementId === areaKey}
          onSelect={setSelectedElementId}
          customTexts={customTexts}
        />
      );
    });
  };

  const renderStaticFallback = () => {
    const isLeft = textPosition === "Left" || textPosition === "Auto";
    const elements: SceneSpecification["design"]["elements"] = [
      { id: "fallback-title", type: "title", area: "fallback_area" },
      { id: "fallback-features", type: "feature_list", area: "fallback_area" },
      { id: "fallback-price", type: "price_badge", area: "fallback_price" },
    ];

    return (
      <>
        <DraggableArea
          areaKey="fallback_area"
          initialLayout={{ x: isLeft ? 0.05 : 0.5, y: 0.05, width: 0.45, height: 0.5 }}
          designElements={elements.filter(e => e.area === "fallback_area")}
          designDirection={designState}
          name={name}
          price={price}
          features={features}
          templateStyle={templateStyle}
          canvasRef={canvasRef}
          isSelected={selectedElementId === "fallback_area"}
          onSelect={setSelectedElementId}
          customTexts={customTexts}
        />
        {price && (
          <DraggableArea
            areaKey="fallback_price"
            initialLayout={{ x: isLeft ? 0.05 : 0.5, y: 0.65, width: 0.45, height: 0.2 }}
            designElements={elements.filter(e => e.area === "fallback_price")}
            designDirection={designState}
            name={name}
            price={price}
            features={features}
            templateStyle={templateStyle}
            canvasRef={canvasRef}
            isSelected={selectedElementId === "fallback_price"}
            onSelect={setSelectedElementId}
            customTexts={customTexts}
          />
        )}
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
      {/* Editor Canvas (Left) */}
      <div className="md:col-span-8 flex flex-col gap-4">
        <div 
          className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 w-full max-w-md mx-auto aspect-[4/5]"
          onClick={() => setSelectedElementId(null)}
        >
          <div ref={canvasRef} className="relative w-full h-full flex">
            <img src={baseImage} alt="Base Ad" className="w-full h-full object-cover block" />
            {showOverlays && (hasDynamicLayout ? renderDynamicAreas() : renderStaticFallback())}
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <button
            onClick={handleDownload}
            className="w-full max-w-md py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" /> Export Final Ad
          </button>
        </div>
      </div>

      {/* Editor Controls (Right) */}
      <div className="md:col-span-4 flex flex-col gap-4">
        
        {selectedElementId?.includes("price") && designState.card_style === "promo" ? (
          <div className="bg-slate-900/80 rounded-2xl border border-indigo-500/50 p-5 space-y-4 sticky top-24 shadow-xl shadow-indigo-500/10">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-400" /> Promo Banner Edit
              </h3>
              <button 
                onClick={() => setSelectedElementId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Done
              </button>
            </div>
            
            <div className="space-y-3">
              <TextInput label="Ribbon Text (Yellow)" value={customTexts.shopee_ribbon} onChange={(v) => handleCustomTextChange("shopee_ribbon", v)} />
              <TextInput label="Top Right Badge (Black)" value={customTexts.shopee_top_right} onChange={(v) => handleCustomTextChange("shopee_top_right", v)} />
              <TextInput label="Left Text - Line 1" value={customTexts.shopee_top_left} onChange={(v) => handleCustomTextChange("shopee_top_left", v)} />
              <TextInput label="Left Text - Line 2" value={customTexts.shopee_left_main} onChange={(v) => handleCustomTextChange("shopee_left_main", v)} />
              <TextInput label="Left Text - Sub" value={customTexts.shopee_left_sub} onChange={(v) => handleCustomTextChange("shopee_left_sub", v)} />
              <TextInput label="Bottom Bar Text (Yellow)" value={customTexts.shopee_bottom} onChange={(v) => handleCustomTextChange("shopee_bottom", v)} />
            </div>
            <p className="text-[10px] text-indigo-300 bg-indigo-500/10 p-2 rounded-lg mt-4">
              Tip: Click outside the banner on the image to return to global settings.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-6 sticky top-24">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-indigo-400" /> Global Art Direction
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {selectedElementId ? "Click 'Done' to edit specific text, or adjust global tokens below." : "AI-generated design tokens. Click any text on the image to edit it directly."}
              </p>
            </div>

          {/* Typography */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-3 h-3" /> Typography
            </h4>
            <select
                value={designState.title_font} 
                onChange={(e) => setDesignState({ ...designState, title_font: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="sans">Sans Serif (Modern)</option>
                <option value="prompt">Prompt (Thai Premium)</option>
                <option value="kanit">Kanit (Thai Bold)</option>
                <option value="serif">Serif (Premium/Classic)</option>
                <option value="mono">Monospace (Tech)</option>
              </select>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-3 h-3" /> Colors
            </h4>
            
            <ColorPickerRow 
              label="Primary Text" 
              value={designState.primary_text_color} 
              onChange={(v) => handleColorChange("primary_text_color", v)} 
            />
            <ColorPickerRow 
              label="Secondary Text" 
              value={designState.secondary_text_color} 
              onChange={(v) => handleColorChange("secondary_text_color", v)} 
            />
            <ColorPickerRow 
              label="Accent/Badge" 
              value={designState.accent_color} 
              onChange={(v) => handleColorChange("accent_color", v)} 
            />
            <ColorPickerRow 
              label="Brand Primary" 
              value={designState.primary_color} 
              onChange={(v) => handleColorChange("primary_color", v)} 
            />
          </div>
          
          {/* Style Toggles */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Card Style
            </h4>
            <div className="flex gap-2">
              <button 
                onClick={() => handleColorChange("card_style", "glass")}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${designState.card_style === "glass" ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
              >
                Glass
              </button>
              <button 
                onClick={() => handleColorChange("card_style", "solid")}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${designState.card_style === "solid" ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
              >
                Solid
              </button>
              <button 
                onClick={() => handleColorChange("card_style", "promo")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${designState.card_style === "promo" ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
              >
                Shopee
              </button>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="space-y-3 pt-4 border-t border-slate-800 mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={showOverlays}
                  onChange={() => setShowOverlays(!showOverlays)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${showOverlays ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showOverlays ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-xs font-semibold text-slate-300">
                Show CSS Overlays
              </span>
            </label>
            <p className="text-[10px] text-slate-500">
              Turn off to see only the raw AI-generated typography from FLUX.
            </p>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function ColorPickerRow({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase">{value}</span>
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
      </div>
    </div>
  );
}
