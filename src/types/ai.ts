// ============================================================
// AI Provider Interfaces
// ============================================================

import type { ProductAnalysis, ProductAnalysisInput } from "./product";

// ----- Vision Provider -----

export interface VisionProvider {
  /** Analyze a product image and return structured product data */
  analyzeProduct(input: ProductAnalysisInput): Promise<ProductAnalysis>;
}

// ----- Scene Planning -----

export interface SceneSpecification {
  product: {
    name: string;
    primary_use: string;
  };
  visual_story: {
    concept: string;
    action: {
      type: "human_using_product" | "product_in_use" | "static_lifestyle" | string;
      description: string;
    };
    supporting_objects: string[];
    required_objects: string[];
    optional_objects: string[];
  };
  environment: {
    location: string;
    lighting: string;
    mood: string;
  };
  composition: {
    product_role: "hero" | string;
    product_focus: "hero" | "balanced" | "lifestyle" | string;
    product_position: string;
    product_scale: number;
    background_priority: "secondary" | string;
    depth_of_field: string;
  };

  // Geometry
  format: string;
  width: number;
  height: number;
  product_zone: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text_safe_zone: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  layout_areas: {
    title_features_area: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    price_area: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  design: {
    direction: {
      primary_color: string;
      secondary_color: string;
      accent_color: string;
      primary_text_color: string;
      secondary_text_color: string;
      background_color: string;
      title_font: string; // e.g., 'sans', 'serif', 'mono'
      card_style: string; // e.g., 'glass', 'solid', 'outline'
    };
    elements: {
      id: string;
      type: "title" | "feature_list" | "price_badge" | string;
      area: "title_features_area" | "price_area" | string;
    }[];
  };
  
  // The actual generative prompt
  generation_prompt: string;
}

export type AdTemplateStyle = "Lifestyle" | "Premium" | "Minimal" | "Promotion" | "New Arrival" | "Product Focus";
export type ProductInteraction = "Auto" | "Product Only" | "In Use" | "Human Interaction";

export interface ScenePlanInput {
  analysis: ProductAnalysis;
  features?: string[];
  interactionPreference: string;
  /** User-selected scene override, or "auto" */
  scenePreference: string;
  /** User-selected style override, or "auto" */
  stylePreference: string;
  /** Text position constraint (left, right, top, bottom, auto) */
  textPosition?: string;
  /** Aspect ratio constraint (e.g. "4:5", "1:1") */
  adFormat?: string;
  /** The specific ad template */
  templateStyle?: AdTemplateStyle;
}

// ----- Image Generation Provider -----

export interface ImageGenerationInput {
  /** The full image-generation prompt assembled by the scene planner */
  prompt: string;
  /** Base64 original product image */
  productImageBase64: string;
  /** Additional reference images, like masks or secondary products */
  referenceImages?: string[];
  /** Target output size or aspect ratio */
  outputSize?: string;
}

export interface GeneratedImage {
  /** Result image as a data-URI base64 string */
  imageBase64: string;
  /** The provider that produced this image */
  provider: string;
  /** The specific model used */
  model: string;
}

export interface ImageProvider {
  generateProductAd(input: ImageGenerationInput): Promise<GeneratedImage>;
}

// ----- Background Removal Provider -----

export interface BackgroundRemovalProvider {
  removeBackground(image: Buffer): Promise<Buffer>;
}
