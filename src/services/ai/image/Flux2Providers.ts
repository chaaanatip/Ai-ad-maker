import type { ImageProvider, ImageGenerationInput, GeneratedImage } from "@/types/ai";
import { fal } from "@fal-ai/client";

export class Flux2DevProvider implements ImageProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    process.env.FAL_KEY = apiKey;
  }

  async generateProductAd(input: ImageGenerationInput): Promise<GeneratedImage> {
    if (!input.productImageBase64) {
      throw new Error("Flux2DevProvider requires productImageBase64");
    }

    try {
      // Build references array
      const allImages = [input.productImageBase64, ...(input.referenceImages || [])];
      
      const result = await fal.subscribe("fal-ai/flux-2/edit", {
        input: {
          image_urls: allImages,
          prompt: input.prompt,
        },
      });

      const imageUrl = (result.data as any).images?.[0]?.url || (result.data as any).image?.url;
      
      if (!imageUrl) {
        throw new Error("Invalid response format from Fal API (dev): " + JSON.stringify(result.data));
      }

      const imgRes = await fetch(imageUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      
      return {
        imageBase64: `data:image/jpeg;base64,${base64}`,
        provider: "fal.ai",
        model: "flux-2-dev-edit",
      };
    } catch (error) {
      console.error("Flux2DevProvider Error:", error);
      throw error;
    }
  }
}

export class Flux2ProProvider implements ImageProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    process.env.FAL_KEY = apiKey;
  }

  async generateProductAd(input: ImageGenerationInput): Promise<GeneratedImage> {
    if (!input.productImageBase64) {
      throw new Error("Flux2ProProvider requires productImageBase64");
    }

    try {
      const allImages = [input.productImageBase64, ...(input.referenceImages || [])];
      
      const result = await fal.subscribe("fal-ai/flux-2-pro/edit", {
        input: {
          image_urls: allImages,
          prompt: input.prompt,
        },
      });

      const imageUrl = (result.data as any).images?.[0]?.url || (result.data as any).image?.url;
      
      if (!imageUrl) {
        throw new Error("Invalid response format from Fal API (pro): " + JSON.stringify(result.data));
      }

      const imgRes = await fetch(imageUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      
      return {
        imageBase64: `data:image/jpeg;base64,${base64}`,
        provider: "fal.ai",
        model: "flux-2-pro-edit",
      };
    } catch (error) {
      console.error("Flux2ProProvider Error:", error);
      throw error;
    }
  }
}
