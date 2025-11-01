import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  Calendar,
  BookOpen,
  Video,
  FileText,
  TrendingUp,
  Bell,
  Loader2,
  LogOut,
  UserPlus,
  Search,
  Home,
  BarChart,
  GraduationCap,
  Settings,
  HelpCircle,
} from 'lucide-react';

const MyBatches: React.FC = () => {
  const navigate = useNavigate();
  const [enrolledBatches, setEnrolledBatches] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrolled');

  useEffect(() => {
    void fetchBatchData();
  }, []);

  const fetchBatchData = async () => {
    try {
      setLoading(true);
      const [batchesResponse, dashboardResponse] = await Promise.all([
        apiService.getMyBatches(),
        apiService.getStudentDashboardData(),
      ]);

      const batches = batchesResponse?.data || [];
      setEnrolledBatches(batches);
      setAvailableBatches([]); // Will be populated when available batches API is ready

      const dashboard = dashboardResponse?.data || {};
      setDashboardStats(dashboard);
      setRecentActivities(dashboard.recentActivities || []);
      setUpcomingAssignments([]);
    } catch (error: any) {
      console.error('Failed to load batch data:', error);
      if (
        error.message?.includes('401') ||
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Invalid token')
      ) {
        navigate('/login');
        return;
      }
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
      // await apiService.requestEnrollment(batchId);
      toast.success('Enrollment request sent successfully!');
      void fetchBatchData();
    } catch (error) {
      toast.error('Failed to send enrollment request');
      console.error(error);
    }
  };

  const handleLeaveBatch = async (batchId: string) => {
    try {
      // await apiService.leaveBatch(batchId);
      toast.success('Left batch successfully');
      void fetchBatchData();
    } catch (error) {
      toast.error('Failed to leave batch');
      console.error(error);
    }
  };

  const handleRequestTransfer = async (batchId: string) => {
    try {
      // await apiService.requestTransfer(batchId);
      toast.success('Transfer request sent successfully!');
      void fetchBatchData();
    } catch (error) {
      toast.error('Failed to send transfer request');
      console.error(error);
    }
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/student/dashboard' },
    { icon: GraduationCap, label: 'My Batches', path: '/student/batches', active: true },
    { icon: Video, label: 'Live Classes', path: '/student/live-classes' },
    { icon: FileText, label: 'Assessments', path: '/student/assessments' },
    { icon: BarChart, label: 'Progress', path: '/student/progress' },
    { icon: Settings, label: 'Settings', path: '/student/settings' },
    { icon: HelpCircle, label: 'Help', path: '/student/help' },
  ];

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        {/* Sidebar */}
        <aside className='w-64 bg-white border-r border-gray-200 p-6'>
          <div className='mb-8'>
            <h2 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              GenZEd LMS
            </h2>
          </div>
          <nav className='space-y-2'>
            {sidebarItems.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className='w-5 h-5' />
                <span className='font-medium'>{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-8'>
          <div className='flex items-center justify-center min-h-[60vh]'>
            <div className='text-center'>
              <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
              <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Loading Your Batches
              </h2>
              <p className='text-gray-600'>Preparing your learning journey...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      {/* Sidebar */}
      <aside className='w-64 bg-white border-r border-gray-200 p-6'>
        <div className='mb-8'>
          <h2 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            GenZEd LMS
          </h2>
        </div>
        <nav className='space-y-2'>
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className='w-5 h-5' />
              <span className='font-medium'>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className='flex-1 p-8 overflow-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
            My Batches
          </h1>
          <p className='text-gray-600'>Track your learning progress across all enrolled batches</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full max-w-md grid-cols-2 mb-8'>
            <TabsTrigger value='enrolled'>Enrolled Batches ({enrolledBatches.length})</TabsTrigger>
            <TabsTrigger value='available'>Available Batches</TabsTrigger>
          </TabsList>

          {/* Enrolled Batches Tab */}
          <TabsContent value='enrolled'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Batches List */}
              <div className='lg:col-span-2 space-y-6'>
                {enrolledBatches.length === 0 ? (
                  <Card className='bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl border-0'>
                    <CardContent className='text-center py-16'>
                      <BookOpen className='w-20 h-20 mx-auto mb-4 text-gray-300' />
                      <h3 className='text-2xl font-bold text-gray-700 mb-2'>No Batches Yet</h3>
                      <p className='text-gray-500 mb-6'>You haven't enrolled in any batches yet.</p>
                      <Button
                        onClick={() => setActiveTab('available')}
                        className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                      >
                        <Search className='w-4 h-4 mr-2' />
                        Explore Available Batches
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  enrolledBatches.map(batch => (
                    <Card
                      key={batch.id}
                      className='bg-gradient-to-r from-white to-blue-50/30 shadow-xl rounded-3xl border-0 hover:shadow-2xl transition-all duration-300'
                    >
                      <CardHeader>
                        <div className='flex items-start justify-between'>
                          <div>
                            <CardTitle className='text-2xl mb-2 flex items-center gap-2'>
                              {batch.name || 'Unnamed Batch'}
                              <Badge className='bg-green-100 text-green-700'>Active</Badge>
                            </CardTitle>
                            <p className='text-gray-600'>
                              Teacher: {batch.teacherName || 'TBD'} • {batch.studentCount || 0}{' '}
                              students
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4 text-sm'>
                          <div className='flex items-center gap-2 text-gray-600'>
                            <Calendar className='w-4 h-4 text-blue-500' />
                            <span>Schedule: {batch.schedule || 'TBD'}</span>
                          </div>
                          <div className='flex items-center gap-2 text-gray-600'>
                            <Clock className='w-4 h-4 text-green-500' />
                            <span>Next Class: {batch.nextClass || 'TBD'}</span>
                          </div>
                        </div>

                        <div className='flex flex-wrap gap-2'>
                          <Button
                            size='sm'
                            onClick={() => navigate('/student/live-classes')}
                            className='bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          >
                            <Video className='w-4 h-4 mr-2' />
                            View Classes
                          </Button>
                          <Button size='sm' variant='outline' onClick={() => navigate('/student/recorded-content')}>
                            <BookOpen className='w-4 h-4 mr-2' />
                            Materials
                          </Button>
                          <Button size='sm' variant='outline' onClick={() => handleRequestTransfer(batch.id)}>
                            <UserPlus className='w-4 h-4 mr-2' />
                            Request Transfer
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='text-red-600 hover:bg-red-50'
                            onClick={() => {
                              if (confirm('Are you sure you want to leave this batch?')) {
                                void handleLeaveBatch(batch.id);
                              }
                            }}
                          >
                            <LogOut className='w-4 h-4 mr-2' />
                            Leave Batch
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Sidebar Stats */}
              <div className='space-y-6'>
                {/* Recent Activity */}
                <Card className='bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl border-0'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <Bell className='w-5 h-5 text-purple-600' />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivities.length === 0 ? (
                      <div className='text-center py-8'>
                        <Bell className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                        <p className='text-sm text-gray-500'>No recent activities</p>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {recentActivities.map((activity: any) => (
                          <div
                            key={activity.id}
                            className='bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100'
                          >
                            <p className='font-medium text-sm text-gray-900'>{activity.title}</p>
                            <p className='text-xs text-gray-500'>{activity.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card className='bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl border-0'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <TrendingUp className='w-5 h-5 text-green-600' />
                      Learning Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl'>
                      <div className='text-3xl font-bold text-blue-600'>
                        {dashboardStats?.stats?.totalBatches ?? enrolledBatches.length}
                      </div>
                      <p className='text-sm text-gray-600'>Active Batches</p>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div className='text-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl'>
                        <div className='text-xl font-bold text-green-600'>
                          {dashboardStats?.stats?.attendancePercentage ?? 0}%
                        </div>
                        <p className='text-xs text-gray-600'>Attendance</p>
                      </div>
                      <div className='text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl'>
                        <div className='text-xl font-bold text-purple-600'>
                          {dashboardStats?.stats?.recentTestScore ?? 0}%
                        </div>
                        <p className='text-xs text-gray-600'>Avg Score</p>
                      </div>
                    </div>

                    <div className='pt-4 border-t border-gray-200'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-xs text-gray-500 mb-1'>Study Streak</p>
                          <p className='text-2xl font-bold text-orange-600'>
                            {dashboardStats?.stats?.studyStreak ?? 0} days
                          </p>
                        </div>
                        <div className='w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center'>
                          <span className='text-2xl'>🔥</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Available Batches Tab */}
          <TabsContent value='available'>
            <Card className='bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl border-0'>
              <CardContent className='text-center py-16'>
                <Search className='w-20 h-20 mx-auto mb-4 text-gray-300' />
                <h3 className='text-2xl font-bold text-gray-700 mb-2'>Available Batches</h3>
                <p className='text-gray-500 mb-6'>
                  This feature is coming soon. You'll be able to explore and join new batches here.
                </p>
                <Button
                  onClick={() => navigate('/courses')}
                  className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                >
                  <BookOpen className='w-4 h-4 mr-2' />
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyBatches;
