import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Badge not used in this page
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import {
  FileText,
  TrendingUp,
  Users,
  Clock,
  Download,
  Calendar,
  Award,
  Target,
} from 'lucide-react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { toast } from 'sonner';

const SOCKET_URL = 'http://localhost:5001';

interface TeacherAnalytics {
  overview?: {
    liveClassesCount?: number;
    totalUsers?: number;
    averageRating?: number;
  };
  revenue?: {
    total?: number;
  };
  charts?: {
    monthly?: { month: string; users?: number; active?: number; revenue?: number }[];
    hours?: { hour: string; students?: number }[];
  };
  topPerformers?: {
    batches?: { name: string; students?: number; earnings?: number; rating?: number }[];
  };
}

const Reports: React.FC = () => {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchAnalytics = async () => {
    try {
      const resp = await apiService.getTeacherDashboard();
      // apiService returns either { success, data } or raw data
      const maybe = resp as unknown as { data?: TeacherAnalytics };
      const payload = maybe.data ?? (resp as unknown as TeacherAnalytics);
      setAnalytics(payload);
    } catch (err: unknown) {
      console.warn('Failed to fetch analytics', (err as Error)?.message ?? err);
      toast.error('Failed to load reports');
    }
  };

  useEffect(() => {
    void fetchAnalytics();

    const token = localStorage.getItem('genzed_token') ?? localStorage.getItem('token');
    try {
      const s: Socket = io(SOCKET_URL, { auth: { token } });
      s.on('connect', () => {
        console.warn('Connected socket for reports');
      });
      s.on('analytics-update', (_data: unknown) => {
        void fetchAnalytics();
      });
      s.on('user-count', (_d: unknown) => {
        void fetchAnalytics();
      });
      socketRef.current = s;
    } catch (e) {
      console.warn('socket init failed', e);
    }

    // polling fallback: refresh every 30s in case socket events are missed
    const poll = setInterval(() => {
      void fetchAnalytics();
    }, 30_000);

    return () => {
      clearInterval(poll);
      try {
        socketRef.current?.disconnect();
      } catch (e) {
        console.warn('socket disconnect error', e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  const chartData = (analytics?.charts?.monthly ?? []) as { month: string; users?: number; active?: number; revenue?: number }[];
  const hoursData = (analytics?.charts?.hours ?? []) as { hour: string; students?: number }[];
  const batches = analytics?.topPerformers?.batches ?? [];

  function handleExport() {
    const data = JSON.stringify(analytics ?? {}, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleRefresh() {
    void fetchAnalytics();
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.05)_0%,_transparent_50%)]' />
      <div className='relative z-10 p-6'>
        <div className='mb-8'>
          <div className='bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 animate-pulse' />
            <div className='flex items-center justify-between relative z-10'>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='bg-white/20 backdrop-blur-sm p-3 rounded-xl'>
                    <FileText className='w-8 h-8' />
                  </div>
                  <h1 className='text-4xl font-bold'>Performance Reports</h1>
                </div>
                <p className='text-purple-100 text-lg'>Analyze your teaching performance and growth</p>
              </div>
              <div className='hidden md:flex gap-2'>
                <Button onClick={handleRefresh} variant='secondary' size='sm' className='bg-white/20 border-0 text-white'>
                  Refresh
                </Button>
                <Button onClick={handleExport} variant='secondary' size='sm' className='bg-white/20 border-0 text-white'>
                  <Download className='w-4 h-4 mr-2' /> Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Total Classes</p>
                  <p className='text-3xl font-bold text-gray-900'>{analytics?.overview?.liveClassesCount ?? 0}</p>
                  <p className='text-xs text-gray-500'>Conducted</p>
                </div>
                <div className='bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl'>
                  <Calendar className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Total Students</p>
                  <p className='text-3xl font-bold text-gray-900'>{analytics?.overview?.totalUsers ?? 0}</p>
                  <p className='text-xs text-gray-500'>Taught</p>
                </div>
                <div className='bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl'>
                  <Users className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Total Earnings</p>
                  <p className='text-3xl font-bold text-gray-900'>{formatCurrency(Number(analytics?.revenue?.total ?? 0))}</p>
                  <p className='text-xs text-gray-500'>Lifetime</p>
                </div>
                <div className='bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl'>
                  <TrendingUp className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Average Rating</p>
                  <p className='text-3xl font-bold text-gray-900'>{analytics?.overview?.averageRating ?? 0}</p>
                  <p className='text-xs text-gray-500'>Out of 5</p>
                </div>
                <div className='bg-gradient-to-br from-orange-500 to-red-400 p-4 rounded-xl'>
                  <Award className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance Chart */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          <Card className='border-0 shadow-xl bg-white/90'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'><TrendingUp className='w-5 h-5 text-purple-600'/> Monthly Performance</CardTitle>
              <CardDescription className='text-gray-500'>Your performance over the last months</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id='colorUsers' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8}/>
                        <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey='month' />
                    <YAxis />
                    <CartesianGrid strokeDasharray='3 3' />
                    <Tooltip />
                    <Area type='monotone' dataKey='users' stroke='#8b5cf6' fillOpacity={1} fill='url(#colorUsers)'/>
                    <Area type='monotone' dataKey='active' stroke='#10b981' fill='#10b981' fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'><Clock className='w-5 h-5 text-purple-600'/> Active Hours Distribution</CardTitle>
              <CardDescription className='text-gray-500'>Peak learning hours during the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={hoursData}>
                    <XAxis dataKey='hour' />
                    <YAxis />
                    <CartesianGrid strokeDasharray='3 3' />
                    <Tooltip />
                    <Line type='monotone' dataKey='students' stroke='#6366f1' strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Batches */}
        <Card className='border-0 shadow-xl bg-white/90'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-purple-600'><Target className='w-5 h-5'/> Top Performing Batches</CardTitle>
            <CardDescription className='text-gray-500'>Your most successful batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {(analytics?.topPerformers?.batches ?? []).length === 0 ? (
                <div className='text-center py-12 text-gray-500'>No batch data available</div>
              ) : (
                (analytics?.topPerformers?.batches ?? []).map((b: any, i: number) => (
                  <div key={i} className='flex items-center justify-between p-4 bg-white rounded-lg border'>
                    <div>
                      <h4 className='font-semibold text-gray-900'>{b.name}</h4>
                      <p className='text-sm text-gray-500'>{b.students} students • {b.rating} rating</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold text-green-600'>{formatCurrency(b.earnings)}</p>
                      <p className='text-sm text-gray-500'>Earnings</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
