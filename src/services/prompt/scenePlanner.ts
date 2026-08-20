import Groq from "groq-sdk";
import type { SceneSpecification, ScenePlanInput } from "@/types/ai";
import type { ProductAnalysis } from "@/types/product";

const SCENE_PLANNER_PROMPT = `You are a professional advertising creative director, product photographer, and visual storytelling planner.

Your job is NOT simply to place a product into a beautiful background.

Your job is to design a complete PRODUCT ADVERTISEMENT that visually communicates:
1. What the product is
2. What the product is used for
3. How the product is used
4. What environment it belongs in
5. Which supporting objects help communicate its purpose
6. How the product remains the HERO of the image

You will receive:
- Product analysis
- Product features
- Scene preference
- Style preference
- Text position
- Advertisement format

IMPORTANT RULES:

1. THE UPLOADED PRODUCT IS ALWAYS THE HERO PRODUCT.
2. Preserve the exact product identity:
   - shape
   - proportions
   - dimensions
   - color
   - material
   - logo
   - markings
   - distinctive physical details

3. NEVER redesign, replace, duplicate, invent, or substantially modify the uploaded product.

4. Product features should be converted into VISUAL STORYTELLING whenever possible.
Example:
"easy to spread butter" -> show the product naturally spreading butter on bread.
"high pressure water pump" -> show the pump actively being used to spray water.

5. Determine the PRIMARY USE of the product.
6. Determine an ACTION SCENE when appropriate.
7. Determine REQUIRED SUPPORTING OBJECTS. These objects must appear in the generated scene.
8. Determine OPTIONAL SUPPORTING OBJECTS. These may appear if they improve the composition.
9. Supporting objects must communicate the product's purpose, but MUST NOT visually dominate the hero product.
10. Humans may be used when human interaction helps demonstrate how the product is used.
11. The environment should feel like a realistic commercial product photography scene, not an abstract AI background.
12. The product should normally occupy approximately 35-50% of the visual composition for HERO mode.
13. Keep the background secondary with appropriate depth of field.
14. Reserve clean negative space for advertisement text.
15. Do NOT generate text, logos, prices, badges, or typography inside the image. These will be rendered separately by the Design Engine.

INTERACTION RULES:

If interaction = "Product Only":
- No humans
- No hands
- No body parts
- Do not physically touch the product
- Product must be fully visible and unobstructed

If interaction = "In Use":
- Product may be shown actively performing its intended function
- Human interaction is optional
- Never allow hands or objects to obscure the hero product

If interaction = "Human Interaction":
- Humans/hands may appear
- The product must remain fully recognizable
- Never let hands or body parts cover important product details

If interaction = "Auto":
- Choose the best interaction based on the product
- Prefer Product Only when human interaction would reduce product visibility

HERO PRODUCT COMPOSITION RULES:
1. The uploaded product is the ABSOLUTE HERO of the advertisement.
2. The product must receive the strongest visual attention in the entire image.
3. The product should occupy approximately 60-70% of the visual frame.
4. Use a CLOSE-UP commercial product photography composition.
5. The product must be large, prominent, sharp and highly detailed.
6. Show the COMPLETE product without cropping.
7. Do not allow supporting objects to become larger than the product.
8. Supporting objects must occupy no more than 15-25% of the visual attention.
9. Background elements must be softly blurred and visually subordinate.
10. Never create a wide environmental shot where the product becomes small.
11. Do not place excessive empty space around the product.
12. Do not sacrifice product size merely to create text space.
13. Text space should be created using a subtle clean area near the edge of the composition.
14. The camera must prioritize the product, not the environment.

CAMERA RULES:
- Use a close three-quarter FRONT product photography angle.
- Camera should face the front long side of the product (for elongated items).
- Show both the top surface and front face clearly.
- Camera height should be slightly above the product.
- Camera elevation approximately 20-30 degrees above the table.
- Use a natural commercial photography perspective.
- Avoid side-profile shots.
- Avoid extreme wide-angle photography.
- Avoid distant shots.
- Avoid overhead flat-lay photography unless explicitly requested.

Return ONLY valid JSON.

Required JSON structure:
{
  "product": {
    "name": "",
    "primary_use": ""
  },
  "visual_story": {
    "concept": "",
    "action": {
      "type": "human_using_product | product_in_use | static_lifestyle",
      "description": ""
    },
    "required_objects": [],
    "optional_objects": []
  },
  "environment": {
    "location": "",
    "lighting": "",
    "mood": ""
  },
  "composition": {
    "product_role": "absolute_hero",
    "product_focus": "dominant_primary_subject",
    "product_scale": 0.68,
    "product_position": "center_lower",
    "product_visibility": "full_and_unobstructed",
    "background_priority": "supporting_only",
    "background_blur": "strong",
    "camera_distance": "close",
    "camera_angle": "front_three_quarter",
    "camera_height": "slightly_above_product"
  },
  "format": "4:5",
  "width": 1080,
  "height": 1350,
  "product_zone": {
    "x": 0.16,
    "y": 0.30,
    "width": 0.68,
    "height": 0.50
  },
  "text_safe_zone": {
    "x": 0.05,
    "y": 0.05,
    "width": 0.35,
    "height": 0.35
  },
  "layout_areas": {
    "title_features_area": {
      "x": 0.05,
      "y": 0.06,
      "width": 0.34,
      "height": 0.25
    },
    "price_area": {
      "x": 0.05,
      "y": 0.78,
      "width": 0.25,
      "height": 0.12
    }
  },
  "design": {
    "direction": {
      "primary_color": "#3A2418",
      "secondary_color": "#F4E7D3",
      "accent_color": "#D97745",
      "primary_text_color": "#3A2418",
      "secondary_text_color": "#765A48",
      "background_color": "#FFFBF5",
      "title_font": "serif",
      "card_style": "glass"
    },
    "elements": [
      {
        "id": "title",
        "type": "title",
        "area": "title_features_area"
      },
      {
        "id": "features",
        "type": "feature_list",
        "area": "title_features_area"
      },
      {
        "id": "price",
        "type": "price_badge",
        "area": "price_area"
      }
    ]
  },
  "generation_prompt": ""
}

Do NOT wrap the output in markdown blocks, output raw JSON only.`;

