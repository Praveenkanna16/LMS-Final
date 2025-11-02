import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentDashboard } from '@/hooks/useDashboard';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  BookOpen,
  Calendar,
  Clock,
  Users,
  PlayCircle,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Play,
  Zap,
  Sparkles,
  BarChart3,
  Bell,
  Award,
  FileText,
  Target,
  Rocket,
  Star,
  Trophy,
  BookMarked,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { socketService } from '@/services/socket';
import { sessionManager } from '@/lib/sessionManager';
import { useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface UpcomingClass {
  batchId: string;
  batchName?: string;
  courseTitle?: string;
  topic?: string;
  startTime?: string;
  endTime?: string;
  teacher?: string;
}

interface RecentActivity {
  id: string;
  title?: string;
  time?: string;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: dashboardData, isLoading, error } = useStudentDashboard();
  const queryClient = useQueryClient();

  // Surface fetch errors with a toast from a top-level effect so hooks remain stable
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleJoinClass = (batchId: string) => {
    navigate(`/live-class/${batchId}`);
  };

  // Socket connection and batch joining for real-time updates
  React.useEffect(() => {
    const user = sessionManager.getUser();
    if (user?.id) {
      const token = localStorage.getItem('genzed_token') || localStorage.getItem('token') || '';
      socketService.connect(user.id.toString(), token);

      // Join all student's batches to receive updates
      const joinStudentBatches = async () => {
        try {
          const response = await apiService.getMyBatches();
          if (response?.data && Array.isArray(response.data)) {
            response.data.forEach((batch: any) => {
              if (batch._id) {
                socketService.joinBatch(batch._id);
              }
            });
          }
        } catch (error) {
          // Silent fail - socket connection is optional
        }
      };

      void joinStudentBatches();

      // Listen for batch notifications (when schedules are created)
      const handleScheduleCreated = () => {
        // Refetch dashboard data when a new schedule is created
        void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
        toast({
          title: 'Schedule Updated',
          description: 'A new class has been scheduled in your batch',
        });
      };

      socketService.on('batch-notification', handleScheduleCreated);

      return () => {
        socketService.off('batch-notification', handleScheduleCreated);
        socketService.disconnect();
      };
    }
  }, [queryClient, toast]);

  const upcomingClasses: UpcomingClass[] = dashboardData?.data?.upcomingClasses?.slice(0, 3) ?? [];
  const batches = dashboardData?.data?.batches ?? [];
  const user = dashboardData?.data?.user;

  // Get real stats from API
  const attendancePercentage = dashboardData?.data?.stats?.attendancePercentage ?? 0;
  const recentTestScore = dashboardData?.data?.stats?.recentTestScore ?? 0;
  const notificationsCount = dashboardData?.data?.stats?.notificationsCount ?? 0;
  const studyStreak = dashboardData?.data?.stats?.studyStreak ?? 0;
  const totalBatches = batches.length;

  // Get real activities and achievements
  const recentActivities: RecentActivity[] = dashboardData?.data?.recentActivities ?? [];
  const achievements = dashboardData?.data?.achievements ?? [];
  const weeklyProgress = dashboardData?.data?.weeklyProgress ?? {
    classesAttended: { value: 0, max: 10 },
    testsCompleted: { value: 0, max: 4 },
    assignmentsDone: { value: 0, max: 5 },
  };

  if (isLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (error) {
    // Error UI shown below; toast is handled by top-level effect to keep hooks stable
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-6' />
            <h2 className='text-2xl font-bold mb-4 text-gray-900'>Failed to Load Dashboard</h2>
            <p className='text-gray-600 mb-6'>There was an error loading your dashboard data.</p>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Background with gradient */}
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorative elements */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          {/* Header Section with Floating Icons */}
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
                      Student Portal
                    </Badge>
                  </div>
                  <h1 className='text-4xl font-bold text-white mb-2'>
                    Welcome back, {user?.name}! 👋
                  </h1>
                  <p className='text-blue-100 text-lg mb-6'>
                    Track your learning progress with AI-powered insights
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      onClick={() => navigate("/student/batches")}
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Continue Learning
                    </Button>

                    <Button
                      size="lg"
                      variant="ghost"
                      className="border-2 border-white/50 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all duration-300"
                      onClick={() => navigate("/student/progress")}
                    >
                      <BarChart3 className="w-5 h-5 mr-2" />
                      View Progress
                    </Button>

                    <Button
                      size="lg"
                      variant="ghost"
                      className="border-2 border-white/50 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all duration-300"
                      onClick={() => navigate("/student/schedule")}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      My Schedule
                    </Button>
                  </div>

                </div>
              </div>
            </Card>
          </div>

          {/* Stats Cards - Enhanced with more metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {/* Total Enrollments */}
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl overflow-hidden group'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <BookOpen className='w-6 h-6 text-white' />
                  </div>
                  <Badge className='bg-blue-100 text-blue-700'>Active</Badge>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm text-gray-600 font-medium'>Total Enrollments</p>
                  <p className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                    {totalBatches}
                  </p>
                  <div className='flex items-center gap-2 text-sm text-green-600'>
                    <TrendingUp className='w-4 h-4' />
                    <span>Keep it up!</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Percentage */}
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl overflow-hidden group'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <CheckCircle className='w-6 h-6 text-white' />
                  </div>
                  <Badge className='bg-green-100 text-green-700'>Excellent</Badge>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm text-gray-600 font-medium'>Attendance</p>
                  <p className='text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                    {attendancePercentage}%
                  </p>
                  <Progress value={attendancePercentage} className='h-2' />
                </div>
              </CardContent>
            </Card>

            {/* Recent Test Score */}
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl overflow-hidden group'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <Award className='w-6 h-6 text-white' />
                  </div>
                  <Badge className='bg-purple-100 text-purple-700'>A+</Badge>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm text-gray-600 font-medium'>Recent Test Score</p>
                  <p className='text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                    {recentTestScore}%
                  </p>
                  <div className='flex items-center gap-2 text-sm text-purple-600'>
                    <Star className='w-4 h-4 fill-current' />
                    <span>Top 10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Streak */}
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl overflow-hidden group'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <Rocket className='w-6 h-6 text-white' />
                  </div>
                  <Badge className='bg-orange-100 text-orange-700'>🔥 Hot</Badge>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm text-gray-600 font-medium'>Study Streak</p>
                  <p className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'>
                    {studyStreak} days
                  </p>
                  <div className='flex items-center gap-2 text-sm text-orange-600'>
                    <Trophy className='w-4 h-4' />
                    <span>Amazing!</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Upcoming Classes - 2 columns */}
            <div className='lg:col-span-2'>
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden h-full'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse'>
                        <Clock className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                          Upcoming Classes
                        </CardTitle>
                        <p className='text-sm text-gray-600 mt-1'>
                          Your next scheduled learning sessions
                        </p>
                      </div>
                    </div>
                    <Badge className='bg-blue-100 text-blue-700'>
                      {upcomingClasses.length} Classes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='p-6'>
                  {upcomingClasses.length > 0 ? (
                    <div className='space-y-4'>
                      {upcomingClasses.map((classItem: UpcomingClass) => {
                        return (
                          <div
                            key={classItem.batchId}
                            className='relative p-5 bg-gradient-to-r from-gray-50 via-white to-blue-50 rounded-2xl border border-gray-200/50 hover:shadow-lg transition-all duration-300 group'
                          >
                            {/* Live indicator */}
                            <div className='absolute top-3 right-3'>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                                <Badge className='bg-green-100 text-green-700 text-xs'>Live</Badge>
                              </div>
                            </div>

                            <div className='flex items-start justify-between gap-4'>
                              <div className='flex-1 space-y-3'>
                                <div>
                                  <h4 className='font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors'>
                                    {classItem.topic}
                                  </h4>
                                  <p className='text-sm text-gray-600 flex items-center gap-2'>
                                    <BookMarked className='w-4 h-4' />
                                    {classItem.courseTitle ?? classItem.batchName}
                                  </p>
                                </div>
                                <div className='flex items-center gap-6 text-sm'>
                                  <div className='flex items-center gap-2 text-gray-600'>
                                    <Calendar className='w-4 h-4 text-blue-500' />
                                    <span className='font-medium'>
                                      {classItem.startTime &&
                                        new Date(classItem.startTime).toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-2 text-gray-600'>
                                    <Clock className='w-4 h-4 text-purple-500' />
                                    <span className='font-medium'>
                                      {classItem.startTime &&
                                        new Date(classItem.startTime).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                    </span>
                                  </div>
                                  {classItem.teacher && (
                                    <div className='flex items-center gap-2 text-gray-600'>
                                      <Users className='w-4 h-4 text-green-500' />
                                      <span className='font-medium'>{classItem.teacher}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                                onClick={() => {
                                  handleJoinClass(classItem.batchId);
                                }}
                              >
                                <Play className='w-4 h-4 mr-2' />
                                Join Now
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <Button
                        variant='outline'
                        className='w-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                        onClick={() => {
                          navigate('/student/schedule');
                        }}
                      >
                        View Full Schedule
                      </Button>
                    </div>
                  ) : (
                    <div className='text-center py-12'>
                      <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4'>
                        <Calendar className='h-10 w-10 text-gray-400' />
                      </div>
                      <p className='text-gray-900 font-bold text-lg mb-2'>No upcoming classes</p>
                      <p className='text-sm text-gray-600 mb-6'>Your schedule is clear for now</p>
                      <Button
                        className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        onClick={() => {
                          navigate('/courses');
                        }}
                      >
                        <BookOpen className='w-4 h-4 mr-2' />
                        Browse Courses
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* My Batches - 1 column */}
            <div className='lg:col-span-1'>
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden h-full'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <Users className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'>
                        My Batches
                      </CardTitle>
                      <p className='text-sm text-gray-600 mt-1'>Your learning communities</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-6'>
                  {batches.length > 0 ? (
                    <div className='space-y-4'>
                      {batches.slice(0, 3).map(batch => (
                        <div
                          key={batch._id}
                          className='p-4 bg-gradient-to-r from-gray-50 to-green-50/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-300 group cursor-pointer'
                          onClick={() => {
                            navigate(`/student/batch/${batch._id}`);
                          }}
                        >
                          <div className='flex items-start gap-3 mb-3'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0'>
                              <span className='text-white text-sm font-bold'>
                                {batch.teacher?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-bold text-gray-900 mb-1 truncate group-hover:text-green-600 transition-colors'>
                                {batch.name}
                              </h4>
                              <p className='text-xs text-gray-600 truncate'>{batch.course?.title || 'Course'}</p>
                            </div>
                          </div>
                          <div className='flex items-center justify-between text-xs'>
                            <Badge className='bg-green-100 text-green-700'>
                              {batch.students?.length ?? 0} students
                            </Badge>
                            <span className='text-gray-500'>
                              by {batch.teacher?.name ?? 'Instructor'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {batches.length > 3 && (
                        <Button
                          variant='outline'
                          className='w-full border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50'
                          onClick={() => {
                            navigate('/student/batches');
                          }}
                        >
                          View All ({batches.length})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <div className='w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3'>
                        <BookOpen className='h-8 w-8 text-gray-400' />
                      </div>
                      <p className='text-gray-900 font-semibold mb-2'>No batches yet</p>
                      <p className='text-xs text-gray-600 mb-4'>Start your journey</p>
                      <Button
                        size='sm'
                        className='bg-gradient-to-r from-green-500 to-blue-600 text-white'
                        onClick={() => {
                          navigate('/courses');
                        }}
                      >
                        <BookOpen className='w-4 h-4 mr-2' />
                        Browse
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions Grid - Enhanced with more actions */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-pulse'>
                  <Zap className='w-5 h-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                    Quick Actions
                  </CardTitle>
                  <p className='text-sm text-gray-600 mt-1'>
                    Access your resources and tools instantly
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                {/* View Tests */}
                <button
                  onClick={() => {
                    navigate('/student/tests');
                  }}
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200/50 hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <FileText className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    View Tests
                  </span>
                </button>

                {/* Recorded Classes */}
                <button
                  onClick={() => {
                    navigate('/student/recordings');
                  }}
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Video className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    Recordings
                  </span>
                </button>

                {/* Attendance */}
                <button
                  onClick={() => {
                    navigate('/student/attendance');
                  }}
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <CheckCircle className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    Attendance
                  </span>
                </button>

                {/* Performance */}
                <button
                  onClick={() => {
                    navigate('/student/performance');
                  }}
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200/50 hover:border-orange-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <BarChart3 className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    Performance
                  </span>
                </button>

                {/* Notifications */}
                <button
                  onClick={() => {
                    navigate('/student/notifications');
                  }}
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200/50 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group relative'
                >
                  {notificationsCount > 0 && (
                    <Badge className='absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center p-0 bg-red-500 text-white text-xs'>
                      {notificationsCount}
                    </Badge>
                  )}
                  <div className='w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Bell className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    Notifications
                  </span>
                </button>

                {/* Support */}
                <button
                  onClick={() => {
                    navigate('/student/support');
                  }}
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200/50 hover:border-pink-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <HelpCircle className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>Support</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Features Row */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Recent Activity */}
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center'>
                    <Activity className='w-4 h-4 text-white' />
                  </div>
                  <CardTitle className='text-lg'>Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-4'>
                <div className='space-y-3'>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity: RecentActivity) => (
                      <div
                        key={activity.id}
                        className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors'
                      >
                        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                          <Activity className='w-4 h-4 text-blue-600' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {activity.title}
                          </p>
                          <p className='text-xs text-gray-500'>{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='text-center py-4 text-sm text-gray-500'>No recent activity</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center'>
                    <Trophy className='w-4 h-4 text-white' />
                  </div>
                  <CardTitle className='text-lg'>Achievements</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-4'>
                <div className='grid grid-cols-3 gap-3'>
                  {achievements.length > 0 ? (
                    achievements.map((badge, i) => (
                      <div
                        key={i}
                        className='flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105'
                      >
                        <div className='text-2xl'>{badge.icon}</div>
                        <span className='text-xs font-medium text-gray-700 text-center'>
                          {badge.label}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className='col-span-3 text-center py-4 text-sm text-gray-500'>
                      No achievements yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center'>
                    <Target className='w-4 h-4 text-white' />
                  </div>
                  <CardTitle className='text-lg'>This Week</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-4'>
                <div className='space-y-4'>
                  {[
                    {
                      label: 'Classes Attended',
                      value: weeklyProgress.classesAttended.value,
                      max: weeklyProgress.classesAttended.max,
                      color: 'blue',
                    },
                    {
                      label: 'Tests Completed',
                      value: weeklyProgress.testsCompleted.value,
                      max: weeklyProgress.testsCompleted.max,
                      color: 'purple',
                    },
                    {
                      label: 'Assignments Done',
                      value: weeklyProgress.assignmentsDone.value,
                      max: weeklyProgress.assignmentsDone.max,
                      color: 'green',
                    },
                  ].map((item, i) => (
                    <div key={i} className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-700 font-medium'>{item.label}</span>
                        <span className='text-gray-900 font-bold'>
                          {item.value}/{item.max}
                        </span>
                      </div>
                      <Progress value={(item.value / item.max) * 100} className='h-2' />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
