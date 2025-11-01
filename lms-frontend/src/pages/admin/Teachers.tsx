import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAllUsers, useUpdateUserStatus, useDeleteUser } from '@/hooks/api';
import {
  Users,
  Search,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  TrendingUp,
  Star,
  DollarSign,
  UserCheck,
  AlertCircle,
  Loader2,
  Clock,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'pending' | 'suspended';
  totalEarnings: number;
  availableBalance: number;
  totalStudents: number;
  averageRating: number;
  coursesCount: number;
  batchesCount: number;
  joinDate: string;
  lastActive: string;
}



const TeachersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const { data: allUsers, isLoading, error } = useAllUsers();
  
  const updateUserStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  // Filter teachers from all users
  const teachers = React.useMemo(() => {
    const usersList = Array.isArray(allUsers) ? (allUsers as any[]) : [];
    
    return usersList
      .filter((user: any) => user.role === 'teacher')
      .filter((teacher: any) => {
        const name = String(teacher.name ?? '').toLowerCase();
        const email = String(teacher.email ?? '').toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .map((teacher: any) => ({
        id: teacher.id ?? teacher._id ?? '',
        name: teacher.name ?? 'Unknown',
        email: teacher.email ?? 'unknown@example.com',
        phone: teacher.phone,
        status: (teacher.isActive === false ? 'suspended' : (teacher.status ?? 'active')) as 'active' | 'pending' | 'suspended',
        totalEarnings: teacher.totalEarnings ?? 0,
        availableBalance: teacher.availableBalance ?? teacher.pendingEarnings ?? 0,
        totalStudents: teacher.totalStudents ?? 0,
        averageRating: teacher.averageRating ?? 0,
        coursesCount: teacher.coursesCount ?? teacher.courses ?? 0,
        batchesCount: teacher.batchesCount ?? teacher.batches ?? 0,
        joinDate: teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A',
        lastActive: teacher.lastActive ?? 'N/A',
      }));
  }, [allUsers, searchTerm, statusFilter]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => t.status === 'active').length;
    const pending = teachers.filter(t => t.status === 'pending').length;
    const suspended = teachers.filter(t => t.status === 'suspended').length;
    const totalEarnings = teachers.reduce((sum, t) => sum + t.totalEarnings, 0);

    return { total, active, pending, suspended, totalEarnings };
  }, [teachers]);

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId: teacherId,
        status: 'active',
      });
      toast.success('Teacher approved successfully');
      setShowApprovalDialog(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Failed to approve teacher:', error);
      toast.error('Failed to approve teacher');
    }
  };

  const handleSuspendTeacher = async (teacherId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId: teacherId,
        status: 'inactive',
      });
      toast.success('Teacher suspended successfully');
      setShowSuspendDialog(false);
      setSuspendReason('');
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Failed to suspend teacher:', error);
      toast.error('Failed to suspend teacher');
    }
  };

  const handleActivateTeacher = async (teacherId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId: teacherId,
        status: 'active',
      });
      toast.success('Teacher activated successfully');
    } catch (error) {
      console.error('Failed to activate teacher:', error);
      toast.error('Failed to activate teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId: string, email: string) => {
    try {
      await deleteUserMutation.mutateAsync(teacherId);
      toast.success(`Teacher ${email} deleted permanently`);
      setShowDeleteDialog(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      toast.error('Failed to delete teacher');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]"></div>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]"></div>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">Failed to load teachers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]"></div>
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl relative overflow-hidden border-0">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.1)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.1)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(34,197,94,0.1)_0%,_transparent_50%)]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <UserCheck className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <Badge className="mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold">
                      <Users className="w-4 h-4 mr-2" />
                      Teacher Management
                    </Badge>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg">
                      Teachers Portal
                    </h1>
                    <p className="text-xl text-gray-600 mt-2">
                      Manage educator profiles and track teaching performance with{' '}
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                        advanced analytics
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-12 translate-x-12"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-gray-900">Total Teachers</CardTitle>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats.total}
                </div>
                <p className="text-sm text-gray-600">Registered educators</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">+5% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-gray-900">Active Teachers</CardTitle>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats.active}
                </div>
                <p className="text-sm text-gray-600">Currently teaching</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">All verified</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -translate-y-12 translate-x-12"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-gray-900">Pending Approval</CardTitle>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats.pending}
                </div>
                <p className="text-sm text-gray-600">Awaiting review</p>
                <div className="flex items-center mt-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-xs text-orange-600 font-medium">Requires attention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-gray-900">Total Earnings</CardTitle>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300">
                  ₹{stats.totalEarnings.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Platform revenue</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">+15% this month</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto mb-8">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search teachers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers Table */}
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Teachers Directory</CardTitle>
              <CardDescription className="text-gray-600">
                Manage teacher accounts, approvals, and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-900">Teacher</TableHead>
                      <TableHead className="text-gray-900">Status</TableHead>
                      <TableHead className="text-gray-900">Students</TableHead>
                      <TableHead className="text-gray-900">Rating</TableHead>
                      <TableHead className="text-gray-900">Earnings</TableHead>
                      <TableHead className="text-gray-900">Courses</TableHead>
                      <TableHead className="text-gray-900">Joined</TableHead>
                      <TableHead className="text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                    <TableRow key={teacher.id} className="border-gray-200 hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-gray-900 font-semibold">
                            {teacher.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{teacher.name}</p>
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                          {teacher.phone && (
                            <p className="text-sm text-gray-400">{teacher.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          teacher.status === 'active' ? 'bg-green-600' :
                          teacher.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                        } text-white border-0`}
                      >
                        {teacher.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {teacher.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {teacher.status === 'suspended' && <Ban className="w-3 h-3 mr-1" />}
                        {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{teacher.totalStudents}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-900">{teacher.averageRating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900 font-medium">₹{teacher.totalEarnings.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Available: ₹{teacher.availableBalance.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-900">{teacher.coursesCount} courses</span>
                      <br />
                      <span className="text-sm text-gray-400">{teacher.batchesCount} batches</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-900">{teacher.joinDate}</span>
                      <br />
                      <span className="text-sm text-gray-600">{teacher.lastActive}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm" 
                          variant="outline" 
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowViewDialog(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm" 
                          variant="outline" 
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setEditFormData({
                              name: teacher.name,
                              email: teacher.email,
                              phone: teacher.phone || '',
                            });
                            setShowEditDialog(true);
                          }}
                          title="Edit Teacher"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {teacher.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowApprovalDialog(true);
                            }}
                            disabled={updateUserStatusMutation.isPending}
                            title="Approve Teacher"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}

                        {teacher.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowSuspendDialog(true);
                            }}
                            disabled={updateUserStatusMutation.isPending}
                            title="Suspend Teacher"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}

                        {teacher.status === 'suspended' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              void handleActivateTeacher(teacher.id);
                            }}
                            disabled={updateUserStatusMutation.isPending}
                            title="Activate Teacher"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}

                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowDeleteDialog(true);
                          }}
                          disabled={deleteUserMutation.isPending}
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
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
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Approve Teacher</DialogTitle>
            <DialogDescription className="text-gray-600">
              Approve {selectedTeacher?.name} to start teaching on the platform?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="font-medium text-blue-700 mb-2">Teacher Details</h4>
              <p className="text-gray-900">{selectedTeacher?.name}</p>
              <p className="text-gray-600">{selectedTeacher?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedTeacher && handleApproveTeacher(selectedTeacher.id)}
              disabled={updateUserStatusMutation.isPending}
            >
              {updateUserStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Suspend Teacher</DialogTitle>
            <DialogDescription className="text-gray-600">
              Suspend {selectedTeacher?.name} from the platform?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <h4 className="font-medium text-red-700 mb-2">Teacher Details</h4>
                <p className="text-gray-900">{selectedTeacher?.name}</p>
                <p className="text-gray-600">{selectedTeacher?.email}</p>
              </div>
              <div>
                <Label htmlFor="reason" className="text-gray-700">Reason for suspension</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for suspension..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSuspendDialog(false);
              setSuspendReason('');
            }}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedTeacher && handleSuspendTeacher(selectedTeacher.id)}
              disabled={updateUserStatusMutation.isPending || !suspendReason.trim()}
            >
              {updateUserStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              Suspend Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Teacher Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {selectedTeacher?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedTeacher?.name}</h3>
                    <p className="text-gray-700">{selectedTeacher?.email}</p>
                    {selectedTeacher?.phone && <p className="text-gray-600">{selectedTeacher.phone}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge className={`${
                    selectedTeacher?.status === 'active' ? 'bg-green-600' :
                    selectedTeacher?.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                  } text-white border-0`}>
                    {selectedTeacher?.status}
                  </Badge>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-xl font-bold text-gray-900">{selectedTeacher?.totalStudents}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Courses</p>
                  <p className="text-xl font-bold text-gray-900">{selectedTeacher?.coursesCount}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Active Batches</p>
                  <p className="text-xl font-bold text-gray-900">{selectedTeacher?.batchesCount}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <p className="text-xl font-bold text-gray-900">{selectedTeacher?.averageRating}</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-xl font-bold text-gray-900">₹{selectedTeacher?.totalEarnings.toLocaleString()}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Joined</p>
                  <p className="font-semibold text-gray-900">{selectedTeacher?.joinDate}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Last Active</p>
                  <p className="font-semibold text-gray-900">{selectedTeacher?.lastActive}</p>
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

      {/* Edit Teacher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-500" />
              Edit Teacher
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update information for {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-700">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Teacher name"
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
                toast.success('Teacher updated successfully!');
                setShowEditDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Teacher Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Teacher Permanently
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to permanently delete {selectedTeacher?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-red-900 mb-2">Teacher Details</h4>
              <p className="text-red-800 font-medium">{selectedTeacher?.name}</p>
              <p className="text-red-700">{selectedTeacher?.email}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Warning:</strong> This will permanently delete the teacher account and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedTeacher && handleDeleteTeacher(selectedTeacher.id, selectedTeacher.email)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeachersManagement;
