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
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Filter,
  Search,
  Zap,
  TrendingUp,
  Award,
  BarChart3,
  Bell,
  Copy,
} from 'lucide-react';
import { socketService } from '@/services/socket';
import { sessionManager } from '@/lib/sessionManager';
import { useToast } from '@/hooks/use-toast';

interface TeacherScheduleItem {
  id: string;
  batchId: string;
  batchName: string;
  courseTitle: string;
  topic: string;
  startTime: string;
  endTime: string;
  duration: number;
  studentsCount: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  zoomLink?: string;
  meetingId?: string;
}

interface BatchStats {
  totalBatches: number;
  activeClasses: number;
  totalStudents: number;
  nextClass?: TeacherScheduleItem;
}

const ScheduleEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = sessionManager.getUser();
  
  const [schedules, setSchedules] = useState<TeacherScheduleItem[]>([]);
  const [batchStats, setBatchStats] = useState<BatchStats>({
    totalBatches: 0,
    activeClasses: 0,
    totalStudents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([]);
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
  });;

  // Fetch data from backend
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('genzed_token') || '';

        // Fetch teacher schedules
        const scheduleRes = await fetch('/api/teacher/schedules', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (scheduleRes.ok) {
          const data = await scheduleRes.json();
          setSchedules(data.data || []);
        }

        // Fetch batch stats
        const statsRes = await fetch('/api/teacher/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setBatchStats(data.data || {});
        }

        // Fetch batches for filter
        const batchesRes = await fetch('/api/teacher/batches', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (batchesRes.ok) {
          const data = await batchesRes.json();
          setBatches(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
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
  }, [user?.id, toast]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (user?.id) {
      const token = localStorage.getItem('genzed_token') || '';
      socketService.connect(user.id.toString(), token);

      socketService.on('schedule-created', (data) => {
        setSchedules((prev) => [...prev, data]);
        toast({
          title: 'Success',
          description: 'New class scheduled',
        });
      });

      socketService.on('schedule-updated', (data) => {
        setSchedules((prev) =>
          prev.map((s) => (s.id === data.id ? data : s))
        );
      });

      return () => {
        socketService.off('schedule-created');
        socketService.off('schedule-updated');
        socketService.disconnect();
      };
    }
  }, [user?.id, toast]);

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesBatch = filterBatch === 'all' || schedule.batchId === filterBatch;
    const matchesSearch =
      schedule.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.batchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate =
      new Date(schedule.startTime).toDateString() === selectedDate.toDateString();

    return matchesBatch && matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-blue-500/20 text-blue-700 border-blue-300';
      case 'scheduled':
        return 'bg-orange-500/20 text-orange-700 border-orange-300';
      case 'ended':
        return 'bg-green-500/20 text-green-700 border-green-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-300';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-300';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleDelete = async (scheduleId: string) => {
    if (window.confirm('Are you sure you want to cancel this class?')) {
      try {
        const token = localStorage.getItem('genzed_token') || '';
        const res = await fetch(`/api/teacher/schedules/${scheduleId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
          toast({
            title: 'Success',
            description: 'Class cancelled successfully',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to cancel class',
          variant: 'destructive',
        });
      }
    }
  };

  const copyZoomLink = (link: string | undefined) => {
    if (link) {
      navigator.clipboard.writeText(link);
      toast({
        title: 'Copied',
        description: 'Zoom link copied to clipboard',
      });
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !scheduleForm.batchId ||
      !scheduleForm.startTime ||
      !scheduleForm.endTime ||
      !scheduleForm.topic
    ) {
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
      const token = localStorage.getItem('genzed_token') || '';
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const res = await fetch('/api/live-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          batchId: scheduleForm.batchId,
          title: scheduleForm.topic,
          description: scheduleForm.description,
          startTime: scheduleForm.startTime,
          duration,
          zoomLink: scheduleForm.meetingLink,
          meetingType: scheduleForm.meetingType,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Class scheduled successfully!',
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
        // Reload schedules
        window.location.reload();
      } else {
        const errData = await res.json();
        toast({
          title: 'Error',
          description: errData.message || 'Failed to schedule class',
          variant: 'destructive',
        });
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

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
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
              borderRadius: '12px',
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
              Create a new class for one of your batches
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
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
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
                  placeholder='Brief description'
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
        <div className='max-w-7xl mx-auto space-y-8'>
          {/* Header */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl rotate-12 animate-bounce opacity-20' />
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <Calendar className='w-7 h-7 text-white' />
                    </div>
                    <div>
                      <h1 className='text-4xl font-bold text-white mb-2'>Class Schedule 📅</h1>
                      <p className='text-blue-100'>Manage and monitor all your live classes</p>
                    </div>
                  </div>
                  <Button
                    className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                    onClick={() => {
                      const now = new Date();
                      const startTime = new Date(now.getTime() + 60 * 60 * 1000);
                      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                      setScheduleForm({
                        ...scheduleForm,
                        startTime: startTime.toISOString().slice(0, 16),
                        endTime: endTime.toISOString().slice(0, 16),
                      });
                      setShowScheduleModal(true);
                    }}
                  >
                    <Plus className='w-5 h-5 mr-2' />
                    Schedule New Class
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-blue-600 text-sm font-semibold'>Total Batches</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>{batchStats.totalBatches}</p>
                  </div>
                  <div className='w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                    <Users className='w-6 h-6 text-blue-600' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-purple-600 text-sm font-semibold'>Active Classes</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>{batchStats.activeClasses}</p>
                  </div>
                  <div className='w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center'>
                    <Zap className='w-6 h-6 text-purple-600 animate-pulse' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-green-600 text-sm font-semibold'>Total Students</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>{batchStats.totalStudents}</p>
                  </div>
                  <div className='w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center'>
                    <TrendingUp className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-orange-600 text-sm font-semibold'>Upcoming</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>
                      {schedules.filter((s) => s.status === 'scheduled').length}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center'>
                    <Bell className='w-6 h-6 text-orange-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Class Highlight */}
          {batchStats.nextClass && (
            <Card className='bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 border-2 border-blue-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
                      <Video className='w-8 h-8 text-white' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Next Upcoming Class</p>
                      <h3 className='text-2xl font-bold text-gray-900'>{batchStats.nextClass.topic}</h3>
                      <div className='flex items-center gap-4 mt-2 text-gray-600'>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-4 h-4' />
                          {new Date(batchStats.nextClass.startTime).toLocaleTimeString()}
                        </span>
                        <span className='flex items-center gap-1'>
                          <MapPin className='w-4 h-4' />
                          {batchStats.nextClass.batchName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button className='bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'>
                    <Video className='w-4 h-4 mr-2' />
                    Start Class
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule List */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse'>
                    <Calendar className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                      Schedule Overview
                    </CardTitle>
                  </div>
                </div>
              </div>

              {/* Date Navigation and Filters */}
              <div className='flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigateDate('prev')}
                    className='p-2'
                  >
                    <ChevronLeft className='w-4 h-4' />
                  </Button>
                  <div className='text-center min-w-[180px] font-semibold'>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigateDate('next')}
                    className='p-2'
                  >
                    <ChevronRight className='w-4 h-4' />
                  </Button>
                </div>

                <div className='flex gap-2 flex-1 sm:flex-none'>
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search classes...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className='px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='all'>All Batches</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-6'>
              {filteredSchedules.length > 0 ? (
                <div className='space-y-4'>
                  {filteredSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className='group p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-blue-50/50'
                    >
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex-1 space-y-3'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                              <Video className='w-5 h-5 text-white' />
                            </div>
                            <div>
                              <h4 className='font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors'>
                                {schedule.topic}
                              </h4>
                              <p className='text-sm text-gray-600'>{schedule.courseTitle}</p>
                            </div>
                          </div>

                          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4'>
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Calendar className='w-4 h-4 text-blue-500' />
                              <span className='text-sm'>
                                {new Date(schedule.startTime).toLocaleDateString()}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Clock className='w-4 h-4 text-purple-500' />
                              <span className='text-sm'>
                                {new Date(schedule.startTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Users className='w-4 h-4 text-green-500' />
                              <span className='text-sm'>{schedule.studentsCount} students</span>
                            </div>
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Zap className='w-4 h-4 text-orange-500' />
                              <span className='text-sm'>{schedule.duration} min</span>
                            </div>
                          </div>
                        </div>

                        <div className='flex flex-col items-end gap-2'>
                          <Badge className={`${getStatusColor(schedule.status)} border`}>
                            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                          </Badge>
                          <div className='flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            {schedule.zoomLink && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => copyZoomLink(schedule.zoomLink)}
                                title='Copy Zoom link'
                              >
                                <Copy className='w-4 h-4' />
                              </Button>
                            )}
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => navigate(`/teacher/schedule/${schedule.id}/edit`)}
                            >
                              <Edit className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              className='hover:bg-red-50 hover:text-red-600'
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4'>
                    <AlertCircle className='w-10 h-10 text-gray-400' />
                  </div>
                  <p className='text-gray-600 font-semibold mb-2'>No classes scheduled</p>
                  <p className='text-sm text-gray-500 mb-6'>
                    Create your first class to get started with live sessions
                  </p>
                  <Button
                    className='bg-gradient-to-r from-blue-500 to-purple-600'
                    onClick={() => {
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
      </div>
    </>
  );
};

export default ScheduleEnhanced;