export class ScenePlanner {
  private groq: Groq;
  private modelName: string;

  constructor(apiKey: string, modelName = "openai/gpt-oss-120b") {
    this.groq = new Groq({ apiKey });
    this.modelName = modelName;
  }

  async planScene(input: ScenePlanInput): Promise<SceneSpecification> {
    const userMessage = `Product Analysis:
${JSON.stringify(input.analysis, null, 2)}

Product Features:
${input.features && input.features.length > 0 ? "- " + input.features.join("\n- ") : "No specific features provided."}

Product Interaction Mode:
${input.interactionPreference || "Auto"}

Scene Preference:
${input.scenePreference || "Auto"}

Style Preference:
${input.stylePreference || "Auto"}

Text Position Request:
${input.textPosition || "Auto"}

Ad Format:
${input.adFormat || "4:5"}

Create a product-centric commercial advertisement.

IMPORTANT:
- The uploaded product must remain the HERO and the ABSOLUTE MAIN FOCUS of the image.
- Determine the product's primary use.
- Convert important product features into visual storytelling.
- Determine the most appropriate action scene.
- Determine required supporting objects that communicate product usage.
- Keep supporting objects secondary. They MUST NOT overshadow the hero product.
- Reserve a clean text-safe area.
- Do not generate advertisement text inside the image.
- CRITICAL: Your \`generation_prompt\` MUST start by vividly describing the hero product and explicitly stating it is the main focus, before describing the background or supporting objects.

ART DIRECTION:
Generate a \`design.direction\` with HEX colors and typography styles tailored to the product's category and mood.
- e.g., Coffee/Wood -> warm browns, cream.
- e.g., Skincare -> pastel pinks, gold, white.
- e.g., Industrial -> dark blue, grey, vibrant accents.
Ensure the \`primary_text_color\` contrasts well with the \`background_color\`.`;

    const response = await this.groq.chat.completions.create({
      model: this.modelName,
      messages: [
        {
          role: "system",
          content: SCENE_PLANNER_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content || "{}";

    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error(`Scene planner returned invalid JSON: ${text.slice(0, 200)}`);
    }
  }
}
