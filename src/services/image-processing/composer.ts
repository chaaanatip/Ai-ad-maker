import sharp from "sharp";

/**
 * Takes a product image (with transparency), scales it down,
 * and places it on a transparent canvas of the target dimensions.
 * This gives FLUX.2 negative space to generate the background and context.
 */
export async function padAndScaleImage(
  productImageBase64: string,
  targetWidth = 1080,
  targetHeight = 1350,
  scaleRatio = 0.6
): Promise<string> {
  // Strip data-URI prefix
  const raw = productImageBase64.includes(",")
    ? productImageBase64.split(",")[1]
    : productImageBase64;
  const productBuffer = Buffer.from(raw, "base64");

  // Get product metadata
  const meta = await sharp(productBuffer).metadata();
  const srcW = meta.width || 500;
  const srcH = meta.height || 500;

  // Scale product to fit requested ratio of canvas
  const maxDim = Math.min(targetWidth, targetHeight) * scaleRatio;
  const scale = Math.min(maxDim / srcW, maxDim / srcH);
  const drawW = Math.round(srcW * scale);
  const drawH = Math.round(srcH * scale);

  // Center product, slightly lower (60% down) so it looks grounded
  const left = Math.round((targetWidth - drawW) / 2);
  const top = Math.round(targetHeight * 0.6 - drawH / 2);

  // Resize product and ensure it has an alpha channel
  const resizedProduct = await sharp(productBuffer)
    .ensureAlpha()
    .resize(drawW, drawH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Create transparent canvas and composite
  const paddedImage = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedProduct, left, top }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${paddedImage.toString("base64")}`;
}
