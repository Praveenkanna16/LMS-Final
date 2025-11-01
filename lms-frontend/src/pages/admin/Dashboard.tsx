import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserCheck,
  Video,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Crown,
  Zap,
  BarChart3,
  Shield,
  Settings,
  Bell,
  Send,
  Search,
  Calendar,
} from 'lucide-react';
import type { DashboardStats, Payout, User } from '@/types';
import { toast as sonnerToast } from 'sonner';

interface PayoutResponse {
  payouts?: Payout[];
}

interface ErrorWithMessage {
  message?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Payment Dialog State
  const [showQuickPayDialog, setShowQuickPayDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [searchedTeacher, setSearchedTeacher] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMode: 'online',
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardResponse, usersResponse, payoutsResponse] = await Promise.all([
        apiService.getAdminDashboard(),
        apiService.getAllUsers(),
        apiService.getPendingPayouts(),
      ]);

      // Handle wrapped response from API
      const dashboardApiData = dashboardResponse.data;
      
      // Transform backend response to match frontend expectations
      const transformedData: DashboardStats = {
        studentCount: dashboardApiData?.overview?.totalStudents ?? 0,
        teacherCount: dashboardApiData?.overview?.totalTeachers ?? 0,
        batchCount: dashboardApiData?.overview?.activeBatches ?? 0,
        pendingPayouts: dashboardApiData?.overview?.pendingPayouts ?? 0,
        totalEarnings: dashboardApiData?.overview?.totalRevenue ?? 0,
        upcomingClasses: dashboardApiData?.recentActivity?.upcomingClasses ?? [],
        overview: dashboardApiData?.overview,
        recentActivity: dashboardApiData?.recentActivity,
        systemHealth: dashboardApiData?.systemHealth,
      };
      
      setDashboardData(transformedData);
      
