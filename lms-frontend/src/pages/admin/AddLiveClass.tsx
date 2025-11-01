import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Video,
  Save,
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';

interface ErrorWithMessage {
  message?: string;
}

interface Batch {
  id: string | number;
  name: string;
  subject?: string;
  grade?: string;
  courseId?: string | number;
  isActive?: boolean;
  teacher?: {
    id: string | number;
    name: string;
    email: string;
  };
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface LiveClassFormData {
  title: string;
  description: string;
  batchId: string;
  teacherId: string;
  startTime: string;
  duration: string;
  zoomLink: string;
  isRecorded: boolean;
}

const AddLiveClass: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<LiveClassFormData>({
    title: '',
    description: '',
    batchId: '',
    teacherId: '',
    startTime: '',
    duration: '60',
    zoomLink: '',
    isRecorded: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [batchesRes, usersRes] = await Promise.all([
        apiService.getAllBatches(),
        apiService.getAllUsers(),
      ]);

      // Extract batches from nested response structure
      const batchesData = 'data' in batchesRes ? batchesRes.data : batchesRes;
      const batchesList = 'batches' in batchesData ? batchesData.batches : 
                         Array.isArray(batchesData) ? batchesData : [];
      // Filter only active batches for live class creation
      const activeBatches = batchesList.filter((batch: any) => batch?.isActive !== false);
      setBatches(activeBatches as Batch[]);

      const usersData = 'data' in usersRes ? usersRes.data : usersRes;
      const usersList = Array.isArray(usersData) ? usersData : [];
      const teachersList = usersList.filter((user: { role: string }) => user.role === 'teacher');
      setTeachers(teachersList as Teacher[]);
    } catch (error) {
      const errorWithMessage = error as ErrorWithMessage;
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: errorWithMessage.message ?? 'Failed to load batches and teachers',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.batchId || !formData.startTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    void (async () => {
      try {
        setLoading(true);

        const submitData = {
          title: formData.title,
          description: formData.description,
          batchId: formData.batchId,
          startTime: new Date(formData.startTime).toISOString(),
          duration: parseInt(formData.duration),
          isRecorded: formData.isRecorded,
          zoomLink: formData.zoomLink || undefined, // Send Google Meet link
        };

        await apiService.createLiveSession(submitData);

        toast({
          title: 'Success',
          description: 'Live class scheduled successfully!',
        });

        navigate('/admin/live-classes');
      } catch (error) {
        console.error('Error scheduling live class:', error);
        toast({
          title: 'Error',
          description: 'Failed to schedule live class. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loadingData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Data
            </h2>
            <p className='text-gray-600'>Fetching batches and teachers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
          <Video className='w-8 h-8 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <Button
              variant='outline'
              onClick={() => {
                navigate('/admin/live-classes');
              }}
              className='mb-6 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Live Classes
            </Button>

            <div className='flex items-center gap-4 mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                <Video className='w-10 h-10 text-white' />
              </div>
              <div>
                <Badge className='mb-2 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white border-0 px-4 py-2 font-semibold'>
                  <Video className='w-4 h-4 mr-2' />
                  Live Class Scheduling
                </Badge>
                <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                  Schedule Live Class
                </h1>
                <p className='text-xl text-gray-600 mt-2'>Create a new live session for students</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <FileText className='h-6 w-6 text-red-600' />
                  Basic Information
                </CardTitle>
                <CardDescription>Core details about the live class</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='title'
                    className='text-gray-900 font-semibold flex items-center gap-2'
                  >
                    <Video className='w-4 h-4 text-red-600' />
                    Class Title *
                  </Label>
                  <Input
                    id='title'
                    name='title'
                    placeholder='e.g., Python Basics - Introduction to Programming'
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description' className='text-gray-900 font-semibold'>
                    Description
                  </Label>
                  <Textarea
                    id='description'
                    name='description'
                    placeholder='What will be covered in this session...'
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='batchId'
                      className='text-gray-900 font-semibold flex items-center gap-2'
                    >
                      <Users className='w-4 h-4 text-blue-600' />
                      Batch *
                    </Label>
                    <Select
                      name='batchId'
                      value={formData.batchId}
                      onValueChange={value => {
                        handleSelectChange('batchId', value);
                      }}
                    >
                      <SelectTrigger className='border-2 border-gray-200 bg-white focus:border-blue-500'>
                        <SelectValue placeholder='Select batch' className='text-gray-500' />
                      </SelectTrigger>
                      <SelectContent className='max-h-64 overflow-y-auto'>
                        {batches.length === 0 ? (
                          <div className='p-4 text-center text-gray-500'>
                            No active batches available. Please create a batch first.
                          </div>
                        ) : (
                          batches.map(batch => (
                            <SelectItem key={batch.id} value={String(batch.id)}>
                              {batch.name} {batch.subject ? `- ${batch.subject}` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {batches.length === 0 && (
                      <p className='text-xs text-red-500'>
                        No batches found. Go to Batches page to create one.
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='teacherId' className='text-gray-900 font-semibold'>
                      Teacher (Optional)
                    </Label>
                    <Select
                      name='teacherId'
                      value={formData.teacherId}
                      onValueChange={value => {
                        handleSelectChange('teacherId', value);
                      }}
                    >
                      <SelectTrigger className='border-2 border-gray-200 bg-white focus:border-blue-500'>
                        <SelectValue placeholder='Auto-assign from batch' className='text-gray-500' />
                      </SelectTrigger>
                      <SelectContent className='max-h-64 overflow-y-auto'>
                        {teachers.length === 0 ? (
                          <div className='p-4 text-center text-gray-500'>
                            No teachers available
                          </div>
                        ) : (
                          teachers.map(teacher => (
                            <SelectItem key={teacher._id} value={teacher._id}>
                              {teacher.name} ({teacher.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {teachers.length > 0 && (
                      <p className='text-xs text-gray-500'>
                        Leave empty to use the batch's assigned teacher
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Settings */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <Calendar className='h-6 w-6 text-purple-600' />
                  Schedule & Settings
                </CardTitle>
                <CardDescription>Set date, time, and duration</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='startTime'
                      className='text-gray-900 font-semibold flex items-center gap-2'
                    >
                      <Calendar className='w-4 h-4 text-purple-600' />
                      Start Date & Time *
                    </Label>
                    <Input
                      id='startTime'
                      name='startTime'
                      type='datetime-local'
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='duration'
                      className='text-gray-900 font-semibold flex items-center gap-2'
                    >
                      <Clock className='w-4 h-4 text-blue-600' />
                      Duration (minutes)
                    </Label>
                    <Input
                      id='duration'
                      name='duration'
                      type='number'
                      placeholder='e.g., 60'
                      value={formData.duration}
                      onChange={handleInputChange}
                      min='15'
                      step='15'
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='zoomLink'
                    className='text-gray-900 font-semibold flex items-center gap-2'
                  >
                    <LinkIcon className='w-4 h-4 text-green-600' />
                    Google Meet Link (Optional)
                  </Label>
                  <Input
                    id='zoomLink'
                    name='zoomLink'
                    type='url'
                    placeholder='https://meet.google.com/...'
                    value={formData.zoomLink}
                    onChange={handleInputChange}
                    className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                  />
                  <p className='text-xs text-gray-500'>
                    Paste your Google Meet link here. Students will use this link to join the class.
                  </p>
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='isRecorded'
                    checked={formData.isRecorded}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, isRecorded: e.target.checked }));
                    }}
                    className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <Label htmlFor='isRecorded' className='text-gray-900 font-medium cursor-pointer'>
                    Record this session
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <AlertCircle className='w-4 h-4' />
                    <span>* Required fields</span>
                  </div>
                  <div className='flex gap-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        navigate('/admin/live-classes');
                      }}
                      className='border-2 border-gray-300 hover:border-red-500 hover:bg-red-50'
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={loading}
                      className='bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-xl'
                    >
                      {loading ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Save className='w-4 h-4 mr-2' />
                          Schedule Class
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLiveClass;
