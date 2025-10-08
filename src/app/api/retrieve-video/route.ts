import { getEchoToken } from "@/echo";
import OpenAI from "openai";

const BASE_URL = process.env.BASE_URL;

export async function GET(request: Request) {
  console.log("=== VIDEO RETRIEVE REQUEST ===");
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  console.log("Video ID:", videoId);
  console.log("BASE_URL:", BASE_URL);
  console.log(
    "Request headers:",
    Object.fromEntries(request.headers.entries()),
  );

  if (!videoId || typeof videoId !== "string") {
    console.log("ERROR: Invalid videoId");
    return Response.json({ error: "videoId is required" }, { status: 400 });
  }

  // Try to get Echo token, but use x402 dummy payment if unavailable
  let token: string | null = null;
  let apiKey = "ignore";
  const openaiHeaders: Record<string, string> = {};

  console.log("Attempting to get Echo token...");
  try {
    token = await getEchoToken();
    if (token) {
      apiKey = token;
      console.log("Echo token retrieved successfully, using for auth");
    } else {
      console.log("No Echo token available, using dummy payment header");
      openaiHeaders["x-payment"] = "dummy";
    }
  } catch (error) {
    console.log("Echo token error, using dummy payment header:", error);
    openaiHeaders["x-payment"] = "dummy";
  }

  console.log("Creating OpenAI client with:");
  console.log("- API Key:", apiKey === "ignore" ? "ignore" : "token present");
  console.log("- Headers:", openaiHeaders);
  console.log("- Base URL:", BASE_URL);

  const client = new OpenAI({
    apiKey,
    defaultHeaders: openaiHeaders,
    baseURL: BASE_URL,
  });

  try {
    console.log("Attempting to download video content for ID:", videoId);
    const response = await client.videos.downloadContent(videoId);
    console.log("Download response received, converting to blob...");

    const content = await response.blob();
    console.log("Blob created successfully, size:", content.size);

    return new Response(content, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video-${videoId}.mp4"`,
      },
    });
  } catch (error) {
    console.error("=== VIDEO DOWNLOAD ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Full error:", JSON.stringify(error, null, 2));

    if (error instanceof Error && "status" in error) {
      console.error("HTTP Status:", (error as any).status);
    }

    return Response.json(
      { error: "Failed to download video" },
      { status: 500 },
    );
  }
}
