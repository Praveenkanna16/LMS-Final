import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAllUsers, useUpdateUserStatus, useDeleteUser } from '@/hooks/api';
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Shield,
  GraduationCap,
  Award,
  Sparkles,
  Activity,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  enrolledCourses?: number;
  lastLogin?: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
  courses?: number;
  lastActive?: string;
}

interface UserStats {
  coursesCompleted: number;
  totalProgress: number;
  averageScore: number;
  timeSpent: number;
}

interface UserWithStats {
  id: number | string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  isActive?: boolean;
  emailVerified?: boolean;
  enrolledCourses: number;
  lastLogin: Date;
  createdAt?: Date;
  created_at?: Date;
  updated_at?: Date;
  courses?: number;
  lastActive?: string;
  stats?: UserStats;
  coursesCount?: number;
  studentsCount?: number;
  totalEarnings?: number;
  availableBalance?: number;
  phone?: string;
}

const UsersManagement: React.FC = () => {
  const { data: allUsers, isLoading, error } = useAllUsers();
  const updateUserStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Transform unknown array data into typed user objects
  const usersArray = Array.isArray(allUsers) ? (allUsers as ApiUser[]) : [];
  const typedUsers = usersArray.map(
    (user: ApiUser): UserWithStats => ({
      id: user.id ?? user._id ?? '',
      name: user.name ?? 'Unknown',
      email: user.email ?? '',
      role: (['student', 'teacher', 'admin'].includes(user.role ?? '') ? user.role : 'student') as
        | 'student'
        | 'teacher'
        | 'admin',
      status:
        user.isActive === false
          ? 'suspended'
          : ((user.status ?? 'active') as 'active' | 'pending' | 'suspended'),
      isActive: user.isActive ?? true,
      emailVerified: user.emailVerified ?? false,
      enrolledCourses: user.enrolledCourses ?? 0,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date(),
      created_at: user.created_at ? new Date(user.created_at) : undefined,
      updated_at: user.updated_at ? new Date(user.updated_at) : undefined,
      courses: user.courses ?? 0,
      lastActive: user.lastActive ?? 'Never',
    })
  );

  // Filter users based on search and filters
  const usersWithStats = React.useMemo(() => {
    return typedUsers
      .filter(user => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      })
      .map(user => ({
        ...user,
        phone: '',
        avatar: '',
        totalEarnings: 0,
        availableBalance: 0,
        coursesCount: user.courses ?? 0,
        studentsCount: 0,
        createdAt: user.created_at,
      }));
  }, [searchTerm, roleFilter, statusFilter, typedUsers]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = usersWithStats.length;
    const students = usersWithStats.filter(u => u.role === 'student').length;
    const teachers = usersWithStats.filter(u => u.role === 'teacher').length;
    const admins = usersWithStats.filter(u => u.role === 'admin').length;
    const active = usersWithStats.filter(u => u.status === 'active').length;
    const pending = usersWithStats.filter(u => u.status === 'pending').length;

    return { total, students, teachers, admins, active, pending };
  }, [usersWithStats]);

  const handleSuspendUser = async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId,
        status: 'inactive',
      });
      toast.success(`User suspended successfully`);
      setShowSuspendDialog(false);
      setSuspendReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to suspend user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId,
        status: 'active',
      });
      toast.success(`User activated successfully`);
    } catch (error) {
      console.error('Failed to activate user:', error);
      toast.error('Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success(`User ${email} deleted permanently`);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-600'>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-red-600 mx-auto mb-4' />
          <p className='text-red-600'>Failed to load users</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                    <Users className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                      <Shield className='w-4 h-4 mr-2' />
                      User Management
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Users Directory
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Complete user management with{' '}
                      <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold'>
                        role and status control
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl'>
                  <Sparkles className='w-4 h-4 mr-2' />
                  Export Users
                </Button>
                <Button
                  variant='outline'
                  className='border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                >
                  <Filter className='w-4 h-4 mr-2' />
                  Advanced Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-10 translate-x-10'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 mb-1'>Total Users</p>
                    <p className='text-3xl font-bold text-blue-600'>{stats.total}</p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-10 translate-x-10'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 mb-1'>Students</p>
                    <p className='text-3xl font-bold text-green-600'>{stats.students}</p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <GraduationCap className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-10 translate-x-10'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 mb-1'>Teachers</p>
                    <p className='text-3xl font-bold text-purple-600'>{stats.teachers}</p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <Award className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-10 translate-x-10'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 mb-1'>Admins</p>
                    <p className='text-3xl font-bold text-orange-600'>{stats.admins}</p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <Shield className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full -translate-y-10 translate-x-10'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 mb-1'>Active</p>
                    <p className='text-3xl font-bold text-emerald-600'>{stats.active}</p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <UserCheck className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -translate-y-10 translate-x-10'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 mb-1'>Pending</p>
                    <p className='text-3xl font-bold text-yellow-600'>{stats.pending}</p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <Clock className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6 relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
            <CardContent className='p-6 relative z-10'>
              <div className='flex flex-col md:flex-row gap-4 items-center'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    placeholder='Search users by name or email...'
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                    }}
                    className='pl-10 border-0 bg-gray-50/80 focus:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300'
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className='w-full md:w-48 border-0 bg-gray-50/80 focus:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300'>
                    <SelectValue placeholder='Filter by role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Roles</SelectItem>
                    <SelectItem value='student'>Students</SelectItem>
                    <SelectItem value='teacher'>Teachers</SelectItem>
                    <SelectItem value='admin'>Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full md:w-48 border-0 bg-gray-50/80 focus:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                    <SelectItem value='suspended'>Suspended</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full -translate-y-16 translate-x-16'></div>
            <CardHeader className='relative z-10'>
              <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                <Activity className='h-6 w-6 text-blue-600' />
                User Directory
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Complete user management with role and status control
              </CardDescription>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-gray-200'>
                      <TableHead className='text-gray-900 font-semibold'>User</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Role</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Status</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Courses</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Students</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Earnings</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Joined</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersWithStats.map(user => (
                      <TableRow
                        key={user.id}
                        className='border-gray-200 hover:bg-gray-50/50 transition-colors'
                      >
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                user.role === 'admin'
                                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                                  : user.role === 'teacher'
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    : 'bg-gradient-to-br from-green-500 to-green-600'
                              }`}
                            >
                              <span className='text-white font-semibold text-sm'>
                                {user.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className='font-semibold text-gray-900'>{user.name}</p>
                              <p className='text-sm text-gray-600'>{user.email}</p>
                              {user.phone && <p className='text-sm text-gray-600'>{user.phone}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-0 shadow-sm ${
                              user.role === 'admin'
                                ? 'bg-red-500 text-white'
                                : user.role === 'teacher'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-green-500 text-white'
                            }`}
                          >
                            {user.role === 'admin' && <Shield className='w-3 h-3 mr-1' />}
                            {user.role === 'teacher' && <Award className='w-3 h-3 mr-1' />}
                            {user.role === 'student' && <GraduationCap className='w-3 h-3 mr-1' />}
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-0 shadow-sm ${
                              user.status === 'active'
                                ? 'bg-green-500 text-white'
                                : user.status === 'pending'
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                            }`}
                          >
                            {user.status === 'active' && <CheckCircle className='w-3 h-3 mr-1' />}
                            {user.status === 'pending' && <Clock className='w-3 h-3 mr-1' />}
                            {user.status === 'suspended' && <Ban className='w-3 h-3 mr-1' />}
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === 'teacher' ? (
                            <span className='text-gray-900 font-medium'>
                              {user.coursesCount} courses
                            </span>
                          ) : (
                            <span className='text-gray-400'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.role === 'teacher' ? (
                            <span className='text-gray-900 font-medium'>
                              {user.studentsCount} students
                            </span>
                          ) : (
                            <span className='text-gray-400'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.role === 'teacher' ? (
                            <div>
                              <div className='text-gray-900 font-semibold'>
                                ₹{user.totalEarnings.toLocaleString()}
                              </div>
                              <div className='text-sm text-gray-600'>
                                Available: ₹{user.availableBalance.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className='text-gray-400'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className='text-gray-900 font-medium'>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : 'N/A'}
                          </span>
                          <br />
                          <span className='text-sm text-gray-600'>
                            {user.lastActive ?? 'Never'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                              onClick={() => {
                                setSelectedUser(user);
                                setShowViewDialog(true);
                              }}
                              title='View Details'
                            >
                              <Eye className='w-4 h-4' />
                            </Button>

                            {user.status === 'active' ? (
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500'
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowSuspendDialog(true);
                                }}
                                disabled={updateUserStatusMutation.isPending}
                                title='Suspend User'
                              >
                                <Ban className='w-4 h-4 mr-1' />
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-green-300 text-green-600 hover:bg-green-50 hover:border-green-500'
                                onClick={() => {
                                  if (user.id) {
                                    void handleActivateUser(String(user.id));
                                  }
                                }}
                                disabled={updateUserStatusMutation.isPending}
                                title='Activate User'
                              >
                                <CheckCircle className='w-4 h-4 mr-1' />
                                Activate
                              </Button>
                            )}

                            <Button
                              size='sm'
                              variant='outline'
                              className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500'
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              disabled={deleteUserMutation.isPending}
                              title='Delete Permanently'
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
            </CardContent>
          </Card>

          {/* Suspend Dialog */}
          <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
            <DialogContent className='bg-white border-0 shadow-2xl'>
              <DialogHeader>
                <DialogTitle className='text-gray-900 flex items-center gap-2'>
                  <AlertCircle className='w-5 h-5 text-red-500' />
                  Suspend User
                </DialogTitle>
                <DialogDescription className='text-gray-600'>
                  Are you sure you want to suspend {selectedUser?.name} from the platform? This
                  action can be reversed later.
                </DialogDescription>
              </DialogHeader>
              <div className='py-4'>
                <div className='space-y-4'>
                  <div className='bg-red-50 border border-red-200 rounded-2xl p-4'>
                    <h4 className='font-semibold text-red-900 mb-2'>User Details</h4>
                    <p className='text-red-800 font-medium'>{selectedUser?.name}</p>
                    <p className='text-red-700'>{selectedUser?.email}</p>
                    <p className='text-sm text-red-600'>Role: {selectedUser?.role}</p>
                  </div>
                  <div>
                    <Label htmlFor='reason' className='text-gray-900 font-semibold'>
                      Reason for suspension
                    </Label>
                    <textarea
                      id='reason'
                      placeholder='Enter reason for suspension...'
                      value={suspendReason}
                      onChange={e => {
                        setSuspendReason(e.target.value);
                      }}
                      className='w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-2xl px-4 py-3 mt-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300'
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowSuspendDialog(false);
                    setSuspendReason('');
                  }}
                  className='border-gray-300 hover:border-gray-500'
                >
                  Cancel
                </Button>
                <Button
                  className='bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                  onClick={() => {
                    if (selectedUser) {
                      void handleSuspendUser(String(selectedUser.id));
                    }
                  }}
                  disabled={updateUserStatusMutation.isPending || !suspendReason.trim()}
                >
                  {updateUserStatusMutation.isPending ? (
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  ) : (
                    <Ban className='w-4 h-4 mr-2' />
                  )}
                  Suspend User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className='bg-white border-0 shadow-2xl'>
              <DialogHeader>
                <DialogTitle className='text-gray-900 flex items-center gap-2'>
                  <Trash2 className='w-5 h-5 text-red-500' />
                  Delete User Permanently
                </DialogTitle>
                <DialogDescription className='text-gray-600'>
                  Are you sure you want to permanently delete {selectedUser?.name}? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className='py-4'>
                <div className='bg-red-50 border border-red-200 rounded-2xl p-4'>
                  <h4 className='font-semibold text-red-900 mb-2'>User Details</h4>
                  <p className='text-red-800 font-medium'>{selectedUser?.name}</p>
                  <p className='text-red-700'>{selectedUser?.email}</p>
                  <p className='text-sm text-red-600'>Role: {selectedUser?.role}</p>
                </div>
                <div className='mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4'>
                  <p className='text-yellow-800 text-sm'>
                    <strong>Warning:</strong> This will permanently delete the user account and all
                    associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowDeleteDialog(false);
                  }}
                  className='border-gray-300 hover:border-gray-500'
                >
                  Cancel
                </Button>
                <Button
                  className='bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                  onClick={() => {
                    if (selectedUser) {
                      void handleDeleteUser(String(selectedUser.id), selectedUser.email);
                    }
                  }}
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending ? (
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  ) : (
                    <Trash2 className='w-4 h-4 mr-2' />
                  )}
                  Delete Permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View User Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className='bg-white border-0 shadow-2xl max-w-2xl'>
              <DialogHeader>
                <DialogTitle className='text-gray-900 flex items-center gap-2'>
                  <Eye className='w-5 h-5 text-blue-500' />
                  User Details
                </DialogTitle>
                <DialogDescription className='text-gray-600'>
                  Complete information about {selectedUser?.name}
                </DialogDescription>
              </DialogHeader>
              <div className='py-4'>
                <div className='space-y-4'>
                  <div className='bg-blue-50 border border-blue-200 rounded-2xl p-4'>
                    <div className='flex items-center gap-4 mb-4'>
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                          selectedUser?.role === 'admin'
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : selectedUser?.role === 'teacher'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                              : 'bg-gradient-to-br from-green-500 to-green-600'
                        }`}
                      >
                        <span className='text-white font-bold text-xl'>
                          {selectedUser?.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className='text-xl font-bold text-gray-900'>{selectedUser?.name}</h3>
                        <p className='text-gray-700'>{selectedUser?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4'>
                      <p className='text-sm text-gray-600 mb-1'>Role</p>
                      <Badge
                        className={`border-0 ${
                          selectedUser?.role === 'admin'
                            ? 'bg-red-500 text-white'
                            : selectedUser?.role === 'teacher'
                              ? 'bg-blue-500 text-white'
                              : 'bg-green-500 text-white'
                        }`}
                      >
                        {selectedUser?.role}
                      </Badge>
                    </div>

                    <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4'>
                      <p className='text-sm text-gray-600 mb-1'>Status</p>
                      <Badge
                        className={`border-0 ${
                          selectedUser?.status === 'active'
                            ? 'bg-green-500 text-white'
                            : selectedUser?.status === 'pending'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                        }`}
                      >
                        {selectedUser?.status}
                      </Badge>
                    </div>

                    <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4'>
                      <p className='text-sm text-gray-600 mb-1'>Joined</p>
                      <p className='font-semibold text-gray-900'>
                        {selectedUser?.created_at
                          ? new Date(selectedUser.created_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>

                    <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4'>
                      <p className='text-sm text-gray-600 mb-1'>Last Active</p>
                      <p className='font-semibold text-gray-900'>
                        {selectedUser?.lastActive ?? 'Never'}
                      </p>
                    </div>

                    {selectedUser?.role === 'teacher' && (
                      <>
                        <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4'>
                          <p className='text-sm text-gray-600 mb-1'>Courses</p>
                          <p className='font-semibold text-gray-900'>{selectedUser.coursesCount}</p>
                        </div>

                        <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4'>
                          <p className='text-sm text-gray-600 mb-1'>Students</p>
                          <p className='font-semibold text-gray-900'>{selectedUser.studentsCount}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowViewDialog(false);
                  }}
                  className='border-gray-300 hover:border-gray-500'
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
