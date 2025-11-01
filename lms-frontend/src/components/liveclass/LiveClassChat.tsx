import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Smile,
  Image as ImageIcon,
  X,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'public' | 'teacher-only';
  isGif?: boolean;
}

interface LiveClassChatProps {
  batchId: string;
  socket: Socket;
  userId: string;
  userName: string;
  isTeacher: boolean;
  onClose: () => void;
}

const giphyFetch = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'demo_api_key');

export const LiveClassChat: React.FC<LiveClassChatProps> = ({
  batchId,
  socket,
  userId,
  userName,
  isTeacher,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'teacher'>('public');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', handleIncomingMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);

    return () => {
      socket.off('chat-message', handleIncomingMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleIncomingMessage = (data: any) => {
    const newMessage: Message = {
      id: `${data.userId}-${Date.now()}`,
      userId: data.userId,
      userName: data.userName || 'User',
      message: data.message,
      timestamp: new Date(data.timestamp),
      type: data.type,
      isGif: data.isGif,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleUserTyping = (data: { userId: string; userName: string }) => {
    if (data.userId !== userId) {
      setTypingUsers((prev) => new Set(prev).add(data.userName));
    }
  };

  const handleUserStoppedTyping = (data: { userId: string; userName: string }) => {
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(data.userName);
      return newSet;
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !socket) return;

    const messageData = {
      batchId,
      message: inputMessage,
      type: activeTab === 'teacher' ? 'teacher-only' : 'public',
      userName,
      isGif: false,
    };

    socket.emit('send-message', messageData);
    setInputMessage('');
    setShowEmojiPicker(false);

    const newMessage: Message = {
      id: `${userId}-${Date.now()}`,
      userId,
      userName: 'You',
      message: inputMessage,
      timestamp: new Date(),
      type: activeTab,
    };
    setMessages((prev) => [...prev, newMessage]);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          batchId,
          message: inputMessage,
          type: activeTab,
        }),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const sendGif = (gifUrl: string) => {
    if (!socket) return;

    const messageData = {
      batchId,
      message: gifUrl,
      type: activeTab === 'teacher' ? 'teacher-only' : 'public',
      userName,
      isGif: true,
    };

    socket.emit('send-message', messageData);
    setShowGiphyPicker(false);

    const newMessage: Message = {
      id: `${userId}-${Date.now()}`,
      userId,
      userName: 'You',
      message: gifUrl,
      timestamp: new Date(),
      type: activeTab,
      isGif: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (socket) {
      socket.emit('user-typing', { batchId, userId, userName });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('user-stopped-typing', { batchId, userId, userName });
      }, 2000);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!isTeacher) return;

    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    socket.emit('delete-message', { batchId, messageId });

    toast({
      title: 'Message Deleted',
      description: 'The message has been removed.',
    });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchGifs = (offset: number) => giphyFetch.trending({ offset, limit: 10 });

  const filteredMessages = messages.filter((msg) =>
    activeTab === 'public' ? msg.type === 'public' : msg.type === 'teacher-only'
  );

  return (
    <Card className='fixed right-4 top-20 bottom-20 w-96 z-50 flex flex-col shadow-2xl'>
      <CardHeader className='flex flex-row items-center justify-between border-b p-4 bg-gray-50'>
        <div className='flex items-center gap-2'>
          <Users className='w-5 h-5 text-blue-600' />
          <h3 className='font-semibold text-lg'>Chat</h3>
        </div>
        <Button onClick={onClose} variant='ghost' size='sm'>
          <X className='w-4 h-4' />
        </Button>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'public' | 'teacher')} className='flex-1 flex flex-col'>
        <TabsList className='w-full grid grid-cols-2 mx-4 mt-2'>
          <TabsTrigger value='public' className='flex items-center gap-2'>
            <Users className='w-4 h-4' />
            Public
          </TabsTrigger>
          <TabsTrigger value='teacher' disabled={!isTeacher} className='flex items-center gap-2'>
            <User className='w-4 h-4' />
            Teachers Only
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='flex-1 flex flex-col mt-0'>
          <ScrollArea className='flex-1 p-4' ref={scrollRef}>
            <div className='space-y-3'>
              {filteredMessages.length === 0 ? (
                <div className='text-center text-gray-400 py-8'>
                  <Users className='w-12 h-12 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.userName === 'You' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className='w-8 h-8'>
                      <AvatarFallback className='text-xs'>
                        {msg.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${msg.userName === 'You' ? 'text-right' : ''}`}>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='text-xs font-medium text-gray-700'>{msg.userName}</span>
                        <span className='text-xs text-gray-400'>
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={`inline-block rounded-lg px-3 py-2 max-w-[250px] ${
                          msg.userName === 'You'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {msg.isGif ? (
                          <img
                            src={msg.message}
                            alt='GIF'
                            className='rounded max-w-full'
                          />
                        ) : (
                          <p className='text-sm break-words'>{msg.message}</p>
                        )}
                      </div>
                      {isTeacher && msg.userName !== 'You' && (
                        <Button
                          onClick={() => deleteMessage(msg.id)}
                          variant='ghost'
                          size='sm'
                          className='mt-1 h-6 text-xs text-red-600'
                        >
                          <Trash2 className='w-3 h-3 mr-1' />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {typingUsers.size > 0 && (
              <div className='text-xs text-gray-500 italic mt-2'>
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </ScrollArea>

          <CardContent className='p-4 border-t'>
            {showEmojiPicker && (
              <div className='absolute bottom-20 right-4 z-50'>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}

            {showGiphyPicker && (
              <div className='absolute bottom-20 right-4 w-80 h-96 bg-white border rounded-lg shadow-xl z-50 overflow-hidden'>
                <div className='flex items-center justify-between p-2 border-b'>
                  <h4 className='font-medium text-sm'>Select a GIF</h4>
                  <Button onClick={() => setShowGiphyPicker(false)} variant='ghost' size='sm'>
                    <X className='w-4 h-4' />
                  </Button>
                </div>
                <div className='overflow-y-auto h-[calc(100%-40px)]'>
                  <Grid
                    width={320}
                    columns={2}
                    fetchGifs={fetchGifs}
                    onGifClick={(gif, e) => {
                      e.preventDefault();
                      sendGif(gif.images.fixed_height.url);
                    }}
                  />
                </div>
              </div>
            )}

            <div className='flex gap-2'>
              <Button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGiphyPicker(false);
                }}
                variant='outline'
                size='sm'
              >
                <Smile className='w-4 h-4' />
              </Button>
              <Button
                onClick={() => {
                  setShowGiphyPicker(!showGiphyPicker);
                  setShowEmojiPicker(false);
                }}
                variant='outline'
                size='sm'
              >
                <ImageIcon className='w-4 h-4' />
              </Button>
              <Input
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder='Type a message...'
                className='flex-1'
              />
              <Button onClick={sendMessage} size='sm'>
                <Send className='w-4 h-4' />
              </Button>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
