'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VideoPage() {
  const params = useParams();
  const videoId = params.video_id as string;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/retrieve-video?videoId=${videoId}`);
      
      if (!response.ok) {
        setError('video is not available');
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setLoading(false);
    };

    if (videoId) {
      fetchVideo();
    }

    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Video Player</h1>
        </div>

        {/* Video Container */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="aspect-video bg-black flex items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <div className="text-white text-lg">Loading video...</div>
              </div>
            )}
            
            {error && (
              <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <div className="text-red-400 text-xl font-semibold">{error}</div>
                <Link href="/">
                  <Button variant="outline" className="mt-4">
                    Return to Home
                  </Button>
                </Link>
              </div>
            )}
            
            {videoUrl && !error && (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Video Info */}
        {videoUrl && !error && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Video Details</h2>
              <div className="text-sm text-gray-600">
                <p>Video ID: <span className="font-mono text-gray-800">{videoId}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

