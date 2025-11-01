import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Calendar,
  AlertCircle,
  Download,
  Filter,
  Search,
  Eye,
  Clock,
  Zap,
  Target,
  Activity,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  classesCount: number;
  classesCountTrend: number;
  studentsCount: number;
  studentsTrend: number;
  totalEarnings: number;
  earningsTrend: number;
  totalWatchTime: number;
  watchTimeTrend: number;
  averageEngagement: number;
  engagementTrend: number;
  completionRate: number;
  completionTrend: number;
}

interface ClassReport {
  id: string;
  topic: string;
  batchName: string;
  date: string;
  duration: number;
  attendees: number;
  engagementScore: number;
  recording?: boolean;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  email: string;
  classesAttended: number;
  averageScore: number;
  engagementLevel: string;
  lastActive: string;
}

interface BatchAnalytics {
  batchId: string;
  batchName: string;
  courseTitle: string;
  totalStudents: number;
  activeStudents: number;
  averageScore: number;
  engagement: number;
  completionRate: number;
}

const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const user = sessionManager.getUser();

  const [reportData, setReportData] = useState<ReportData>({
    classesCount: 0,
    classesCountTrend: 0,
    studentsCount: 0,
    studentsTrend: 0,
    totalEarnings: 0,
    earningsTrend: 0,
    totalWatchTime: 0,
    watchTimeTrend: 0,
    averageEngagement: 0,
    engagementTrend: 0,
    completionRate: 0,
    completionTrend: 0,
  });

  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [batchAnalytics, setBatchAnalytics] = useState<BatchAnalytics[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'engagement' | 'attendance' | 'performance'>('engagement');

  // Fetch reports data
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('genzed_token') || '';

        // Fetch main report
        const reportRes = await fetch(`/api/teacher/reports?dateRange=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (reportRes.ok) {
          const data = await reportRes.json();
          setReportData(data.data);
        }

        // Fetch class reports
        const classRes = await fetch(`/api/teacher/class-reports?dateRange=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (classRes.ok) {
          const data = await classRes.json();
          setClassReports(data.data || []);
        }

        // Fetch student performance
        const studentRes = await fetch(`/api/teacher/student-performance?dateRange=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (studentRes.ok) {
          const data = await studentRes.json();
          setStudentPerformance(data.data || []);
        }

        // Fetch batch analytics
        const batchRes = await fetch(`/api/teacher/batch-analytics?dateRange=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (batchRes.ok) {
          const data = await batchRes.json();
          setBatchAnalytics(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reports data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, dateRange, toast]);

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? (
      <TrendingUp className='w-4 h-4 text-green-600' />
    ) : (
      <TrendingDown className='w-4 h-4 text-red-600' />
    );
  };

  const handleExportReport = () => {
    const csvContent = [
      ['Metric', 'Value', 'Trend'],
      [
        'Total Classes',
        reportData.classesCount.toString(),
        `${reportData.classesCountTrend > 0 ? '+' : ''}${reportData.classesCountTrend.toFixed(1)}%`,
      ],
      [
        'Total Students',
        reportData.studentsCount.toString(),
        `${reportData.studentsTrend > 0 ? '+' : ''}${reportData.studentsTrend.toFixed(1)}%`,
      ],
      ['Total Earnings', `₹${reportData.totalEarnings.toFixed(2)}`, `${reportData.earningsTrend > 0 ? '+' : ''}${reportData.earningsTrend.toFixed(1)}%`],
      ['Average Engagement', `${reportData.averageEngagement.toFixed(1)}%`, `${reportData.engagementTrend > 0 ? '+' : ''}${reportData.engagementTrend.toFixed(1)}%`],
      ['Completion Rate', `${reportData.completionRate.toFixed(1)}%`, `${reportData.completionTrend > 0 ? '+' : ''}${reportData.completionTrend.toFixed(1)}%`],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6'>
        <div className='max-w-7xl mx-auto space-y-8'>
          {/* Header */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl rotate-12 animate-bounce opacity-20' />
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <BarChart3 className='w-7 h-7 text-white' />
                    </div>
                    <div>
                      <h1 className='text-4xl font-bold text-white mb-2'>Analytics & Reports 📊</h1>
                      <p className='text-teal-100'>Track your teaching performance and student insights</p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      className='bg-white/20 border-white/30 text-white hover:bg-white/30'
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Refresh
                    </Button>
                    <Button
                      className='bg-white text-teal-600 hover:bg-teal-50 shadow-lg'
                      onClick={handleExportReport}
                    >
                      <Download className='w-5 h-5 mr-2' />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Date Range Filter */}
          <div className='flex gap-2 justify-center'>
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                className={
                  dateRange === range
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                    : ''
                }
                onClick={() => setDateRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Classes */}
            <Card className='bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <p className='text-blue-600 font-semibold'>Classes Conducted</p>
                  <div className='w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                    <Activity className='w-5 h-5 text-blue-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>{reportData.classesCount}</p>
                  <div className='flex items-center gap-1 text-sm'>
                    {getTrendIcon(reportData.classesCountTrend)}
                    <span className={getTrendColor(reportData.classesCountTrend)}>
                      {reportData.classesCountTrend > 0 ? '+' : ''}
                      {reportData.classesCountTrend.toFixed(1)}% vs last period
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students */}
            <Card className='bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <p className='text-purple-600 font-semibold'>Students Taught</p>
                  <div className='w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center'>
                    <Users className='w-5 h-5 text-purple-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>{reportData.studentsCount}</p>
                  <div className='flex items-center gap-1 text-sm'>
                    {getTrendIcon(reportData.studentsTrend)}
                    <span className={getTrendColor(reportData.studentsTrend)}>
                      {reportData.studentsTrend > 0 ? '+' : ''}
                      {reportData.studentsTrend.toFixed(1)}% vs last period
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings */}
            <Card className='bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <p className='text-green-600 font-semibold'>Total Earnings</p>
                  <div className='w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center'>
                    <Award className='w-5 h-5 text-green-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>
                    ₹{reportData.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <div className='flex items-center gap-1 text-sm'>
                    {getTrendIcon(reportData.earningsTrend)}
                    <span className={getTrendColor(reportData.earningsTrend)}>
                      {reportData.earningsTrend > 0 ? '+' : ''}
                      {reportData.earningsTrend.toFixed(1)}% vs last period
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement */}
            <Card className='bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <p className='text-orange-600 font-semibold'>Avg Engagement</p>
                  <div className='w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center'>
                    <Zap className='w-5 h-5 text-orange-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>
                    {reportData.averageEngagement.toFixed(1)}%
                  </p>
                  <div className='flex items-center gap-1 text-sm'>
                    {getTrendIcon(reportData.engagementTrend)}
                    <span className={getTrendColor(reportData.engagementTrend)}>
                      {reportData.engagementTrend > 0 ? '+' : ''}
                      {reportData.engagementTrend.toFixed(1)}% vs last period
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card className='bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <p className='text-red-600 font-semibold'>Completion Rate</p>
                  <div className='w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center'>
                    <Target className='w-5 h-5 text-red-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>
                    {reportData.completionRate.toFixed(1)}%
                  </p>
                  <div className='flex items-center gap-1 text-sm'>
                    {getTrendIcon(reportData.completionTrend)}
                    <span className={getTrendColor(reportData.completionTrend)}>
                      {reportData.completionTrend > 0 ? '+' : ''}
                      {reportData.completionTrend.toFixed(1)}% vs last period
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Watch Time */}
            <Card className='bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-indigo-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <p className='text-indigo-600 font-semibold'>Total Watch Time</p>
                  <div className='w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center'>
                    <Clock className='w-5 h-5 text-indigo-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>
                    {(reportData.totalWatchTime / 3600).toFixed(1)}h
                  </p>
                  <div className='flex items-center gap-1 text-sm'>
                    {getTrendIcon(reportData.watchTimeTrend)}
                    <span className={getTrendColor(reportData.watchTimeTrend)}>
                      {reportData.watchTimeTrend > 0 ? '+' : ''}
                      {reportData.watchTimeTrend.toFixed(1)}% vs last period
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Reports */}
          {classReports.length > 0 && (
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <Activity className='w-5 h-5 text-white' />
                  </div>
                  <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent'>
                    Class Performance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-gray-200'>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Topic</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Batch</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Date</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Attendees</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Engagement</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classReports.map((report) => (
                        <tr key={report.id} className='border-b border-gray-100 hover:bg-gray-50'>
                          <td className='py-3 px-4 font-medium'>{report.topic}</td>
                          <td className='py-3 px-4'>{report.batchName}</td>
                          <td className='py-3 px-4'>
                            {new Date(report.date).toLocaleDateString()}
                          </td>
                          <td className='py-3 px-4 text-center'>{report.attendees}</td>
                          <td className='py-3 px-4 text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              <div className='w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                                <div
                                  className='h-full bg-gradient-to-r from-blue-500 to-teal-500'
                                  style={{ width: `${report.engagementScore}%` }}
                                />
                              </div>
                              <span className='text-xs font-semibold'>
                                {report.engagementScore.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className='py-3 px-4 text-center'>{report.duration}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batch Analytics */}
          {batchAnalytics.length > 0 && (
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <PieChart className='w-5 h-5 text-white' />
                  </div>
                  <CardTitle className='text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                    Batch Performance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {batchAnalytics.map((batch) => (
                    <div
                      key={batch.batchId}
                      className='p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all'
                    >
                      <div className='mb-4'>
                        <h4 className='font-semibold text-gray-900'>{batch.batchName}</h4>
                        <p className='text-sm text-gray-600'>{batch.courseTitle}</p>
                      </div>

                      <div className='grid grid-cols-2 gap-3 mb-4'>
                        <div>
                          <p className='text-xs text-gray-600'>Total Students</p>
                          <p className='text-lg font-bold text-gray-900'>{batch.totalStudents}</p>
                        </div>
                        <div>
                          <p className='text-xs text-gray-600'>Active</p>
                          <p className='text-lg font-bold text-green-600'>{batch.activeStudents}</p>
                        </div>
                        <div>
                          <p className='text-xs text-gray-600'>Avg Score</p>
                          <p className='text-lg font-bold text-blue-600'>
                            {batch.averageScore.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className='text-xs text-gray-600'>Completion</p>
                          <p className='text-lg font-bold text-purple-600'>
                            {batch.completionRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Engagement Bar */}
                      <div>
                        <p className='text-xs text-gray-600 mb-2'>Engagement Level</p>
                        <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-gradient-to-r from-purple-500 to-pink-600'
                            style={{ width: `${batch.engagement}%` }}
                          />
                        </div>
                        <p className='text-xs text-gray-700 mt-1'>{batch.engagement.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Performance */}
          {studentPerformance.length > 0 && (
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <Users className='w-5 h-5 text-white' />
                  </div>
                  <CardTitle className='text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                    Student Performance
                  </CardTitle>
                </div>

                {/* Search and Sort */}
                <div className='flex gap-2 flex-col sm:flex-row'>
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search students...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500'
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-gray-200'>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Student</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Classes Attended</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Avg Score</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Engagement</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentPerformance.map((student) => (
                        <tr key={student.studentId} className='border-b border-gray-100 hover:bg-gray-50'>
                          <td className='py-3 px-4'>
                            <div>
                              <p className='font-medium text-gray-900'>{student.studentName}</p>
                              <p className='text-xs text-gray-500'>{student.email}</p>
                            </div>
                          </td>
                          <td className='py-3 px-4 text-center font-semibold'>
                            {student.classesAttended}
                          </td>
                          <td className='py-3 px-4 text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              <span className='font-semibold'>
                                {student.averageScore.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className='py-3 px-4 text-center'>
                            <Badge
                              className={
                                student.engagementLevel === 'High'
                                  ? 'bg-green-100 text-green-700'
                                  : student.engagementLevel === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }
                            >
                              {student.engagementLevel}
                            </Badge>
                          </td>
                          <td className='py-3 px-4 text-center text-xs text-gray-600'>
                            {new Date(student.lastActive).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
};

export default ReportsPage;
