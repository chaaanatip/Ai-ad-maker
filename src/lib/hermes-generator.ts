export interface HermesGeneratedCopy {
  title: string;
  tagline: string;
  scarcityText: string;
  highlightBadge: string;
  specsText1: string;
  specsText2: string;
  socialCaption: string;
  imagePrompt: string;
  themeColor?: "purple" | "red" | "blue" | "green";
  imageUrl?: string;
}

export async function generateWithHermes(
  productName: string,
  price: string,
  category: string,
  highlights: string
): Promise<HermesGeneratedCopy> {
  try {
    const res = await fetch("/api/hermes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName,
        price,
        category,
        highlights,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    console.error("Failed to connect to Hermes API route:", error);
  }

  // Local fallback with theme matching
  let imgUrl = "/saw.png";
  let themeColor: "purple" | "red" | "blue" | "green" = "purple";
  if (category === "fruit" || productName.includes("ส้ม")) {
    imgUrl = "/orange.png";
    themeColor = "green";
  } else if (category === "tech" || productName.includes("หูฟัง")) {
    imgUrl = "/earbuds.png";
    themeColor = "red";
  }

  return {
    title: productName || "เลื่อยตั้งโต๊ะ",
    tagline: "สินค้ามาตรฐาน  ราคาถูกคุณภาพดี",
    scarcityText: "โปรพิเศษ 100 ท่านแรกเท่านั้น",
    highlightBadge: "คุ้มสุดๆ ทั้งลด ทั้งแถม",
    specsText1: highlights || "รอบหมุนสูงถึง 9,000 รอบ/นาที",
    specsText2: "มีบริการเก็บเงินปลายทางถึงหน้าบ้านคุณ",
    socialCaption: `🔥 โปรโมชั่นพิเศษ! ${productName} ราคาพิเศษเพียง ฿${price} บาทเท่านั้น!\n\n✨ จุดเด่นสินค้า:\n- ${highlights}\n- บริการส่งฟรี มีเก็บเงินปลายทาง\n\n⏰ จำกัดสิทธิ์เพียง 100 ท่านแรก! สนใจทักแชตสั่งซื้อได้เลยครับ!`,
    imagePrompt: `Professional e-commerce product photography of ${productName}, studio lighting, clean background, 8k resolution.`,
    themeColor: themeColor,
    imageUrl: imgUrl,
  };
}
