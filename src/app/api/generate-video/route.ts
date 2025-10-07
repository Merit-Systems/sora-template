/**
 * API Route: Generate Video
 *
 * This route demonstrates Echo SDK integration with AI video generation:
 * - Supports Gemini Veo models
 * - Handles text-to-video generation
 * - Returns video URLs or operation status
 */

import { validateGenerateVideoRequest } from './validation';
// import { handleGeminiGenerate } from './vertex';
import { handleSoraGenerate, validateSoraRequest } from './openai';
import { handleGeminiGenerate } from './vertex';
import { VideoCreateParams, VideoSeconds } from 'openai/resources/videos.mjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = validateGenerateVideoRequest(body);
    if (!validation.isValid) {
      return Response.json(
        { error: validation.error!.message },
        { status: validation.error!.status }
      );
    }

    if (body.model === 'sora-2') {
      const { prompt, model, durationSeconds, image } = body;

      const soraRequest : Omit<VideoCreateParams, 'input_reference'> & {
        input_reference?: string;
      } = {
        prompt,
        model,
        seconds: String(durationSeconds) as VideoSeconds,
        size: '1280x720',
        input_reference: image,
      };

      const validation = validateSoraRequest(soraRequest);
      if (!validation.isValid) {
        return Response.json(
          { error: validation.error!.message },
          { status: validation.error!.status }
        );
      }

      return handleSoraGenerate(soraRequest);
    } else if (body.model === 'veo-3.0-fast-generate-preview' || body.model === 'veo-3.0-generate-preview') {
      const validation = validateGenerateVideoRequest(body);
      if (!validation.isValid) {
        return Response.json(
          { error: validation.error!.message },
          { status: validation.error!.status }
        );
      }

      const { prompt, model, durationSeconds, generateAudio, image, lastFrame } = body;

      return handleGeminiGenerate(prompt, model, durationSeconds, generateAudio, image, lastFrame);
    }

  } catch (error) {
    console.error('Video generation error:', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Video generation failed. Please try again later.',
      },
      { status: 500 }
    );
  }
}
