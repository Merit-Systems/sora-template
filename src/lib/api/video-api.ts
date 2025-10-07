import type { GenerateVideoRequest, VideoModelOption } from '@/lib/types';
import { GenerateVideosOperation } from '@google/genai';

/**
 * Generate a new video using the Echo SDK
 */
export async function generateVideo(
  request: GenerateVideoRequest
): Promise<GenerateVideosOperation> {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Check the status of a video generation operation
 */
export async function checkVideoStatus(
  operation: GenerateVideosOperation,
  model: VideoModelOption
): Promise<GenerateVideosOperation> {
  const response = await fetch('/api/check-video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName: operation.name, model }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}


export async function checkSoraStatus(
  operation: string,
  model: VideoModelOption
): Promise<GenerateVideosOperation> {
  const response = await fetch('/api/check-video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName: operation, model }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}