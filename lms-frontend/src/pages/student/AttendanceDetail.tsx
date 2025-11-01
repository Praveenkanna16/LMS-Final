import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  FileText,
  Sparkles,
  Target,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string | number;
  date: string;
  sessionTitle: string;
  status: 'present' | 'absent' | 'leave';
  duration?: string;
  liveClass?: {
    title: string;
    scheduledAt: string;
  };
}

interface AttendanceSummary {
  totalClasses: number;
  attended: number;
  percentage: number;
  absent: number;
}

interface Batch {
  id: string | number;
  name: string;
  courseId?: string;
}

const AttendanceDetail: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalClasses: 0,
    attended: 0,
    percentage: 0,
    absent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportIssue, setReportIssue] = useState({
    sessionId: '',
    issueType: 'attendance_mismatch',
    description: '',
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchAttendance(selectedBatch);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await apiService.getStudentBatches();
      if (response.success && response.data) {
        const batchList = (response.data as any).batches || response.data;
        setBatches(Array.isArray(batchList) ? batchList : []);
        
        // Auto-select first batch
        if (batchList.length > 0) {
          setSelectedBatch(String(batchList[0].id));
        }
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      toast.error('Failed to load batches');
    }
  };

  const fetchAttendance = async (batchId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getAttendanceByBatch(batchId);
      
      if (response.success && response.data) {
        const data = response.data as any;
        const records = data.attendance || [];
        const summaryData = data.summary || {
          totalClasses: 0,
          attended: 0,
          percentage: 0,
          absent: 0,
        };
        
        setAttendanceRecords(Array.isArray(records) ? records : []);
        setSummary(summaryData);
      }
    } catch (error: any) {
      console.error('Failed to load attendance:', error);
      toast.error('Failed to load attendance records');
      setAttendanceRecords([]);
      setSummary({ totalClasses: 0, attended: 0, percentage: 0, absent: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!reportIssue.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    try {
      const response = await apiService.reportAttendanceIssue({
        sessionId: reportIssue.sessionId,
        batchId: selectedBatch,
        issueType: reportIssue.issueType,
        description: reportIssue.description,
      });

      if (response.success) {
        toast.success('Issue reported successfully');
        setReportDialogOpen(false);
        setReportIssue({
          sessionId: '',
          issueType: 'attendance_mismatch',
          description: '',
        });
      }
    } catch (error) {
      console.error('Failed to report issue:', error);
      toast.error('Failed to report issue');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge className='bg-green-100 text-green-800 border-green-200'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Present
          </Badge>
        );
      case 'absent':
        return (
          <Badge className='bg-red-100 text-red-800 border-red-200'>
            <XCircle className='w-3 h-3 mr-1' />
            Absent
          </Badge>
        );
      case 'leave':
        return (
          <Badge className='bg-yellow-100 text-yellow-800 border-yellow-200'>
            <AlertCircle className='w-3 h-3 mr-1' />
            Leave
          </Badge>
        );
      default:
        return (
          <Badge variant='outline' className='border-gray-300'>
            {status}
          </Badge>
        );
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentageIcon = (percentage: number) => {
    if (percentage >= 75) return <TrendingUp className='w-6 h-6 text-green-600' />;
    return <TrendingDown className='w-6 h-6 text-red-600' />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorations */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl animate-pulse delay-500' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          {/* Header Card */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl rotate-12 animate-bounce opacity-20' />
            <div className='absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce delay-300 opacity-20' />

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 p-8 relative overflow-hidden'>
                {/* Animated particles */}
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
                  <h1 className='text-4xl font-bold text-white mb-2'>Attendance Details 📊</h1>
                  <p className='text-orange-100 text-lg mb-6'>
                    Track your class attendance and participation
                  </p>
                  <div className='flex items-center gap-4 flex-wrap'>
                    <Button
                      size='lg'
                      className='bg-white text-orange-600 hover:bg-orange-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                      onClick={() => navigate('/student/batches')}
                    >
                      <Users className='w-5 h-5 mr-2' />
                      My Batches
                    </Button>
                    <Button
                      size='lg'
                      variant='outline'
                      className='border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm'
                      onClick={() => navigate('/student/schedule')}
                    >
                      <Calendar className='w-5 h-5 mr-2' />
                      View Schedule
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Batch Selector */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex flex-col md:flex-row items-start md:items-center gap-4'>
                <div className='flex-1'>
                  <Label className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Select Batch
                  </Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger className='w-full md:w-80 border-2 border-gray-200 rounded-xl focus:border-orange-500'>
                      <SelectValue placeholder='Choose a batch...' />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={String(batch.id)}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant='outline'
                      className='border-2 border-orange-300 text-orange-600 hover:bg-orange-50 mt-6 md:mt-0'
                      disabled={!selectedBatch}
                    >
                      <AlertCircle className='w-4 h-4 mr-2' />
                      Report Issue
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                      <DialogTitle>Report Attendance Issue</DialogTitle>
                      <DialogDescription>
                        Report any issues with your attendance records
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='issueType'>Issue Type</Label>
                        <Select
                          value={reportIssue.issueType}
                          onValueChange={(value) =>
                            setReportIssue({ ...reportIssue, issueType: value })
                          }
                        >
                          <SelectTrigger id='issueType'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='attendance_mismatch'>
                              Attendance Mismatch
                            </SelectItem>
                            <SelectItem value='marked_absent_incorrectly'>
                              Marked Absent Incorrectly
                            </SelectItem>
                            <SelectItem value='technical_issue'>
                              Technical Issue
                            </SelectItem>
                            <SelectItem value='other'>Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='description'>Description</Label>
                        <Textarea
                          id='description'
                          placeholder='Describe the issue in detail...'
                          value={reportIssue.description}
                          onChange={(e) =>
                            setReportIssue({ ...reportIssue, description: e.target.value })
                          }
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className='flex justify-end gap-3'>
                      <Button
                        variant='outline'
                        onClick={() => setReportDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className='bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white'
                        onClick={handleReportIssue}
                      >
                        Submit Report
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-300'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                    <BookOpen className='w-6 h-6 text-white' />
                  </div>
                  {getPercentageIcon(summary.percentage)}
                </div>
                <p className='text-gray-600 text-sm font-medium'>Total Classes</p>
                <p className='text-3xl font-bold text-gray-900 mt-1'>
                  {summary.totalClasses}
                </p>
              </CardContent>
            </Card>

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-300'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                    <CheckCircle className='w-6 h-6 text-white' />
                  </div>
                  <Award className='w-6 h-6 text-green-600' />
                </div>
                <p className='text-gray-600 text-sm font-medium'>Classes Attended</p>
                <p className='text-3xl font-bold text-gray-900 mt-1'>
                  {summary.attended}
                </p>
              </CardContent>
            </Card>

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-300'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                    <Target className='w-6 h-6 text-white' />
                  </div>
                  <Sparkles className='w-6 h-6 text-purple-600' />
                </div>
                <p className='text-gray-600 text-sm font-medium'>Attendance %</p>
                <p className={`text-3xl font-bold mt-1 ${getPercentageColor(summary.percentage)}`}>
                  {summary.percentage.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-300'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center'>
                    <XCircle className='w-6 h-6 text-white' />
                  </div>
                  <AlertCircle className='w-6 h-6 text-red-600' />
                </div>
                <p className='text-gray-600 text-sm font-medium'>Days Absent</p>
                <p className='text-3xl font-bold text-gray-900 mt-1'>
                  {summary.absent}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Records Table */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-xl bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent'>
                    Attendance Records
                  </CardTitle>
                  <CardDescription>
                    {attendanceRecords.length} session{attendanceRecords.length !== 1 ? 's' : ''} recorded
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-6'>
              {loading ? (
                <div className='text-center py-12'>
                  <div className='w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
                  <p className='text-gray-600'>Loading attendance records...</p>
                </div>
              ) : attendanceRecords.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b-2 border-gray-200'>
                        <th className='text-left py-4 px-4 text-gray-700 font-semibold'>Date</th>
                        <th className='text-left py-4 px-4 text-gray-700 font-semibold'>Session</th>
                        <th className='text-left py-4 px-4 text-gray-700 font-semibold'>Status</th>
                        <th className='text-left py-4 px-4 text-gray-700 font-semibold'>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr
                          key={record.id}
                          className='border-b border-gray-100 hover:bg-orange-50/50 transition-colors'
                        >
                          <td className='py-4 px-4'>
                            <div className='flex items-center gap-2'>
                              <Calendar className='w-4 h-4 text-gray-400' />
                              <span className='text-gray-900 font-medium'>
                                {formatDate(record.date || record.liveClass?.scheduledAt || '')}
                              </span>
                            </div>
                          </td>
                          <td className='py-4 px-4'>
                            <span className='text-gray-900'>
                              {record.sessionTitle || record.liveClass?.title || 'N/A'}
                            </span>
                          </td>
                          <td className='py-4 px-4'>{getStatusBadge(record.status)}</td>
                          <td className='py-4 px-4'>
                            {record.duration ? (
                              <div className='flex items-center gap-2 text-gray-600'>
                                <Clock className='w-4 h-4' />
                                <span>{record.duration}</span>
                              </div>
                            ) : (
                              <span className='text-gray-400'>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                    <FileText className='h-10 w-10 text-orange-500' />
                  </div>
                  <p className='text-gray-900 font-semibold mb-2 text-lg'>
                    No attendance records found
                  </p>
                  <p className='text-sm text-gray-600 mb-6'>
                    {selectedBatch
                      ? 'Attendance records will appear here once classes are conducted'
                      : 'Please select a batch to view attendance records'}
                  </p>
                  {!selectedBatch && (
                    <Button
                      className='bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white'
                      onClick={() => navigate('/student/batches')}
                    >
                      <Users className='w-4 h-4 mr-2' />
                      View My Batches
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceDetail;
