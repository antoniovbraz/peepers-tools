const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Compress an image file using Canvas.
 * - Resizes to fit within MAX_DIMENSION (longest side)
 * - Converts to JPEG at JPEG_QUALITY
 * - Returns the original file if it's already small enough or not an image
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Skip compression if already within limits and small enough (< 500KB)
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size < 500_000) {
    bitmap.close();
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  const canvas = new OffscreenCanvas(newW, newH);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, newW, newH);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });

  // Keep original if compression didn't help
  if (blob.size >= file.size) return file;

  const ext = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${ext}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
