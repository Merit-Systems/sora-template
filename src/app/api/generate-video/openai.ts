/**
 * OpenAI Sora video generation handler
 */

import { getEchoToken } from "@/echo";
import { ERROR_MESSAGES } from "@/lib/constants";
import { padImageForVideo } from "@/lib/image-padding";
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

  if (prompt.length < 3) {
    return {
      isValid: false,
      error: { message: "Prompt must be 3 characters or more", status: 400 },
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

// Helper functions for cleaner code
async function validateAuthentication(
  useX402: boolean,
): Promise<{ token?: string | null; error?: Response }> {
  if (useX402) {
    // In x402 mode, we don't validate payment header here
    // Let the OpenAI API return 402 if payment is needed
    return {};
  }

  // Echo mode - need token
  try {
    const token = await getEchoToken();
    if (!token) {
      return {
        error: Response.json(
          { error: ERROR_MESSAGES.AUTH_FAILED },
          { status: 500 },
        ),
      };
    }
    return { token };
  } catch (error) {
    console.log("No Echo token available:", error);
    return {
      error: Response.json(
        { error: ERROR_MESSAGES.AUTH_FAILED },
        { status: 500 },
      ),
    };
  }
}

function echoFetch(fetch: any, paymentAuthHeader: string | null | undefined) {

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, any> = { ...init?.headers };
    // Handle 402 payment
    if (paymentAuthHeader) {
      headers['x-payment'] = paymentAuthHeader;
    }

    delete headers['Authorization'];

    console.log("headers: ", headers)
    return fetch(input, {
      ...init,
      headers,
    });
  }
}

function createOpenAIClient(
  useX402: boolean,
  paymentHeader: string | null,
  token?: string | null,
): OpenAI {
  const openaiHeaders: Record<string, string> = {};
  let apiKey = "ignore";

  if (useX402) {
    openaiHeaders["x-payment"] = paymentHeader || "";
    return new OpenAI({
      defaultHeaders: openaiHeaders,
      baseURL: BASE_URL,
      apiKey: token || "ignore",
      fetch: echoFetch(fetch, paymentHeader),
    });
  } else {
    apiKey = token || "ignore";
    return new OpenAI({
      defaultHeaders: openaiHeaders,
      baseURL: BASE_URL,
      apiKey,
    });
  }
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
  const useX402 = headers.get("use-x402") === "true";
  const paymentHeader = headers.get("x-payment");

  // Validate authentication
  const authResult = await validateAuthentication(useX402);
  if (authResult.error) {
    return authResult.error;
  }

  // For x402 mode, use direct fetch to properly handle 402 responses
  if (useX402) {
    const fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (paymentHeader) {
      fetchHeaders["x-payment"] = paymentHeader;
    }

    const fullUrl = `${BASE_URL}/videos`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      return Response.json(errorBody, {
        status: response.status,
      });
    }

    const successBody = await response.json();
    return Response.json(successBody);
  }

  // For Echo mode, use OpenAI client
  const openai = createOpenAIClient(useX402, paymentHeader, authResult.token);

  const createParams: VideoCreateParams = {
    prompt: params.prompt,
    model: params.model,
    seconds: params.seconds,
    size: params.size,
  };

  // Add image reference if provided
  if (params.input_reference) {
    try {
      // Handle both data URLs and plain base64
      const base64Data = params.input_reference.startsWith("data:")
        ? params.input_reference.split(",")[1]
        : params.input_reference;

      // Pad image to match video output dimensions
      const videoSize = params.size || "1280x720"; // default size if not specified
      const paddedBase64 = await padImageForVideo(base64Data, videoSize);

      // Convert padded base64 to File object
      const buffer = Buffer.from(paddedBase64, "base64");
      const blob = new Blob([buffer], { type: "image/png" }); // PNG to preserve transparency
      const file = new File([blob], "reference.png", { type: "image/png" });

      createParams.input_reference = file;
    } catch (error) {
      console.error("Error padding input image:", error);
      // Fallback to original image without padding
      const base64Data = params.input_reference.startsWith("data:")
        ? params.input_reference.split(",")[1]
        : params.input_reference;

      const buffer = Buffer.from(base64Data, "base64");
      const blob = new Blob([buffer], { type: "image/jpeg" });
      const file = new File([blob], "reference.jpg", { type: "image/jpeg" });

      createParams.input_reference = file;
    }
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
  paymentHeader?: string,
): Promise<Response> {
  // Validate authentication
  const authResult = await validateAuthentication(useX402);
  if (authResult.error) {
    return authResult.error;
  }

  // Create OpenAI client
  const openai = createOpenAIClient(
    useX402,
    paymentHeader || null,
    authResult.token,
  );

  try {
    const video = await openai.videos.retrieve(videoId);
    return Response.json(video);
  } catch (error) {
    console.error("Error retrieving video status:", error);
    return Response.json(
      { error: "Failed to retrieve video status" },
      { status: 500 },
    );
  }
}
