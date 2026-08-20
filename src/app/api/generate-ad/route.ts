import { NextResponse } from "next/server";

const thaiToEnglish: Record<string, string> = {
  "มีดทาเนย": "butter knife",
  "มีด": "knife",
  "เนย": "butter",
  "เครื่องตัดหญ้า": "lawn mower",
  "หูฟัง": "bluetooth earbuds",
  "ส้ม": "oranges",
  "กล้อง": "camera",
  "นาฬิกา": "watch",
  "รองเท้า": "shoes",
  "กระเป๋า": "bag",
  "เครื่องปั๊มน้ำ": "water pump",
  "ปั๊มน้ำ": "water pump"
};

export async function POST(request: Request) {
  try {
    const { productName, imageBase64, maskBase64 } = await request.json();

    if (!productName) {
      return NextResponse.json({ error: "productName is required" }, { status: 400 });
    }

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "STABILITY_API_KEY not set" }, { status: 500 });
    }

    // Step 1: Prompt Generation
    let englishName = productName;
    for (const [thai, eng] of Object.entries(thaiToEnglish)) {
      if (productName.includes(thai)) { englishName = eng; break; }
    }
    if (englishName === productName && /[^\x00-\x7F]/.test(englishName)) {
      englishName = "product";
    }

    let bgPrompt = "";
    let socialCaption = "";

    const llmConfigs = [
      { url: "http://127.0.0.1:9119/v1/chat/completions", model: "hermes-agent" },
      { url: process.env.HERMES_AGENT_URL || "http://127.0.0.1:8080/v1/chat/completions", model: "hermes-agent" },
      { url: "http://127.0.0.1:11434/v1/chat/completions", model: "qwen2.5:7b" },
      { url: "http://127.0.0.1:11434/v1/chat/completions", model: "qwen2.5:latest" }
    ];

    for (const config of llmConfigs) {
      try {
        const res = await fetch(config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HERMES_AGENT_API_KEY || "local"}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: "system", content: "You are a professional product photographer and prompt engineer. Output valid JSON only." },
              {
                role: "user",
                content: `Product: "${englishName}"
Write a SHORT English prompt (max 30 words) for an e-commerce product advertisement photo.
The photo should show the product beautifully arranged on a fitting background (e.g. water pump in clean industrial setting, food on wooden table).
CRITICAL: The product must appear to be resting firmly on the surface with a realistic contact shadow, NOT floating.
Focus on: professional product photography, clean composition, warm lighting, grounded placement.
Also write a Thai sales caption with emojis.
JSON format: {"bgPrompt": "...", "socialCaption": "..."}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = typeof content === "string" ? JSON.parse(content) : content;
            bgPrompt = parsed.bgPrompt || parsed.adPrompt || "";
            socialCaption = parsed.socialCaption || "";
            break;
          }
        }
      } catch {
        // Continue to next fallback
      }
    }

    if (!bgPrompt) {
      if (englishName.toLowerCase().includes("knife")) {
        bgPrompt = `Professional e-commerce product advertisement photo of ${englishName}, beautifully arranged on a rustic wooden cutting board, decorated with pink roses and pine cones in the background, top-down view, warm natural lighting, clean composition, high quality`;
      } else {
        bgPrompt = `Professional e-commerce product advertisement photo of ${englishName}, beautifully arranged in a clean modern studio setting with fitting professional props, perfect studio lighting, clean composition, commercial photography, high quality`;
      }
    }
    if (!socialCaption) {
      socialCaption = `🔥 ${productName} คุณภาพพรีเมียม!\n✨ ราคาสุดคุ้ม จัดส่งด่วน\n📦 ทักแชทสั่งเลย!`;
    }

    const cleanPrompt = bgPrompt.replace(/[^\x00-\x7F]/g, "").trim()
      + ", photorealistic, 8k, perfect product integration";

    // Step 2: Generate image via Stability AI
    const formData = new FormData();
    let endpoint = "https://api.stability.ai/v2beta/stable-image/generate/core";
    
    if (imageBase64 && maskBase64) {
      endpoint = "https://api.stability.ai/v2beta/stable-image/edit/inpaint";
      
      const base64Data = imageBase64.split(",")[1] || imageBase64;
      const maskData = maskBase64.split(",")[1] || maskBase64;
      
      const binaryData = Buffer.from(base64Data, "base64");
      const blob = new Blob([binaryData], { type: "image/png" });
      const maskBinary = Buffer.from(maskData, "base64");
      const maskBlob = new Blob([maskBinary], { type: "image/png" });
      
      formData.append("image", blob, "product.png");
      formData.append("mask", maskBlob, "mask.png");
      
      formData.append("prompt", cleanPrompt + ", photorealistic, high-end commercial product photography, perfect lighting integration, dramatic drop shadow, grounded, resting naturally on surface");
      formData.append("output_format", "png");
    } else {
      formData.append("prompt", cleanPrompt);
      formData.append("aspect_ratio", "1:1");
      formData.append("output_format", "png");
    }

    let imageBuffer: ArrayBuffer | null = null;
    let lastError = "";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
        body: formData,
      });

      if (res.ok) {
        imageBuffer = await res.arrayBuffer();
      } else {
        const errText = await res.text();
        lastError = `${res.status}: ${errText}`;
      }
    } catch (err) {
      lastError = String(err);
    }

    if (!imageBuffer) {
      return NextResponse.json({ error: `Stability AI failed: ${lastError}` }, { status: 502 });
    }

    const base64Result = Buffer.from(imageBuffer).toString("base64");

    return NextResponse.json({
      generatedImageBase64: `data:image/png;base64,${base64Result}`,
      socialCaption,
      promptUsed: cleanPrompt,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
