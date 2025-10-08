import { getEchoToken } from "@/echo";
import OpenAI from "openai";

const BASE_URL = process.env.BASE_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId || typeof videoId !== "string") {
    return Response.json({ error: "videoId is required" }, { status: 400 });
  }

  // Try to get Echo token, but use x402 dummy payment if unavailable
  let token: string | null = null;
  let apiKey = "ignore";
  const openaiHeaders: Record<string, string> = {};

  try {
    token = await getEchoToken();
    if (token) {
      apiKey = token;
    } else {
      openaiHeaders["x-payment"] = "dummy";
    }
  } catch {
    openaiHeaders["x-payment"] = "dummy";
  }

  const client = new OpenAI({
    apiKey,
    defaultHeaders: openaiHeaders,
    baseURL: BASE_URL,
  });

  try {
    const response = await client.videos.downloadContent(videoId);
    const content = await response.blob();

    return new Response(content, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video-${videoId}.mp4"`,
      },
    });
  } catch (error) {
    console.error("Error downloading video:", error);
    return Response.json(
      { error: "Failed to download video" },
      { status: 500 },
    );
  }
}
