import OpenAI from 'openai';
import { config } from 'dotenv';

config();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId || typeof videoId !== 'string') {
    return Response.json(
      { error: 'videoId is required' },
      { status: 400 }
    );
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.videos.downloadContent(videoId);
  const content = await response.blob();

  return new Response(content, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="video-${videoId}.mp4"`,
    },
  });
}

