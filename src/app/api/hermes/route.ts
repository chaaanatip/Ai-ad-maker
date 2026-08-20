import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { productName } = await request.json();

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // Use Hermes Agent to generate a scene description prompt in English
    let scenePrompt = "";
    let socialCaption = "";

    const candidateEndpoints = [
      "http://127.0.0.1:9119/v1/chat/completions",
      process.env.HERMES_AGENT_URL || "http://127.0.0.1:8080/v1/chat/completions",
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HERMES_AGENT_API_KEY || "hermes-agent-local"}`,
          },
          body: JSON.stringify({
            model: "hermes-agent",
            messages: [
              {
                role: "system",
                content: "You are a product photography director. Output valid JSON only.",
              },
              {
                role: "user",
                content: `สินค้าชื่อ "${productName}" 
ให้คิด:
1) scenePrompt: เขียนเป็นภาษาอังกฤษล้วน อธิบายฉากพื้นหลังที่เหมาะกับสินค้านี้ สำหรับใช้สั่ง AI สร้างภาพ เช่น ถ้าเป็นมีดทาเนย ก็คือ "warm breakfast table with wooden cutting board, fresh bread, morning sunlight" ถ้าเป็นเครื่องตัดหญ้า ก็คือ "bright green manicured garden lawn, soft morning sunlight"
2) socialCaption: แคปชั่นขายของภาษาไทยสั้นๆ มี Emoji สำหรับโพสต์ Facebook/LINE

ตอบเป็น JSON: {"scenePrompt": "...", "socialCaption": "..."}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = typeof content === "string" ? JSON.parse(content) : content;
            scenePrompt = parsed.scenePrompt || "";
            socialCaption = parsed.socialCaption || "";
            break;
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    // Fallback scene prompt based on product name keywords
    if (!scenePrompt) {
      const nameLower = productName.toLowerCase();
      if (nameLower.includes("มีด") || nameLower.includes("เนย") || nameLower.includes("ครัว")) {
        scenePrompt = "warm cozy breakfast table scene with wooden cutting board, fresh toast bread slices, butter curls, morning golden sunlight through window, shallow depth of field, food photography";
      } else if (nameLower.includes("ตัดหญ้า") || nameLower.includes("หญ้า") || nameLower.includes("สวน")) {
        scenePrompt = "beautiful bright green manicured garden lawn field, soft morning sunlight, garden path, flowers in background, outdoor product photography";
      } else if (nameLower.includes("ส้ม") || nameLower.includes("ผลไม้")) {
        scenePrompt = "fresh fruit market display, wooden crate, green leaves, morning dew, vibrant colors, food photography";
      } else if (nameLower.includes("หูฟัง") || nameLower.includes("ลำโพง") || nameLower.includes("tech")) {
        scenePrompt = "modern minimalist white desk setup, clean workspace, soft gradient lighting, tech product photography";
      } else {
        scenePrompt = `clean professional product photography background scene for ${productName}, studio lighting, commercial advertisement`;
      }
    }

    if (!socialCaption) {
      socialCaption = `🔥 ${productName} คุณภาพเยี่ยม!\n✨ สินค้าพรีเมียม ราคาสุดคุ้ม\n📦 จัดส่งด่วนทั่วไทย\n💬 สนใจทักแชทเลยครับ!\n#${productName.replace(/\s+/g, "")} #ส่งด่วน`;
    }

    // Clean English-only prompt (strip any non-ASCII chars)
    const cleanPrompt = scenePrompt.replace(/[^\x00-\x7F]/g, "").trim();

    // Generate BACKGROUND SCENE image via FLUX AI (Pollinations - free, no API key needed)
    const seed = Math.floor(Math.random() * 90000) + 10000;
    const bgImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanPrompt + ", photorealistic, 8k, no text, no watermark, no product, empty scene background only"
    )}?width=1080&height=1080&model=flux&nologo=true&seed=${seed}`;

    return NextResponse.json({
      backgroundImageUrl: bgImageUrl,
      scenePrompt: cleanPrompt,
      socialCaption,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
