import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { sessionManager } from '@/lib/sessionManager';
import {
  Clock,
  Calendar,
  BookOpen,
  Video,
  TrendingUp,
  Bell,
  Loader2,
  LogOut,
  UserPlus,
  Search,
} from 'lucide-react';
import { socketService } from '@/services/socket';

interface BatchData {
  id: string;
  name?: string;
  subject?: string;
  grade?: string;
  courseId?: string;
  teacherName?: string;
  teacher?: string | { name: string };
  studentCount?: number;
  courseTitle?: string;
  schedule?: string[] | string;
  enrolledAt?: string;
  enrollmentFee?: number;
}

interface ActivityData {
  id: string;
  title: string;
  time: string;
}

interface DashboardData {
  recentActivities?: ActivityData[];
  stats?: {
    totalBatches?: number;
    attendancePercentage?: number;
    recentTestScore?: number;
    studyStreak?: number;
  };
}

const MyBatches: React.FC = () => {
  const navigate = useNavigate();
  const [enrolledBatches, setEnrolledBatches] = useState<BatchData[]>([]);
  const [availableBatches, setAvailableBatches] = useState<BatchData[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrolled');
  const [enrollingBatchId, setEnrollingBatchId] = useState<string | null>(null);

  const fetchBatchData = useCallback(async () => {
    try {
      setLoading(true);
      const [batchesResponse, dashboardResponse, allBatchesResponse] = await Promise.all([
        apiService.getMyBatches(),
        apiService.getStudentDashboardData(),
        apiService.getAllBatches(),
      ]);

      const batches = (batchesResponse.data ?? []) as unknown as BatchData[];
      setEnrolledBatches(batches);

      // Get list of enrolled batch IDs
      const enrolledIds = batches.map(b => b.id);

      // Get available batches (batches not enrolled in)
      // Backend returns: { success, data: { batches: [...], pagination: {...} } }
      let allBatchesData: BatchData[] = [];
      const allBatchesResult = allBatchesResponse.data as any;
      
      if (allBatchesResult && Array.isArray(allBatchesResult)) {
        // If data is already an array
        allBatchesData = allBatchesResult;
      } else if (allBatchesResult && typeof allBatchesResult === 'object' && Array.isArray(allBatchesResult.batches)) {
        // If data is wrapped in batches property
        allBatchesData = allBatchesResult.batches;
      }
      
      const available = allBatchesData.filter(batch => !enrolledIds.includes(batch.id));
      setAvailableBatches(available);

      const dashboard = (dashboardResponse.data ?? {}) as unknown as DashboardData;
      setDashboardStats(dashboard);
      setRecentActivities(dashboard.recentActivities ?? []);
    } catch (error) {
      console.error('Failed to load batch data:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (
        errorMsg.includes('401') ||
        errorMsg.includes('Unauthorized') ||
        errorMsg.includes('Invalid token')
      ) {
        navigate('/login');
        return;
      }
      setEnrolledBatches([]);
      setAvailableBatches([]);
      setRecentActivities([]);
      setDashboardStats(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Only fetch once on mount
    void fetchBatchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add Socket.IO real-time updates
  useEffect(() => {
    const user = sessionManager.getUser();
    if (user?._id) {
      const token = localStorage.getItem('genzed_token') ?? localStorage.getItem('token') ?? '';
      socketService.connect(user._id.toString(), token);

      const handleBatchUpdate = (data: unknown) => {
        console.warn('Batch update received:', data);
        const eventData = data as { type?: string };
        if (
          eventData.type === 'batch_created' ||
          eventData.type === 'batch_updated' ||
          eventData.type === 'student_enrolled' ||
          eventData.type === 'student_removed'
        ) {
          void fetchBatchData();
        }
      };

      socketService.on('batch-notification', handleBatchUpdate);

      return () => {
        socketService.off('batch-notification', handleBatchUpdate);
        socketService.disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnrollBatch = async (batchId: string, enrollmentFee: number) => {
    try {
      setEnrollingBatchId(batchId);

      // If fee is required, redirect to payment page
      if (enrollmentFee && enrollmentFee > 0) {
        // Navigate to payment page with batch info
        navigate(`/payment?batchId=${batchId}&amount=${enrollmentFee}`);
        return;
      }

      // If no fee, enroll directly
      const user = sessionManager.getUser();
      const userId = (user as any)?.id ?? (user as any)?._id ?? '';
      const response = await apiService.enrollStudentInBatch(userId, batchId);

      if (response.success) {
        toast.success('Enrolled in batch successfully!');
        await fetchBatchData();
      } else {
        toast.error((response as any)?.message ?? 'Failed to enroll in batch');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('402')) {
        toast.error('Payment required for enrollment. Redirecting to payment...');
        navigate(`/payment?batchId=${batchId}&amount=${enrollmentFee}`);
      } else {
        toast.error('Failed to enroll in batch. Please try again.');
      }
    } finally {
      setEnrollingBatchId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Your Batches
            </h2>
            <p className='text-gray-600'>Preparing your learning journey...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='space-y-6'>
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
                        onClick={() => {
                          setActiveTab('available');
                        }}
                        className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                      >
                        <Search className='w-4 h-4 mr-2' />
                        Explore Available Batches
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  enrolledBatches.map(batch => {
                    const teacherName =
                      batch.teacherName ?? batch.teacher?.name ?? 'Unknown Teacher';
                    const teacherInitial = teacherName.charAt(0).toUpperCase();

                    return (
                      <Card
                        key={batch.id}
                        className='bg-gradient-to-r from-white to-blue-50/30 shadow-xl rounded-3xl border-0 hover:shadow-2xl transition-all duration-300'
                      >
                        <CardHeader>
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <CardTitle className='text-2xl mb-2 flex items-center gap-2'>
                                {batch.name ?? 'Unnamed Batch'}
                                <Badge className='bg-green-100 text-green-700'>Active</Badge>
                              </CardTitle>
                              <p className='text-gray-600'>
                                <span className='inline-block mr-3'>
                                  Teacher: <strong>{teacherName}</strong>
                                </span>
                                •
                                <span className='inline-block ml-3'>
                                  {batch.studentCount ?? 0} students
                                </span>
                              </p>
                              {batch.courseTitle && (
                                <p className='text-sm text-gray-500 mt-1'>
                                  Course: {batch.courseTitle}
                                </p>
                              )}
                            </div>
                            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0'>
                              {teacherInitial}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='grid grid-cols-2 gap-4 text-sm'>
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Calendar className='w-4 h-4 text-blue-500' />
                              <span>
                                Schedule:{' '}
                                {Array.isArray(batch.schedule)
                                  ? batch.schedule.join(', ')
                                  : (batch.schedule ?? 'TBD')}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Clock className='w-4 h-4 text-green-500' />
                              <span>
                                Joined:{' '}
                                {batch.enrolledAt
                                  ? new Date(batch.enrolledAt).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {(batch.enrollmentFee ?? 0) > 0 && (
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                              <p className='text-sm text-blue-900'>
                                <strong>Enrollment Fee:</strong> ₹
                                {(batch.enrollmentFee ?? 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}

                          <div className='flex flex-wrap gap-2'>
                            <Button
                              size='sm'
                              onClick={() => {
                                navigate('/student/live-classes');
                              }}
                              className='bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            >
                              <Video className='w-4 h-4 mr-2' />
                              View Classes
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => {
                                navigate('/student/recorded-content');
                              }}
                            >
                              <BookOpen className='w-4 h-4 mr-2' />
                              Materials
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => {
                                toast.info('Transfer request feature coming soon');
                              }}
                            >
                              <UserPlus className='w-4 h-4 mr-2' />
                              Request Transfer
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              className='text-red-600 hover:bg-red-50'
                              onClick={() => {
                                toast.info('Leave batch feature coming soon');
                              }}
                            >
                              <LogOut className='w-4 h-4 mr-2' />
                              Leave Batch
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
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
                        {recentActivities.map(activity => (
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
            {availableBatches.length === 0 ? (
              <Card className='bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl border-0'>
                <CardContent className='text-center py-16'>
                  <Search className='w-20 h-20 mx-auto mb-4 text-gray-300' />
                  <h3 className='text-2xl font-bold text-gray-700 mb-2'>No Available Batches</h3>
                  <p className='text-gray-500 mb-6'>
                    All available batches have been explored or you're already enrolled in all of them.
                  </p>
                  <Button
                    onClick={() => {
                      navigate('/courses');
                    }}
                    className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                  >
                    <BookOpen className='w-4 h-4 mr-2' />
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {availableBatches.map(batch => (
                  <Card key={batch.id} className='bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0 hover:shadow-xl transition-shadow'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-lg font-bold text-gray-900'>{batch.name || 'Batch'}</CardTitle>
                      <div className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                        <BookOpen className='w-4 h-4' />
                        {batch.subject || 'Subject'} • {batch.grade || 'Grade'}
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-600'>Teacher:</span>
                          <span className='font-medium'>
                            {typeof batch.teacher === 'string'
                              ? batch.teacher
                              : batch.teacher?.name ?? 'Unknown'}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-600'>Schedule:</span>
                          <span className='font-medium'>{batch.schedule ?? 'TBD'}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-600'>Students:</span>
                          <Badge variant='secondary'>
                            {Array.isArray(batch.studentCount) ? 0 : (batch.studentCount ?? 0)}/30
                          </Badge>
                        </div>
                      </div>

                      {batch.enrollmentFee !== undefined && batch.enrollmentFee > 0 && (
                        <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
                          <p className='text-sm text-gray-700'>
                            <strong>Enrollment Fee:</strong> ₹{batch.enrollmentFee.toLocaleString()}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={() => void handleEnrollBatch(batch.id, batch.enrollmentFee ?? 0)}
                        disabled={enrollingBatchId === batch.id}
                        className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      >
                        {enrollingBatchId === batch.id ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                            Processing...
                          </>
                        ) : batch.enrollmentFee && batch.enrollmentFee > 0 ? (
                          <>
                            <UserPlus className='w-4 h-4 mr-2' />
                            Pay Now & Enroll
                          </>
                        ) : (
                          <>
                            <UserPlus className='w-4 h-4 mr-2' />
                            Enroll Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MyBatches;
