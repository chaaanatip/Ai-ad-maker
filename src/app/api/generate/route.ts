import { NextResponse } from "next/server";
import { GroqVisionProvider } from "@/services/ai/vision/GroqVisionProvider";
import { ScenePlanner } from "@/services/prompt/scenePlanner";
import { Flux2DevProvider, Flux2ProProvider } from "@/services/ai/image/Flux2Providers";
import { FalBirefnetProvider } from "@/services/ai/background-removal/FalBirefnetProvider";

export async function POST(request: Request) {
  try {
    const { imageBase64, name, price, features, description, scene, style, templateStyle, textPosition, interaction, adFormat, quality } = await request.json();

    // --- Validation ---
    if (!imageBase64 || !name?.trim()) {
      return NextResponse.json(
        { error: "imageBase64 and name are required" },
        { status: 400 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    const falKey = process.env.FAL_KEY;

    if (!groqKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY not set" }, { status: 500 });
    }

    // ====================================================
    // STEP 1: Product Analysis (Groq Vision)
    // ====================================================
    console.log("[generate] Step 1: Analyzing product...");
    const vision = new GroqVisionProvider(groqKey);
    const analysis = await vision.analyzeProduct({
      imageBase64,
      name: name.trim(),
      description: description?.trim(),
    });

    // ====================================================
    // STEP 2: Scene Planning (Groq LLM)
    // ====================================================
    console.log("[generate] Step 2: Planning scene...");
    
    // Parse features into an array of strings
    const featuresArray = features
      ? features.split(/\r?\n|,/).map((f: string) => f.trim()).filter(Boolean)
      : undefined;

    const planner = new ScenePlanner(groqKey);
    const sceneSpec = await planner.planScene({
      analysis,
      features: featuresArray,
      interactionPreference: interaction || "Auto",
      scenePreference: scene || "AI Auto",
      stylePreference: style || "AI Auto",
      textPosition: textPosition || "Auto",
      adFormat: adFormat || "4:5",
      templateStyle: templateStyle || "Lifestyle",
    });

    // ====================================================
    // STEP 2.5: Background Removal (BiRefNet via Fal.ai)
    // ====================================================
    console.log("[generate] Step 2.5: Removing background (for reference mask)...");
    const bgRemover = new FalBirefnetProvider(falKey);
    const rawBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const inputBuffer = Buffer.from(rawBase64, "base64");
    
    const cutoutBuffer = await bgRemover.removeBackground(inputBuffer);
    const cutoutBase64 = `data:image/png;base64,${cutoutBuffer.toString("base64")}`;

    // ====================================================
    // STEP 2.8: Create Reference Canvas (Padding & Scaling)
    // ====================================================
    console.log("[generate] Step 2.8: Creating Reference Canvas...");
    const targetWidth = sceneSpec.width || 1080;
    const targetHeight = sceneSpec.height || 1350;
    
    // Import padAndScaleImage dynamically or add it at the top of the file
    const { padAndScaleImage } = await import("@/services/image-processing/composer");
    const referenceCanvasBase64 = await padAndScaleImage(
      cutoutBase64, 
      targetWidth, 
      targetHeight, 
      0.6 // Scale product to 60% of canvas
    );

    // ====================================================
    // STEP 3: Generate image via FLUX.2 Edit
    // ====================================================
    console.log("[generate] Step 3: Generating image with FLUX.2 Edit...");
    
    // Choose provider based on requested quality or default to dev for preview
    const isPro = quality === "pro";
    const imageProvider = isPro ? new Flux2ProProvider(falKey) : new Flux2DevProvider(falKey);

    const fullPrompt = [
      sceneSpec.generation_prompt,
      "The product is the absolute main focus and hero of the image",
      "highly detailed product",
      "sharp focus on the product",
      "photorealistic, 8k resolution, professional commercial product photography",
      "realistic contact shadows on the surface beneath the product",
      "natural lighting matching the scene, depth of field",
      "the product is resting firmly on the surface, not floating",
    ].filter(Boolean).join(", ");

    // Pass reference canvas as primary, original image as secondary identity reference
    const generated = await imageProvider.generateProductAd({
      prompt: fullPrompt,
      productImageBase64: referenceCanvasBase64,
      referenceImages: [imageBase64],
      outputSize: `${targetWidth}x${targetHeight}`,
    });

    // ====================================================
    // STEP 5: Return result
    // ====================================================
    console.log("[generate] Done!");
    return NextResponse.json({
      analysis,
      sceneSpec,
      generatedImageBase64: generated.imageBase64,
      provider: generated.provider,
      promptUsed: fullPrompt,
    });
  } catch (error) {
    console.error("[/api/generate] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
