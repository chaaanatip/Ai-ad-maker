import type { BackgroundRemovalProvider } from "@/types/ai";
import { fal } from "@fal-ai/client";

export class FalBirefnetProvider implements BackgroundRemovalProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    process.env.FAL_KEY = apiKey;
  }

  /**
   * Expects a Buffer and returns a Buffer of the PNG with transparent background.
   */
  async removeBackground(image: Buffer): Promise<Buffer> {
    const base64Image = `data:image/jpeg;base64,${image.toString("base64")}`;

    const result = await fal.subscribe("fal-ai/birefnet", {
      input: {
        image_url: base64Image,
      },
    });

    // Extract the URL from the response
    const imageUrl = (result.data as any).image?.url;
    
    if (!imageUrl) {
      throw new Error("Failed to get image URL from BiRefNet API");
    }

    // Download the transparent image back as a Buffer
    const res = await fetch(imageUrl);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
