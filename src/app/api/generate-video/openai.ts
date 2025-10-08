/**
 * OpenAI Sora video generation handler
 */

import { getEchoToken } from "@/echo";
import { ERROR_MESSAGES } from "@/lib/constants";
import { config } from "dotenv";
import OpenAI from "openai";
import { VideoCreateParams } from "openai/resources/videos.mjs";

config();

export interface ValidationResult {
  isValid: boolean;
  error?: { message: string; status: number };
}

const BASE_URL = process.env.BASE_URL;

export function validateSoraRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return {
      isValid: false,
      error: { message: "Invalid request body", status: 400 },
    };
  }

  const { prompt, model, seconds, size, input_reference } = body as Record<
    string,
    unknown
  >;

  if (!prompt || typeof prompt !== "string") {
    return {
      isValid: false,
      error: { message: "Prompt is required", status: 400 },
    };
  }

  if (prompt.length < 3 || prompt.length > 1000) {
    return {
      isValid: false,
      error: { message: "Prompt must be 3-1000 characters", status: 400 },
    };
  }

  const validModels = ["sora-2", "sora-2-pro"];
  if (model !== undefined && !validModels.includes(model as string)) {
    return {
      isValid: false,
      error: {
        message: `Model must be: ${validModels.join(", ")}`,
        status: 400,
      },
    };
  }

  const validSeconds = ["4", "8", "12"];
  if (seconds !== undefined && !validSeconds.includes(seconds as string)) {
    return {
      isValid: false,
      error: {
        message: `Seconds must be: ${validSeconds.join(", ")}`,
        status: 400,
      },
    };
  }

  const validSizes = ["1280x720", "1920x1080", "720x1280", "1080x1920"];
  if (size !== undefined && !validSizes.includes(size as string)) {
    return {
      isValid: false,
      error: {
        message: `Size must be: ${validSizes.join(", ")}`,
        status: 400,
      },
    };
  }

  if (input_reference !== undefined && typeof input_reference !== "string") {
    return {
      isValid: false,
      error: {
        message: "input_reference must be a base64 string or data URL",
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
  headers: Headers,
  params: Omit<VideoCreateParams, "input_reference"> & {
    input_reference?: string; // Base64 encoded image or data URL
  },
): Promise<Response> {
  console.log("using x402", headers.get("use-x402"));
  let token: string | null = null;
  try {
    token = await getEchoToken();
  } catch (error) {
    console.log("No Echo token available:", error);
  }

  if (!token && headers.get("use-x402") !== "true") {
    return Response.json(
      { error: ERROR_MESSAGES.AUTH_FAILED },
      { status: 500 },
    );
  }

  console.log("using x402", headers.get("use-x402"));

  console.log("payment header", headers.get("x-payment"));

  if (!headers.get("x-payment")) {
    const fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Only forward specific headers we need
    const paymentHeader = headers.get("x-payment");
    if (paymentHeader) {
      fetchHeaders["x-payment"] = paymentHeader;
    }

    const response = await fetch(`${BASE_URL}/v1/videos`, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.log("error", errorBody);

      return Response.json(errorBody, {
        status: response.status,
      });
    }

    const successBody = await response.json();
    return Response.json(successBody);
  }

  const openai = new OpenAI({
    defaultHeaders: {
      "x-payment": headers.get("x-payment") || "",
    },
    baseURL: BASE_URL,
    apiKey: "ignore",
  });

  const createParams: VideoCreateParams = {
    prompt: params.prompt,
    model: params.model,
    seconds: params.seconds,
    size: params.size,
  };

  // Add image reference if provided
  if (params.input_reference) {
    // Handle both data URLs and plain base64
    const base64Data = params.input_reference.startsWith("data:")
      ? params.input_reference.split(",")[1]
      : params.input_reference;

    // Convert base64 to File object
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const file = new File([blob], "reference.jpg", { type: "image/jpeg" });

    createParams.input_reference = file;
  }

  try {
    const video = await openai.videos.create(createParams);
    return Response.json(video);
  } catch (error) {
    console.error("Sora video generation error:", error);

    if (error instanceof OpenAI.APIError) {
      console.log("API Error details:", {
        status: error.status,
        message: error.message,
        error: error.error,
        headers: error.headers,
      });

      // For 402, we need to return the payment request details from the response body
      // The payment info should be in the original response body, not error.error
      const responseBody = (
        error as {
          response?: { data: unknown };
          error?: unknown;
          message: string;
        }
      ).response?.data ||
        (error as { error?: unknown }).error || { error: error.message };

      return Response.json(responseBody, {
        status: error.status || 500,
      });
    }

    return Response.json(
      { error: ERROR_MESSAGES.NO_VIDEO_GENERATED },
      { status: 500 },
    );
  }
}

/**
 * Checks the status of a Sora video generation by ID
 */
export async function checkSoraStatus(
  videoId: string,
  useX402: boolean,
): Promise<Response> {
  let token: string | null = null;

  if (!useX402) {
    try {
      token = await getEchoToken();
    } catch (error) {
      console.log("No Echo token available:", error);
    }

    if (!token) {
      return Response.json(
        { error: ERROR_MESSAGES.AUTH_FAILED },
        { status: 500 },
      );
    }
  }

  const openai = new OpenAI({
    apiKey: token || "ignore",
    defaultHeaders: {
      "x-payment": "placeholder",
    },
    baseURL: BASE_URL,
  });

  const video = await openai.videos.retrieve(videoId);

  return Response.json(video);
}
