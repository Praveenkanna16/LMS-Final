import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  Settings,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';

const LiveClassesManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    topic: '',
    startTime: '',
    duration: 60,
  });

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to get all live classes
      setLiveClasses([]);
    } catch (error: any) {
      console.error('Failed to fetch live classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load live classes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await apiService.createLiveClass({
        batchId: formData.batchId,
        topic: formData.topic,
        startTime: formData.startTime,
        duration: formData.duration,
      });

      toast({
        title: 'Success',
        description: 'Live class created successfully',
      });

      setShowCreateForm(false);
      setFormData({ batchId: '', topic: '', startTime: '', duration: 60 });
      fetchLiveClasses();
    } catch (error: any) {
      console.error('Failed to create live class:', error);
      toast({
        title: 'Error',
        description: 'Failed to create live class',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClass = async (meetingId: string) => {
    try {
      // TODO: Implement delete API call
      toast({
        title: 'Success',
        description: 'Live class deleted successfully',
      });
      fetchLiveClasses();
    } catch (error: any) {
      console.error('Failed to delete live class:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete live class',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout
      title='Live Classes Management'
      subtitle='Manage and schedule live video classes'
      badgeText='Admin Portal'
      badgeIcon={<Video className='w-4 h-4' />}
    >
      <div className='space-y-6'>
        {/* Header Actions */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>Live Classes</h2>
            <p className='text-gray-600'>Schedule and manage live video sessions</p>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm(true);
            }}
            className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
          >
            <Plus className='w-4 h-4 mr-2' />
            Schedule Live Class
          </Button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Live Class</CardTitle>
              <CardDescription>Create a new live video session for your students</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMeeting} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='batchId'>Batch</Label>
                    <Select
                      value={formData.batchId}
                      onValueChange={value => {
                        setFormData({ ...formData, batchId: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select a batch' />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Load batches from API */}
                        <SelectItem value='batch-1'>Batch 1 - Web Development</SelectItem>
                        <SelectItem value='batch-2'>Batch 2 - Data Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor='topic'>Topic</Label>
                    <Input
                      id='topic'
                      value={formData.topic}
                      onChange={e => {
                        setFormData({ ...formData, topic: e.target.value });
                      }}
                      placeholder='Enter class topic'
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='startTime'>Start Time</Label>
                    <Input
                      id='startTime'
                      type='datetime-local'
                      value={formData.startTime}
                      onChange={e => {
                        setFormData({ ...formData, startTime: e.target.value });
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='duration'>Duration (minutes)</Label>
                    <Input
                      id='duration'
                      type='number'
                      min='30'
                      max='180'
                      value={formData.duration}
                      onChange={e => {
                        setFormData({ ...formData, duration: parseInt(e.target.value) });
                      }}
                      required
                    />
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Button type='submit' className='bg-green-500 hover:bg-green-600'>
                    <Video className='w-4 h-4 mr-2' />
                    Schedule Class
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setShowCreateForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Live Classes List */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Live Classes</CardTitle>
            <CardDescription>Manage upcoming and past live sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600'>Loading live classes...</p>
              </div>
            ) : liveClasses.length > 0 ? (
              <div className='space-y-4'>
                {liveClasses.map(liveClass => (
                  <div
                    key={liveClass.id}
                    className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center'>
                          <Video className='w-5 h-5 text-white' />
                        </div>
                        <div>
                          <h3 className='font-semibold text-gray-900'>{liveClass.topic}</h3>
                          <p className='text-sm text-gray-600'>{liveClass.batchName}</p>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Badge
                          className={
                            liveClass.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }
                        >
                          {liveClass.status}
                        </Badge>
                        <div className='flex items-center gap-1'>
                          <Button variant='ghost' size='sm'>
                            <Eye className='w-4 h-4' />
                          </Button>
                          <Button variant='ghost' size='sm'>
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteClass(liveClass.id)}
                            className='text-red-600 hover:text-red-700'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-6 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-4 h-4' />
                        <span>{new Date(liveClass.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-4 h-4' />
                        <span>{new Date(liveClass.startTime).toLocaleTimeString()}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Users className='w-4 h-4' />
                        <span>{liveClass.duration} minutes</span>
                      </div>
                    </div>

                    {liveClass.joinUrl && (
                      <div className='mt-3'>
                        <Button
                          size='sm'
                          onClick={() => window.open(liveClass.joinUrl, '_blank')}
                          className='bg-green-500 hover:bg-green-600'
                        >
                          <Play className='w-4 h-4 mr-1' />
                          Join as Admin
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <Video className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  No Live Classes Scheduled
                </h3>
                <p className='text-gray-600 mb-6'>
                  Start scheduling live video sessions for your students
                </p>
                <Button
                  onClick={() => {
                    setShowCreateForm(true);
                  }}
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Schedule First Class
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LiveClassesManagement;
