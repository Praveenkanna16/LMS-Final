import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Video,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  PlayCircle,
  Eye,
  Loader2,
  Award,
  Target,
  Sparkles,
  Activity,
  Zap,
  Crown,
  Star,
} from 'lucide-react';
import type { Batch, DashboardStats } from '@/types';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, batchesResponse] = await Promise.all([
          apiService.getTeacherDashboard(),
          apiService.getMyTeacherBatches(),
        ]);

        // Handle wrapped response from API
        const dashboardData =
          'data' in dashboardResponse ? dashboardResponse.data : dashboardResponse;
        setDashboardData(dashboardData);
        setBatches(batchesResponse.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboardData();
  }, [toast]);

  const handleCreateBatch = () => {
    navigate('/teacher/batches/create');
  };

  const handleJoinClass = (batchId: string) => {
    navigate(`/live-class/${batchId}`);
  };

  const handleViewBatch = (batchId: string) => {
    navigate(`/teacher/batches/${batchId}`);
  };

  const todayClasses: Batch[] = dashboardData?.upcomingClasses?.slice(0, 3) ?? [];

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        {/* Floating Elements */}
        <div className='absolute top-20 left-10 animate-bounce delay-1000'>
          <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
            <Award className='w-8 h-8 text-white' />
          </div>
        </div>
        <div className='absolute top-32 right-16 animate-bounce delay-2000'>
          <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
            <Crown className='w-6 h-6 text-white' />
          </div>
        </div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Teacher Dashboard
            </h2>
            <p className='text-gray-600'>Preparing your teaching console...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <Award className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <Crown className='w-6 h-6 text-white' />
        </div>
      </div>
      <div className='absolute bottom-20 left-20 animate-bounce delay-3000'>
        <div className='w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
          <Target className='w-7 h-7 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                    <Award className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                      <Crown className='w-4 h-4 mr-2' />
                      Teacher Portal
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Welcome back, {user?.name}! 
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Manage your classes and track your{' '}
                      <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold'>
                        teaching success
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl'>
                  <Video className='w-4 h-4 mr-2' />
                  Start Live Class
                </Button>
                <Button
                  onClick={handleCreateBatch}
                  className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Create Batch
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Total Earnings
                </CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <DollarSign className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-green-600 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  ₹{dashboardData?.totalEarnings ?? 0}
                </div>
                <p className='text-sm text-gray-600'>Lifetime earnings</p>
                <div className='flex items-center mt-2'>
                  <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
                  <span className='text-xs text-green-600 font-medium'>Excellent work!</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Available for Payout
                </CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <TrendingUp className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-blue-600 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  ₹{dashboardData?.availableForPayout ?? 0}
                </div>
                <p className='text-sm text-gray-600'>Ready to withdraw</p>
                <div className='flex items-center mt-2'>
                  <Sparkles className='w-4 h-4 text-blue-500 mr-1' />
                  <span className='text-xs text-blue-600 font-medium'>Available now!</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>Total Batches</CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Users className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-purple-600 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {dashboardData?.batchCount ?? 0}
                </div>
                <p className='text-sm text-gray-600'>Active batches</p>
                <div className='flex items-center mt-2'>
                  <Activity className='w-4 h-4 text-purple-500 mr-1' />
                  <span className='text-xs text-purple-600 font-medium'>Currently running</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Today's Classes
                </CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Calendar className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-orange-600 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {todayClasses.length}
                </div>
                <p className='text-sm text-gray-600'>Scheduled for today</p>
                <div className='flex items-center mt-2'>
                  <Clock className='w-4 h-4 text-orange-500 mr-1' />
                  <span className='text-xs text-orange-600 font-medium'>Ready to teach!</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Today's Classes */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='relative z-10'>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <Clock className='h-6 w-6 text-green-600' />
                  Today's Classes
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Your scheduled teaching sessions for today
                </CardDescription>
              </CardHeader>
              <CardContent className='relative z-10'>
                {todayClasses.length > 0 ? (
                  <div className='space-y-4'>
                    {todayClasses.map(classItem => (
                      <div
                        key={classItem._id}
                        className='flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-300'
                      >
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h4 className='font-semibold text-gray-900'>{classItem.name}</h4>
                            <Badge className='bg-green-100 text-green-700 text-xs'>Live</Badge>
                          </div>
                          <p className='text-sm text-gray-600 mb-2'>{classItem.course?.title || classItem.subject || 'Course'}</p>
                          <div className='flex items-center gap-4 text-xs text-gray-500'>
                            <div className='flex items-center gap-1'>
                              <Users className='w-3 h-3' />
                              <span>{classItem.students?.length || 0} students</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              <span>
                                {classItem.schedule?.[0]?.startTime ? new Date(classItem.schedule[0].startTime).toLocaleTimeString() : 'TBD'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              handleViewBatch(classItem._id);
                            }}
                            className='border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                          >
                            <Eye className='h-4 w-4 mr-1' />
                            View
                          </Button>
                          <Button
                            size='sm'
                            onClick={() => {
                              handleJoinClass(classItem._id);
                            }}
                            className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                          >
                            <PlayCircle className='h-4 w-4 mr-1' />
                            Start Class
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <div className='w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <Calendar className='h-8 w-8 text-gray-400' />
                    </div>
                    <p className='text-gray-900 font-semibold mb-2'>
                      No classes scheduled for today
                    </p>
                    <p className='text-sm text-gray-600 mb-4'>
                      Enjoy your day off or create a new batch!
                    </p>
                    <Button
                      variant='outline'
                      onClick={() => {
                        navigate('/teacher/schedule');
                      }}
                      className='border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    >
                      <Calendar className='w-4 h-4 mr-2' />
                      View Schedule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Batches */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='relative z-10'>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <Users className='h-6 w-6 text-purple-600' />
                  My Recent Batches
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Your latest created learning communities
                </CardDescription>
              </CardHeader>
              <CardContent className='relative z-10'>
                {batches.length > 0 ? (
                  <div className='space-y-4'>
                    {batches.slice(0, 3).map(batch => (
                      <div
                        key={batch._id}
                        className='flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-300'
                      >
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h4 className='font-semibold text-gray-900'>{batch.name}</h4>
                            <Badge className='bg-purple-100 text-purple-700 text-xs'>
                              {batch.students?.length || 0}/{batch.studentLimit || 30} enrolled
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-600 mb-2'>{batch.course?.title || batch.subject || 'Course'}</p>
                          <div className='flex items-center gap-2 text-xs text-gray-500'>
                            <div className='w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center'>
                              <Star className='w-3 h-3 text-white' />
                            </div>
                            <span>{batch.students?.length || 0} students enrolled</span>
                          </div>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            handleViewBatch(batch._id);
                          }}
                          className='border-gray-300 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600'
                        >
                          <Eye className='h-4 w-4 mr-1' />
                          Manage
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant='outline'
                      className='w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      onClick={() => {
                        navigate('/teacher/batches');
                      }}
                    >
                      <Users className='w-4 h-4 mr-2' />
                      View All Batches ({batches.length})
                    </Button>
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <div className='w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <Users className='h-8 w-8 text-gray-400' />
                    </div>
                    <p className='text-gray-900 font-semibold mb-2'>No batches created yet</p>
                    <p className='text-sm text-gray-600 mb-4'>
                      Start building your student community
                    </p>
                    <Button
                      onClick={handleCreateBatch}
                      className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Create Your First Batch
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
            <CardHeader className='relative z-10'>
              <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                <Zap className='h-6 w-6 text-blue-600' />
                Quick Actions
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Manage your teaching activities efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50/50 hover:text-green-600 transition-all duration-300 transform hover:scale-105'
                  onClick={handleCreateBatch}
                >
                  <Plus className='h-8 w-8' />
                  <span className='font-semibold'>Create Batch</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50/50 hover:text-purple-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/teacher/batches');
                  }}
                >
                  <Users className='h-8 w-8' />
                  <span className='font-semibold'>Manage Batches</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/teacher/payouts');
                  }}
                >
                  <DollarSign className='h-8 w-8' />
                  <span className='font-semibold'>Request Payout</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50/50 hover:text-orange-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/teacher/schedule');
                  }}
                >
                  <Calendar className='h-8 w-8' />
                  <span className='font-semibold'>View Schedule</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
