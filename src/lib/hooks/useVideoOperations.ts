import { checkSoraStatus } from "@/lib/api/video-api";
import type { GeneratedVideo } from "@/lib/types";
import { videoOperationsStorage } from "@/lib/video-operations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video } from "openai/resources/videos.mjs";
import { useEffect } from "react";
import { WalletClient } from "viem";

interface UseVideoOperationsOptions {
  isInitialized: boolean;
  walletClient: WalletClient | undefined;
  onOperationComplete: (
    operationId: string,
    updates: Partial<GeneratedVideo>,
  ) => void;
}

/**
 * Hook to manage video operation polling
 *
 * Smart polling logic:
 * - Polls operations that are not done yet
 * - Re-polls completed operations if their signed URLs have expired (after 1 hour)
 * - Stops polling once operation is done and URL is still valid
 */
export function useVideoOperations({
  isInitialized,
  walletClient,
  onOperationComplete,
}: UseVideoOperationsOptions) {
  const queryClient = useQueryClient();
  const pendingOperations = isInitialized
    ? videoOperationsStorage.getPending()
    : [];

  const { data: operationStatuses } = useQuery({
    queryKey: [
      "video-operations",
      pendingOperations.map((op) => op.id),
      walletClient?.account?.address,
    ],
    queryFn: async () => {
      if (pendingOperations.length === 0) {
        return [];
      }

      const results = await Promise.allSettled(
        pendingOperations.map(async (op) => {
          // Always use Sora status check since we only support Sora models
          const operation = op.operation as Video;
          const result = await checkSoraStatus(
            operation.id,
            op.model,
            walletClient,
          );
          return { operationId: op.id, result };
        }),
      );
      return results;
    },
    enabled: isInitialized && pendingOperations.length > 0,
    refetchInterval: 5000,
  });

  // Process operation status updates
  useEffect(() => {
    if (!operationStatuses) return;

    let hasUpdates = false;

    operationStatuses.forEach((result) => {
      if (result.status === "fulfilled") {
        const { operationId, result: opResult } = result.value;

        // opResult is already a Video object from checkSoraStatus
        const operation = opResult;
        videoOperationsStorage.update(operationId, { operation });

        if (operation.status === "completed") {
          const videoUrl = `/api/retrieve-video?videoId=${operation.id}`;
          const expiresAt = operation.expires_at
            ? new Date(operation.expires_at * 1000).toISOString()
            : undefined;

          onOperationComplete(operationId, {
            videoUrl,
            fullVideoId: operation.id,
            isLoading: false,
            progress: 100,
            error: undefined,
          });

          videoOperationsStorage.update(operationId, {
            videoUrl,
            error: undefined,
            signedUrlExpiresAt: expiresAt,
            operation,
          });

          hasUpdates = true;
        } else if (
          operation.status === "in_progress" ||
          operation.status === "queued"
        ) {
          // Update progress for in-progress videos
          const progress = operation.progress || 0;

          onOperationComplete(operationId, {
            isLoading: true,
            progress,
            error: undefined,
          });

          hasUpdates = true;
        } else if (operation.status === "failed" || operation.error) {
          const errorMsg =
            operation.error?.message || "Video generation failed";
          onOperationComplete(operationId, {
            error: errorMsg,
            isLoading: false,
            progress: undefined,
          });

          videoOperationsStorage.update(operationId, {
            error: errorMsg,
            operation,
          });

          hasUpdates = true;
        }
      }
    });

    if (hasUpdates) {
      queryClient.invalidateQueries({ queryKey: ["video-operations"] });
    }
  }, [operationStatuses, queryClient, onOperationComplete]);
}
