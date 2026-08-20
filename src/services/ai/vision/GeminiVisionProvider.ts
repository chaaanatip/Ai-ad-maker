import type { VisionProvider } from "@/types/ai";
import type { ProductAnalysis, ProductAnalysisInput } from "@/types/product";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a professional product analyst for an e-commerce advertising system.

Given a product image and its name (and optionally a description), you must analyze the product and return a structured JSON object.

Your analysis must include:
- category: the general product category (e.g. "water pump", "knife", "headphones")
- subcategory: a more specific classification (e.g. "home water pressure pump")
- brand: the brand name visible on the product, or inferred from the product name. Use "" if unknown.
- product_type: a broad type (e.g. "home appliance", "kitchen tool", "electronics", "fashion")
- primary_use: an array of typical use cases (e.g. ["household water system", "shower", "washing"])
- recommended_environments: an array of realistic environments where this product would be used or displayed (e.g. ["modern home", "utility room", "garage"])
- recommended_placement: where the product should sit in a photo (e.g. "floor", "table", "countertop", "shelf", "wall-mounted", "worn by person")
- recommended_camera: the best camera angle for advertising (e.g. "three-quarter front view", "eye-level", "top-down", "hero shot low angle")
- physical_details: an object with:
  - dominant_colors: array of main colors (e.g. ["blue", "black", "silver"])
  - material: primary material (e.g. "metal", "plastic", "glass", "fabric", "wood")
  - approximate_size: human-readable size estimate (e.g. "medium - about 30cm wide", "small handheld")
  - has_text_or_logo: boolean – whether the product has visible text, logos, or branding

Return ONLY valid JSON. No markdown, no explanation, no code fences.`;

export class GeminiVisionProvider implements VisionProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName = "gemini-1.5-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async analyzeProduct(input: ProductAnalysisInput): Promise<ProductAnalysis> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    // Strip data-URI prefix if present
    const base64Data = input.imageBase64.includes(",")
      ? input.imageBase64.split(",")[1]
      : input.imageBase64;

    // Detect mime type from data URI, default to jpeg
    let mimeType = "image/jpeg";
    const mimeMatch = input.imageBase64.match(/^data:(image\/\w+);/);
    if (mimeMatch) mimeType = mimeMatch[1];

    const userMessage = [
      `Product Name: ${input.name}`,
      input.description ? `Product Description: ${input.description}` : "",
      "Analyze this product image and return the structured JSON.",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: userMessage },
    ]);

    const text = result.response.text();

    try {
      const parsed: ProductAnalysis = JSON.parse(text);
      return parsed;
    } catch {
      // Sometimes the model wraps JSON in markdown fences
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ProductAnalysis;
      }
      throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
    }
  }
}
