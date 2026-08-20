export interface BannerCanvasOptions {
  productTitle: string;
  taglineText?: string;
  salePrice?: string;
  scarcityText?: string;
  highlightBadge?: string;
  specsLine1?: string;
  specsLine2?: string;
  badgeText?: string;
  themeColor?: "purple" | "red" | "blue" | "green";
  productImage: HTMLImageElement | null;
  backgroundImage: HTMLImageElement | null;
  productScale?: number;
  productOffsetY?: number;
}

export function drawEcomBanner(canvas: HTMLCanvasElement, options: BannerCanvasOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;

  // -------------------------------------------------------------
  // 1. AI GENERATED SCENE BACKGROUND LAYER
  // -------------------------------------------------------------
  if (options.backgroundImage && options.backgroundImage.complete && options.backgroundImage.naturalWidth > 0) {
    ctx.drawImage(options.backgroundImage, 0, 0, width, height);
  } else {
    // Elegant fallback background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#f8fafc");
    bgGrad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Top White Vignette Gradient for clean header text legibility
  const topGrad = ctx.createLinearGradient(0, 0, 0, 260);
  topGrad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  topGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.85)");
  topGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 260);

  // -------------------------------------------------------------
  // 2. USER UPLOADED PRODUCT PNG LAYER (WITH REALISTIC DROP SHADOW & ACCENT)
  // -------------------------------------------------------------
  const productCenterY = 510 + (options.productOffsetY || 0);
  const scale = (options.productScale || 100) / 100;

  if (options.productImage && options.productImage.complete && options.productImage.naturalWidth > 0) {
    ctx.save();
    const imgWidth = options.productImage.naturalWidth;
    const imgHeight = options.productImage.naturalHeight;
    const maxDim = 520 * scale;
    const ratio = Math.min(maxDim / imgWidth, maxDim / imgHeight);
    const drawW = imgWidth * ratio;
    const drawH = imgHeight * ratio;

    const posX = width / 2 - drawW / 2;
    const posY = productCenterY - drawH / 2;

    // Soft contact ground shadow ellipse onto kitchen marble table surface
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.beginPath();
    ctx.ellipse(width / 2, posY + drawH - 10, drawW * 0.45, 18, 0, 0, Math.PI * 2);
    ctx.filter = "blur(14px)";
    ctx.fill();
    ctx.restore();

    // Natural realistic product drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 15;

    ctx.drawImage(
      options.productImage,
      posX,
      posY,
      drawW,
      drawH
    );
    ctx.restore();
  }

  // Floating Spec Ribbon (e.g. "ได้ถึง 3 ชิ้น" / "ขนาดมาตรฐาน")
  if (options.badgeText) {
    ctx.save();
    const badgeX = width / 2 + 210;
    const badgeY = productCenterY - 140;

    ctx.translate(badgeX, badgeY);
    ctx.rotate((12 * Math.PI) / 180);

    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.ellipse(0, 0, 105, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px var(--font-prompt), sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.badgeText, 0, 0);
    ctx.restore();
  }

  // -------------------------------------------------------------
  // 3. TOP HEADER TEXT OVERLAY
  // -------------------------------------------------------------
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Main Title ("มีดทาเนย" / "เลื่อยตั้งโต๊ะ")
  let titleGrad: CanvasGradient = ctx.createLinearGradient(0, 45, 0, 145);
  if (options.themeColor === "red") {
    titleGrad.addColorStop(0, "#e11d48");
    titleGrad.addColorStop(1, "#9f1239");
  } else if (options.themeColor === "green") {
    titleGrad.addColorStop(0, "#16a34a");
    titleGrad.addColorStop(1, "#14532d");
  } else {
    // Purple / Pink Gradient
    titleGrad.addColorStop(0, "#9333ea");
    titleGrad.addColorStop(0.5, "#d946ef");
    titleGrad.addColorStop(1, "#581c87");
  }

  // White stroke for outline readability
  ctx.font = "900 92px var(--font-prompt), var(--font-kanit), sans-serif";
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(options.productTitle || "มีดทาเนย", width / 2, 45);

  ctx.fillStyle = titleGrad;
  ctx.fillText(options.productTitle || "มีดทาเนย", width / 2, 45);

  // Subtitle / Tagline ("✔ สินค้ามาตรฐาน ✔ ราคาถูกคุณภาพดี")
  ctx.font = "700 34px var(--font-kanit), sans-serif";
  const tagline = options.taglineText || "สินค้ามาตรฐาน  ราคาถูกคุณภาพดี";
  
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(`✔ ${tagline.replace(/✔/g, "").trim()}`, width / 2, 155);

  ctx.fillStyle = "#dc2626";
  ctx.fillText(`✔ ${tagline.replace(/✔/g, "").trim()}`, width / 2, 155);
  ctx.restore();

  // -------------------------------------------------------------
  // 4. BOTTOM ADVERTISING BANNER & SLANTED PRICE CONTAINER
  // -------------------------------------------------------------
  
  // Left Small Purple Checkbox Badge ("✔ ขนาดมาตรฐาน")
  ctx.save();
  ctx.fillStyle = "#581c87";
  ctx.fillRect(45, 620, 250, 45);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px var(--font-kanit), sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✔ ขนาดมาตรฐาน", 170, 642);
  ctx.restore();

  // Black Scarcity Bar ("โปรพิเศษ 100 ท่านแรกเท่านั้น")
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(45, 665, 520, 75);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px var(--font-prompt), sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(options.scarcityText || "โปรพิเศษ 100 ท่านแรกเท่านั้น", 65, 702);
  ctx.restore();

  // White Specs Details Box ("ได้เนียนเรียบ")
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(45, 740, 520, 95);

  ctx.fillStyle = "#000000";
  ctx.font = "900 38px var(--font-prompt), sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(options.specsLine1 || "ใช้งานง่าย คุ้มค่าเกินราคา", 305, 785);

  ctx.font = "bold 22px var(--font-kanit), sans-serif";
  ctx.fillText(options.specsLine2 || "มีบริการเก็บเงินปลายทางถึงหน้าบ้านคุณ", 305, 820);
  ctx.restore();

  // Slanted Yellow Price Container Badge ("พิเศษเพียง  ส่งเร็ว!")
  ctx.save();
  const badgeX = 560;
  const badgeY = 620;
  const badgeW = 475;
  const badgeH = 280;

  // Slanted Yellow Header Ribbon
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(badgeX - 30, badgeY + 10);
  ctx.lineTo(badgeX + 410, badgeY + 10);
  ctx.lineTo(badgeX + 380, badgeY + 78);
  ctx.lineTo(badgeX - 30, badgeY + 78);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.font = "900 40px var(--font-prompt), sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("พิเศษเพียง  ส่งเร็ว!", badgeX - 5, badgeY + 54);

  // Main Price Purple Box
  const priceGrad = ctx.createLinearGradient(badgeX, badgeY + 70, badgeX + badgeW, badgeY + badgeH);
  if (options.themeColor === "red") {
    priceGrad.addColorStop(0, "#dc2626");
    priceGrad.addColorStop(1, "#881337");
  } else if (options.themeColor === "green") {
    priceGrad.addColorStop(0, "#16a34a");
    priceGrad.addColorStop(1, "#052e16");
  } else {
    // Purple / Pink Gradient
    priceGrad.addColorStop(0, "#7e22ce");
    priceGrad.addColorStop(0.5, "#c026d3");
    priceGrad.addColorStop(1, "#4c1d95");
  }

  ctx.fillStyle = priceGrad;
  ctx.beginPath();
  ctx.roundRect(badgeX + 10, badgeY + 74, badgeW - 10, 165, 24);
  ctx.fill();

  // Price Text ("129.-" / "1590.-")
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 125px var(--font-prompt), sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.fillText(`${options.salePrice || "129"}.-`, badgeX + 235, badgeY + 192);

  // Bottom Yellow Ribbon ("คุ้มสุดๆ ทั้งลด ทั้งแถม")
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.roundRect(badgeX + 60, badgeY + 225, badgeW - 110, 52, 20);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.font = "900 28px var(--font-kanit), sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(options.highlightBadge || "คุ้มสุดๆ ทั้งลด ทั้งแถม", badgeX + 245, badgeY + 260);

  ctx.restore();
}
