import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Users,
  Wifi,
  WifiOff,
  Circle,
  Video,
  AlertTriangle,
} from 'lucide-react';

interface SessionIndicatorsProps {
  startTime: Date;
  participantCount: number;
  isRecording?: boolean;
  networkQuality?: 'excellent' | 'good' | 'poor' | 'offline';
}

export const SessionIndicators: React.FC<SessionIndicatorsProps> = ({
  startTime,
  participantCount,
  isRecording = false,
  networkQuality = 'good',
}) => {
  const [duration, setDuration] = useState('00:00:00');
  const [bandwidth, setBandwidth] = useState('--');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setDuration(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        const updateBandwidth = () => {
          const speed = conn.downlink;
          setBandwidth(speed ? `${speed.toFixed(1)} Mbps` : '--');
        };
        updateBandwidth();
        conn.addEventListener('change', updateBandwidth);
        return () => conn.removeEventListener('change', updateBandwidth);
      }
    }
  }, []);

  const getNetworkIcon = () => {
    switch (networkQuality) {
      case 'excellent':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'good':
        return <Wifi className="w-4 h-4 text-blue-600" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNetworkColor = () => {
    switch (networkQuality) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'poor':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Duration */}
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <Clock className="w-4 h-4" />
        <span className="font-mono text-sm">{duration}</span>
      </Badge>

      {/* Participants */}
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <Users className="w-4 h-4" />
        <span className="text-sm">{participantCount}</span>
      </Badge>

      {/* Network Quality */}
      <Badge className={`flex items-center gap-1.5 px-3 py-1.5 ${getNetworkColor()}`}>
        {getNetworkIcon()}
        <span className="text-sm capitalize">{networkQuality}</span>
        {bandwidth !== '--' && <span className="text-xs">({bandwidth})</span>}
      </Badge>

      {/* Recording Indicator */}
      {isRecording && (
        <Badge className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 animate-pulse">
          <Circle className="w-3 h-3 fill-red-600" />
          <Video className="w-4 h-4" />
          <span className="text-sm font-medium">REC</span>
        </Badge>
      )}

      {/* Low Bandwidth Warning */}
      {networkQuality === 'poor' && (
        <Card className="px-3 py-2 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Low bandwidth detected</span>
          </div>
        </Card>
      )}
    </div>
  );
};
