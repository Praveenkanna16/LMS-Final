import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Hand } from 'lucide-react';

interface StudentEngagementProps {
  batchId: string;
  socket: Socket;
  userId: string;
  userName: string;
  isTeacher: boolean;
}

interface HandRaise {
  userId: string;
  userName: string;
  timestamp: Date;
}

export const StudentEngagement: React.FC<StudentEngagementProps> = ({
  batchId,
  socket,
  userId,
  userName,
  isTeacher,
}) => {
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<HandRaise[]>([]);
  const [recentReactions, setRecentReactions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    socket.on('hand-raise', handleHandRaiseEvent);
    socket.on('user-reaction', handleReactionEvent);

    return () => {
      socket.off('hand-raise', handleHandRaiseEvent);
      socket.off('user-reaction', handleReactionEvent);
    };
  }, [socket]);

  const handleHandRaiseEvent = (data: any) => {
    if (data.raised) {
      setRaisedHands(prev => [...prev, {
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date(data.timestamp)
      }]);
    } else {
      setRaisedHands(prev => prev.filter(h => h.userId !== data.userId));
    }
  };

  const handleReactionEvent = (data: any) => {
    setRecentReactions(prev => [data.reactionType, ...prev].slice(0, 20));
    setTimeout(() => {
      setRecentReactions(prev => prev.filter(r => r !== data.reactionType));
    }, 3000);
  };

  const toggleHandRaise = () => {
    if (!socket) return;

    const newState = !handRaised;
    setHandRaised(newState);

    socket.emit('raise-hand', {
      batchId,
      userId,
      userName,
      raised: newState
    });

    toast({
      title: newState ? 'Hand Raised' : 'Hand Lowered',
      description: newState ? 'Teacher will call on you soon' : 'Hand lowered'
    });
  };

  const sendReaction = (reactionType: string) => {
    if (!socket) return;

    socket.emit('send-reaction', {
      batchId,
      userId,
      userName,
      reactionType
    });
  };

  const callOnStudent = (studentId: string) => {
    if (!socket || !isTeacher) return;

    socket.emit('call-on-student', {
      batchId,
      studentId
    });

    setRaisedHands(prev => prev.filter(h => h.userId !== studentId));

    toast({
      title: 'Student Called',
      description: 'The student has been notified'
    });
  };

  return (
    <div className='space-y-4'>
      {/* Reaction Buttons */}
      <Card className='p-4'>
        <h4 className='font-medium text-sm mb-3'>Quick Reactions</h4>
        <div className='flex gap-2 flex-wrap'>
          <Button onClick={() => sendReaction('👍')} variant='outline' size='sm'>
            👍
          </Button>
          <Button onClick={() => sendReaction('❤️')} variant='outline' size='sm'>
            ❤️
          </Button>
          <Button onClick={() => sendReaction('👏')} variant='outline' size='sm'>
            👏
          </Button>
          <Button onClick={() => sendReaction('😂')} variant='outline' size='sm'>
            😂
          </Button>
          <Button onClick={() => sendReaction('👎')} variant='outline' size='sm'>
            👎
          </Button>
        </div>
      </Card>

      {/* Raise Hand */}
      {!isTeacher && (
        <Card className='p-4'>
          <Button
            onClick={toggleHandRaise}
            variant={handRaised ? 'default' : 'outline'}
            className='w-full'
          >
            <Hand className='w-4 h-4 mr-2' />
            {handRaised ? 'Lower Hand' : 'Raise Hand'}
          </Button>
        </Card>
      )}

      {/* Raised Hands Queue (Teacher Only) */}
      {isTeacher && raisedHands.length > 0 && (
        <Card className='p-4'>
          <h4 className='font-medium text-sm mb-3'>Raised Hands ({raisedHands.length})</h4>
          <div className='space-y-2'>
            {raisedHands.map((hand) => (
              <div key={hand.userId} className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                <div className='flex items-center gap-2'>
                  <Hand className='w-4 h-4 text-yellow-600' />
                  <span className='text-sm font-medium'>{hand.userName}</span>
                  <span className='text-xs text-gray-500'>
                    {hand.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <Button onClick={() => callOnStudent(hand.userId)} size='sm'>
                  Call On
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Floating Reactions Display */}
      <div className='fixed bottom-32 right-24 pointer-events-none'>
        {recentReactions.map((reaction, i) => (
          <div
            key={i}
            className='text-4xl animate-bounce'
            style={{
              animation: 'float 3s ease-out forwards',
              animationDelay: `${i * 0.1}s`
            }}
          >
            {reaction}
          </div>
        ))}
      </div>
    </div>
  );
};
