import sharp from "sharp";

interface PaddingConfig {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

/**
 * Pad an image to a specific canvas size while maintaining aspect ratio
 * Uses letterboxing/pillarboxing with configurable background
 */
export async function padImageToCanvas(
  inputBuffer: Buffer,
  width: number,
  height: number,
  background: PaddingConfig = { r: 0, g: 0, b: 0, alpha: 1 }, // black background by default
): Promise<Buffer> {
  return await sharp(inputBuffer)
    .rotate() // respect EXIF orientation
    .resize({
      width,
      height,
      fit: "contain", // letterbox/pillarbox
      background,
      withoutEnlargement: false, // allow upscaling if needed
    })
    .png() // use PNG to preserve quality and transparency
    .toBuffer();
}

/**
 * Parse video size string and return width/height dimensions
 */
export function parseVideoSize(size: string): {
  width: number;
  height: number;
} {
  const [width, height] = size.split("x").map(Number);
  if (!width || !height) {
    throw new Error(`Invalid video size format: ${size}`);
  }
  return { width, height };
}

/**
 * Pad input image to match video output dimensions
 * This ensures the input image has the same aspect ratio as the output video
 */
export async function padImageForVideo(
  base64Data: string,
  videoSize: string,
): Promise<string> {
  // Parse video dimensions
  const { width, height } = parseVideoSize(videoSize);

  // Convert base64 to buffer
  const inputBuffer = Buffer.from(base64Data, "base64");

  // Pad image to match video aspect ratio
  const paddedBuffer = await padImageToCanvas(inputBuffer, width, height);

  // Convert back to base64
  return paddedBuffer.toString("base64");
}
