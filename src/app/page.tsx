/**
 * Next.js Video Generation Template with Echo SDK
 *
 * This template demonstrates how to build an AI video generation app using:
 * - Echo SDK for authentication and token management
 * - Google Veo models for video generation
 * - Next.js App Router for server-side rendering
 *
 * Key features:
 * 1. Authentication: Automatic login/logout with Echo SDK
 * 2. Video Generation: Support for Veo 3 Fast model
 * 3. Duration Control: Adjustable video length (1-60 seconds)
 * 4. History: Persistent video gallery with download/copy actions
 * 5. Responsive Design: Works on desktop and mobile
 *
 * Usage Examples:
 * - Text-to-Video: "A beautiful sunset over mountains with birds flying"
 * - Duration Control: Adjust slider for video length
 * - Model Selection: Currently supports Veo 3 Fast
 */

import VideoGenerator from "@/components/video-generator";
import { isSignedIn } from "@/echo";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";

/**
 * Main application page
 *
 * Server component that checks authentication status and renders
 * either the sign-in page or the main video generation interface
 */
export default async function Home() {
  // Check authentication status using Echo SDK
  const _isSignedIn = await isSignedIn();

  // Main application interface
  return (
    <AuthGuard isEchoSignedIn={_isSignedIn}>
      <div className="flex flex-col h-screen p-2 sm:p-4 max-w-6xl mx-auto">
        <AppHeader />
        <VideoGenerator />
      </div>
    </AuthGuard>
  );
}
