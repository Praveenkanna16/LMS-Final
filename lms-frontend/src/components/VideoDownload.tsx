import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Lock, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface VideoDownloadProps {
  videoId: number;
  videoTitle: string;
  videoUrl: string;
  allowDownload: boolean;
}

export const VideoDownload: React.FC<VideoDownloadProps> = ({
  videoId,
  videoTitle,
  videoUrl,
  allowDownload
}) => {
  const [downloading, setDownloading] = useState(false);

  const generateDownloadToken = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/videos/${videoId}/download-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate download token');
      }

      const data = await response.json();
      return data.downloadUrl;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  };

  const handleDownload = async () => {
    if (!allowDownload) {
      toast.error('Downloads are not allowed for this video');
      return;
    }

    setDownloading(true);

    try {
      // Generate secure download URL with token
      const downloadUrl = await generateDownloadToken();

      // Create hidden link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${videoTitle}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started! Check your downloads folder.');
    } catch (error) {
      toast.error('Failed to download video. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allowDownload ? (
          <>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5" />
              <span>
                Download link expires in 1 hour for security. You can generate a new link anytime.
              </span>
            </div>
            
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full"
            >
              {downloading ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-pulse" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Video: {videoTitle}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Downloads Disabled</p>
              <p className="text-sm text-muted-foreground">
                This video cannot be downloaded. Contact your teacher for more information.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
