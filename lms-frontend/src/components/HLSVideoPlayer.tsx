import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface HLSVideoPlayerProps {
  manifestUrl: string;
  poster?: string;
  autoplay?: boolean;
}

export const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
  manifestUrl,
  poster,
  autoplay = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });

      hls.loadSource(manifestUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const qualities = data.levels.map((level, index) => ({
          index,
          height: level.height,
          label: `${level.height}p`
        }));

        setAvailableQualities(['auto', ...qualities.map(q => q.label)]);

        if (autoplay) {
          video.play();
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        console.log(`Quality switched to: ${level.height}p`);
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = manifestUrl;
      if (autoplay) {
        video.play();
      }
    }
  }, [manifestUrl, autoplay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const changeQuality = (quality: string) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (quality === 'auto') {
      hls.currentLevel = -1; // Enable auto quality
    } else {
      const qualityIndex = hls.levels.findIndex(
        level => `${level.height}p` === quality
      );
      if (qualityIndex !== -1) {
        hls.currentLevel = qualityIndex;
      }
    }

    setCurrentQuality(quality);
  };

  return (
    <Card className='w-full'>
      <CardContent className='p-0'>
        <div className='relative group'>
          <video
            ref={videoRef}
            className='w-full aspect-video bg-black'
            poster={poster}
            controls={false}
            onClick={togglePlay}
          />

          {/* Custom Controls */}
          <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity'>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={togglePlay}
                className='text-white hover:text-white hover:bg-white/20'
              >
                {playing ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
              </Button>

              <Button
                variant='ghost'
                size='sm'
                onClick={toggleMute}
                className='text-white hover:text-white hover:bg-white/20'
              >
                {muted ? <VolumeX className='h-5 w-5' /> : <Volume2 className='h-5 w-5' />}
              </Button>

              <div className='flex-1' />

              {/* Quality Selector */}
              <div className='flex items-center gap-2'>
                <Settings className='h-4 w-4 text-white' />
                <Select value={currentQuality} onValueChange={changeQuality}>
                  <SelectTrigger className='w-24 h-8 bg-white/10 border-white/20 text-white'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQualities.map(quality => (
                      <SelectItem key={quality} value={quality}>
                        {quality === 'auto' ? 'Auto' : quality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant='ghost'
                size='sm'
                onClick={toggleFullscreen}
                className='text-white hover:text-white hover:bg-white/20'
              >
                <Maximize className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
