"use client";

import React, { useState, useCallback } from "react";
import { Box, Zap, RotateCcw, Eye, ChevronLeft } from "lucide-react";
import ProductUploader from "@/components/ProductUploader";
import ProductForm from "@/components/ProductForm";
import GenerationProgress from "@/components/GenerationProgress";
import { AdvertisementEditor } from "@/components/editor/AdvertisementEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductAnalysis } from "@/types/product";
import type { AdTemplateStyle } from "@/types/ai";
import type { AdvertisementDesignSchema } from "@/lib/editor/schema";

type UIState = "FORM" | "PROGRESS" | "EDITOR";

export default function Home() {
  // --- Form state ---
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState("");
  const [description, setDescription] = useState("");
  const [templateStyle, setTemplateStyle] = useState<AdTemplateStyle>("Lifestyle");
  const [textPosition, setTextPosition] = useState("Auto");
  const [interaction, setInteraction] = useState("Auto");
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [quality, setQuality] = useState("dev");

  // --- Processing state ---
  const [uiState, setUiState] = useState<UIState>("FORM");
  const [currentStep, setCurrentStep] = useState("");
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [sceneSpec, setSceneSpec] = useState<Record<string, unknown> | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // --- Image upload handler ---
  const handleImageSelected = useCallback((base64: string) => {
    setImageBase64(base64);
    setPreviewUrl(base64);
    setAnalysis(null);
    setSceneSpec(null);
    setResultImage(null);
    setError(null);
  }, []);

  const handleClearImage = useCallback(() => {
    setImageBase64(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setSceneSpec(null);
    setResultImage(null);
    setError(null);
  }, []);

  const handleStartOver = useCallback(() => {
    setUiState("FORM");
  }, []);

  // --- Full generation pipeline ---
  const handleGenerate = async () => {
    if (!imageBase64 || !name.trim()) {
      setError("กรุณาอัปโหลดรูปและกรอกชื่อสินค้า");
      return;
    }

    setUiState("PROGRESS");
    setError(null);
    setAnalysis(null);
    setSceneSpec(null);
    setResultImage(null);

    try {
      setCurrentStep("Analyzing product...");

      // Small delay so user sees the first step
      await new Promise((r) => setTimeout(r, 300));

      setCurrentStep("Creating advertising concept...");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          name: name.trim(),
          features: features.trim() || undefined,
          description: description.trim() || undefined,
          templateStyle,
          textPosition,
          interaction,
          adFormat: aspectRatio,
          quality,
        }),
      });

      setCurrentStep("Generating scene...");

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      setCurrentStep("Finishing advertisement...");

      if (data.analysis) setAnalysis(data.analysis);
      if (data.sceneSpec) setSceneSpec(data.sceneSpec);
      if (data.promptUsed) setPromptUsed(data.promptUsed);

      if (data.generatedImageBase64) {
        setResultImage(data.generatedImageBase64);
      }

      setCurrentStep("");
      setUiState("EDITOR");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setCurrentStep("");
      setUiState("FORM");
    }
  };

  function getAdvertisementDesign(
    sceneSpec: Record<string, unknown> | null
  ): AdvertisementDesignSchema | undefined {
    if (!sceneSpec) return undefined;
    const design = sceneSpec.design;
    if (!design || typeof design !== "object") {
      return undefined;
    }
    return design as AdvertisementDesignSchema;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Header */}
      <header className="flex-none h-14 border-b bg-background z-50 px-6 flex items-center">
        <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Box className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight ml-1">
              AdGen
            </h1>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 rounded-sm ml-2">Beta</Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Professional Product Ads Generator
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 bg-muted/20">
        <ScrollArea className="h-full w-full">
          <div className="h-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-6 w-full max-w-[1600px] mx-auto">
            {uiState === "FORM" && (
              <div className="w-full max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Left Column: Image */}
                  <Card className="shadow-xl border-border/40 lg:col-span-5 flex flex-col overflow-hidden bg-gradient-to-b from-muted/30 to-background">
                    <CardHeader className="pb-3 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" /> Product Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                      <div className="w-full h-full flex items-center justify-center">
                        <ProductUploader
                          onImageSelected={handleImageSelected}
                          previewUrl={previewUrl}
                          onClear={handleClearImage}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right Column: Details */}
                  <Card className="shadow-xl border-border/40 lg:col-span-7 flex flex-col">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-base flex items-center gap-2">
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6 flex-1 flex flex-col">
                      <ProductForm
                        name={name}
                        onNameChange={setName}
                        price={price}
                        onPriceChange={setPrice}
                        features={features}
                        onFeaturesChange={setFeatures}
                        description={description}
                        onDescriptionChange={setDescription}
                        templateStyle={templateStyle}
                        onTemplateStyleChange={setTemplateStyle}
                        textPosition={textPosition}
                        onTextPositionChange={setTextPosition}
                        interaction={interaction}
                        onInteractionChange={setInteraction}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                      />

                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Quality Mode</p>
                          <p className="text-xs text-muted-foreground">Dev for preview, Pro for final</p>
                        </div>
                        <Select value={quality} onValueChange={setQuality}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dev">Dev</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {error && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-sm animate-in fade-in slide-in-from-bottom-2">
                          {error}
                        </div>
                      )}

                      <div className="pt-4 mt-auto">
                        <Button
                          onClick={handleGenerate}
                          disabled={!imageBase64 || !name.trim()}
                          className="w-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                          size="lg"
                        >
                          Generate Advertisement
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {uiState === "PROGRESS" && (
              <div className="w-full max-w-lg">
                <GenerationProgress currentStep={currentStep} />
              </div>
            )}

            {uiState === "EDITOR" && resultImage && (
              <div className="flex-1 w-full flex flex-col min-h-[600px] space-y-4 pt-2 pb-8 h-full">
                <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-lg border-border/50 h-full">
                  <CardHeader className="flex flex-row justify-between items-center py-3 px-4 border-b bg-muted/30 space-y-0 flex-shrink-0">
                    <CardTitle className="text-sm font-semibold">Design Editor</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartOver}
                        className="h-8 px-3 text-xs"
                      >
                        <ChevronLeft className="w-3 h-3 mr-2" /> กลับไปแก้ไขข้อมูล
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleGenerate}
                        className="h-8 px-3 text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-2" /> Re-generate
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {/* The Editor */}
                  <CardContent className="flex-1 min-h-0 p-0 overflow-hidden relative">
                    <AdvertisementEditor
                      baseImage={resultImage}
                      name={name}
                      price={price}
                      aspectRatio={aspectRatio}
                      initialDesign={getAdvertisementDesign(sceneSpec)}
                    />
                  </CardContent>
                </Card>

                {/* Debug Panel (Analysis + Scene Spec) */}
                {(analysis || sceneSpec) && (
                  <Card className="border-border/50 shadow-sm flex-shrink-0">
                    <CardHeader className="py-3 px-4 border-b bg-muted/10">
                      <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {showDebug ? "ซ่อน" : "ดู"} AI Analysis & Scene Plan
                      </button>
                    </CardHeader>

                    {showDebug && (
                      <CardContent className="p-4 space-y-4">
                        {/* Analysis cards */}
                        {analysis && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Product Analysis
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                              <InfoCard label="Category" value={analysis.category} />
                              <InfoCard label="Brand" value={analysis.brand || "–"} />
                              <InfoCard label="Placement" value={analysis.recommended_placement} />
                              <InfoCard label="Camera" value={analysis.recommended_camera} />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.recommended_environments.map((env) => (
                                <Badge key={env} variant="secondary">
                                  {env}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Scene spec */}
                        {sceneSpec && (
                          <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Scene Specification
                            </h3>
                            <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground overflow-x-auto max-h-48 overflow-y-auto border border-border/50">
                              {JSON.stringify(sceneSpec, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Prompt used */}
                        {promptUsed && (
                          <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Image Prompt
                            </h3>
                            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3 border border-border/50">
                              {promptUsed}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
