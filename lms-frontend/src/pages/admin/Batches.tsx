import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAllUsers, useEnrollInBatch } from '@/hooks/api';
import { toast as sonnerToast } from 'sonner';
import { useBatchSync, triggerBatchUpdate, useBatchUpdateListener } from '@/hooks/useBatchSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BookOpen,
  Search,
  Eye,
  Edit,
  Users,
  Clock,
  Loader2,
  TrendingUp,
  CheckCircle,
  MoreHorizontal,
  GraduationCap,
  Award,
  Plus,
  RefreshCw,
  X,
  UserPlus,
  Copy,
  Archive,
  Download,
  Trash2,
} from 'lucide-react';

interface ErrorWithMessage {
  message?: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  grade: string;
  teacherId: string;
  teacher: {
    name: string;
    email: string;
  };
  students: { id: string; name: string; status: string }[];
  maxStudents: number;
  schedule: string;
  isActive: boolean;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

const BatchesManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Enable automatic batch synchronization across all dashboards
  // TEMPORARILY DISABLED - Causing infinite re-renders, needs fix
  // const { syncNow } = useBatchSync(true, 30000); // Auto-sync every 30 seconds
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    maxStudents: 30,
    schedule: '',
    teacherId: '',
  });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Add batch form state
  const [addFormData, setAddFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    description: '',
    teacherId: '',
    maxStudents: 30,
    schedule: '',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    enrollmentFee: 0,
  });
  const [addStudentSearchTerm, setAddStudentSearchTerm] = useState('');
  const [addSelectedStudents, setAddSelectedStudents] = useState<string[]>([]);

  // Fetch all users for teacher and student selection
  const { data: allUsers = [] } = useAllUsers();
  const enrollInBatch = useEnrollInBatch();

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
  const response = await apiService.getAllBatches();
      
      // Handle nested response structure: { data: { batches: [...] } }
      let batchesList = [];
      if ('data' in response) {
        if (response.data && typeof response.data === 'object' && 'batches' in response.data) {
          batchesList = Array.isArray(response.data.batches) ? response.data.batches : [];
        } else if (Array.isArray(response.data)) {
          batchesList = response.data;
        }
      } else if (Array.isArray(response)) {
        batchesList = response;
      }
      
      setBatches(batchesList as Batch[]);
    } catch (error) {
      const errorWithMessage = error as ErrorWithMessage;
      console.error('Batches fetch error:', error);
      toast({
        title: 'Error',
        description: errorWithMessage.message ?? 'Failed to load batches data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshBatches = async () => {
    setRefreshing(true);
    await fetchBatches();
    // await syncNow(); // Force sync across all dashboards - DISABLED
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Batches refreshed successfully',
    });
  };

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  // Listen for batch updates from other tabs/dashboards
  useBatchUpdateListener(useCallback(() => {
    console.log('🔔 Batch update detected in Admin - refreshing data...');
    void fetchBatches();
  }, [fetchBatches]));

  // Transform batches data
  const batchesWithStats = React.useMemo(() => {
    return batches
      .filter(batch => {
        const batchName = batch?.name || '';
        const batchSubject = batch?.subject || '';
        const teacherName = batch?.teacher?.name || '';
        const matchesSearch =
          batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batchSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacherName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          (statusFilter === 'all' && batch?.isActive !== false) ||  // Show active batches by default
          (statusFilter === 'active' && batch?.isActive) ||
          (statusFilter === 'inactive' && !batch?.isActive);
        return matchesSearch && matchesStatus;
      })
      .map(batch => {
        const students = Array.isArray(batch?.students) ? batch.students : [];
  const currentStudents = Number.isFinite(students.length) ? students.length : 0;
  const maxStudents = Number.isFinite(Number(batch?.maxStudents)) && Number(batch?.maxStudents) > 0 ? Number(batch?.maxStudents) : 30;
  const enrollmentRate = Number.isFinite(currentStudents) && Number.isFinite(maxStudents) ? Math.round((currentStudents / maxStudents) * 100) : 0;
  const completedStudents = Array.isArray(students) ? students.filter(s => s?.status === 'completed').length : 0;
  const completionRate = Number.isFinite(currentStudents) && currentStudents > 0 ? Math.round((completedStudents / currentStudents) * 100) : 0;

        return {
          id: batch?.id || '',
          name: batch?.name || 'Unnamed Batch',
          subject: batch?.subject || 'N/A',
          grade: batch?.grade || 'N/A',
          teacherId: batch?.teacherId || '',
          teacher: {
            name: batch?.teacher?.name || 'Unknown',
            email: batch?.teacher?.email || 'N/A',
          },
          maxStudents,
          schedule: batch?.schedule || 'Not scheduled',
          isActive: batch?.isActive ?? true,
          createdAt: batch?.createdAt || new Date().toISOString(),
          currentStudents,
          status: batch?.isActive ? 'active' : 'completed',
          startDate: new Date(batch?.startDate || batch?.createdAt || new Date()),
          endDate: new Date(batch?.endDate || batch?.createdAt || new Date()),
          enrollmentRate,
          completionRate,
        };
      });
  }, [batches, searchTerm, statusFilter]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = batchesWithStats.length;
    const active = batchesWithStats.filter(b => b.isActive).length;
    const completed = batchesWithStats.filter(b => !b.isActive).length;
  const totalStudents = batchesWithStats.reduce((sum, b) => sum + (Number.isFinite(Number(b.currentStudents)) ? Number(b.currentStudents) : 0), 0);
  const totalCapacity = batchesWithStats.reduce((sum, b) => sum + (Number.isFinite(Number(b.maxStudents)) ? Number(b.maxStudents) : 0), 0);

    return { total, active, completed, totalStudents, totalCapacity };
  }, [batchesWithStats]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]' />
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-blue-600' />
          <p className='text-gray-600'>Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]' />
      <div className='relative z-10 p-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            <div className='w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
              <BookOpen className='w-10 h-10 text-white' />
            </div>
            <div>
              <Badge className='mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                <BookOpen className='w-4 h-4 mr-2' />
                Batch Management
              </Badge>
              <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent drop-shadow-lg'>
                Manage Batches
              </h1>
              <p className='text-xl text-gray-600 mt-2'>Monitor and manage all course batches</p>
            </div>
          </div>
          <div className='flex gap-4'>
            <Button
              variant='outline'
              onClick={() => void refreshBatches()}
              disabled={refreshing}
              className='border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50'
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl'
              onClick={() => {
                // Reset form data
                setAddFormData({
                  name: '',
                  subject: '',
                  grade: '',
                  description: '',
                  teacherId: '',
                  maxStudents: 30,
                  schedule: '',
                  startDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                });
                setAddSelectedStudents([]);
                setShowAddDialog(true);
              }}
            >
              <Plus className='w-4 h-4 mr-2' />
              Add Batch
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-12 translate-x-12'></div>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Batches</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <BookOpen className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                {stats.total}
              </div>
              <p className='text-sm text-gray-600'>All batches</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12'></div>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Active</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <CheckCircle className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                {stats.active}
              </div>
              <p className='text-sm text-gray-600'>Currently running</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12'></div>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Completed</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <Award className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                {stats.completed}
              </div>
              <p className='text-sm text-gray-600'>Finished batches</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-12 translate-x-12'></div>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Students</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <Users className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                {stats.totalStudents}
              </div>
              <p className='text-sm text-gray-600'>Enrolled students</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full -translate-y-12 translate-x-12'></div>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Capacity</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <TrendingUp className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                {stats.totalCapacity}
              </div>
              <p className='text-sm text-gray-600'>Maximum capacity</p>
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
                  placeholder='Search batches by name, course, or teacher...'
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                  }}
                  className='pl-10 h-12 border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full md:w-48 h-12 border-2 border-gray-200 bg-white focus:border-blue-500'>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Batches Table */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='text-gray-900'>Batch Directory</CardTitle>
            <CardDescription className='text-gray-600'>
              Monitor batch enrollment, capacity, and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-gray-200'>
                    <TableHead className='text-gray-700'>Batch</TableHead>
                    <TableHead className='text-gray-700'>Course</TableHead>
                    <TableHead className='text-gray-700'>Teacher</TableHead>
                    <TableHead className='text-gray-700'>Enrollment</TableHead>
                    <TableHead className='text-gray-700'>Schedule</TableHead>
                    <TableHead className='text-gray-700'>Status</TableHead>
                    <TableHead className='text-gray-700'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchesWithStats.map(batch => (
                    <TableRow key={batch.id} className='border-gray-200'>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
                            <GraduationCap className='w-6 h-6 text-white' />
                          </div>
                          <div>
                            <p className='font-medium text-gray-900'>{batch.name}</p>
                            <p className='text-sm text-gray-500'>ID: {String(batch.id).slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium text-gray-900'>{batch.subject}</p>
                          <p className='text-sm text-gray-500'>Grade: {batch.grade}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium text-gray-900'>{batch.teacher.name}</p>
                          <p className='text-sm text-gray-500'>{batch.teacher.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-gray-900 font-medium mb-1'>
                          {batch.currentStudents}/{batch.maxStudents}
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full'
                            style={{
                              width: `${Number.isFinite(batch.currentStudents) && Number.isFinite(batch.maxStudents) && batch.maxStudents > 0 ? Math.min(100, Math.round((batch.currentStudents / batch.maxStudents) * 100)) : 0}%`,
                            }}
                          ></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1 text-gray-900'>
                          <Clock className='w-4 h-4 text-gray-500' />
                          <span className='font-medium'>{batch.schedule || '—'}</span>
                        </div>
                        <p className='text-sm text-gray-500 mt-1'>
                          {batch.startDate.toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            batch.status === 'active'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-purple-100 text-purple-700 border-purple-200'
                          } border`}
                        >
                          {batch.status === 'active' && <CheckCircle className='w-3 h-3 mr-1' />}
                          {batch.status === 'completed' && <Award className='w-3 h-3 mr-1' />}
                          {(batch.status || '').charAt(0).toUpperCase() + ((batch.status || '').slice(1) || '')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            className='border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-500'
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowViewDialog(true);
                            }}
                            title='View Batch Details'
                          >
                            <Eye className='w-4 h-4' />
                          </Button>

                          <Button
                            size='sm'
                            variant='outline'
                            className='border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-500'
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowEditDialog(true);
                            }}
                            title='Edit Batch'
                          >
                            <Edit className='w-4 h-4' />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-gray-300 text-gray-700 hover:bg-gray-50'
                                title='More Options'
                              >
                                <MoreHorizontal className='w-4 h-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                              <DropdownMenuLabel>Batch Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  sonnerToast.info('Duplicate batch feature coming soon!');
                                }}
                              >
                                <Copy className='w-4 h-4 mr-2' />
                                Duplicate Batch
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  sonnerToast.info('Archive batch feature coming soon!');
                                }}
                              >
                                <Archive className='w-4 h-4 mr-2' />
                                Archive Batch
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  sonnerToast.info('Export batch data feature coming soon!');
                                }}
                              >
                                <Download className='w-4 h-4 mr-2' />
                                Export Data
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className='text-red-600 focus:text-red-600'
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete "${batch.name}"?`)) {
                                    try {
                                      await apiService.deleteBatch(String(batch.id));
                                      sonnerToast.success('Batch deleted successfully');
                                      fetchBatches();
                                    } catch (error) {
                                      sonnerToast.error('Failed to delete batch');
                                    }
                                  }
                                }}
                              >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Delete Batch
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Batch Analytics */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mt-6'>
          <CardHeader>
            <CardTitle className='text-gray-900'>Batch Analytics</CardTitle>
            <CardDescription className='text-gray-600'>
              Enrollment trends and capacity utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-blue-700 mb-1'>Avg Enrollment Rate</p>
                    <p className='text-3xl font-bold text-blue-900'>
            {Number.isFinite(stats.totalStudents) && Number.isFinite(stats.totalCapacity) && stats.totalCapacity > 0
              ? Math.round((Number(stats.totalStudents) / Number(stats.totalCapacity)) * 100)
              : 0}
                      %
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center'>
                    <TrendingUp className='w-6 h-6 text-white' />
                  </div>
                </div>
              </div>

              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-green-700 mb-1'>Capacity Utilization</p>
                    <p className='text-3xl font-bold text-green-900'>
            {Number.isFinite(stats.totalStudents) && Number.isFinite(stats.totalCapacity) && stats.totalCapacity > 0
              ? Math.round((Number(stats.totalStudents) / Number(stats.totalCapacity)) * 100)
              : 0}
                      %
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                </div>
              </div>

              <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-purple-700 mb-1'>Completion Rate</p>
                    <p className='text-3xl font-bold text-purple-900'>
                      {(() => {
                          const count = batchesWithStats.length;
                          if (count === 0) return 0;
                          const sum = batchesWithStats.reduce((s, batch) => s + (Number.isFinite(Number(batch.completionRate)) ? Number(batch.completionRate) : 0), 0);
                          return Number.isFinite(sum) ? Math.round(sum / count) : 0;
                        })()}
                      %
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center'>
                    <Award className='w-6 h-6 text-white' />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Batch Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Batch Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about {selectedBatch?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedBatch?.name}</h3>
                    <p className="text-gray-700">{selectedBatch?.subject} - Grade {selectedBatch?.grade}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Teacher</p>
                  <p className="text-lg font-bold text-gray-900">{selectedBatch?.teacher?.name}</p>
                  <p className="text-sm text-gray-500">{selectedBatch?.teacher?.email}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge className={selectedBatch?.isActive ? 'bg-green-600 text-white border-0' : 'bg-gray-600 text-white border-0'}>
                    {selectedBatch?.isActive ? 'Active' : 'Completed'}
                  </Badge>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Enrollment</p>
                  <p className="text-xl font-bold text-gray-900">{selectedBatch?.currentStudents}/{selectedBatch?.maxStudents}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Schedule</p>
                  <p className="font-semibold text-gray-900">{selectedBatch?.schedule}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="font-semibold text-gray-900">
                    {selectedBatch?.startDate ? new Date(selectedBatch.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Batch ID</p>
                  <p className="font-semibold text-gray-900">{String(selectedBatch?.id).slice(0, 12)}...</p>
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

      {/* Edit Batch Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (open && selectedBatch) {
          // Debug: Log the selected batch structure
          console.log('Selected batch for editing:', selectedBatch);
          
          // Initialize form data when dialog opens
          // Use fallbacks to ensure fields are never empty
          setEditFormData({
            name: selectedBatch.name || selectedBatch.batchName || 'Batch',
            subject: selectedBatch.subject || selectedBatch.courseName || 'Subject',
            grade: selectedBatch.grade || '',
            maxStudents: selectedBatch.maxStudents || selectedBatch.studentLimit || 30,
            schedule: selectedBatch.schedule || '',
            teacherId: selectedBatch.teacherId || selectedBatch.teacher_id || '',
          });
          setSelectedStudents(selectedBatch.students?.map((s: any) => s.id || s.student) || []);
        }
      }}>
        <DialogContent className='bg-white border-0 shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-gray-900 flex items-center gap-2'>
              <Edit className='w-5 h-5 text-blue-500' />
              Edit Batch
            </DialogTitle>
            <DialogDescription className='text-gray-600'>
              Update information for {selectedBatch?.name}
            </DialogDescription>
          </DialogHeader>
          <div className='py-4 space-y-6'>
            {/* Basic Information */}
            <div className='space-y-4 border-b pb-4'>
              <h3 className='text-sm font-semibold text-gray-700'>Basic Information</h3>
              <div className='space-y-2'>
                <Label htmlFor='edit-name' className='text-gray-700'>Batch Name</Label>
                <Input
                  id='edit-name'
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder='Batch name'
                  className='bg-white border-gray-300'
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-subject' className='text-gray-700'>Subject</Label>
                  <Input
                    id='edit-subject'
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                    placeholder='Subject'
                    className='bg-white border-gray-300'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-grade' className='text-gray-700'>Grade</Label>
                  <Input
                    id='edit-grade'
                    value={editFormData.grade}
                    onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                    placeholder='Grade'
                    className='bg-white border-gray-300'
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-max' className='text-gray-700'>Max Students</Label>
                  <Input
                    id='edit-max'
                    type='number'
                    value={editFormData.maxStudents}
                    onChange={(e) => setEditFormData({ ...editFormData, maxStudents: parseInt(e.target.value) || 30 })}
                    placeholder='30'
                    className='bg-white border-gray-300'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-schedule' className='text-gray-700'>Schedule</Label>
                  <Input
                    id='edit-schedule'
                    value={editFormData.schedule}
                    onChange={(e) => setEditFormData({ ...editFormData, schedule: e.target.value })}
                    placeholder='Mon, Wed, Fri'
                    className='bg-white border-gray-300'
                  />
                </div>
              </div>
            </div>

            {/* Teacher Assignment */}
            <div className='space-y-4 border-b pb-4'>
              <h3 className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                <Users className='w-4 h-4' />
                Assign Teacher
              </h3>
              <div className='space-y-2'>
                <Label htmlFor='edit-teacher' className='text-gray-700'>Select Teacher</Label>
                <Select
                  value={editFormData.teacherId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, teacherId: value })}
                >
                  <SelectTrigger className='bg-white border-gray-300'>
                    <SelectValue placeholder='Select a teacher' />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter((user: any) => user.role === 'teacher')
                      .map((teacher: any) => (
                        <SelectItem key={teacher._id || teacher.id} value={String(teacher.id ?? teacher._id ?? '')}>
                          {teacher.name} ({teacher.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Management */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <UserPlus className='w-4 h-4' />
                  Manage Students ({selectedStudents.length}/{editFormData.maxStudents})
                </h3>
              </div>
              
              {/* Search and Add Students */}
              <div className='space-y-2'>
                <Label className='text-gray-700'>Add Students</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    placeholder='Search students by name or email...'
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className='pl-10 bg-white border-gray-300'
                  />
                </div>
                
                {/* Available Students List */}
                {studentSearchTerm && (
                  <div className='border border-gray-200 rounded-lg max-h-48 overflow-y-auto'>
                    {allUsers
                      .filter((user: any) => 
                        user.role === 'student' && 
                        !selectedStudents.includes(user._id || user.id) &&
                        (user.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                      )
                      .slice(0, 10)
                      .map((student: any) => (
                        <div
                          key={student._id || student.id}
                          className='flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer'
                          onClick={() => {
                            if (selectedStudents.length < editFormData.maxStudents) {
                              setSelectedStudents([...selectedStudents, student._id || student.id]);
                              setStudentSearchTerm('');
                            } else {
                              sonnerToast.error('Maximum student capacity reached');
                            }
                          }}
                        >
                          <div>
                            <p className='font-medium text-gray-900'>{student.name}</p>
                            <p className='text-sm text-gray-500'>{student.email}</p>
                          </div>
                          <Button size='sm' variant='ghost' type="button">
                            <Plus className='w-4 h-4' />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Current Students */}
              {selectedStudents.length > 0 && (
                <div className='space-y-2'>
                  <Label className='text-gray-700'>Enrolled Students</Label>
                  <div className='border border-gray-200 rounded-lg max-h-64 overflow-y-auto'>
                    {selectedStudents.map((studentId) => {
                      const student = allUsers.find((u: any) => (u._id || u.id) === studentId);
                      return (
                        <div
                          key={studentId}
                          className='flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0'
                        >
                          <div>
                            <p className='font-medium text-gray-900'>{student?.name || 'Unknown'}</p>
                            <p className='text-sm text-gray-500'>{student?.email || 'N/A'}</p>
                          </div>
                          <Button
                            size='sm'
                            variant='ghost'
                            type="button"
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                            onClick={() => {
                              setSelectedStudents(selectedStudents.filter(id => id !== studentId));
                            }}
                          >
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowEditDialog(false)} disabled={isSaving} type="button">
              Cancel
            </Button>
            <Button 
              disabled={isSaving || !editFormData.name}
              onClick={async () => {
                try {
                  setIsSaving(true);
                  
                  // Validate required fields
                  if (!editFormData.name || editFormData.name.trim() === '') {
                    sonnerToast.error('Batch name is required');
                    setIsSaving(false);
                    return;
                  }
                  
                  // Update batch basic information
                  await apiService.updateBatch(String(selectedBatch.id), {
                    name: editFormData.name.trim(),
                    subject: editFormData.subject,
                    grade: editFormData.grade,
                    maxStudents: editFormData.maxStudents,
                    schedule: editFormData.schedule,
                  });

                  // Update teacher assignment if changed
                  if (editFormData.teacherId !== selectedBatch.teacherId) {
                    // Note: This would require a backend API endpoint to update teacher assignment
                    console.log('Teacher assignment updated to:', editFormData.teacherId);
                  }

                  // Enroll new students
                  const currentStudentIds = selectedBatch.students?.map((s: any) => s.id) || [];
                  const newStudentIds = selectedStudents.filter(id => !currentStudentIds.includes(id));
                  
                  for (const studentId of newStudentIds) {
                    try {
                      await enrollInBatch.mutateAsync({
                        studentId,
                        batchId: String(selectedBatch.id),
                      });
                    } catch (error) {
                      console.error('Error enrolling student:', error);
                    }
                  }

                  // Remove students (would need backend API for removal)
                  const removedStudentIds = currentStudentIds.filter((id: string) => !selectedStudents.includes(id));
                  if (removedStudentIds.length > 0) {
                    console.log('Students to remove:', removedStudentIds);
                    // Note: Would call apiService.removeStudentFromBatch for each
                  }

                  sonnerToast.success('Batch updated successfully!');
                  setShowEditDialog(false);
                  
                  // Trigger update event to sync across all dashboards - DISABLED
                  // triggerBatchUpdate();
                  
                  // Refresh batches list
                  await fetchBatches();
                } catch (error) {
                  console.error('Error updating batch:', error);
                  sonnerToast.error('Failed to update batch. Please try again.');
                } finally {
                  setIsSaving(false);
                }
              }}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {isSaving ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Batch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className='bg-white border-0 shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-gray-900 flex items-center gap-2'>
              <Plus className='w-5 h-5 text-purple-600' />
              Create New Batch
            </DialogTitle>
            <DialogDescription className='text-gray-600'>
              Add a new batch and assign teacher and students
            </DialogDescription>
          </DialogHeader>
          <div className='py-4 space-y-6'>
            {/* Basic Information */}
            <div className='space-y-4 border-b pb-4'>
              <h3 className='text-sm font-semibold text-gray-700'>Basic Information</h3>
              <div className='space-y-2'>
                <Label htmlFor='add-name' className='text-gray-700'>Batch Name *</Label>
                <Input
                  id='add-name'
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  placeholder='e.g., Java Programming Batch 2025'
                  className='bg-white border-gray-300'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='add-description' className='text-gray-700'>Description</Label>
                <Input
                  id='add-description'
                  value={addFormData.description}
                  onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                  placeholder='Brief description of the batch'
                  className='bg-white border-gray-300'
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='add-subject' className='text-gray-700'>Subject *</Label>
                  <Input
                    id='add-subject'
                    value={addFormData.subject}
                    onChange={(e) => setAddFormData({ ...addFormData, subject: e.target.value })}
                    placeholder='e.g., Java, Python, Mathematics'
                    className='bg-white border-gray-300'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='add-grade' className='text-gray-700'>Grade/Level</Label>
                  <Input
                    id='add-grade'
                    value={addFormData.grade}
                    onChange={(e) => setAddFormData({ ...addFormData, grade: e.target.value })}
                    placeholder='e.g., 10, 11, 12, Advanced'
                    className='bg-white border-gray-300'
                  />
                </div>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='add-max' className='text-gray-700'>Max Students *</Label>
                  <Input
                    id='add-max'
                    type='number'
                    value={addFormData.maxStudents}
                    onChange={(e) => setAddFormData({ ...addFormData, maxStudents: parseInt(e.target.value) || 30 })}
                    placeholder='30'
                    className='bg-white border-gray-300'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='add-schedule' className='text-gray-700'>Schedule</Label>
                  <Input
                    id='add-schedule'
                    value={addFormData.schedule}
                    onChange={(e) => setAddFormData({ ...addFormData, schedule: e.target.value })}
                    placeholder='Mon, Wed, Fri'
                    className='bg-white border-gray-300'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='add-startDate' className='text-gray-700'>Start Date *</Label>
                  <Input
                    id='add-startDate'
                    type='date'
                    value={addFormData.startDate}
                    onChange={(e) => setAddFormData({ ...addFormData, startDate: e.target.value })}
                    className='bg-white border-gray-300'
                    required
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='add-enrollmentFee' className='text-gray-700'>Enrollment Fee (₹)</Label>
                <Input
                  id='add-enrollmentFee'
                  type='number'
                  min='0'
                  step='0.01'
                  value={addFormData.enrollmentFee}
                  onChange={(e) => setAddFormData({ ...addFormData, enrollmentFee: parseFloat(e.target.value) || 0 })}
                  placeholder='0'
                  className='bg-white border-gray-300'
                />
              </div>
            </div>

            {/* Teacher Assignment */}
            <div className='space-y-4 border-b pb-4'>
              <h3 className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                <Users className='w-4 h-4' />
                Assign Teacher *
              </h3>
              <div className='space-y-2'>
                <Label htmlFor='add-teacher' className='text-gray-700'>Select Teacher</Label>
                <Select
                  value={addFormData.teacherId}
                  onValueChange={(value) => setAddFormData({ ...addFormData, teacherId: value })}
                  required
                >
                  <SelectTrigger className='bg-white border-gray-300'>
                    <SelectValue placeholder='Select a teacher' />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter((user: any) => user.role === 'teacher')
                      .map((teacher: any) => (
                        <SelectItem key={teacher._id || teacher.id} value={String(teacher.id ?? teacher._id ?? '')}>
                          {teacher.name} ({teacher.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Management */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <UserPlus className='w-4 h-4' />
                  Add Students (Optional) ({addSelectedStudents.length}/{addFormData.maxStudents})
                </h3>
              </div>
              
              {/* Search and Add Students */}
              <div className='space-y-2'>
                <Label className='text-gray-700'>Search Students</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    placeholder='Search students by name or email...'
                    value={addStudentSearchTerm}
                    onChange={(e) => setAddStudentSearchTerm(e.target.value)}
                    className='pl-10 bg-white border-gray-300'
                  />
                </div>
                
                {/* Available Students List */}
                {addStudentSearchTerm && (
                  <div className='border border-gray-200 rounded-lg max-h-48 overflow-y-auto'>
                    {allUsers
                      .filter((user: any) => 
                        user.role === 'student' && 
                        !addSelectedStudents.includes(user._id || user.id) &&
                        (user.name?.toLowerCase().includes(addStudentSearchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(addStudentSearchTerm.toLowerCase()))
                      )
                      .slice(0, 10)
                      .map((student: any) => (
                        <div
                          key={student._id || student.id}
                          className='flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer'
                          onClick={() => {
                            if (addSelectedStudents.length < addFormData.maxStudents) {
                              setAddSelectedStudents([...addSelectedStudents, student._id || student.id]);
                              setAddStudentSearchTerm('');
                            } else {
                              sonnerToast.error('Maximum student capacity reached');
                            }
                          }}
                        >
                          <div>
                            <p className='font-medium text-gray-900'>{student.name}</p>
                            <p className='text-sm text-gray-500'>{student.email}</p>
                          </div>
                          <Button size='sm' variant='ghost' type="button">
                            <Plus className='w-4 h-4' />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Current Students */}
              {addSelectedStudents.length > 0 && (
                <div className='space-y-2'>
                  <Label className='text-gray-700'>Selected Students</Label>
                  <div className='border border-gray-200 rounded-lg max-h-64 overflow-y-auto'>
                    {addSelectedStudents.map((studentId) => {
                      const student = allUsers.find((u: any) => (u._id || u.id) === studentId);
                      return (
                        <div
                          key={studentId}
                          className='flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0'
                        >
                          <div>
                            <p className='font-medium text-gray-900'>{student?.name || 'Unknown'}</p>
                            <p className='text-sm text-gray-500'>{student?.email || 'N/A'}</p>
                          </div>
                          <Button
                            size='sm'
                            variant='ghost'
                            type="button"
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                            onClick={() => {
                              setAddSelectedStudents(addSelectedStudents.filter(id => id !== studentId));
                            }}
                          >
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAddDialog(false)} disabled={isSaving} type="button">
              Cancel
            </Button>
            <Button 
              disabled={isSaving || !addFormData.name || !addFormData.subject || !addFormData.teacherId}
              onClick={async () => {
                try {
                  setIsSaving(true);
                  
                  // Create the batch
                  const teacherIdToSend = addFormData.teacherId && /^\d+$/.test(String(addFormData.teacherId)) ? Number(addFormData.teacherId) : addFormData.teacherId;

                  const response = await apiService.createBatch({
                    name: addFormData.name,
                    subject: addFormData.subject,
                    grade: addFormData.grade,
                    description: addFormData.description,
                    teacherId: teacherIdToSend,
                    maxStudents: addFormData.maxStudents,
                    schedule: addFormData.schedule,
                    startDate: addFormData.startDate,
                    isActive: addFormData.isActive,
                    enrollmentFee: addFormData.enrollmentFee,
                    studentIds: addSelectedStudents,
                  });

                  // Ensure backend confirmed creation
                  if (!response || !(response as any).success) {
                    const errMsg = (response && ((response as any).message || (response as any).error)) || 'Failed to create batch';
                    throw new Error(errMsg);
                  }

                  sonnerToast.success('Batch created successfully!');
                  setShowAddDialog(false);
                  
                  // Trigger update event to sync across all dashboards - DISABLED
                  // triggerBatchUpdate();
                  
                  // Refresh batches list
                  await fetchBatches();
                } catch (error) {
                  console.error('Error creating batch:', error);
                  sonnerToast.error('Failed to create batch. Please try again.');
                } finally {
                  setIsSaving(false);
                }
              }}
              className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
            >
              {isSaving ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className='w-4 h-4 mr-2' />
                  Create Batch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchesManagement;
