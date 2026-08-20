// ============================================================
// Product Types
// ============================================================

export interface ProductAnalysisInput {
  /** Base64-encoded product image (data URI or raw base64) */
  imageBase64: string;
  /** User-provided product name */
  name: string;
  /** Optional user-provided description */
  description?: string;
}

export interface ProductAnalysis {
  /** e.g. "water pump", "knife", "headphones" */
  category: string;
  /** e.g. "home water pressure pump" */
  subcategory: string;
  /** Detected or inferred brand name */
  brand: string;
  /** e.g. "home appliance", "kitchen tool", "electronics" */
  product_type: string;
  /** How this product is typically used */
  primary_use: string[];
  /** Where this product is typically found / used */
  recommended_environments: string[];
  /** e.g. "floor", "table", "countertop", "shelf", "wall" */
  recommended_placement: string;
  /** e.g. "three-quarter front view", "top-down", "eye-level" */
  recommended_camera: string;
  /** Physical characteristics detected from the image */
  physical_details: {
    dominant_colors: string[];
    material: string;
    approximate_size: string;
    has_text_or_logo: boolean;
  };
}
