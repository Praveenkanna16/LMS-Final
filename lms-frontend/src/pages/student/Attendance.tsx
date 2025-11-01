import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Calendar, TrendingUp, Scan } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { QRScanner } from '@/components/attendance/QRScanner';

interface AttendanceRecord {
  id: string;
  date: string;
  batchName?: string;
  courseTitle?: string;
  status: 'present' | 'absent' | 'late';
}

const StudentAttendance: React.FC = () => {
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: async () => {
      const response = await apiService.get('/student/attendance');
      return response.data;
    },
  });

  const records: AttendanceRecord[] = Array.isArray(attendanceData) ? (attendanceData as unknown as AttendanceRecord[]) : [];
  
  const totalClasses = records.length;
  const presentCount = records.filter(r => r.status === 'present').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700';
      case 'late':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'present' ? <CheckCircle2 className='w-4 h-4' /> : <XCircle className='w-4 h-4' />;
  };

  return (
    <Layout>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
            My Attendance
          </h1>
          <p className='text-gray-600 mt-2'>Track your class attendance and performance</p>
        </div>

        {/* Summary Card */}
        <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-3'>
              <TrendingUp className='w-6 h-6 text-green-600' />
              <span>Attendance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <p className='text-sm text-gray-600'>Overall Attendance</p>
                <p className='text-3xl font-bold text-green-600'>{attendancePercentage}%</p>
                <Progress value={attendancePercentage} className='h-2' />
              </div>
              <div className='space-y-2'>
                <p className='text-sm text-gray-600'>Classes Attended</p>
                <p className='text-3xl font-bold text-gray-900'>{presentCount}/{totalClasses}</p>
              </div>
              <div className='space-y-2'>
                <p className='text-sm text-gray-600'>Missed Classes</p>
                <p className='text-3xl font-bold text-red-600'>{totalClasses - presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Scanner Section */}
        <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-3'>
              <Scan className='w-6 h-6 text-blue-600' />
              <span>Mark Attendance via QR</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRScanner onSuccess={() => {
              void refetch();
            }} />
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-3'>
              <Calendar className='w-5 h-5' />
              <span>Attendance History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='p-12 text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto' />
                <p className='mt-4 text-gray-600'>Loading attendance...</p>
              </div>
            ) : records.length > 0 ? (
              <div className='space-y-3'>
                {records.map(record => (
                  <div
                    key={record.id}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-3'>
                        <Calendar className='w-5 h-5 text-gray-600' />
                        <div>
                          <p className='font-semibold text-gray-900'>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {record.courseTitle ?? record.batchName ?? 'Class'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      <div className='flex items-center gap-1'>
                        {getStatusIcon(record.status)}
                        <span className='capitalize'>{record.status}</span>
                      </div>
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-12 text-center'>
                <Calendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>No Attendance Records</h3>
                <p className='text-gray-600'>Your attendance records will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentAttendance;
