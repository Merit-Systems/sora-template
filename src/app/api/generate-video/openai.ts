/**
 * OpenAI Sora video generation handler
 */

import OpenAI from 'openai';
import { VideoCreateParams } from 'openai/resources/videos.mjs';
// import { getEchoToken } from '@/echo';
// import { ERROR_MESSAGES } from '@/lib/constants';
import { config } from 'dotenv';

config();

export interface ValidationResult {
  isValid: boolean;
  error?: { message: string; status: number };
}

export function validateSoraRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: { message: 'Invalid request body', status: 400 },
    };
  }

  const { prompt, model, seconds, size, input_reference } = body as Record<
    string,
    unknown
  >;

  if (!prompt || typeof prompt !== 'string') {
    return {
      isValid: false,
      error: { message: 'Prompt is required', status: 400 },
    };
  }

  if (prompt.length < 3 || prompt.length > 1000) {
    return {
      isValid: false,
      error: { message: 'Prompt must be 3-1000 characters', status: 400 },
    };
  }

  const validModels = ['sora-2', 'sora-turbo'];
  if (model !== undefined && !validModels.includes(model as string)) {
    return {
      isValid: false,
      error: {
        message: `Model must be: ${validModels.join(', ')}`,
        status: 400,
      },
    };
  }

  const validSeconds = ['4', '8', '12'];
  if (seconds !== undefined && !validSeconds.includes(seconds as string)) {
    return {
      isValid: false,
      error: {
        message: `Seconds must be: ${validSeconds.join(', ')}`,
        status: 400,
      },
    };
  }

  const validSizes = ['1280x720', '1920x1080', '720x1280', '1080x1920'];
  if (size !== undefined && !validSizes.includes(size as string)) {
    return {
      isValid: false,
      error: {
        message: `Size must be: ${validSizes.join(', ')}`,
        status: 400,
      },
    };
  }

  if (input_reference !== undefined && typeof input_reference !== 'string') {
    return {
      isValid: false,
      error: {
        message: 'input_reference must be a base64 string or data URL',
        status: 400,
      },
    };
  }

  return { isValid: true };
}

/**
 * Initiates OpenAI Sora video generation and returns operation immediately
 */
export async function handleSoraGenerate(
  params: Omit<VideoCreateParams, 'input_reference'> & {
    input_reference?: string; // Base64 encoded image or data URL
  }
): Promise<Response> {
  const openai = new OpenAI(
    {
      apiKey: process.env.OPENAI_API_KEY,
    }
  );

  const createParams: VideoCreateParams = {
    prompt: params.prompt,
    model: params.model,
    seconds: params.seconds,
    size: params.size,
  };

  // Add image reference if provided
  if (params.input_reference) {
    // Handle both data URLs and plain base64
    const base64Data = params.input_reference.startsWith('data:')
      ? params.input_reference.split(',')[1]
      : params.input_reference;

    // Convert base64 to File object
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const file = new File([blob], 'reference.jpg', { type: 'image/jpeg' });

    createParams.input_reference = file;
  }

  const video = await openai.videos.create(createParams);

  // Return the video generation response
  return Response.json(video);
}

/**
 * Checks the status of a Sora video generation by ID
 */
export async function checkSoraStatus(videoId: string): Promise<Response> {
//   const apiKey = await getEchoToken();

//   if (!apiKey) {
//     return Response.json({ error: 'API key not configured' }, { status: 500 });
//   }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const video = await openai.videos.retrieve(videoId);

  return Response.json(video);
}
