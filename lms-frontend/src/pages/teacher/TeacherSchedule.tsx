import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Play,
  Sparkles,
  BookOpen,
  FileText,
  PlayCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';
import { useToast } from '@/hooks/use-toast';
import { sessionManager } from '@/lib/sessionManager';

interface ScheduleItem {
  id: string;
  batchId: string;
  batchName: string;
  courseTitle: string;
  topic: string;
  startTime: string;
  endTime: string;
  duration: number;
  studentsCount: number;
  type?: 'live_class' | 'lab_session' | 'review_session';
  status?: 'upcoming' | 'ongoing' | 'completed';
  description?: string;
  zoomLink?: string;
}

const TeacherSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = sessionManager.getUser();

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    batchId: '',
    startTime: '',
    endTime: '',
    topic: '',
    description: '',
    meetingType: 'zoom',
    meetingLink: '',
  });

  // Get session status
  const getSessionStatus = (startTime: string, endTime: string): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'completed';
  };

  // Fetch schedules and batches
  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [schedulesRes, batchesRes] = await Promise.all([
          apiService.getLiveClasses({ teacherId: user._id, limit: 100 }),
          apiService.getMyTeacherBatches(),
        ]);

        if (schedulesRes?.success && schedulesRes.data?.liveClasses) {
          const liveClasses = schedulesRes.data.liveClasses.map((item: any) => ({
            id: item.id || item._id,
            batchId: item.batchId,
            batchName: item.batchName || 'Class',
            courseTitle: item.courseTitle || 'Course',
            topic: item.title || item.topic || 'Session',
            startTime: item.startTime,
            endTime: new Date(new Date(item.startTime).getTime() + (item.duration || 60) * 60000).toISOString(),
            duration: item.duration || 60,
            studentsCount: item.studentsCount || 0,
            type: 'live_class' as const,
            status: getSessionStatus(item.startTime, new Date(new Date(item.startTime).getTime() + (item.duration || 60) * 60000).toISOString()),
            description: item.description || '',
            zoomLink: item.zoomLink || item.meetingLink || '',
          }));
          setSchedules(liveClasses);
        }

        if (batchesRes?.success) {
          setBatches(batchesRes.data || []);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load schedule data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id, toast]);

  // Socket for real-time updates
  useEffect(() => {
    if (user?._id) {
      const token = localStorage.getItem('genzed_token') || '';
      socketService.connect(user._id.toString(), token);

      const handleScheduleCreated = () => {
        // Refetch all schedules
        const fetchUpdates = async () => {
          try {
            const res = await apiService.getLiveClasses({ teacherId: user._id, limit: 100 });
            if (res?.success && res.data?.liveClasses) {
              const updated = res.data.liveClasses.map((item: any) => ({
                id: item.id || item._id,
                batchId: item.batchId,
                batchName: item.batchName || 'Class',
                courseTitle: item.courseTitle || 'Course',
                topic: item.title || item.topic || 'Session',
                startTime: item.startTime,
                endTime: new Date(new Date(item.startTime).getTime() + (item.duration || 60) * 60000).toISOString(),
                duration: item.duration || 60,
                studentsCount: item.studentsCount || 0,
                type: 'live_class' as const,
                status: getSessionStatus(item.startTime, new Date(new Date(item.startTime).getTime() + (item.duration || 60) * 60000).toISOString()),
                description: item.description || '',
                zoomLink: item.zoomLink || item.meetingLink || '',
              }));
              setSchedules(updated);
            }
            toast({
              title: 'Updated',
              description: 'Schedule refreshed',
            });
          } catch (error) {
            console.error('Failed to refresh schedules:', error);
          }
        };
        void fetchUpdates();
      };

      socketService.on('batch-notification', handleScheduleCreated);
      socketService.on('schedule-created', handleScheduleCreated);

      // Join all teacher's batches
      batches.forEach(batch => {
        if (batch._id || batch.id) {
          socketService.joinBatch(batch._id || batch.id);
        }
      });

      return () => {
        socketService.off('batch-notification', handleScheduleCreated);
        socketService.off('schedule-created', handleScheduleCreated);
        socketService.disconnect();
      };
    }
  }, [user?._id, batches, toast]);

  // Format date helper
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Navigate date
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'ongoing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'upcoming':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Filter schedule for selected date/week
  const getFilteredSchedule = () => {
    if (viewMode === 'day') {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      return schedules.filter(item => {
        const itemDate = new Date(item.startTime).toISOString().split('T')[0];
        return itemDate === selectedDateStr;
      });
    } else {
      // Week view
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return schedules.filter(item => {
        const itemDate = new Date(item.startTime);
        return itemDate >= weekStart && itemDate <= weekEnd;
      });
    }
  };

  const filteredSchedule = getFilteredSchedule();
  const todaySchedule = schedules.filter(item => {
    const today = new Date().toISOString().split('T')[0];
    const itemDate = new Date(item.startTime).toISOString().split('T')[0];
    return itemDate === today;
  });

  // Handle schedule submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleForm.batchId || !scheduleForm.startTime || !scheduleForm.endTime || !scheduleForm.topic) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const startTime = new Date(scheduleForm.startTime);
    const endTime = new Date(scheduleForm.endTime);

    if (endTime <= startTime) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSchedulingLoading(true);
      
      // Parse the datetime-local input (it's in format: YYYY-MM-DDTHH:mm)
      // When you pick a time like "3:00 PM" in the form, it's treated as local time
      // We need to convert it to UTC for storage
      
      // Create dates from the input strings
      const startDate = new Date(scheduleForm.startTime);
      const endDate = new Date(scheduleForm.endTime);
      
      // Get timezone offset in minutes (negative for timezones east of UTC)
      // For IST (UTC+5:30), getTimezoneOffset() returns -330
      // To convert local time to UTC, we need to SUBTRACT the offset
      const tzOffsetMinutes = new Date().getTimezoneOffset(); // e.g., -330 for IST
      const tzOffsetMs = tzOffsetMinutes * 60 * 1000; // Convert to milliseconds
      
      // To get UTC: local_time - offset
      // If local is 3:00 PM and offset is -330, UTC = 3:00 PM - (-330) = 3:00 PM + 330 min = 09:30 AM
      const utcStartTime = new Date(startDate.getTime() - tzOffsetMs).toISOString();
      const utcEndTime = new Date(endDate.getTime() - tzOffsetMs).toISOString();
      
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

      const response = await apiService.createSchedule({
        batchId: scheduleForm.batchId,
        startTime: utcStartTime,
        endTime: utcEndTime,
        topic: scheduleForm.topic,
        description: scheduleForm.description,
        meetingType: scheduleForm.meetingType,
        meetingLink: scheduleForm.meetingLink,
      });

      if (response?.success) {
        toast({
          title: 'Success',
          description: 'Class scheduled successfully! Students will be notified in real-time.',
        });

        setShowScheduleModal(false);
        setScheduleForm({
          batchId: '',
          startTime: '',
          endTime: '',
          topic: '',
          description: '',
          meetingType: 'zoom',
          meetingLink: '',
        });

        // Refresh schedules
        const res = await apiService.getLiveClasses({ teacherId: user?._id, limit: 100 });
        if (res?.success && res.data?.liveClasses) {
          const updated = res.data.liveClasses.map((item: any) => ({
            id: item.id || item._id,
            batchId: item.batchId,
            batchName: item.batchName || 'Class',
            courseTitle: item.courseTitle || 'Course',
            topic: item.title || item.topic || 'Session',
            startTime: item.startTime,
            endTime: new Date(new Date(item.startTime).getTime() + (item.duration || 60) * 60000).toISOString(),
            duration: item.duration || 60,
            studentsCount: item.studentsCount || 0,
            type: 'live_class' as const,
            status: getSessionStatus(item.startTime, new Date(new Date(item.startTime).getTime() + (item.duration || 60) * 60000).toISOString()),
            description: item.description || '',
            zoomLink: item.zoomLink || item.meetingLink || '',
          }));
          setSchedules(updated);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to schedule class',
        variant: 'destructive',
      });
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Open schedule modal
  const openScheduleModal = () => {
    if (batches.length === 0) {
      toast({
        title: 'No Batches',
        description: 'Create a batch first in "My Batches"',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    setScheduleForm({
      batchId: '',
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
      topic: '',
      description: '',
      meetingType: 'zoom',
      meetingLink: '',
    });
    setShowScheduleModal(true);
  };

  // Handle delete schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await apiService.deleteLiveClass(scheduleId);
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <h2 className='text-xl font-semibold mb-2'>Loading Schedule</h2>
          <p className='text-gray-600'>Fetching your class schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
              📅 Schedule New Class
            </h2>
            <p style={{ color: '#666', margin: 0, marginBottom: '24px', fontSize: '14px' }}>
              Create a new live class for your students
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleScheduleSubmit(e);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Select Batch *
                </label>
                <select
                  value={scheduleForm.batchId}
                  onChange={e => setScheduleForm({ ...scheduleForm, batchId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value=''>-- Select a batch --</option>
                  {batches.map(batch => (
                    <option key={batch._id || batch.id} value={batch._id || batch.id}>
                      {batch.name} ({batch.students?.length || 0} students)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Topic *
                </label>
                <input
                  type='text'
                  value={scheduleForm.topic}
                  onChange={e => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                  placeholder='e.g., Introduction to Algebra'
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder='Brief description of the class'
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Start Time *
                </label>
                <input
                  type='datetime-local'
                  value={scheduleForm.startTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  End Time *
                </label>
                <input
                  type='datetime-local'
                  value={scheduleForm.endTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Meeting Type
                </label>
                <select
                  value={scheduleForm.meetingType}
                  onChange={e => setScheduleForm({ ...scheduleForm, meetingType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value='zoom'>Zoom</option>
                  <option value='google_meet'>Google Meet</option>
                  <option value='in_app'>In App</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Meeting Link
                </label>
                <input
                  type='url'
                  value={scheduleForm.meetingLink}
                  onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder='https://...'
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type='button'
                  onClick={() => setShowScheduleModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={schedulingLoading}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: schedulingLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: schedulingLoading ? 0.6 : 1,
                  }}
                >
                  {schedulingLoading ? '⏳ Scheduling...' : '✅ Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN PAGE - Matching Student UI */}
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorative elements */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          {/* Header - Matching student schedule header */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl rotate-12 animate-bounce opacity-20' />
            <div className='absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-bounce delay-300 opacity-20' />

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 relative overflow-hidden'>
                {/* Animated background pattern */}
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute top-0 left-0 w-full h-full'>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className='absolute bg-white rounded-full'
                        style={{
                          width: `${Math.random() * 100 + 50}px`,
                          height: `${Math.random() * 100 + 50}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className='relative z-10'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                        <Sparkles className='w-6 h-6 text-white' />
                      </div>
                      <Badge className='bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1'>
                        My Schedule
                      </Badge>
                    </div>
                    <Button
                      onClick={openScheduleModal}
                      className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                    >
                      <Plus className='w-5 h-5 mr-2' />
                      Schedule New Class
                    </Button>
                  </div>
                  <h1 className='text-4xl font-bold text-white mb-2'>Class Schedule 📅</h1>
                  <p className='text-blue-100 text-lg'>Manage and schedule your live classes</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Controls - Matching student UI */}
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigateDate('prev')}
                className='p-2 hover:bg-blue-50'
              >
                <ChevronLeft className='w-4 h-4' />
              </Button>
              <div className='text-center min-w-[220px]'>
                <p className='font-semibold text-lg text-gray-900'>{formatDate(selectedDate)}</p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigateDate('next')}
                className='p-2 hover:bg-blue-50'
              >
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('week')}
                className={
                  viewMode === 'week'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : ''
                }
              >
                Week View
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('day')}
                className={
                  viewMode === 'day'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : ''
                }
              >
                Day View
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Main Schedule */}
            <div className='lg:col-span-2'>
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse'>
                        <Calendar className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                          {viewMode === 'week' ? 'Weekly Schedule' : 'Daily Schedule'}
                        </CardTitle>
                        <CardDescription>
                          {viewMode === 'week'
                            ? `Schedule for week of ${formatDate(selectedDate)}`
                            : `Schedule for ${formatDate(selectedDate)}`}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className='bg-blue-100 text-blue-700'>
                      {filteredSchedule.length} {filteredSchedule.length === 1 ? 'Class' : 'Classes'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='p-6'>
                  {filteredSchedule.length > 0 ? (
                    <div className='space-y-4'>
                      {filteredSchedule.map((item) => (
                        <div
                          key={item.id}
                          className={`relative p-5 rounded-2xl border hover:shadow-lg transition-all duration-300 group ${
                            item.status === 'ongoing'
                              ? 'bg-gradient-to-r from-blue-50 via-white to-blue-50 border-blue-300'
                              : 'bg-gradient-to-r from-gray-50 via-white to-purple-50 border-gray-200'
                          }`}
                        >
                          {/* Status indicator */}
                          <div className='absolute top-3 right-3'>
                            <Badge className={getStatusColor(item.status || 'upcoming')}>
                              {item.status === 'ongoing' && (
                                <span className='flex items-center gap-1'>
                                  <span className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                                  Live Now
                                </span>
                              )}
                              {item.status === 'upcoming' && 'Upcoming'}
                              {item.status === 'completed' && 'Completed'}
                            </Badge>
                          </div>

                          <div className='flex items-start justify-between gap-4'>
                            <div className='flex-1 space-y-3'>
                              <div>
                                <h4 className='font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors'>
                                  {item.topic}
                                </h4>
                                <p className='text-sm text-gray-600 flex items-center gap-2'>
                                  <BookOpen className='w-4 h-4' />
                                  {item.courseTitle}
                                </p>
                              </div>
                              <div className='grid grid-cols-2 gap-4 text-sm'>
                                <div className='flex items-center gap-2 text-gray-600'>
                                  <Calendar className='w-4 h-4 text-blue-500' />
                                  <span className='font-medium'>
                                    {new Date(item.startTime).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2 text-gray-600'>
                                  <Clock className='w-4 h-4 text-purple-500' />
                                  <span className='font-medium'>
                                    {new Date(item.startTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2 text-gray-600'>
                                  <Users className='w-4 h-4 text-green-500' />
                                  <span className='font-medium'>{item.studentsCount} students</span>
                                </div>
                                <div className='flex items-center gap-2 text-gray-600'>
                                  <MapPin className='w-4 h-4 text-orange-500' />
                                  <span className='font-medium'>{item.batchName}</span>
                                </div>
                              </div>
                            </div>
                            <div className='flex flex-col gap-2'>
                              <Button
                                className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                                size='sm'
                              >
                                <Play className='w-4 h-4 mr-2' />
                                Start
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                className='border-gray-300 hover:bg-gray-50'
                              >
                                <Edit className='w-4 h-4 mr-2' />
                                Edit
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                className='border-red-300 text-red-600 hover:bg-red-50'
                                onClick={() => handleDeleteSchedule(item.id)}
                              >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-12'>
                      <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4'>
                        <Calendar className='h-10 w-10 text-gray-400' />
                      </div>
                      <p className='text-gray-900 font-bold text-lg mb-2'>No classes scheduled</p>
                      <p className='text-sm text-gray-600 mb-6'>
                        You have no classes scheduled for the selected {viewMode === 'week' ? 'week' : 'day'}
                      </p>
                      <Button
                        className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        onClick={openScheduleModal}
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        Schedule First Class
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Matching student UI */}
            <div className='space-y-6'>
              {/* Today's Summary */}
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <Clock className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'>
                        Today's Summary
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-6 space-y-4'>
                  <div className='text-center'>
                    <div className='text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-1'>
                      {todaySchedule.length}
                    </div>
                    <p className='text-sm text-gray-600'>Classes Today</p>
                  </div>

                  {todaySchedule.length > 0 && (
                    <div className='space-y-2'>
                      {todaySchedule.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className='bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-3 border border-blue-100'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium text-sm text-gray-900 truncate'>
                                {item.topic}
                              </p>
                              <p className='text-xs text-gray-600'>
                                {new Date(item.startTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.status === 'ongoing'
                                  ? 'bg-blue-500 animate-pulse'
                                  : 'bg-gray-400'
                              }`}
                            ></div>
                          </div>
                        </div>
                      ))}
                      {todaySchedule.length > 3 && (
                        <p className='text-xs text-center text-gray-500'>
                          +{todaySchedule.length - 3} more classes
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <PlayCircle className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                        Quick Actions
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4 space-y-2'>
                  <Button
                    variant='outline'
                    className='w-full justify-start hover:bg-blue-50 hover:border-blue-300'
                    onClick={() => navigate('/teacher/dashboard')}
                  >
                    <BookOpen className='w-4 h-4 mr-2' />
                    Dashboard
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start hover:bg-purple-50 hover:border-purple-300'
                    onClick={() => navigate('/teacher/batches')}
                  >
                    <Users className='w-4 h-4 mr-2' />
                    My Batches
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start hover:bg-green-50 hover:border-green-300'
                    onClick={() => navigate('/teacher/recorded-content')}
                  >
                    <FileText className='w-4 h-4 mr-2' />
                    Recordings
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start hover:bg-orange-50 hover:border-orange-300'
                    onClick={() => navigate('/teacher/students')}
                  >
                    <Video className='w-4 h-4 mr-2' />
                    My Students
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherSchedule;
