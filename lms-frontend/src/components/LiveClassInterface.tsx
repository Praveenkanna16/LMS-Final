import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Hand,
  MessageCircle,
  Users,
  Settings as _Settings,
  Circle as RecordIcon,
  Square,
  Phone as _Phone,
  PhoneOff,
  Palette,
  Eraser,
  Type,
  Circle,
  Minus,
  MoreHorizontal as _MoreHorizontal,
  Send,
  Smile as _Smile,
  ThumbsUp,
  Heart,
  Activity as ClappingIcon,
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isVideoOn: boolean;
  isAudioOn: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system';
}

interface LiveClassInterfaceProps {
  sessionId: string;
  userRole: 'teacher' | 'student';
  onLeaveClass: () => void;
}

const LiveClassInterface: React.FC<LiveClassInterfaceProps> = ({
  sessionId: _sessionId,
  userRole,
  onLeaveClass,
}) => {
  const [participants, _setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState<
    'pen' | 'eraser' | 'text' | 'circle' | 'line'
  >('pen');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);

  const whiteboardRef = useRef<HTMLCanvasElement>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video controls
  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // TODO: Implement actual video toggle with WebRTC
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    // TODO: Implement actual audio toggle with WebRTC
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // TODO: Implement screen sharing with WebRTC
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement recording functionality
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    // TODO: Send hand raise status to other participants
  };

  // Handle chat
  const sendMessage = () => {
    if (newMessage.trim()) {
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: 'current-user',
        userName: 'You',
        message: newMessage,
        timestamp: new Date(),
        type: 'message',
      };
      setChatMessages((prev) => [...prev, chatMessage]);
      setNewMessage('');
      // TODO: Send message to other participants via WebSocket
    }
  };

  const addReaction = (_type: 'thumbs' | 'heart' | 'clap') => {
    // TODO: Implement reaction system
  };

  // Whiteboard functions
  const handleWhiteboardDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // TODO: Implement whiteboard drawing functionality
    const canvas = whiteboardRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const _x = e.clientX - rect.left;
    const _y = e.clientY - rect.top;

    // Drawing logic here
  };

  return (
    <div className='h-screen bg-gray-900 flex flex-col'>
      {/* Header with session info and controls */}
      <div className='bg-gray-800 p-2 sm:p-4 flex items-center justify-between border-b border-gray-700'>
        <div className='flex items-center space-x-2 sm:space-x-4'>
          <div className='flex items-center space-x-1 sm:space-x-2'>
            <div className='w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse'></div>
            <span className='text-white font-medium text-sm sm:text-base'>
              Live
            </span>
          </div>
          <Badge
            variant='outline'
            className='text-green-400 border-green-400 text-xs sm:text-sm px-1 sm:px-2'
          >
            {formatDuration(sessionDuration)}
          </Badge>
          <Badge
            variant='outline'
            className='text-blue-400 border-blue-400 text-xs sm:text-sm px-1 sm:px-2 hidden sm:inline-flex'
          >
            {participants.length} Participants
          </Badge>
          <Badge
            variant='outline'
            className='text-blue-400 border-blue-400 text-xs px-1 sm:hidden'
          >
            {participants.length}
          </Badge>
        </div>

        <div className='flex items-center space-x-1 sm:space-x-2'>
          {userRole === 'teacher' && (
            <>
              <Button
                size='sm'
                variant={isRecording ? 'destructive' : 'outline'}
                onClick={toggleRecording}
                className='px-2 sm:px-3'
              >
                {isRecording ? (
                  <Square className='w-3 h-3 sm:w-4 sm:h-4' />
                ) : (
                  <RecordIcon className='w-3 h-3 sm:w-4 sm:h-4' />
                )}
                <span className='hidden sm:inline ml-1 sm:ml-2'>
                  {isRecording ? 'Stop' : 'Record'}
                </span>
              </Button>
            </>
          )}
          <Button
            size='sm'
            variant='outline'
            onClick={onLeaveClass}
            className='px-2 sm:px-3'
          >
            <PhoneOff className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline ml-1 sm:ml-2'>Leave</span>
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className='flex-1 flex flex-col lg:flex-row'>
        {/* Left sidebar - Participants (Mobile: Collapsible) */}
        {showParticipants && (
          <div className='bg-gray-800 border-b lg:border-r border-gray-700 lg:border-b-0 w-full lg:w-64 max-h-32 lg:max-h-none overflow-hidden lg:overflow-visible'>
            <div className='p-2 lg:p-4 border-b border-gray-700'>
              <h3 className='text-white font-medium flex items-center text-sm lg:text-base'>
                <Users className='w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2' />
                Participants ({participants.length})
              </h3>
            </div>
            <ScrollArea className='h-24 lg:h-full'>
              <div className='p-1 lg:p-2 space-y-1 lg:space-y-2'>
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className='flex items-center justify-between p-2 lg:p-3 bg-gray-700 rounded-lg'
                  >
                    <div className='flex items-center space-x-1 lg:space-x-2'>
                      <div
                        className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${
                          participant.role === 'teacher'
                            ? 'bg-yellow-400'
                            : 'bg-blue-400'
                        }`}
                      ></div>
                      <span className='text-white text-xs lg:text-sm truncate max-w-20 lg:max-w-none'>
                        {participant.name}
                      </span>
                      {participant.role === 'teacher' && (
                        <Badge
                          variant='outline'
                          className='text-xs hidden lg:inline-flex'
                        >
                          Teacher
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center space-x-0.5 lg:space-x-1'>
                      {participant.isHandRaised && (
                        <Hand className='w-3 h-3 lg:w-4 lg:h-4 text-yellow-400' />
                      )}
                      {!participant.isVideoOn && (
                        <VideoOff className='w-3 h-3 lg:w-4 lg:h-4 text-red-400' />
                      )}
                      {!participant.isAudioOn && (
                        <MicOff className='w-3 h-3 lg:w-4 lg:h-4 text-red-400' />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Center area - Video grid and whiteboard */}
        <div className='flex-1 flex flex-col'>
          {/* Video Grid */}
          <div className='flex-1'>
            <div
              ref={videoGridRef}
              className='h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-4'
            >
              {/* Main video (teacher or screen share) */}
              <div className='col-span-1 sm:col-span-2 lg:col-span-2 bg-gray-800 rounded-lg relative overflow-hidden min-h-[200px] sm:min-h-[300px]'>
                {isScreenSharing ? (
                  <div className='w-full h-full bg-gray-700 flex items-center justify-center'>
                    <div className='text-center text-white'>
                      <Monitor className='w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2' />
                      <p className='text-sm sm:text-base'>Screen Share Active</p>
                    </div>
                  </div>
                ) : (
                  <div className='w-full h-full bg-gray-700 flex items-center justify-center'>
                    <div className='text-center text-white'>
                      <Video className='w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2' />
                      <p className='text-sm sm:text-base'>Main Video</p>
                    </div>
                  </div>
                )}
                <div className='absolute bottom-2 left-2'>
                  <Badge className='bg-black/50 text-xs'>Teacher</Badge>
                </div>
              </div>

              {/* Participant videos */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className='bg-gray-800 rounded-lg relative overflow-hidden min-h-[80px] sm:min-h-[120px]'
                >
                  <div className='w-full h-full bg-gray-700 flex items-center justify-center'>
                    <div className='text-center text-white'>
                      <div className='w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full mx-auto mb-1 flex items-center justify-center'>
                        <span className='text-xs'>S{i}</span>
                      </div>
                      <p className='text-xs'>Student {i}</p>
                    </div>
                  </div>
                  <div className='absolute bottom-1 left-1'>
                    <div className='flex space-x-1'>
                      <MicOff className='w-2 h-2 sm:w-3 sm:h-3 text-red-400' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Whiteboard Area - Mobile optimized */}
          <div className='h-32 sm:h-48 lg:h-64 bg-white border-t border-gray-700 relative'>
            <div className='absolute top-1 left-1 sm:top-2 sm:left-2 flex items-center space-x-1 bg-gray-800 rounded-lg p-1 sm:p-2 z-10'>
              <Button
                size='sm'
                variant={whiteboardTool === 'pen' ? 'default' : 'ghost'}
                onClick={() => {
                  setWhiteboardTool('pen');
                }}
                className='p-1 h-6 w-6 sm:h-8 sm:w-8'
              >
                <Palette className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
              <Button
                size='sm'
                variant={whiteboardTool === 'eraser' ? 'default' : 'ghost'}
                onClick={() => {
                  setWhiteboardTool('eraser');
                }}
                className='p-1 h-6 w-6 sm:h-8 sm:w-8'
              >
                <Eraser className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
              <Button
                size='sm'
                variant={whiteboardTool === 'text' ? 'default' : 'ghost'}
                onClick={() => {
                  setWhiteboardTool('text');
                }}
                className='p-1 h-6 w-6 sm:h-8 sm:w-8 hidden sm:flex'
              >
                <Type className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
              <Button
                size='sm'
                variant={whiteboardTool === 'circle' ? 'default' : 'ghost'}
                onClick={() => {
                  setWhiteboardTool('circle');
                }}
                className='p-1 h-6 w-6 sm:h-8 sm:w-8 hidden sm:flex'
              >
                <Circle className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
              <Button
                size='sm'
                variant={whiteboardTool === 'line' ? 'default' : 'ghost'}
                onClick={() => {
                  setWhiteboardTool('line');
                }}
                className='p-1 h-6 w-6 sm:h-8 sm:w-8 hidden sm:flex'
              >
                <Minus className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
            </div>
            <canvas
              ref={whiteboardRef}
              className='w-full h-full cursor-crosshair touch-none'
              onMouseDown={handleWhiteboardDraw}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = whiteboardRef.current?.getBoundingClientRect();
                if (rect) {
                  const _x = touch.clientX - rect.left;
                  const _y = touch.clientY - rect.top;
                  // Handle touch drawing
                }
              }}
              width={window.innerWidth}
              height={window.innerHeight * 0.2}
            />
          </div>

          {/* Controls - Mobile optimized */}
          <div className='bg-gray-800 p-2 sm:p-4 flex items-center justify-center space-x-2 sm:space-x-4 border-t border-gray-700'>
            <Button
              size='sm'
              variant={isVideoOn ? 'default' : 'destructive'}
              onClick={toggleVideo}
              className='flex-shrink-0 h-10 w-10 sm:h-auto sm:w-auto p-2 sm:px-3'
            >
              {isVideoOn ? (
                <Video className='w-4 h-4' />
              ) : (
                <VideoOff className='w-4 h-4' />
              )}
            </Button>
            <Button
              size='sm'
              variant={isAudioOn ? 'default' : 'destructive'}
              onClick={toggleAudio}
              className='flex-shrink-0 h-10 w-10 sm:h-auto sm:w-auto p-2 sm:px-3'
            >
              {isAudioOn ? (
                <Mic className='w-4 h-4' />
              ) : (
                <MicOff className='w-4 h-4' />
              )}
            </Button>
            {userRole === 'teacher' && (
              <Button
                size='sm'
                variant={isScreenSharing ? 'default' : 'outline'}
                onClick={toggleScreenShare}
                className='flex-shrink-0 h-10 w-10 sm:h-auto sm:w-auto p-2 sm:px-3'
              >
                {isScreenSharing ? (
                  <MonitorOff className='w-4 h-4' />
                ) : (
                  <Monitor className='w-4 h-4' />
                )}
              </Button>
            )}
            {userRole === 'student' && (
              <Button
                size='sm'
                variant={isHandRaised ? 'default' : 'outline'}
                onClick={toggleHandRaise}
                className='flex-shrink-0 h-10 w-10 sm:h-auto sm:w-auto p-2 sm:px-3'
              >
                <Hand className='w-4 h-4' />
              </Button>
            )}

            {/* Reaction buttons - Hide some on mobile */}
            <div className='flex space-x-1 sm:space-x-2'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  addReaction('thumbs');
                }}
                className='flex-shrink-0 h-8 w-8 sm:h-auto sm:w-auto p-1 sm:p-2'
              >
                <ThumbsUp className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  addReaction('heart');
                }}
                className='flex-shrink-0 h-8 w-8 sm:h-auto sm:w-auto p-1 sm:p-2 hidden sm:flex'
              >
                <Heart className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  addReaction('clap');
                }}
                className='flex-shrink-0 h-8 w-8 sm:h-auto sm:w-auto p-1 sm:p-2 hidden sm:flex'
              >
                <ClappingIcon className='w-3 h-3 sm:w-4 sm:h-4' />
              </Button>
            </div>

            {/* Mobile toggle buttons for sidebars */}
            <div className='flex space-x-1 sm:hidden ml-auto'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setShowParticipants(!showParticipants);
                }}
                className='h-8 w-8 p-1'
              >
                <Users className='w-4 h-4' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setShowChat(!showChat);
                }}
                className='h-8 w-8 p-1'
              >
                <MessageCircle className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Right sidebar - Chat (Mobile: Full screen overlay) */}
        {showChat && (
          <div className='fixed inset-0 z-50 bg-gray-800 lg:relative lg:inset-auto lg:z-auto lg:w-80 lg:border-l border-gray-700 flex flex-col'>
            {/* Mobile header with close button */}
            <div className='p-2 sm:p-4 border-b border-gray-700 flex items-center justify-between lg:justify-start'>
              <h3 className='text-white font-medium flex items-center text-sm sm:text-base'>
                <MessageCircle className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                Live Chat
              </h3>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setShowChat(false);
                }}
                className='lg:hidden p-1 h-8 w-8'
              >
                ×
              </Button>
            </div>

            <ScrollArea className='flex-1 p-2 sm:p-4' ref={chatRef}>
              <div className='space-y-2 sm:space-y-3'>
                {chatMessages.map((message) => (
                  <div key={message.id} className='flex flex-col space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs text-gray-400 truncate'>
                        {message.userName}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className='bg-gray-700 rounded-lg p-2'>
                      <p className='text-white text-sm break-words'>
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className='p-2 sm:p-4 border-t border-gray-700'>
              <div className='flex space-x-2'>
                <Input
                  placeholder='Type a message...'
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  className='bg-gray-700 border-gray-600 text-white text-sm'
                />
                <Button
                  size='sm'
                  onClick={sendMessage}
                  className='flex-shrink-0 p-2'
                >
                  <Send className='w-3 h-3 sm:w-4 sm:h-4' />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassInterface;
