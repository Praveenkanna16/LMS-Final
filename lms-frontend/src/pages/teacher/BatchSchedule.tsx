import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Plus, Edit, Trash2, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface Session {
  _id: string;
  topic: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  duration: number;
  type: string;
  status: string;
  attendance?: unknown[];
  recording?: string | null;
}

const BatchSchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    duration: 60,
    type: 'live',
  });

  useEffect(() => {
    void fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiService.getBatchSchedule(id);
      const scheduleData = response.data.schedule || [];
      setSessions(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (session?: Session) => {
    if (session) {
      setIsEditing(true);
      setCurrentSession(session);
      setFormData({
        topic: session.topic,
        description: session.description,
        startTime: session.startTime.substring(0, 16),
        endTime: session.endTime.substring(0, 16),
        meetingLink: session.meetingLink,
        duration: session.duration,
        type: session.type,
      });
    } else {
      setIsEditing(false);
      setCurrentSession(null);
      setFormData({
        topic: '',
        description: '',
        startTime: '',
        endTime: '',
        meetingLink: '',
        duration: 60,
        type: 'live',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentSession(null);
  };

  const handleSubmit = async () => {
    if (!id || !formData.topic || !formData.startTime || !formData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing && currentSession) {
        await apiService.updateScheduleSession(id, currentSession._id, formData);
        toast({
          title: 'Success',
          description: 'Session updated successfully',
        });
      } else {
        await apiService.addScheduleSession(id, formData);
        toast({
          title: 'Success',
          description: 'Session added successfully',
        });
      }
      await fetchSchedule();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: 'Error',
        description: 'Failed to save session',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!id || !confirm('Are you sure you want to delete this session?')) return;

    try {
      await apiService.deleteScheduleSession(id, sessionId);
      toast({
        title: 'Success',
        description: 'Session deleted successfully',
      });
      await fetchSchedule();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'ongoing':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <Button
          variant='outline'
          onClick={() => navigate(`/teacher/batches/${id}/manage`)}
          className='mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Batch Management
        </Button>

        <div className='bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-700 rounded-2xl p-8 text-white shadow-2xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Schedule Management</h1>
              <p className='text-blue-100 text-lg'>Create and manage class schedules</p>
            </div>
            <Calendar className='w-16 h-16 opacity-50' />
          </div>
        </div>
      </div>

      <Card className='border-0 shadow-xl bg-white'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-blue-600'>Class Schedules</CardTitle>
              <CardDescription>Manage your batch schedule and class timings</CardDescription>
            </div>
            <Button
              className='bg-gradient-to-r from-blue-600 to-cyan-600'
              onClick={() => handleOpenDialog()}
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-12'>
              <p className='text-gray-500'>Loading schedule...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className='text-center py-12'>
              <Clock className='w-16 h-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-lg font-semibold mb-2'>No Scheduled Sessions</h3>
              <p className='text-gray-600 mb-4'>Get started by adding your first class session</p>
              <Button onClick={() => handleOpenDialog()} variant='outline'>
                <Plus className='h-4 w-4 mr-2' />
                Add First Session
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              {sessions.map((session) => (
                <Card key={session._id} className='border border-gray-200'>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Video className='h-5 w-5 text-blue-600' />
                          <h3 className='font-semibold text-lg'>{session.topic}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        {session.description && (
                          <p className='text-gray-600 text-sm mb-3'>{session.description}</p>
                        )}
                        <div className='flex flex-wrap gap-4 text-sm text-gray-500'>
                          <div className='flex items-center gap-1'>
                            <Calendar className='h-4 w-4' />
                            <span>{formatDateTime(session.startTime)}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            <span>{session.duration} minutes</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <span className='font-medium'>Type:</span>
                            <span className='capitalize'>{session.type}</span>
                          </div>
                        </div>
                        {session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-2'
                          >
                            <ExternalLink className='h-4 w-4' />
                            Join Meeting
                          </a>
                        )}
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleOpenDialog(session)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDelete(session._id)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Session' : 'Add New Session'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the session details' : 'Create a new class session'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='topic'>Topic *</Label>
              <Input
                id='topic'
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder='Enter session topic'
              />
            </div>
            <div>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Enter session description'
                rows={3}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='startTime'>Start Time *</Label>
                <Input
                  id='startTime'
                  type='datetime-local'
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='endTime'>End Time *</Label>
                <Input
                  id='endTime'
                  type='datetime-local'
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='duration'>Duration (minutes)</Label>
                <Input
                  id='duration'
                  type='number'
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  min='15'
                  step='15'
                />
              </div>
              <div>
                <Label htmlFor='type'>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='live'>Live Class</SelectItem>
                    <SelectItem value='recorded'>Recorded</SelectItem>
                    <SelectItem value='webinar'>Webinar</SelectItem>
                    <SelectItem value='workshop'>Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor='meetingLink'>Meeting Link</Label>
              <Input
                id='meetingLink'
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                placeholder='https://zoom.us/j/...'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Update Session' : 'Add Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchSchedule;
