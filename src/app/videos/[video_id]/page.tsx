'use client';

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
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      {loading && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <div className="text-white text-lg">Loading video...</div>
        </div>
      )}
      
      {error && (
        <div className="text-white text-xl">{error}</div>
      )}
      
      {videoUrl && !error && (
        <video
          src={videoUrl}
          controls
          autoPlay
          className="max-h-screen max-w-screen object-contain"
        />
      )}
    </div>
  );
}

