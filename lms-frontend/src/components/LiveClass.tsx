import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Users,
  Calendar,
  Clock,
  Play,
  Settings,
  MessageSquare,
  Share2,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  PhoneOff,
  Maximize,
  Minimize,
} from 'lucide-react';

const LiveClass: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (meetingId) {
      fetchMeetingDetails();
    }
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.joinLiveClass(meetingId!);
      setMeeting(response.data);
    } catch (error: any) {
      console.error('Failed to fetch meeting details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load live class details',
        variant: 'destructive',
      });
      navigate('/student/batches');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    try {
      // In a real implementation, this would integrate with Zoom SDK
      // For now, just simulate joining
      setIsJoined(true);

      toast({
        title: 'Joined Successfully',
        description: 'You have joined the live class',
      });

      // Simulate opening Zoom meeting
      if (meeting?.joinUrl) {
        window.open(meeting.joinUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Failed to join meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to join the live class',
        variant: 'destructive',
      });
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleLeaveMeeting = () => {
    setIsJoined(false);
    toast({
      title: 'Left Meeting',
      description: 'You have left the live class',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <Video className='w-16 h-16 animate-pulse mx-auto mb-6 text-blue-500' />
          <h2 className='text-3xl font-bold mb-4'>Loading Live Class</h2>
          <p className='text-gray-600'>Preparing your meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-red-600'>Meeting Not Found</CardTitle>
            <CardDescription>
              The live class you're looking for doesn't exist or has ended.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <Button
              onClick={() => {
                navigate('/student/batches');
              }}
              className='w-full'
            >
              Back to My Batches
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${isFullscreen ? 'p-0' : 'p-6'}`}
    >
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              onClick={() => {
                navigate('/student/batches');
              }}
              className='flex items-center gap-2'
            >
              ← Back to Batches
            </Button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{meeting.topic}</h1>
              <p className='text-gray-600'>
                {meeting.batchName} • {meeting.teacherName}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='flex items-center gap-1'>
              <Users className='w-3 h-3' />
              {meeting.participantCount || 0} participants
            </Badge>
            <Badge className='bg-green-100 text-green-700'>Live</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Video Area */}
        <div className='lg:col-span-3'>
          <Card className='h-[600px] relative overflow-hidden'>
            {/* Video Placeholder */}
            <div className='absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center'>
              <div className='text-center'>
                <Video className='w-24 h-24 text-blue-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>
                  {isJoined ? 'Live Class in Progress' : 'Ready to Join'}
                </h3>
                <p className='text-gray-500'>
                  {isJoined
                    ? 'Click the Zoom link to join the video conference'
                    : 'Click "Join Class" to start the live session'}
                </p>
              </div>
            </div>

            {/* Controls Overlay */}
            {isJoined && (
              <div className='absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/80 rounded-full px-6 py-3'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleToggleMute}
                  className={`rounded-full p-3 ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                >
                  {isMuted ? <MicOff className='w-5 h-5' /> : <Mic className='w-5 h-5' />}
                </Button>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleToggleVideo}
                  className={`rounded-full p-3 ${!isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                >
                  {isVideoOn ? <VideoIcon className='w-5 h-5' /> : <VideoOff className='w-5 h-5' />}
                </Button>

                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleLeaveMeeting}
                  className='rounded-full px-4'
                >
                  <PhoneOff className='w-4 h-4 mr-1' />
                  Leave
                </Button>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleToggleFullscreen}
                  className='rounded-full p-3 bg-gray-600 hover:bg-gray-700 text-white'
                >
                  {isFullscreen ? (
                    <Minimize className='w-5 h-5' />
                  ) : (
                    <Maximize className='w-5 h-5' />
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-blue-600' />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center gap-2 text-sm'>
                <Clock className='w-4 h-4 text-gray-500' />
                <span>{new Date(meeting.startTime).toLocaleString()}</span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <Video className='w-4 h-4 text-gray-500' />
                <span>Duration: {meeting.duration} minutes</span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <Users className='w-4 h-4 text-gray-500' />
                <span>{meeting.participantCount || 0} participants</span>
              </div>
            </CardContent>
          </Card>

          {/* Join/Leave Actions */}
          <Card>
            <CardContent className='pt-6'>
              {!isJoined ? (
                <Button
                  onClick={handleJoinMeeting}
                  className='w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3'
                  size='lg'
                >
                  <Play className='w-5 h-5 mr-2' />
                  Join Live Class
                </Button>
              ) : (
                <div className='space-y-3'>
                  <Button
                    onClick={() => window.open(meeting.joinUrl, '_blank')}
                    className='w-full bg-green-500 hover:bg-green-600 text-white'
                  >
                    <Video className='w-4 h-4 mr-2' />
                    Open in Zoom
                  </Button>

                  <div className='grid grid-cols-2 gap-2'>
                    <Button
                      variant='outline'
                      onClick={handleToggleMute}
                      className={`text-sm ${isMuted ? 'border-red-300 text-red-600' : ''}`}
                    >
                      {isMuted ? <MicOff className='w-4 h-4' /> : <Mic className='w-4 h-4' />}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={handleToggleVideo}
                      className={`text-sm ${!isVideoOn ? 'border-red-300 text-red-600' : ''}`}
                    >
                      {isVideoOn ? (
                        <VideoIcon className='w-4 h-4' />
                      ) : (
                        <VideoOff className='w-4 h-4' />
                      )}
                    </Button>
                  </div>

                  <Button variant='destructive' onClick={handleLeaveMeeting} className='w-full'>
                    <PhoneOff className='w-4 h-4 mr-2' />
                    Leave Class
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat/Participants */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MessageSquare className='w-5 h-5 text-purple-600' />
                Class Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-48 bg-gray-50 rounded-lg p-3 mb-3 flex items-center justify-center'>
                <p className='text-gray-500 text-sm'>Chat feature coming soon...</p>
              </div>
              <Button variant='outline' className='w-full' disabled>
                <MessageSquare className='w-4 h-4 mr-2' />
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveClass;
