import React, { useState } from 'react';
// Rendered inside `TeacherLayout`; do not wrap with global `Layout` to avoid duplicate sidebars
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Download, 
  Calendar,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { QRAttendanceGenerator } from '@/components/attendance/QRAttendanceGenerator';

interface Batch {
  id: string;
  name: string;
  courseTitle?: string;
  studentCount?: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
  markedVia?: string;
  markedAt?: string;
}

const TeacherAttendance: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Fetch teacher's batches
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/batches', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch attendance records for selected batch
  const { data: attendanceData, isLoading, refetch } = useQuery<{
    records: AttendanceRecord[];
    summary: {
      total: number;
      present: number;
      absent: number;
      late: number;
      percentage: number;
    };
  }>({
    queryKey: ['batch-attendance', selectedBatch, startDate, endDate],
    queryFn: async () => {
      if (!selectedBatch) return { records: [], summary: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 } };
      
      const params = new URLSearchParams({ batchId: selectedBatch });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/teacher/attendance?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const result = await response.json();
      return result.data || { records: [], summary: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 } };
    },
    enabled: !!selectedBatch,
  });

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!selectedBatch) {
      toast({
        title: 'Error',
        description: 'Please select a batch first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);

      const params = new URLSearchParams({
        batchId: selectedBatch,
        format,
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/attendance/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : `attendance_${selectedBatch}_${Date.now()}.${format}`;

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Attendance exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export attendance',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className='w-4 h-4 text-green-600' />;
      case 'late':
        return <Clock className='w-4 h-4 text-yellow-600' />;
      default:
        return <XCircle className='w-4 h-4 text-red-600' />;
    }
  };

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

  return (
    <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
            Attendance Management
          </h1>
          <p className='text-gray-600 mt-2'>Track and manage student attendance for your batches</p>
        </div>

        {/* QR Code Generator */}
        <QRAttendanceGenerator 
          batches={batches.map(b => ({ id: b.id, name: b.name }))}
        />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              View Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Select Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder='Choose a batch' />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.studentCount ?? 0} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Start Date</label>
                <input
                  type='date'
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                  }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>End Date</label>
                <input
                  type='date'
                  value={endDate}
                  onChange={e => {
                    setEndDate(e.target.value);
                  }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Export</label>
                <div className='flex gap-2'>
                  <Button
                    onClick={() => {
                      void handleExport('csv');
                    }}
                    disabled={!selectedBatch || isExporting}
                    className='flex-1'
                    variant='outline'
                  >
                    <FileSpreadsheet className='mr-2 h-4 w-4' />
                    CSV
                  </Button>
                  <Button
                    onClick={() => {
                      void handleExport('pdf');
                    }}
                    disabled={!selectedBatch || isExporting}
                    className='flex-1'
                    variant='outline'
                  >
                    <FileText className='mr-2 h-4 w-4' />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {attendanceData && selectedBatch && (
          <Card className='bg-gradient-to-r from-green-50 to-emerald-50 border-0'>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                <div className='text-center'>
                  <p className='text-3xl font-bold text-blue-600'>
                    {attendanceData.summary.total}
                  </p>
                  <p className='text-sm text-gray-600'>Total Records</p>
                </div>
                <div className='text-center'>
                  <p className='text-3xl font-bold text-green-600'>
                    {attendanceData.summary.present}
                  </p>
                  <p className='text-sm text-gray-600'>Present</p>
                </div>
                <div className='text-center'>
                  <p className='text-3xl font-bold text-yellow-600'>
                    {attendanceData.summary.late}
                  </p>
                  <p className='text-sm text-gray-600'>Late</p>
                </div>
                <div className='text-center'>
                  <p className='text-3xl font-bold text-red-600'>
                    {attendanceData.summary.absent}
                  </p>
                  <p className='text-sm text-gray-600'>Absent</p>
                </div>
                <div className='text-center'>
                  <p className='text-3xl font-bold text-purple-600'>
                    {attendanceData.summary.percentage}%
                  </p>
                  <p className='text-sm text-gray-600'>Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span className='flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Attendance Records
              </span>
              {selectedBatch && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Refresh
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedBatch ? (
              <div className='py-12 text-center text-gray-500'>
                <Users className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <p>Select a batch to view attendance records</p>
              </div>
            ) : isLoading ? (
              <div className='py-12 text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' />
                <p className='text-gray-600'>Loading attendance...</p>
              </div>
            ) : attendanceData?.records && attendanceData.records.length > 0 ? (
              <div className='space-y-2'>
                <div className='grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg font-semibold text-sm'>
                  <div>Date</div>
                  <div>Student</div>
                  <div>Status</div>
                  <div>Marked Via</div>
                  <div>Marked At</div>
                </div>
                {attendanceData.records.map(record => (
                  <div
                    key={record.id}
                    className='grid grid-cols-5 gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span>{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                    <div>{record.studentName}</div>
                    <div>
                      <Badge className={getStatusColor(record.status)}>
                        <div className='flex items-center gap-1'>
                          {getStatusIcon(record.status)}
                          <span className='capitalize'>{record.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className='text-sm text-gray-600 capitalize'>
                      {record.markedVia?.replace('_', ' ') ?? 'Manual'}
                    </div>
                    <div className='text-sm text-gray-600'>
                      {record.markedAt 
                        ? new Date(record.markedAt).toLocaleTimeString()
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='py-12 text-center text-gray-500'>
                <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <p>No attendance records found</p>
                <p className='text-sm mt-2'>Try adjusting your date filters</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default TeacherAttendance;
