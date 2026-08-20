import Groq from "groq-sdk";
import type { VisionProvider } from "@/types/ai";
import type { ProductAnalysis, ProductAnalysisInput } from "@/types/product";

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

export class GroqVisionProvider implements VisionProvider {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async analyzeProduct(input: ProductAnalysisInput): Promise<ProductAnalysis> {
    const { imageBase64, name, description } = input;
    
    // Ensure base64 string doesn't have the data-uri prefix for Groq if not needed, 
    // actually Groq Vision (llama-3.2-11b-vision-preview or 90b) takes base64 data URIs.
    const imageUri = imageBase64.startsWith("data:") 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    const userMessage = [
      `Product Name: ${name}`,
      description ? `User Description: ${description}` : "",
      "Analyze this product and return the JSON."
    ].filter(Boolean).join("\n");

    const response = await this.groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: imageUri } }
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    try {
      return JSON.parse(content) as ProductAnalysis;
    } catch (e) {
      console.error("Groq JSON parsing error:", content);
      throw new Error("Failed to parse Groq Vision analysis");
    }
  }
}
