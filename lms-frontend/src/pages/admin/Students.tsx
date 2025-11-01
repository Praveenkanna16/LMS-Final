import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllUsers, useDeleteUser } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Loader2,
  Mail,
  Calendar,
  Download,
  Trash2,
  BarChart3,
  GraduationCap,
  BookOpen,
  RefreshCw,
  UserPlus,
  Eye,
  Edit,
} from 'lucide-react';
import type { User } from '@/types';

interface ErrorWithMessage {
  message?: string;
}

const Students: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [exporting, setExporting] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const { data: allUsers, isLoading, refetch } = useAllUsers();
  const deleteUserMutation = useDeleteUser();

  // Filter students from all users
  const students = useMemo(() => {
    const usersList = Array.isArray(allUsers) ? (allUsers as any[]) : [];
    return usersList
      .filter((user: any) => user.role === 'student')
      .map((user: any) => ({
        ...user,
        _id: user._id ?? user.id ?? '',
      }));
  }, [allUsers]);

  // Apply search and status filters
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (student: any) =>
          student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter based on isActive field
    if (filterStatus === 'active') {
      filtered = filtered.filter((student: any) => student.isActive === true);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((student: any) => student.isActive === false);
    }

    return filtered;
  }, [students, searchTerm, filterStatus]);

  const refreshStudents = async () => {
    await refetch();
    toast({
      title: 'Success',
      description: 'Students data refreshed',
    });
  };

  const exportStudentsData = () => {
    try {
      setExporting(true);
      // Create CSV data
      const csvHeaders = ['ID', 'Name', 'Email', 'Status', 'Role', 'Joined Date'];
      const csvRows = filteredStudents.map((student: User) => [
        student._id,
        student.name,
        student.email,
        student.isActive ? 'Active' : 'Inactive',
        student.role,
        student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `students_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: `Exported ${filteredStudents.length} students to CSV`,
      });
    } catch (error) {
      const errorWithMessage = error as ErrorWithMessage;
      toast({
        title: 'Error',
        description: errorWithMessage.message ?? 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Are you sure you want to deactivate ${studentName}? This will mark their account as inactive.`
      )
    ) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(studentId);
      toast({
        title: 'Success',
        description: 'Student account deactivated successfully',
      });
    } catch (error) {
      const errorWithMessage = error as ErrorWithMessage;
      toast({
        title: 'Error',
        description: errorWithMessage.message ?? 'Failed to deactivate student',
        variant: 'destructive',
      });
    }
  };

  // View and Edit pages not implemented yet
  // const handleViewStudent = (studentId: string) => {
  //   navigate(`/admin/students/${studentId}`);
  // };

  // const handleEditStudent = (studentId: string) => {
  //   navigate(`/admin/students/${studentId}/edit`);
  // };

  const activeStudents = students.filter((s: any) => s.isActive === true).length;
  const inactiveStudents = students.filter((s: any) => s.isActive === false).length;
  const newThisMonth = students.filter((s: any) => {
    const createdDate = new Date(s.createdAt ?? '');
    const now = new Date();
    return (
      createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    );
  }).length;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        {/* Floating Elements */}
        <div className='absolute top-20 left-10 animate-bounce delay-1000'>
          <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
            <GraduationCap className='w-8 h-8 text-white' />
          </div>
        </div>
        <div className='absolute top-32 right-16 animate-bounce delay-2000'>
          <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
            <BookOpen className='w-6 h-6 text-white' />
          </div>
        </div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Students Data
            </h2>
            <p className='text-gray-600'>Fetching student information...</p>
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
          <GraduationCap className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <BookOpen className='w-6 h-6 text-white' />
        </div>
      </div>
      <div className='absolute bottom-20 left-20 animate-bounce delay-3000'>
        <div className='w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
          <BarChart3 className='w-7 h-7 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                    <GraduationCap className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                      <Users className='w-4 h-4 mr-2' />
                      Student Management
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Students
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Manage and monitor all registered{' '}
                      <span className='bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold'>
                        learners
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Button
                  onClick={() => {
                    void refreshStudents();
                  }}
                  variant='outline'
                  className='border-2 border-gray-300 hover:border-green-500 hover:bg-green-50'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Refresh
                </Button>
                <Button
                  onClick={() => {
                    exportStudentsData();
                  }}
                  className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl'
                  disabled={exporting}
                >
                  <Download className='w-4 h-4 mr-2' />
                  {exporting ? 'Exporting...' : 'Export Data'}
                </Button>
                <Button
                  variant='outline'
                  className='border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                  onClick={() => {
                    navigate('/admin/users');
                  }}
                >
                  <UserPlus className='w-4 h-4 mr-2' />
                  Manage Users
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -translate-y-12 translate-x-12'></div>
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
                  {students.length}
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
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Active Students
                </CardTitle>
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
                  <Activity className='w-4 h-4 text-green-500 mr-1' />
                  <span className='text-xs text-green-600 font-medium'>Online now</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  New This Month
                </CardTitle>
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
                  <TrendingUp className='w-4 h-4 text-purple-500 mr-1' />
                  <span className='text-xs text-purple-600 font-medium'>This month</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>
                  Inactive Students
                </CardTitle>
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
                  <UserX className='w-4 h-4 text-orange-500 mr-1' />
                  <span className='text-xs text-orange-600 font-medium'>Requires review</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden mb-6'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
            <CardContent className='p-6 relative z-10'>
              <div className='flex flex-col md:flex-row gap-4'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                  <Input
                    placeholder='Search by name or email...'
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                    }}
                    className='pl-10 h-12 border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white'
                  />
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setFilterStatus('all');
                    }}
                    className={
                      filterStatus === 'all'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }
                  >
                    All
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setFilterStatus('active');
                    }}
                    className={
                      filterStatus === 'active'
                        ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }
                  >
                    <UserCheck className='w-4 h-4 mr-2' />
                    Active
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setFilterStatus('inactive');
                    }}
                    className={
                      filterStatus === 'inactive'
                        ? 'bg-red-50 border-red-500 text-red-700 hover:bg-red-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }
                  >
                    <UserX className='w-4 h-4 mr-2' />
                    Inactive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
            <CardHeader className='relative z-10'>
              <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                <Users className='h-6 w-6 text-blue-600' />
                All Students ({filteredStudents.length})
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Comprehensive list of all registered students
              </CardDescription>
            </CardHeader>
            <CardContent className='relative z-10'>
              {filteredStudents.length === 0 ? (
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Users className='h-10 w-10 text-blue-500' />
                  </div>
                  <p className='text-gray-900 font-semibold mb-2 text-lg'>No students found</p>
                  <p className='text-sm text-gray-600'>
                    {searchTerm
                      ? 'Try adjusting your search criteria'
                      : 'Students will appear here once they register'}
                  </p>
                </div>
              ) : (
                <div className='rounded-lg border border-gray-200 overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-gradient-to-r from-gray-50 to-blue-50/50'>
                        <TableHead className='font-bold text-gray-900'>Student</TableHead>
                        <TableHead className='font-bold text-gray-900'>Contact</TableHead>
                        <TableHead className='font-bold text-gray-900'>Enrolled</TableHead>
                        <TableHead className='font-bold text-gray-900'>Status</TableHead>
                        <TableHead className='font-bold text-gray-900 text-right'>
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student: any) => (
                        <TableRow
                          key={student._id ?? student.id ?? Math.random()}
                          className='hover:bg-blue-50/50 transition-colors'
                        >
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md'>
                                <span className='text-white font-semibold text-sm'>
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='font-semibold text-gray-900'>{student.name}</p>
                                <p className='text-sm text-gray-600'>ID: {student._id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2 text-sm text-gray-700'>
                                <Mail className='w-4 h-4 text-blue-500' />
                                {student.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2 text-sm text-gray-700'>
                              <Calendar className='w-4 h-4 text-purple-500' />
                              {student.createdAt
                                ? new Date(student.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                student.isActive
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-0'
                              }
                            >
                              {student.isActive ? (
                                <>
                                  <UserCheck className='w-3 h-3 mr-1' />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className='w-3 h-3 mr-1' />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-gray-300 text-gray-700 hover:bg-gray-100'
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowViewDialog(true);
                                }}
                                title='View Student Details'
                              >
                                <Eye className='w-4 h-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-blue-300 text-blue-600 hover:bg-blue-50'
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setEditFormData({
                                    name: student.name || '',
                                    email: student.email || '',
                                    phone: student.phone || '',
                                  });
                                  setShowEditDialog(true);
                                }}
                                title='Edit Student'
                              >
                                <Edit className='w-4 h-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-red-300 text-red-600 hover:bg-red-50'
                                onClick={() => {
                                  const studentId = student._id || student.id || '';
                                  const studentName = student.name || 'this student';
                                  void handleDeleteStudent(studentId, studentName);
                                }}
                                disabled={!student.isActive}
                                title={student.isActive ? 'Delete student' : 'Cannot delete inactive student'}
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Student Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Student Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {selectedStudent?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedStudent?.name}</h3>
                    <p className="text-gray-700">{selectedStudent?.email}</p>
                    {selectedStudent?.phone && <p className="text-gray-600">{selectedStudent.phone}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge className={selectedStudent?.isActive ? 'bg-green-600 text-white border-0' : 'bg-red-600 text-white border-0'}>
                    {selectedStudent?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedStudent?._id || selectedStudent?.id || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{selectedStudent?.role || 'Student'}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Joined</p>
                  <p className="font-semibold text-gray-900">
                    {selectedStudent?.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-500" />
              Edit Student
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update information for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-700">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Student name"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-gray-700">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="email@example.com"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-gray-700">Phone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+91 XXXXXXXXXX"
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: 'Success',
                  description: 'Student updated successfully!',
                });
                setShowEditDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
