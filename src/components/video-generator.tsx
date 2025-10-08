"use client";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useVideoGeneration } from "@/lib/hooks/useVideoGeneration";
import { useVideoHistory } from "@/lib/hooks/useVideoHistory";
import { useVideoOperations } from "@/lib/hooks/useVideoOperations";
import type { VideoModelOption } from "@/lib/types";
import { useEcho } from "@merit-systems/echo-next-sdk/client";
import { Settings, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { AuthModal } from "./auth-modal";
import { FileInputManager } from "./FileInputManager";
import { VideoHistory } from "./video-history";

type VideoSize = "720x1280" | "1280x720" | "1024x1792" | "1792x1024";

/**
 * Main VideoGenerator component
 *
 * This component demonstrates how to integrate Echo SDK with AI video generation:
 * - Uses PromptInput for unified input handling
 * - Supports text-to-video generation with duration control
 * - Maintains history of all generated videos
 * - Configurable model, size, and duration settings via modal
 */
export default function VideoGenerator() {
  const [model, setModel] = useState<VideoModelOption>("sora-2");
  const [videoSize, setVideoSize] = useState<VideoSize>("1280x720");
  const [durationSeconds, setDurationSeconds] = useState<4 | 8 | 12>(4);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const generateAudio = true; // Audio is always enabled
  const [hasContent, setHasContent] = useState(false);
  const promptInputRef = useRef<HTMLFormElement>(null);

  const allowedDurations = [4, 8, 12] as const;

  const { videoHistory, isInitialized, addVideo, updateVideo, removeVideo } =
    useVideoHistory();

  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();
  const { user } = useEcho();

  useVideoOperations({
    isInitialized,
    walletClient,
    onOperationComplete: updateVideo,
  });

  const { handleSubmit: generateVideo } = useVideoGeneration({
    model,
    durationSeconds,
    generateAudio,
    size: videoSize,
    onVideoAdded: addVideo,
    onVideoUpdated: updateVideo,
  });

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      // Check if user is authenticated
      const isAuthenticated = !!user || isConnected;

      if (!isAuthenticated) {
        setAuthModalOpen(true);
        return;
      }

      await generateVideo(message);
      setHasContent(false);
    },
    [generateVideo, user, isConnected],
  );

  const clearForm = useCallback(() => {
    promptInputRef.current?.reset();
    window.__promptInputActions?.clear();
    setHasContent(false);
  }, []);

  return (
    <div className="space-y-6">
      <PromptInput
        ref={promptInputRef}
        onSubmit={handleSubmit}
        className="relative"
        globalDrop
        multiple
        accept="image/*"
      >
        <FileInputManager />
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => {
              setHasContent(true);
              return <PromptInputAttachment data={attachment} />;
            }}
          </PromptInputAttachments>
          <PromptInputTextarea
            placeholder="Describe the video you want to generate, or attach an image..."
            onChange={(e) => setHasContent(e.target.value.length > 0 || false)}
          />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>

            {/* Settings Modal */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <Settings size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Video Settings</DialogTitle>
                  <DialogDescription>
                    Configure your video generation settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select
                      value={model}
                      onValueChange={(value: VideoModelOption) =>
                        setModel(value)
                      }
                    >
                      <SelectTrigger id="model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sora-2">Sora 2</SelectItem>
                        <SelectItem value="sora-2-pro">Sora 2 Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Video Size Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="videoSize">Video Size</Label>
                    <Select
                      value={videoSize}
                      onValueChange={(value: VideoSize) => setVideoSize(value)}
                    >
                      <SelectTrigger id="videoSize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1280x720">
                          1280x720 (Landscape)
                        </SelectItem>
                        <SelectItem value="720x1280">
                          720x1280 (Portrait)
                        </SelectItem>
                        <SelectItem value="1792x1024">
                          1792x1024 (Wide Landscape)
                        </SelectItem>
                        <SelectItem value="1024x1792">
                          1024x1792 (Tall Portrait)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration Slider */}
                  <div className="space-y-2">
                    <Label htmlFor="duration-slider">
                      Duration: {durationSeconds}s
                    </Label>
                    <Slider
                      id="duration-slider"
                      value={[allowedDurations.indexOf(durationSeconds)]}
                      onValueChange={([index]) =>
                        setDurationSeconds(
                          allowedDurations[index] as 4 | 8 | 12,
                        )
                      }
                      min={0}
                      max={allowedDurations.length - 1}
                      step={1}
                      className="w-full py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>4s</span>
                      <span>8s</span>
                      <span>12s</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </PromptInputTools>
          <div className="flex items-center gap-2">
            {hasContent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearForm}
                className="h-9 w-9 p-0"
                title="Clear input"
              >
                <X size={16} />
              </Button>
            )}
            <PromptInputSubmit />
          </div>
        </PromptInputToolbar>
      </PromptInput>

      <VideoHistory videoHistory={videoHistory} onRemoveVideo={removeVideo} />

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
