import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAnalytics } from '@/hooks/api';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Download,
  BarChart3,
  Activity,
  GraduationCap,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');
  const { data: analyticsData, isLoading, error, refetch } = useAdminAnalytics(timeRange);

  const exportReport = (reportType: string) => {
    toast.success(`Exporting ${reportType} report...`);
    
    // Prepare comprehensive report data
    const reportData = {
      type: reportType,
      generatedAt: new Date().toISOString(),
      timeRange,
      data: analyticsData,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Analytics
            </h2>
            <p className='text-gray-600'>Preparing your analytics dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Error Loading Analytics</h2>
            <p className='text-gray-600 mb-6'>
              {error instanceof Error ? error.message : 'Failed to load analytics data'}
            </p>
            <Button
              onClick={() => void refetch()}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const analytics = analyticsData ?? {
    overview: {
      totalUsers: 0,
      totalCourses: 0,
      totalBatches: 0,
      totalRevenue: 0,
      activeUsers: 0,
      completionRate: 0,
      liveClassesCount: 0,
      averageRating: 0,
    },
    growth: {
      usersGrowth: 0,
      coursesGrowth: 0,
      revenueGrowth: 0,
      engagementGrowth: 0,
    },
    topPerformers: {
      teachers: [],
      courses: [],
      students: [],
    },
    revenue: {
      total: 0,
      monthly: [],
      byCategory: {},
    },
    charts: {
      userGrowth: [],
      activeHours: [],
      attendanceTrend: [],
      batchPerformance: [],
      teacherPerformance: [],
      participation: [],
    },
  };

  // Extract chart data from API response with fallback to empty arrays
  const userGrowthData = analytics.charts.userGrowth;
  const activeHoursData = analytics.charts.activeHours;
  const attendanceTrendData = analytics.charts.attendanceTrend;
  const batchPerformanceData = analytics.charts.batchPerformance;
  const teacherPerformanceData = analytics.charts.teacherPerformance;
  const participationData = analytics.charts.participation;

  const hasChartData = userGrowthData.length > 0 || activeHoursData.length > 0 || 
                       batchPerformanceData.length > 0 || teacherPerformanceData.length > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ChevronUp className='w-4 h-4 text-green-400' />;
    if (growth < 0) return <ChevronDown className='w-4 h-4 text-red-400' />;
    return <span className='w-4 h-4' />;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <TrendingUp className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <BarChart3 className='w-6 h-6 text-white' />
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
                    <TrendingUp className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                      <Activity className='w-4 h-4 mr-2' />
                      Analytics Center
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Analytics Dashboard
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Platform performance and user insights with{' '}
                      <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold'>
                        real-time data
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className='w-40 bg-white border-gray-200'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='week'>Last Week</SelectItem>
                    <SelectItem value='month'>Last Month</SelectItem>
                    <SelectItem value='quarter'>Last Quarter</SelectItem>
                    <SelectItem value='year'>Last Year</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => void refetch()}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Refresh
                </Button>

                <Button
                  onClick={() => exportReport('comprehensive')}
                  className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Total Users</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {analytics.overview.totalUsers.toLocaleString()}
                    </p>
                    <div className='flex items-center mt-2'>
                      {getGrowthIcon(analytics.growth.usersGrowth)}
                      <span
                        className={`text-xs font-medium ml-1 ${analytics.growth.usersGrowth > 0 ? 'text-green-600' : analytics.growth.usersGrowth < 0 ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {formatPercentage(analytics.growth.usersGrowth)} this {timeRange}
                      </span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Total Courses</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {analytics.overview.totalCourses}
                    </p>
                    <div className='flex items-center mt-2'>
                      {getGrowthIcon(analytics.growth.coursesGrowth)}
                      <span
                        className={`text-xs font-medium ml-1 ${analytics.growth.coursesGrowth > 0 ? 'text-green-600' : analytics.growth.coursesGrowth < 0 ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {formatPercentage(analytics.growth.coursesGrowth)} this {timeRange}
                      </span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <BookOpen className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Total Revenue</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {formatCurrency(analytics.overview.totalRevenue)}
                    </p>
                    <div className='flex items-center mt-2'>
                      {getGrowthIcon(analytics.growth.revenueGrowth)}
                      <span
                        className={`text-xs font-medium ml-1 ${analytics.growth.revenueGrowth > 0 ? 'text-green-600' : analytics.growth.revenueGrowth < 0 ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {formatPercentage(analytics.growth.revenueGrowth)} this {timeRange}
                      </span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <DollarSign className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Active Users</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {analytics.overview.activeUsers.toLocaleString()}
                    </p>
                    <div className='flex items-center mt-2'>
                      {getGrowthIcon(analytics.growth.engagementGrowth)}
                      <span
                        className={`text-xs font-medium ml-1 ${analytics.growth.engagementGrowth > 0 ? 'text-green-600' : analytics.growth.engagementGrowth < 0 ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {formatPercentage(analytics.growth.engagementGrowth)} this {timeRange}
                      </span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <Eye className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* User Growth Chart */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <CardTitle className='text-gray-900 flex items-center gap-2'>
                  <TrendingUp className='w-5 h-5 text-blue-600' />
                  User Growth Trend
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Total and active users over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowthData && userGrowthData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id='colorUsers' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
                          <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id='colorActive' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8} />
                          <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                      <XAxis dataKey='month' stroke='#6b7280' />
                      <YAxis stroke='#6b7280' />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area
                        type='monotone'
                        dataKey='users'
                        stroke='#3b82f6'
                        fillOpacity={1}
                        fill='url(#colorUsers)'
                        name='Total Users'
                      />
                      <Area
                        type='monotone'
                        dataKey='active'
                        stroke='#8b5cf6'
                        fillOpacity={1}
                        fill='url(#colorActive)'
                        name='Active Users'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='h-[300px] flex items-center justify-center bg-gray-50 rounded-lg'>
                    <p className='text-gray-500'>No user growth data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Hours Chart */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <CardTitle className='text-gray-900 flex items-center gap-2'>
                  <Clock className='w-5 h-5 text-purple-600' />
                  Active Hours Distribution
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Peak learning hours during the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeHoursData && activeHoursData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={activeHoursData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                      <XAxis dataKey='hour' stroke='#6b7280' />
                      <YAxis stroke='#6b7280' />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey='students' fill='#8b5cf6' radius={[8, 8, 0, 0]} name='Active Students' />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='h-[300px] flex items-center justify-center bg-gray-50 rounded-lg'>
                    <p className='text-gray-500'>No active hours data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Trend Chart */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <CardTitle className='text-gray-900 flex items-center gap-2'>
                  <Calendar className='w-5 h-5 text-green-600' />
                  Attendance Trend
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Weekly attendance percentage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceTrendData && attendanceTrendData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={attendanceTrendData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                      <XAxis dataKey='week' stroke='#6b7280' />
                      <YAxis stroke='#6b7280' domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='attendance'
                        stroke='#10b981'
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 6 }}
                        name='Attendance %'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='h-[300px] flex items-center justify-center bg-gray-50 rounded-lg'>
                    <p className='text-gray-500'>No attendance trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Class Participation Chart */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <CardTitle className='text-gray-900 flex items-center gap-2'>
                  <Video className='w-5 h-5 text-orange-600' />
                  Class Participation
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Student engagement levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participationData && participationData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <PieChart>
                      <Pie
                        data={participationData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill='#8884d8'
                        dataKey='value'
                      >
                        {participationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='h-[300px] flex items-center justify-center bg-gray-50 rounded-lg'>
                    <p className='text-gray-500'>No participation data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Cards */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Batch Performance */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-gray-900 flex items-center gap-2'>
                      <GraduationCap className='w-5 h-5 text-blue-600' />
                      Batch-wise Performance
                    </CardTitle>
                    <CardDescription className='text-gray-600'>
                      Performance metrics by batch
                    </CardDescription>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => exportReport('batch-performance')}
                    className='border-blue-200 hover:bg-blue-50'
                  >
                    <Download className='w-4 h-4 mr-2' />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {batchPerformanceData.map((batch, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg'>
                        <span className='text-white font-bold text-sm'>{batch.batch.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>{batch.batch}</p>
                        <p className='text-sm text-gray-600'>{batch.students} students</p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-2xl font-bold text-blue-600'>{batch.performance}%</p>
                      <p className='text-xs text-gray-600'>Avg Performance</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Teacher Performance */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-gray-900 flex items-center gap-2'>
                      <Users className='w-5 h-5 text-purple-600' />
                      Teacher-wise Performance
                    </CardTitle>
                    <CardDescription className='text-gray-600'>
                      Top performing teachers
                    </CardDescription>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => exportReport('teacher-performance')}
                    className='border-purple-200 hover:bg-purple-50'
                  >
                    <Download className='w-4 h-4 mr-2' />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {teacherPerformanceData.map((teacher, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg'>
                        <span className='text-white font-bold text-sm'>
                          {teacher.name.split(' ')[0].charAt(0)}
                          {teacher.name.split(' ')[1].charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>{teacher.name}</p>
                        <p className='text-sm text-gray-600'>{teacher.classes} classes taught</p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='flex items-center gap-1'>
                        <span className='text-2xl font-bold text-purple-600'>{teacher.rating}</span>
                        <span className='text-yellow-500'>★</span>
                      </div>
                      <p className='text-xs text-gray-600'>Rating</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
            <CardHeader>
              <CardTitle className='text-gray-900 flex items-center gap-2'>
                <Download className='w-5 h-5 text-green-600' />
                Export Analytics Reports
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Download detailed reports for further analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Button
                  onClick={() => exportReport('user-growth')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-20 flex flex-col items-center justify-center gap-2'
                >
                  <Users className='w-6 h-6' />
                  <span className='text-sm'>User Growth Report</span>
                </Button>

                <Button
                  onClick={() => exportReport('attendance')}
                  className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-20 flex flex-col items-center justify-center gap-2'
                >
                  <Calendar className='w-6 h-6' />
                  <span className='text-sm'>Attendance Report</span>
                </Button>

                <Button
                  onClick={() => exportReport('revenue')}
                  className='bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white h-20 flex flex-col items-center justify-center gap-2'
                >
                  <DollarSign className='w-6 h-6' />
                  <span className='text-sm'>Revenue Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
