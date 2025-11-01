import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  title: string;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

interface VideoProgress {
  currentTime: number;
  watchedPercentage: number;
  completionStatus: string;
  lastWatchedAt: string;
}

interface VideoData {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  thumbnailUrl?: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    video: VideoData;
    progress: VideoProgress;
  };
  message?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  title,
  onProgressUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [savedProgress, setSavedProgress] = useState<VideoProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  
  const { toast } = useToast();

  // Fetch video progress on mount
  useEffect(() => {
    const fetchVideoProgress = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/video/playback/${videoId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const result = (await response.json()) as ApiResponse;

        if (result.success && result.data) {
          setSavedProgress(result.data.progress);
          
          // Show resume prompt if there's saved progress > 10 seconds
          if (result.data.progress.currentTime > 10) {
            setShowResumePrompt(true);
          }
        }
      } catch (error) {
        console.error('Error fetching video progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVideoProgress();
  }, [videoId]);

  // Save progress to backend every 10 seconds
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      progressIntervalRef.current = setInterval(() => {
        const video = videoRef.current;
        if (video) {
          void saveProgress(video.currentTime, video.duration);
        }
      }, 10000); // Save every 10 seconds

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [isPlaying]);

  // Save progress on unmount (cleanup)
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        void saveProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    };
  }, []);

  // Save progress to API
  const saveProgress = async (time: number, dur: number) => {
    try {
      const response = await fetch(`/api/video/progress/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentTime: time,
          duration: dur,
          playbackSpeed: videoRef.current?.playbackRate ?? 1,
          quality: 'auto',
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (result.success && onProgressUpdate) {
        onProgressUpdate(time, dur);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleResumeFromSaved = () => {
    if (videoRef.current && savedProgress) {
      videoRef.current.currentTime = savedProgress.currentTime;
      setShowResumePrompt(false);
      void handlePlay();
      
      toast({
        title: 'Resumed',
        description: `Continuing from ${formatTime(savedProgress.currentTime)}`,
      });
    }
  };

  const handlePlayFromStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setShowResumePrompt(false);
      void handlePlay();
    }
  };

  const handlePlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      
      // Save progress on pause
      void saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        void videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center h-96'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-0'>
        {/* Resume Prompt */}
        {showResumePrompt && savedProgress && (
          <Alert className='m-4 mb-0 bg-blue-50 border-blue-200'>
            <AlertDescription>
              <div className='flex items-center justify-between'>
                <span>
                  Continue watching from {formatTime(savedProgress.currentTime)}?
                </span>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handlePlayFromStart}
                  >
                    Start Over
                  </Button>
                  <Button
                    size='sm'
                    onClick={handleResumeFromSaved}
                  >
                    Resume
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Video Element */}
        <div className='relative bg-black'>
          <video
            ref={videoRef}
            src={videoUrl}
            className='w-full aspect-video'
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              void saveProgress(duration, duration);
            }}
          >
            <track kind='captions' />
          </video>

          {/* Video Title Overlay */}
          <div className='absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4'>
            <h3 className='text-white font-semibold'>{title}</h3>
          </div>
        </div>

        {/* Controls */}
        <div className='bg-gray-900 text-white p-4 space-y-3'>
          {/* Progress Bar */}
          <div className='flex items-center gap-3'>
            <span className='text-sm tabular-nums min-w-[3rem]'>
              {formatTime(currentTime)}
            </span>
            <input
              type='range'
              min='0'
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className='flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600'
              style={{
                background: `linear-gradient(to right, #2563eb ${progressPercentage}%, #374151 ${progressPercentage}%)`,
              }}
            />
            <span className='text-sm tabular-nums min-w-[3rem]'>
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                variant='ghost'
                className='text-white hover:bg-white/10'
                onClick={() => {
                  handleSkip(-10);
                }}
              >
                <SkipBack className='h-4 w-4' />
              </Button>
              
              {isPlaying ? (
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-white hover:bg-white/10'
                  onClick={handlePause}
                >
                  <Pause className='h-5 w-5' />
                </Button>
              ) : (
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-white hover:bg-white/10'
                  onClick={() => {
                    void handlePlay();
                  }}
                >
                  <Play className='h-5 w-5' />
                </Button>
              )}
              
              <Button
                size='sm'
                variant='ghost'
                className='text-white hover:bg-white/10'
                onClick={() => {
                  handleSkip(10);
                }}
              >
                <SkipForward className='h-4 w-4' />
              </Button>

              <Button
                size='sm'
                variant='ghost'
                className='text-white hover:bg-white/10'
                onClick={handleMute}
              >
                {isMuted ? <VolumeX className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
              </Button>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                variant='ghost'
                className='text-white hover:bg-white/10'
              >
                <Settings className='h-4 w-4' />
              </Button>
              
              <Button
                size='sm'
                variant='ghost'
                className='text-white hover:bg-white/10'
                onClick={handleFullscreen}
              >
                <Maximize className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Progress Info */}
          {savedProgress && (
            <div className='flex items-center justify-between text-xs text-gray-400'>
              <span>
                {Math.round(progressPercentage)}% completed
              </span>
              <span>
                Last watched: {new Date(savedProgress.lastWatchedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
