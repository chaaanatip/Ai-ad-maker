import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const seed = Math.floor(Math.random() * 90000) + 10000;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt + ", photorealistic, 8k, no text, no watermark, empty scene background only"
  )}?width=1080&height=1080&model=flux&nologo=true&seed=${seed}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: 502 });
    }

    const imageBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch AI image" }, { status: 500 });
  }
}
