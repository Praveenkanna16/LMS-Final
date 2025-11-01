import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, MapPin, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: number;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  isCurrent: boolean;
}

export const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sessions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to terminate session');

      toast.success('Session terminated successfully');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const terminateAllOthers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sessions/terminate-all`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to terminate sessions');

      toast.success('All other sessions terminated');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to terminate sessions');
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className='h-5 w-5' />;
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return <Tablet className='h-5 w-5' />;
    }
    return <Monitor className='h-5 w-5' />;
  };

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div className='container mx-auto p-6'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Active Sessions</CardTitle>
          {sessions.filter(s => !s.isCurrent).length > 0 && (
            <Button
              variant='destructive'
              size='sm'
              onClick={terminateAllOthers}
            >
              <X className='h-4 w-4 mr-2' />
              Terminate All Others
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          {sessions.length === 0 ? (
            <div className='text-center p-8 text-muted-foreground'>
              No active sessions
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className='border rounded-lg p-4 space-y-3'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-3'>
                    {getDeviceIcon(session.deviceInfo)}
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <h3 className='font-semibold'>
                          {session.deviceInfo.includes('Chrome') ? 'Chrome Browser' :
                           session.deviceInfo.includes('Firefox') ? 'Firefox Browser' :
                           session.deviceInfo.includes('Safari') ? 'Safari Browser' :
                           'Unknown Device'}
                        </h3>
                        {session.isCurrent && (
                          <Badge variant='default'>Current Session</Badge>
                        )}
                      </div>
                      
                      <div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <MapPin className='h-3 w-3' />
                          {session.ipAddress}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          Last active: {new Date(session.lastActivity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => terminateSession(session.id)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
