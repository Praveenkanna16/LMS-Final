import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Briefcase,
  BookOpen,
  Eye,
  DollarSign,
  RefreshCw,
  Download,
  UserPlus,
  Loader2,
  TrendingUp,
  UserCheck,
  UserX,
} from 'lucide-react';
import { apiService } from '@/services/api';

interface StudentProfile {
  bio: string | null;
  location: string | null;
  company: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
}

interface Course {
  id: number;
  title: string;
  thumbnail: string;
}

interface Enrollment {
  id: number;
  status: string;
  progress: number;
  enrolledAt: string;
  batch: {
    id: number;
    name: string;
    Course: Course;
  };
}

interface Student {
  id: number;
  name: string;
  email: string;
  status: string;
  emailVerified: boolean;
  totalEnrollments: number;
  totalPaid: number;
  profile: StudentProfile | null;
  enrollments: Enrollment[];
  courses: Course[];
}

interface MyStudentsResponse {
  students: Student[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export default function TeacherMyStudents() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch teacher's students
  const { data, isLoading, error, refetch } = useQuery<MyStudentsResponse>({
    queryKey: ['teacher-students', page, search],
    queryFn: async () => {
      console.log('Fetching students...', { page, search });
      const response = await apiService.getMyStudents({
        page,
        limit: 20,
        ...(search && { search }),
      });
      
      console.log('Students API response:', response);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch students');
      }
      
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  // Compute filtered students and stats for UI parity with admin
  const studentsList = (data?.students as any[]) || [];
  const filteredStudents = studentsList.filter(s => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
    const isActive = (s.status || '').toLowerCase() === 'active';
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && isActive) || (filterStatus === 'inactive' && !isActive);
    return matchesSearch && matchesStatus;
  });

  const totalStudents = data?.pagination?.totalCount ?? studentsList.length;
  const activeStudents = studentsList.filter((s: any) => (s.status || '').toLowerCase() === 'active').length;
  const inactiveStudents = studentsList.filter((s: any) => (s.status || '').toLowerCase() === 'inactive').length;
  const newThisMonth = studentsList.filter((s: any) => {
    try {
      const created = new Date(s.createdAt || s.enrolledAt || s.registeredAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    } catch (e) {
      return false;
    }
  }).length;

  const refreshStudents = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const exportStudentsData = () => {
    if (!data || !data.students) return;
    try {
      setExporting(true);
      const csvHeaders = ['ID', 'Name', 'Email', 'Status', 'Total Enrollments', 'Total Paid'];
      const csvRows = data.students.map(s => [
        s.id,
        s.name,
        s.email,
        s.status,
        String(s.totalEnrollments || 0),
        String((s.totalPaid || 0).toFixed ? (s.totalPaid as any).toFixed(2) : s.totalPaid || '0.00'),
      ]);
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500 text-white',
      enrolled: 'bg-blue-500 text-white',
      completed: 'bg-purple-500 text-white',
      inactive: 'bg-gray-500 text-white',
    };
    return <Badge className={variants[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden p-6'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.06)_0%,_transparent_50%)]' />
      <div className='relative z-10 max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                <Users className='w-10 h-10 text-white' />
              </div>
              <div>
                <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                  <Users className='w-4 h-4 mr-2' />
                  Student Management
                </Badge>
                <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent drop-shadow-lg'>
                  My Students
                </h1>
                <p className='text-xl text-gray-600 mt-2'>View students enrolled in your courses</p>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <Button
                onClick={() => { void refreshStudents(); }}
                variant='outline'
                className='border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-600'
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => exportStudentsData()}
                className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl'
                disabled={exporting || !data?.students?.length}
              >
                <Download className='w-4 h-4 mr-2' />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button
                variant='outline'
                className='border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-500'
                onClick={() => navigate('/teacher/batches')}
              >
                <UserPlus className='w-4 h-4 mr-2' />
                Manage Batches
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
          {/* compute totals */}
          {
            (() => {
              const totalRevenue = studentsList.reduce((sum, s: any) => sum + (Number(s.totalPaid) || 0), 0);
              const totalEnrollments = studentsList.reduce((sum, s: any) => sum + (Number(s.totalEnrollments) || 0), 0);
              return (
                <>
                  <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
                    <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -translate-y-12 translate-x-12'></div>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                      <CardTitle className='text-sm font-semibold text-gray-900'>Total Students</CardTitle>
                      <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg'>
                        <Users className='h-6 w-6 text-white' />
                      </div>
                    </CardHeader>
                    <CardContent className='relative z-10'>
                      <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                        {totalStudents}
                      </div>
                      <p className='text-sm text-gray-600'>Registered learners</p>
                      <div className='flex items-center mt-2'>
                        <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
                        <span className='text-xs text-green-600 font-medium'>Active accounts</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
                    <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12'></div>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                      <CardTitle className='text-sm font-semibold text-gray-900'>Active Students</CardTitle>
                      <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                        <UserCheck className='h-6 w-6 text-white' />
                      </div>
                    </CardHeader>
                    <CardContent className='relative z-10'>
                      <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                        {activeStudents}
                      </div>
                      <p className='text-sm text-gray-600'>Currently learning</p>
                      <div className='flex items-center mt-2'>
                        <span className='text-xs text-green-600 font-medium'>Online now</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
                    <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12'></div>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                      <CardTitle className='text-sm font-semibold text-gray-900'>New This Month</CardTitle>
                      <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                        <TrendingUp className='h-6 w-6 text-white' />
                      </div>
                    </CardHeader>
                    <CardContent className='relative z-10'>
                      <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                        {newThisMonth}
                      </div>
                      <p className='text-sm text-gray-600'>New registrations</p>
                      <div className='flex items-center mt-2'>
                        <span className='text-xs text-purple-600 font-medium'>This month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
                    <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-12 translate-x-12'></div>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                      <CardTitle className='text-sm font-semibold text-gray-900'>Inactive Students</CardTitle>
                      <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg'>
                        <UserX className='h-6 w-6 text-white' />
                      </div>
                    </CardHeader>
                    <CardContent className='relative z-10'>
                      <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                        {inactiveStudents}
                      </div>
                      <p className='text-sm text-gray-600'>Deactivated accounts</p>
                      <div className='flex items-center mt-2'>
                        <span className='text-xs text-orange-600 font-medium'>Requires review</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()
          }
        </div>

        {/* Search & Filters */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden mb-6'>
          <CardContent className='p-6 relative z-10'>
            <div className='flex flex-col md:flex-row gap-4 items-center'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <Input
                  placeholder='Search students by name or email...'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  className='pl-10 h-12 border-2 border-gray-200 bg-white focus:border-blue-500'
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'}
                >
                  All
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setFilterStatus('active')}
                  className={filterStatus === 'active' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300'}
                >
                  Active
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setFilterStatus('inactive')}
                  className={filterStatus === 'inactive' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300'}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students List ({filteredStudents.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='text-center py-8'>
                <p>Loading students...</p>
                <p className='text-sm text-gray-500 mt-2'>Fetching data from API...</p>
              </div>
            ) : error ? (
              <div className='text-center py-8'>
                <p className='text-red-600'>Error loading students</p>
                <p className='text-sm text-gray-600 mt-2'>{(error as Error).message}</p>
                <button 
                  onClick={() => refetch()} 
                  className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  Retry
                </button>
              </div>
            ) : !filteredStudents || filteredStudents.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <p>No students found</p>
                <p className='text-sm mt-2'>Students enrolled in your batches will appear here</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Company/School</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className='font-semibold text-gray-900'>{student.name}</p>
                            <p className='text-xs text-gray-500 flex items-center gap-1'>
                              {student.emailVerified && (
                                <span className='text-green-500'>✓</span>
                              )}
                              {student.status}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Mail className='w-4 h-4 text-gray-400' />
                            <span className='text-sm'>{student.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <MapPin className='w-4 h-4 text-gray-400' />
                            <span className='text-sm'>{student.profile?.location || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Briefcase className='w-4 h-4 text-gray-400' />
                            <span className='text-sm'>{student.profile?.company || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <BookOpen className='w-4 h-4 text-blue-500' />
                            <span className='font-semibold text-blue-600'>
                              {student.courses.length}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='font-semibold text-purple-600'>
                            {student.totalEnrollments}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1 text-green-600 font-semibold'>
                            <DollarSign className='w-4 h-4' />
                            ₹{student.totalPaid?.toFixed(2) || '0.00'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => navigate(`/teacher/students/${student.id}`)}
                          >
                            <Eye className='w-4 h-4 mr-1' />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className='flex items-center justify-between mt-6'>
                    <p className='text-sm text-gray-600'>
                    Showing {(page - 1) * 20 + 1} to{' '}
                    {Math.min(page * 20, filteredStudents.length)} of{' '}
                    {totalStudents} students
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className='w-4 h-4' />
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(p => p + 1)}
                      disabled={!(data?.pagination?.hasMore)}
                    >
                      Next
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
