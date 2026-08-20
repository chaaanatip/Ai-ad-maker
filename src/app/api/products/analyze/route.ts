import { NextResponse } from "next/server";
import { GroqVisionProvider } from "@/services/ai/vision/GroqVisionProvider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, name, description } = body;

    // --- Validation ---
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Rough size check (~10 MB base64 limit)
    if (imageBase64.length > 14_000_000) {
      return NextResponse.json(
        { error: "Image too large. Maximum 10 MB." },
        { status: 400 }
      );
    }

    // --- API Key ---
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // --- Analyze ---
    const vision = new GroqVisionProvider(apiKey);
    const analysis = await vision.analyzeProduct({
      imageBase64,
      name: name.trim(),
      description: description?.trim(),
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("[/api/products/analyze] Error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