      // Extract data arrays from API responses
      const usersData = 'data' in usersResponse ? usersResponse.data : usersResponse;
      const payoutsResponseData = payoutsResponse.data as PayoutResponse;
      const payoutsData = payoutsResponseData?.payouts ?? payoutsResponseData;
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPendingPayouts(Array.isArray(payoutsData) ? payoutsData : []);
    } catch (error) {
      const errorWithMessage = error as ErrorWithMessage;
      console.error('Dashboard fetch error:', error);
      toast({
        title: 'Error',
        description: errorWithMessage.message ?? 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApprovePayout = async (payoutId: string) => {
    try {
      await apiService.approvePayout(payoutId);
      toast({
        title: 'Success',
        description: 'Payout approved successfully',
      });
      // Refresh data
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve payout',
        variant: 'destructive',
      });
    }
  };

  // Quick Payment Handlers
  const loadTeachers = async () => {
    try {
      setPaymentLoading(true);
      const response = await apiService.getAllTeachersWithSalaryInfo();
      // API returns { success: true, data: { teachers: [...], pagination: {...} } }
      const teachers = response.data?.data?.teachers || response.data?.teachers || [];
      setTeachersList(teachers);
    } catch (error: any) {
      console.error('Failed to load teachers:', error);
      sonnerToast.error('Failed to load teachers');
      setTeachersList([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSearchTeacher = async () => {
    if (!searchEmail.trim()) {
      sonnerToast.error('Please enter a teacher email');
      return;
    }

    try {
      setPaymentLoading(true);
      const teacher = teachersList.find((t: any) => 
        t.email.toLowerCase() === searchEmail.toLowerCase()
      );

      if (teacher) {
        setSearchedTeacher(teacher);
        sonnerToast.success(`Teacher found: ${teacher.name}`);
      } else {
        sonnerToast.error('Teacher not found with this email');
        setSearchedTeacher(null);
      }
    } catch (error: any) {
      sonnerToast.error(error.message || 'Failed to search teacher');
      setSearchedTeacher(null);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachersList.find((t: any) => t.id.toString() === teacherId);
    if (teacher) {
      setSearchedTeacher(teacher);
      setSearchEmail(teacher.email);
    }
  };

  const handleQuickPayment = async () => {
    if (!searchedTeacher) {
      sonnerToast.error('Please search for a teacher first');
      return;
    }

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      sonnerToast.error('Please enter a valid amount');
      return;
    }

    try {
      setPaymentLoading(true);
      const response = await apiService.initiateSalaryPayment({
        teacherId: searchedTeacher.id,
        amount: parseFloat(paymentForm.amount),
        month: paymentForm.month.toString(),
        year: paymentForm.year.toString(),
        paymentMode: paymentForm.paymentMode,
      });

      // Check if payment URL is returned (for online payments)
      // API returns { success: true, data: { payment: {...}, paymentUrl: '...', paymentMode: '...' } }
      const paymentData = response.data?.data || response.data;
      const paymentUrl = paymentData?.paymentUrl;
      
      if (paymentUrl) {
        sonnerToast.success('Redirecting to payment gateway...');
        // Redirect to Cashfree payment page
        window.location.href = paymentUrl;
      } else {
        sonnerToast.success('Payment initiated successfully!');
        setShowQuickPayDialog(false);
        setSearchEmail('');
        setSearchedTeacher(null);
        setPaymentForm({
          amount: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          paymentMode: 'online',
        });
        void fetchDashboardData();
      }
    } catch (error: any) {
      sonnerToast.error(error.message || 'Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const recentActivities = [
    {
      id: 1,
      type: 'system',
      message: `${pendingPayouts.length} pending payout requests`,
      time: 'Just now',
      status: pendingPayouts.length > 0 ? 'warning' : 'info',
    },
    {
      id: 2,
      type: 'user',
      message: `${Array.isArray(users) ? users.filter(u => u.role === 'teacher').length : 0} teachers active`,
      time: '1 hour ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'payment',
      message: `₹${dashboardData?.totalEarnings || 0} total platform earnings`,
      time: '2 hours ago',
      status: 'success',
    },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        {/* Floating Elements */}
        <div className='absolute top-20 left-10 animate-bounce delay-1000'>
          <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
            <BarChart3 className='w-8 h-8 text-white' />
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
              Loading Admin Dashboard
            </h2>
            <p className='text-gray-600'>Preparing your management console...</p>
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
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <BarChart3 className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <Crown className='w-6 h-6 text-white' />
        </div>
      </div>
      <div className='absolute bottom-20 left-20 animate-bounce delay-3000'>
        <div className='w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
          <Shield className='w-7 h-7 text-white' />
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
                    <Crown className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                      <Shield className='w-4 h-4 mr-2' />
                      Admin Control Center
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Admin Dashboard
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Monitor platform performance and manage operations with{' '}
                      <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold'>
                        AI-powered insights
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl'>
                  <Bell className='w-4 h-4 mr-2' />
                  Notifications
                </Button>
                <Button
                  variant='outline'
                  className='border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                >
                  <Settings className='w-4 h-4 mr-2' />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Total Students
                </CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Users className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {dashboardData?.studentCount || 0}
                </div>
                <p className='text-sm text-gray-600'>Active learners on platform</p>
                <div className='flex items-center mt-2'>
                  <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
                  <span className='text-xs text-green-600 font-medium'>+12% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Total Teachers
                </CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <UserCheck className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {dashboardData?.teacherCount || 0}
                </div>
                <p className='text-sm text-gray-600'>Verified instructors</p>
                <div className='flex items-center mt-2'>
                  <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
                  <span className='text-xs text-green-600 font-medium'>+8% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Active Batches
                </CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Video className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {dashboardData?.batchCount || 0}
                </div>
                <p className='text-sm text-gray-600'>Live classes running</p>
                <div className='flex items-center mt-2'>
                  <Activity className='w-4 h-4 text-blue-500 mr-1' />
                  <span className='text-xs text-blue-600 font-medium'>Currently active</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Pending Payouts
                </CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Clock className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {dashboardData?.pendingPayouts || 0}
                </div>
                <p className='text-sm text-gray-600'>Awaiting approval</p>
                <div className='flex items-center mt-2'>
                  <AlertCircle className='w-4 h-4 text-orange-500 mr-1' />
                  <span className='text-xs text-orange-600 font-medium'>Requires attention</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Recent Activities */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='relative z-10'>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <Activity className='h-6 w-6 text-blue-600' />
                  Recent Activity
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Latest platform activities and system updates
                </CardDescription>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='space-y-4'>
                  {recentActivities.map(activity => (
                    <div
                      key={activity.id}
                      className='flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-300'
                    >
                      <div className='flex items-center gap-3'>
                        {activity.status === 'success' && (
                          <CheckCircle className='h-5 w-5 text-green-500' />
                        )}
                        {activity.status === 'warning' && (
                          <AlertCircle className='h-5 w-5 text-yellow-500' />
                        )}
                        {activity.status === 'info' && (
                          <Activity className='h-5 w-5 text-blue-500' />
                        )}
                        <div>
                          <p className='font-semibold text-gray-900'>{activity.message}</p>
                          <p className='text-sm text-gray-600'>{activity.time}</p>
                        </div>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Payouts */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='relative z-10'>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <DollarSign className='h-6 w-6 text-green-600' />
                  Pending Payouts
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Payout requests awaiting your approval
                </CardDescription>
              </CardHeader>
              <CardContent className='relative z-10'>
                {pendingPayouts.length > 0 ? (
                  <div className='space-y-4'>
                    {pendingPayouts.slice(0, 3).map(payout => (
                      <div
                        key={payout._id}
                        className='flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-300'
                      >
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center'>
                              <span className='text-white font-semibold text-sm'>
                                {payout.teacher.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className='font-semibold text-gray-900'>{payout.teacher.name}</h4>
                              <p className='text-sm text-gray-600'>₹{payout.amount}</p>
                            </div>
                          </div>
                          <p className='text-xs text-gray-500 ml-13'>
                            {new Date(
                              payout.requestedAt || payout.createdAt || ''
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size='sm'
                          onClick={() => handleApprovePayout(payout._id)}
                          className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                        >
                          <CheckCircle className='w-4 h-4 mr-1' />
                          Approve
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant='outline'
                      className='w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      onClick={() => {
                        navigate('/admin/payouts');
                      }}
                    >
                      <DollarSign className='w-4 h-4 mr-2' />
                      View All Payouts ({pendingPayouts.length})
                    </Button>
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <div className='w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <CheckCircle className='h-8 w-8 text-green-500' />
                    </div>
                    <p className='text-gray-900 font-semibold mb-2'>All payouts up to date!</p>
                    <p className='text-sm text-gray-600'>
                      No pending payout requests at the moment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-16 translate-x-16'></div>
            <CardHeader className='relative z-10'>
              <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                <Zap className='h-6 w-6 text-purple-600' />
                Quick Actions
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Manage platform operations efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/admin/users');
                  }}
                >
                  <Users className='h-8 w-8' />
                  <span className='font-semibold'>Manage Users</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50/50 hover:text-green-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/admin/payouts');
                  }}
                >
                  <DollarSign className='h-8 w-8' />
                  <span className='font-semibold'>Process Payouts</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50/50 hover:text-purple-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/admin/batches');
                  }}
                >
                  <Video className='h-8 w-8' />
                  <span className='font-semibold'>Monitor Batches</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50/50 hover:text-orange-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/admin/analytics');
                  }}
                >
                  <BarChart3 className='h-8 w-8' />
                  <span className='font-semibold'>View Analytics</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-24 flex-col gap-3 border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50/50 hover:text-teal-600 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    navigate('/admin/teacher-salaries');
                  }}
                >
                  <DollarSign className='h-8 w-8' />
                  <span className='font-semibold'>Teacher Salaries</span>
                </Button>
                <Button
                  className='h-24 flex-col gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    setShowQuickPayDialog(true);
                  }}
                >
                  <Send className='h-8 w-8' />
                  <span className='font-semibold'>Quick Pay Teacher</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Payment Dialog */}
      <Dialog 
        open={showQuickPayDialog} 
        onOpenChange={(open) => {
          setShowQuickPayDialog(open);
          if (open) {
            loadTeachers();
          }
        }}
      >
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-2xl'>
              <Send className='h-6 w-6 text-emerald-600' />
              Quick Pay Teacher
            </DialogTitle>
            <DialogDescription>
              Select a teacher and make an instant payment via Cashfree
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Teacher Selection */}
            <div className='space-y-4'>
              <Label htmlFor='teacher' className='text-base font-semibold'>
                Select Teacher
              </Label>
              <Select
                value={searchedTeacher?.id?.toString() || ''}
                onValueChange={handleSelectTeacher}
                disabled={paymentLoading || teachersList.length === 0}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={paymentLoading ? 'Loading teachers...' : 'Choose a teacher'} />
                </SelectTrigger>
                <SelectContent>
                  {teachersList.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      <div className='flex items-center justify-between w-full'>
                        <span className='font-medium'>{teacher.name}</span>
                        <span className='text-sm text-gray-500 ml-4'>{teacher.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Info Section */}
            {searchedTeacher && (
              <div className='p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center'>
                    <span className='text-white font-bold text-lg'>
                      {searchedTeacher.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900'>{searchedTeacher.name}</h3>
                    <p className='text-sm text-gray-600'>{searchedTeacher.email}</p>
                  </div>
                </div>
                {searchedTeacher.bankAccount ? (
                  <div className='flex items-center gap-2 text-sm'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    <span className='text-green-700 font-medium'>
                      Bank account verified - {searchedTeacher.bankAccount.bankName}
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-sm'>
                    <AlertCircle className='h-4 w-4 text-orange-600' />
                    <span className='text-orange-700 font-medium'>
                      No bank account on file (Manual payment only)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Form Section */}
            {searchedTeacher && (
              <div className='space-y-4 pt-4 border-t'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='amount' className='font-semibold'>
                      Amount (₹)
                    </Label>
                    <Input
                      id='amount'
                      type='number'
                      placeholder='Enter amount'
                      value={paymentForm.amount}
                      onChange={e =>
                        setPaymentForm({ ...paymentForm, amount: e.target.value })
                      }
                      className='text-lg font-semibold'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='paymentMode' className='font-semibold'>
                      Payment Mode
                    </Label>
                    <Select
                      value={paymentForm.paymentMode}
                      onValueChange={value =>
                        setPaymentForm({ ...paymentForm, paymentMode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='online'>Online (Cashfree)</SelectItem>
                        <SelectItem value='manual'>Manual Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='month' className='font-semibold flex items-center gap-2'>
                      <Calendar className='h-4 w-4' />
                      Month
                    </Label>
                    <Select
                      value={paymentForm.month.toString()}
                      onValueChange={value =>
                        setPaymentForm({ ...paymentForm, month: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2024, month - 1).toLocaleString('default', {
                              month: 'long',
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='year' className='font-semibold'>
                      Year
                    </Label>
                    <Select
                      value={paymentForm.year.toString()}
                      onValueChange={value =>
                        setPaymentForm({ ...paymentForm, year: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                          year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowQuickPayDialog(false);
                setSearchEmail('');
                setSearchedTeacher(null);
              }}
              disabled={paymentLoading}
            >
              Cancel
            </Button>
            {searchedTeacher && (
              <Button
                onClick={handleQuickPayment}
                disabled={paymentLoading}
                className='bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg'
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className='mr-2 h-4 w-4' />
                    Initiate Payment
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
