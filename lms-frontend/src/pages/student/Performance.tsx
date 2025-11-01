import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Award, Calendar, Target, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceData {
  attendanceTrends: Array<{ month: string; percentage: number }>;
  testPerformance: Array<{ date: string; score: number; subject: string }>;
  overallStats: {
    avgAttendance: number;
    avgScore: number;
  };
}

const StudentPerformance: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');

  const { data: performanceData, isLoading } = useQuery<PerformanceData>({
    queryKey: ['performance', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/student/performance?range=${timeRange}d`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      return result.data;
    },
  });

  // Calculate subject-wise performance for radar chart
  const subjectPerformance = React.useMemo(() => {
    if (!performanceData?.testPerformance) return [];
    
    const subjectScores: Record<string, { total: number; count: number }> = {};
    
    performanceData.testPerformance.forEach(test => {
      const subject = test.subject.split(' ')[0]; // Get first word as subject
      if (!subjectScores[subject]) {
        subjectScores[subject] = { total: 0, count: 0 };
      }
      subjectScores[subject].total += test.score;
      subjectScores[subject].count += 1;
    });

    return Object.entries(subjectScores).map(([subject, data]) => ({
      subject,
      score: Math.round(data.total / data.count),
      fullMark: 100,
    }));
  }, [performanceData]);

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading performance data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'>
              Performance Analytics
            </h1>
            <p className='text-gray-600 mt-2'>Track your academic progress and achievements</p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>Last 7 Days</SelectItem>
              <SelectItem value='30'>Last 30 Days</SelectItem>
              <SelectItem value='90'>Last 3 Months</SelectItem>
              <SelectItem value='180'>Last 6 Months</SelectItem>
              <SelectItem value='365'>Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-6 h-6 text-green-600' />
                Average Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-4xl font-bold text-green-600'>
                    {performanceData?.overallStats.avgAttendance ?? 0}%
                  </p>
                  <p className='text-sm text-gray-600 mt-2'>Overall attendance rate</p>
                </div>
                <Activity className='w-20 h-20 text-green-200' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Award className='w-6 h-6 text-blue-600' />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-4xl font-bold text-blue-600'>
                    {performanceData?.overallStats.avgScore ?? 0}%
                  </p>
                  <p className='text-sm text-gray-600 mt-2'>Average test performance</p>
                </div>
                <Target className='w-20 h-20 text-blue-200' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Scores Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-blue-600' />
              Test Scores Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData?.testPerformance && performanceData.testPerformance.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={performanceData.testPerformance}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type='monotone' 
                    dataKey='score' 
                    stroke='#3b82f6' 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name='Score %'
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-64 flex items-center justify-center text-gray-500'>
                <div className='text-center'>
                  <BarChart3 className='w-16 h-16 text-gray-300 mx-auto mb-2' />
                  <p>No test data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout for Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Attendance Trend Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-green-600' />
                Attendance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData?.attendanceTrends && performanceData.attendanceTrends.length > 0 ? (
                <ResponsiveContainer width='100%' height={250}>
                  <AreaChart data={performanceData.attendanceTrends}>
                    <defs>
                      <linearGradient id='colorAttendance' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#10b981' stopOpacity={0.8} />
                        <stop offset='95%' stopColor='#10b981' stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area 
                      type='monotone' 
                      dataKey='percentage' 
                      stroke='#10b981' 
                      fillOpacity={1} 
                      fill='url(#colorAttendance)'
                      name='Attendance %'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-[250px] flex items-center justify-center text-gray-500'>
                  <div className='text-center'>
                    <Calendar className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                    <p>No attendance data</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject-wise Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='w-5 h-5 text-purple-600' />
                Subject-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjectPerformance.length > 0 ? (
                <ResponsiveContainer width='100%' height={250}>
                  <RadarChart data={subjectPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey='subject' />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar 
                      name='Score' 
                      dataKey='score' 
                      stroke='#8b5cf6' 
                      fill='#8b5cf6' 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-[250px] flex items-center justify-center text-gray-500'>
                  <div className='text-center'>
                    <Target className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                    <p>No subject data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subject Scores Bar Chart */}
        {subjectPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='w-5 h-5 text-indigo-600' />
                Subject Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='subject' />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='score' fill='#6366f1' name='Average Score %' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentPerformance;
