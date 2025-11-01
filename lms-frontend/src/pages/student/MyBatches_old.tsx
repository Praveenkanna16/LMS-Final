import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import DashboardLayout from '@/components/DashboardLayout';
import StudentCard from '@/components/StudentCard';
import StudentButton from '@/components/StudentButton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  Calendar,
  BookOpen,
  Video,
  FileText,
  TrendingUp,
  MessageSquare,
  Bell,
  Target,
  Sparkles,
  Loader2,
  LogOut,
  UserPlus,
  Search,
  Filter,
} from 'lucide-react';

const MyBatches: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledBatches, setEnrolledBatches] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrolled');

  useEffect(() => {
    fetchBatchData();
  }, []);

  const fetchBatchData = async () => {
    try {
      setLoading(true);
      const [batchesResponse, availableResponse, dashboardResponse] = await Promise.all([
        apiService.getMyBatches(),
        apiService.getAvailableBatches().catch(() => ({ data: [] })),
        apiService.getStudentDashboardData(),
      ]);

      // Handle batches response
      const batches = batchesResponse?.data || [];
      setEnrolledBatches(batches);

      // Handle available batches
      const available = availableResponse?.data || [];
      setAvailableBatches(available);

      // Handle dashboard response with stats
      const dashboard = dashboardResponse?.data || {};
      setDashboardStats(dashboard);
      
      // Extract activities and assignments from dashboard data
      setRecentActivities(dashboard.recentActivities || []);
      setUpcomingAssignments(dashboard.upcomingAssignments || []);
    } catch (error: any) {
      console.error('Failed to load batch data:', error);

      // If authentication error, redirect to login
      if (
        error.message?.includes('401') ||
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Invalid token')
      ) {
        console.log('Authentication failed, redirecting to login');
        navigate('/login');
        return;
      }

      // For other errors, just show empty states (don't redirect)
      setEnrolledBatches([]);
      setAvailableBatches([]);
      setRecentActivities([]);
      setUpcomingAssignments([]);
      setDashboardStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBatch = async (batchId: string) => {
    try {
      await apiService.requestEnrollment(batchId);
      toast.success('Enrollment request sent successfully!');
      fetchBatchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to send enrollment request');
      console.error(error);
    }
  };

  const handleLeaveBatch = async (batchId: string) => {
    try {
      await apiService.leaveBatch(batchId);
      toast.success('Left batch successfully');
      fetchBatchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to leave batch');
      console.error(error);
    }
  };

  const handleRequestTransfer = async (batchId: string) => {
    try {
      await apiService.requestTransfer(batchId);
      toast.success('Transfer request sent successfully!');
      fetchBatchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to send transfer request');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Your Batches
            </h2>
            <p className='text-gray-600'>Preparing your learning journey...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              My Batches
            </h1>
            <p className='text-gray-600 mt-1'>Track your learning progress across all enrolled batches</p>
          </div>
          <div className='flex items-center gap-4'>
            <StudentButton
              variant='outline'
              onClick={() => navigate('/student/schedule')}
              icon={<Calendar className='w-4 h-4' />}
            >
              View Schedule
            </StudentButton>
            <StudentButton
              variant='primary'
              onClick={() => navigate('/courses')}
              icon={<BookOpen className='w-4 h-4' />}
            >
              Browse Courses
            </StudentButton>
          </div>
        </div>

        {/* Tabs for Enrolled and Available Batches */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value='enrolled'>Enrolled Batches</TabsTrigger>
            <TabsTrigger value='available'>Available Batches</TabsTrigger>
          </TabsList>

          {/* Enrolled Batches Tab */}
          <TabsContent value='enrolled' className='mt-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 space-y-6'>
                <StudentCard
                  title='My Enrolled Batches'
                  description='Your active learning batches and progress'
                  gradientColor='blue'
                  icon={<Users className='h-6 w-6 text-blue-600' />}
                >
                  <div className='space-y-4'>
                    {enrolledBatches.length === 0 ? (
                      <div className='text-center py-12'>
                        <BookOpen className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                        <h3 className='text-lg font-semibold text-gray-600 mb-2'>No Batches Yet</h3>
                        <p className='text-gray-500 mb-4'>You haven't enrolled in any batches yet.</p>
                        <StudentButton
                          variant='primary'
                          onClick={() => setActiveTab('available')}
                          icon={<Search className='w-4 h-4' />}
                        >
                          Explore Available Batches
                        </StudentButton>
                      </div>
                    ) : (
                      enrolledBatches.map(batch => (
                        <div
                          key={batch.id}
                          className='bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300'
                        >
                          <div className='flex gap-4'>
                            <div className='flex-1'>
                              <div className='flex items-start justify-between mb-3'>
                                <div>
                                  <div className='flex items-center gap-2 mb-1'>
                                    <h3 className='font-bold text-gray-900'>{batch.name || 'Unnamed Batch'}</h3>
                                    <Badge className='bg-blue-100 text-blue-700 text-xs'>Active</Badge>
                                  </div>
                                  <p className='text-sm text-gray-600 mb-1'>
                                    Teacher: {batch.teacherName || 'TBD'}
                                  </p>
                                  <p className='text-sm text-gray-600'>
                                    {batch.studentCount || 0} students enrolled
                                  </p>
                                </div>
                              </div>

                              <div className='mb-4'>
                                <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
                                  <div className='flex items-center gap-2'>
                                    <Calendar className='h-4 w-4 text-blue-500' />
                                    <span>Schedule: {batch.schedule || 'TBD'}</span>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <Clock className='h-4 w-4 text-green-500' />
                                    <span>Next Class: {batch.nextClass || 'TBD'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className='flex items-center gap-2 flex-wrap'>
                                <StudentButton
                                  size='sm'
                                  variant='primary'
                                  onClick={() => navigate(`/student/live-classes`)}
                                  icon={<Video className='h-4 w-4' />}
                                >
                                  View Classes
                                </StudentButton>
                                <StudentButton
                                  size='sm'
                                  variant='outline'
                                  onClick={() => navigate('/student/recorded-content')}
                                  icon={<BookOpen className='h-4 w-4' />}
                                >
                                  Materials
                                </StudentButton>
                                <StudentButton
                                  size='sm'
                                  variant='outline'
                                  onClick={() => handleRequestTransfer(batch.id)}
                                  icon={<UserPlus className='h-4 w-4' />}
                                >
                                  Request Transfer
                                </StudentButton>
                                <StudentButton
                                  size='sm'
                                  variant='outline'
                                  onClick={() => {
                                    if (confirm('Are you sure you want to leave this batch?')) {
                                      handleLeaveBatch(batch.id);
                                    }
                                  }}
                                  icon={<LogOut className='h-4 w-4' />}
                                  className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                >
                                  Leave Batch
                                </StudentButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </StudentCard>
              </div>

        <div className='space-y-6'>
          <StudentCard
            title='Recent Activity'
            description='Your latest learning activities'
            gradientColor='purple'
            icon={<Bell className='h-6 w-6 text-purple-600' />}
          >
            <div className='space-y-3'>
              {recentActivities.length === 0 ? (
                <div className='text-center py-8'>
                  <Bell className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                  <p className='text-sm text-gray-500'>No recent activities</p>
                </div>
              ) : (
                recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className='bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100 hover:shadow-md transition-all duration-300'
                  >
                    <div className='flex items-start gap-3'>
                      <div className='w-2 h-2 rounded-full mt-2 bg-purple-500'></div>
                      <div className='flex-1'>
                        <p className='font-medium text-sm text-gray-900'>{activity.title}</p>
                        <p className='text-xs text-gray-500'>{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </StudentCard>

          <StudentCard
            title='Upcoming Assignments'
            description='Deadlines to keep track of'
            gradientColor='orange'
            icon={<FileText className='h-6 w-6 text-orange-600' />}
          >
            <div className='space-y-3'>
              {upcomingAssignments.length === 0 ? (
                <div className='text-center py-8'>
                  <FileText className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                  <p className='text-sm text-gray-500'>No upcoming assignments</p>
                </div>
              ) : (
                upcomingAssignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className='rounded-lg p-3 border border-orange-200 bg-orange-50 hover:shadow-md transition-all duration-300'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='font-medium text-sm text-gray-900 mb-1'>{assignment.title}</p>
                        <p className='text-xs text-gray-600 mb-1'>{assignment.courseTitle}</p>
                        <p className='text-xs text-gray-500'>Due: {formatDate(assignment.dueDate)}</p>
                      </div>
                      <Badge variant='outline' className='text-xs border-orange-300 text-orange-600'>
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </StudentCard>

          <StudentCard
            title='My Learning Stats'
            description='Your progress overview'
            gradientColor='green'
            icon={<TrendingUp className='h-6 h-6 text-green-600' />}
          >
            <div className='space-y-4'>
              <div className='text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50'>
                <div className='text-3xl font-bold text-blue-600 mb-1'>
                  {dashboardStats?.stats?.totalBatches || enrolledBatches.length}
                </div>
                <p className='text-sm text-gray-600'>Active Batches</p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200/50'>
                  <div className='text-xl font-bold text-green-600'>
                    {dashboardStats?.stats?.attendancePercentage || 0}%
                  </div>
                  <p className='text-xs text-gray-600'>Attendance</p>
                </div>
                <div className='text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/50'>
                  <div className='text-xl font-bold text-purple-600'>
                    {dashboardStats?.stats?.recentTestScore || 0}%
                  </div>
                  <p className='text-xs text-gray-600'>Avg Score</p>
                </div>
              </div>

              <div className='pt-4 border-t border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs text-gray-500 mb-1'>Study Streak</p>
                    <p className='text-2xl font-bold text-orange-600'>
                      {dashboardStats?.stats?.studyStreak || 0} days
                    </p>
                  </div>
                  <div className='w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center'>
                    <span className='text-2xl'>🔥</span>
                  </div>
                </div>
              </div>
            </div>
          </StudentCard>
        </div>
      </div>

      <StudentCard
        title='Quick Actions'
        description='Access your learning tools and resources'
        gradientColor='purple'
        icon={<Target className='h-6 w-6 text-purple-600' />}
      >
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <StudentButton
            variant='outline'
            className='h-20 flex-col gap-2 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 transition-all duration-300 transform hover:scale-105'
            onClick={() => {
              navigate('/student/schedule');
            }}
            icon={<Calendar className='w-6 h-6' />}
          >
            View Schedule
          </StudentButton>
          <StudentButton
            variant='outline'
            className='h-20 flex-col gap-2 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50/50 hover:text-green-600 transition-all duration-300 transform hover:scale-105'
            onClick={() => {
              navigate('/student/assessments');
            }}
            icon={<FileText className='w-6 h-6' />}
          >
            Assessments
          </StudentButton>
          <StudentButton
            variant='outline'
            className='h-20 flex-col gap-2 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50/50 hover:text-purple-600 transition-all duration-300 transform hover:scale-105'
            onClick={() => {
              navigate('/student/recorded-content');
            }}
            icon={<Video className='w-6 h-6' />}
          >
            Recordings
          </StudentButton>
        </div>
      </StudentCard>
    </StudentLayout>
  );
};

export default MyBatches;
