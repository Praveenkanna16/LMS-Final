import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useStudentDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  BookOpen,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Sparkles,
  Play,
} from 'lucide-react';
import { socketService } from '@/services/socket';
import { sessionManager } from '@/lib/sessionManager';
import { useToast } from '@/hooks/use-toast';

interface ScheduleItem {
  batchId: string;
  batchName: string;
  courseTitle: string;
  topic: string;
  startTime: string;
  endTime: string;
  teacher: string;
  studentsCount?: number;
  type?: 'live_class' | 'lab_session' | 'review_session';
  status?: 'upcoming' | 'ongoing' | 'completed';
}

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: dashboardData, isLoading, error, refetch } = useStudentDashboard();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const user = sessionManager.getUser();

  // Helper functions - defined before useMemo to avoid hoisting issues
  const getSessionStatus = (startTime: string, endTime: string): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'completed';
  };

  const handleJoinClass = (batchId: string) => {
    navigate(`/live-class/${batchId}`);
  };

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live_class':
        return <Video className='w-4 h-4' />;
      case 'lab_session':
        return <BookOpen className='w-4 h-4' />;
      case 'review_session':
        return <FileText className='w-4 h-4' />;
      default:
        return <Calendar className='w-4 h-4' />;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'live_class':
        return 'text-blue-600';
      case 'lab_session':
        return 'text-green-600';
      case 'review_session':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  // Initialize socket connection for real-time updates
  useEffect(() => {
    if (user?.id) {
  const token = localStorage.getItem('genzed_token') || localStorage.getItem('token') || '';
  socketService.connect(user.id.toString(), token);

      // Listen for batch notifications (when teachers create new schedules)
      const handleScheduleCreated = (data: unknown) => {
        console.warn('New schedule created:', data);
        // Refetch dashboard data to get updated upcoming classes
        void refetch();
        toast({
          title: 'Schedule Updated',
          description: 'A new class has been scheduled',
        });
      };

      socketService.on('batch-notification', handleScheduleCreated);

      // Join all student's batches to receive updates
      const joinStudentBatches = () => {
        try {
          if (dashboardData?.data?.batches) {
            dashboardData.data.batches.forEach((batch: { _id?: string }) => {
              if (batch._id) {
                socketService.joinBatch(batch._id);
              }
            });
          }
        } catch (error) {
          // Silent fail - socket connection is optional
          console.warn('Failed to join batch rooms:', error);
        }
      };

      if (dashboardData?.data?.batches) {
        joinStudentBatches();
      }

      return () => {
        socketService.off('batch-notification', handleScheduleCreated);
        socketService.disconnect();
      };
    }
  }, [user, dashboardData?.data?.batches, refetch, toast]);

  // Get schedule data from dashboard API
  const scheduleData: ScheduleItem[] = React.useMemo(() => {
    if (!dashboardData?.data?.upcomingClasses) return [];
    
    return dashboardData.data.upcomingClasses.map((item: any) => ({
      batchId: item.batchId,
      batchName: item.batchName || 'Class',
      courseTitle: item.courseTitle || 'Course',
      topic: item.topic || 'Session',
      startTime: item.startTime,
      endTime: item.endTime,
      teacher: item.teacher || 'Instructor',
      studentsCount: item.studentsCount || 0,
      type: 'live_class' as const,
      status: getSessionStatus(item.startTime, item.endTime),
    }));
  }, [dashboardData]);

  // Filter schedule for selected date/week
  const getFilteredSchedule = () => {
    if (viewMode === 'day') {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      return scheduleData.filter(item => {
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

      return scheduleData.filter(item => {
        const itemDate = new Date(item.startTime);
        return itemDate >= weekStart && itemDate <= weekEnd;
      });
    }
  };

  const filteredSchedule = getFilteredSchedule();
  const todaySchedule = scheduleData.filter(item => {
    const today = new Date().toISOString().split('T')[0];
    const itemDate = new Date(item.startTime).toISOString().split('T')[0];
    return itemDate === today;
  });

  if (isLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-6' />
            <h2 className='text-2xl font-bold mb-4 text-gray-900'>Failed to Load Schedule</h2>
            <p className='text-gray-600 mb-6'>
              {error instanceof Error ? error.message : 'Failed to load schedule'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
            >
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Background with gradient matching dashboard */}
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorative elements */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          {/* Header matching dashboard style */}
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
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <Sparkles className='w-6 h-6 text-white' />
                    </div>
                    <Badge className='bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1'>
                      My Schedule
                    </Badge>
                  </div>
                  <h1 className='text-4xl font-bold text-white mb-2'>Class Schedule 📅</h1>
                  <p className='text-blue-100 text-lg'>
                    View your class timetable and upcoming sessions
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Controls */}
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
                      {filteredSchedule.map((item, index) => (
                        <div
                          key={index}
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
                                  <span className='font-medium'>{item.teacher}</span>
                                </div>
                                <div className='flex items-center gap-2 text-gray-600'>
                                  <MapPin className='w-4 h-4 text-orange-500' />
                                  <span className='font-medium'>{item.batchName}</span>
                                </div>
                              </div>
                            </div>
                            {item.status !== 'completed' && (
                              <Button
                                className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                                onClick={() => handleJoinClass(item.batchId)}
                              >
                                <Play className='w-4 h-4 mr-2' />
                                {item.status === 'ongoing' ? 'Join Now' : 'Join Class'}
                              </Button>
                            )}
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
                        You have no classes for the selected {viewMode === 'week' ? 'week' : 'day'}
                      </p>
                      <Button
                        className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        onClick={() => navigate('/student/batches')}
                      >
                        <BookOpen className='w-4 h-4 mr-2' />
                        View My Batches
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
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
                    <p className='text-sm text-gray-600'>Sessions Today</p>
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
                                {item.courseTitle}
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
                          +{todaySchedule.length - 3} more sessions
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
                    onClick={() => navigate('/student/dashboard')}
                  >
                    <BookOpen className='w-4 h-4 mr-2' />
                    Dashboard
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start hover:bg-purple-50 hover:border-purple-300'
                    onClick={() => navigate('/student/batches')}
                  >
                    <Users className='w-4 h-4 mr-2' />
                    My Batches
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start hover:bg-green-50 hover:border-green-300'
                    onClick={() => navigate('/student/assessments')}
                  >
                    <FileText className='w-4 h-4 mr-2' />
                    Assessments
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start hover:bg-orange-50 hover:border-orange-300'
                    onClick={() => navigate('/student/recordings')}
                  >
                    <Video className='w-4 h-4 mr-2' />
                    Recordings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;
