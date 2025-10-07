import type { GenerateVideoRequest, VideoModelOption } from '@/lib/types';
import { GenerateVideosOperation } from '@google/genai';
import { WalletClient } from 'viem';
import { createPaymentHeader } from '../402/createPaymentHeader';
import { Signer } from 'x402/types';

/**
 * Generate a new video using the Echo SDK
 */
export async function generateVideo(
  request: GenerateVideoRequest,
  walletClient: WalletClient | undefined
): Promise<GenerateVideosOperation> {
  let headers = { 'Content-Type': 'application/json', "use-x402": "false", "x-payment": ""};
  if (walletClient) {
      headers['use-x402'] = "true"; 
  }
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {

    if (response.status === 402) {
      const body = await response.json();
      const paymentHeader = await createPaymentHeader(walletClient as Signer, JSON.stringify(body));
      headers['x-payment'] = paymentHeader;
      const secondResponse = await fetch('/api/generate-video', {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });
      if (!secondResponse.ok) {
        throw new Error(`HTTP ${secondResponse.status}: ${secondResponse.body}`);
      }
      return secondResponse.json();
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
  walletClient: WalletClient | undefined
): Promise<GenerateVideosOperation> {
  let headers = { 'Content-Type': 'application/json', "use-x402": "false", "x-payment": ""};
  if (walletClient) {
      headers['use-x402'] = "true"; 
  }
  const response = await fetch('/api/check-video-status', {
    method: 'POST',
    headers,
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
  model: VideoModelOption,
  walletClient: WalletClient | undefined
): Promise<GenerateVideosOperation> {
  let headers = { 'Content-Type': 'application/json', "use-x402": "false", "x-payment": ""};
  if (walletClient) {
      headers['use-x402'] = "true"; 
  }
  headers['use-x402'] = "true"; 
  const response = await fetch('/api/check-video-status', {
    method: 'POST',
    headers,
    body: JSON.stringify({ operationName: operation, model }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  return response.json();
}