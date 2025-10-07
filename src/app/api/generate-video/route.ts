/**
 * API Route: Generate Video
 *
 * This route demonstrates Echo SDK integration with AI video generation:
 * - Supports Gemini Veo models
 * - Handles text-to-video generation
 * - Returns video URLs or operation status
 */

import { validateGenerateVideoRequest } from "./validation";
// import { handleGeminiGenerate } from './vertex';
import { VideoCreateParams, VideoSeconds } from "openai/resources/videos.mjs";
import { handleSoraGenerate } from "./openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Generate video request body:", body);

    const validation = validateGenerateVideoRequest(body);
    if (!validation.isValid) {
      return Response.json(
        { error: validation.error!.message },
        { status: validation.error!.status },
      );
    }

    const { prompt, model, durationSeconds, image, size } = body;

    const soraRequest: Omit<VideoCreateParams, "input_reference"> & {
      input_reference?: string;
    } = {
      prompt,
      model,
      seconds: String(durationSeconds) as VideoSeconds,
      size,
      input_reference: image,
    };

    return handleSoraGenerate(req.headers, soraRequest);
  } catch (error) {
    console.error("Video generation error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Video generation failed. Please try again later.",
      },
      { status: 500 },
    );
  }
}
