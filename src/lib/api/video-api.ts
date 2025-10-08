import type { GenerateVideoRequest, VideoModelOption } from "@/lib/types";
import { GenerateVideosOperation } from "@google/genai";
import { WalletClient } from "viem";
import { Signer } from "x402/types";
import { createPaymentHeader } from "../402/createPaymentHeader";

// Helper function to create headers for API requests
function createApiHeaders(
  walletClient: WalletClient | undefined,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "use-x402": walletClient ? "true" : "false",
    "x-payment": "",
  };
}

// Helper function to handle 402 payment retry logic
async function handlePaymentRetry(
  url: string,
  body: any,
  walletClient: WalletClient | undefined,
  initialResponse: Response,
): Promise<Response> {
  if (!walletClient) {
    throw new Error(
      `HTTP ${initialResponse.status}: No wallet client available for payment`,
    );
  }

  const paymentRequestBody = await initialResponse.json();
  const paymentHeader = await createPaymentHeader(
    walletClient as Signer,
    JSON.stringify(paymentRequestBody),
  );

  const headers = createApiHeaders(walletClient);
  headers["x-payment"] = paymentHeader;

  const retryResponse = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!retryResponse.ok) {
    const errorText = await retryResponse.text();
    throw new Error(
      `HTTP ${retryResponse.status}: Payment retry failed - ${errorText}`,
    );
  }

  return retryResponse;
}

/**
 * Generate a new video using the Echo SDK
 */
export async function generateVideo(
  request: GenerateVideoRequest,
  walletClient: WalletClient | undefined,
): Promise<GenerateVideosOperation> {
  const headers = createApiHeaders(walletClient);
  const url = "/api/generate-video";

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 402) {
      const retryResponse = await handlePaymentRetry(
        url,
        request,
        walletClient,
        response,
      );
      return retryResponse.json();
    }
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
  model: VideoModelOption,
  walletClient: WalletClient | undefined,
): Promise<GenerateVideosOperation> {
  const headers = createApiHeaders(walletClient);
  const body = { operationName: operation.name, model };

  const response = await fetch("/api/check-video-status", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function checkSoraStatus(
  operation: string,
  model: VideoModelOption,
  walletClient: WalletClient | undefined,
): Promise<GenerateVideosOperation> {
  const headers = createApiHeaders(walletClient);
  const url = "/api/check-video-status";
  const body = { operationName: operation, model };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 402) {
      const retryResponse = await handlePaymentRetry(
        url,
        body,
        walletClient,
        response,
      );
      return retryResponse.json();
    }
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}
