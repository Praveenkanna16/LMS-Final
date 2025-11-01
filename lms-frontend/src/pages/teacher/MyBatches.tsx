import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Calendar,
  Eye,
  Edit,
  Plus,
  Clock,
  TrendingUp,
  BookOpen,
  Loader2,
  CheckCircle,
  RefreshCw,
  Search as SearchIcon,
  MoreHorizontal,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import StudentProgress from '@/components/StudentProgress';
import type { Batch } from '@/types';
import { useBatchSync, useBatchUpdateListener } from '@/hooks/useBatchSync';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MyBatches: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  // Dialog & form state (was missing causing ReferenceError)
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({
    name: '',
    subject: '',
    grade: '',
    maxStudents: 30,
    schedule: '',
    teacherId: '',
    enrollmentFee: 0,
    description: '',
    courseId: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Enable automatic batch synchronization - DISABLED (causing infinite re-renders)
  // useBatchSync(true, 30000); // Auto-sync every 30 seconds

  const fetchBatches = useCallback(async () => {
      try {
        setLoading(true);
        console.log('Fetching teacher batches...');
        const response = await apiService.getMyTeacherBatches();
        console.log('Teacher batches response:', response);
        
        if (response?.data && Array.isArray(response.data)) {
          console.log('Batches array:', response.data);
          const validBatches = response.data
            .filter(batch => batch && typeof batch === 'object' && (batch.id || batch._id))
            .map(batch => ({
              ...batch,
              _id: batch._id || batch.id?.toString() || '',
              id: batch.id || batch._id,
              name: batch.name || '',
              subject: batch.subject || '',
              students: Array.isArray(batch.students) ? batch.students : [],
              schedule: Array.isArray(batch.schedule) ? batch.schedule : [],
              studentLimit: batch.studentLimit || 30
            }));
          console.log('Valid batches after filter:', validBatches);
          setBatches(validBatches);
        } else {
          console.warn('Invalid response format:', response);
          setBatches([]);
        }
      } catch (error) {
        console.error('Failed to fetch batches:', error);
        setBatches([]);
        toast({
          title: 'Error',
          description: 'Failed to load batches',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }, [toast]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

    const refreshBatches = async () => {
      setRefreshing(true);
      await fetchBatches();
      setRefreshing(false);
      toast({ title: 'Success', description: 'Batches refreshed successfully' });
    };

  // Listen for batch updates from Admin or other dashboards - DISABLED
  // useBatchUpdateListener(useCallback(() => {
  //   console.warn('🔔 Batch update detected in Teacher dashboard - refreshing data...');
  //   void fetchBatches();
  // }, [fetchBatches]));

  const handleCreateBatch = () => {
    navigate('/teacher/batches/create');
  };

  const handleViewDetails = (batchId: string) => {
    // Open details dialog
    void (async () => {
      try {
        setLoading(true);
        const resp: any = await apiService.getBatchById(batchId);
        if (resp && resp.success && resp.data && resp.data.batch) {
          setSelectedBatch(resp.data.batch);
          setShowViewDialog(true);
        } else if (resp && resp.data && resp.data.batch) {
          setSelectedBatch(resp.data.batch);
          setShowViewDialog(true);
        } else {
          toast({ title: 'Error', description: (resp && resp.message) || 'Failed to load batch details', variant: 'destructive' });
        }
      } catch (err) {
        console.error('Failed to load batch details', err);
        toast({ title: 'Error', description: 'Failed to load batch details', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleManageBatch = (batchId: string) => {
    // Open edit dialog with batch data
    void (async () => {
      try {
        setLoading(true);
        const resp: any = await apiService.getBatchById(batchId);
        const batchData = resp && (resp.data?.batch || resp.data);
        if (batchData) {
          setSelectedBatch(batchData);
          setEditFormData({
            name: batchData.name || '',
            subject: batchData.subject || '',
            grade: batchData.grade || '',
            maxStudents: batchData.studentLimit || batchData.maxStudents || 30,
            schedule: Array.isArray(batchData.schedule) ? batchData.schedule.join(', ') : (batchData.schedule || ''),
            teacherId: batchData.teacherId || '',
            enrollmentFee: batchData.enrollmentFee || 0,
            description: batchData.description || '',
            courseId: batchData.courseId || '',
          });
          setShowEditDialog(true);
        } else {
          toast({ title: 'Error', description: 'Failed to load batch for editing', variant: 'destructive' });
        }
      } catch (err) {
        console.error('Failed to load batch for edit', err);
        toast({ title: 'Error', description: 'Failed to load batch for editing', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleStartClass = (batchId: string) => {
    navigate(`/teacher/live-class/${batchId}`);
  };

  const filteredBatches = batches.filter(batch => {
    const name = (batch.name || '').toLowerCase();
    const subject = (batch.subject || '')?.toLowerCase();
    const matchesSearch =
      !searchTerm || name.includes(searchTerm.toLowerCase()) || subject.includes(searchTerm.toLowerCase());
    const isActive = batch.isActive ?? true;
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'active' && isActive) || (statusFilter === 'inactive' && !isActive);
    return matchesSearch && matchesStatus;
  });

  const stats = React.useMemo(() => {
    const total = batches.length;
    const active = batches.filter(b => b.isActive ?? true).length;
    const completed = total - active;
    const totalStudents = batches.reduce((s, b) => s + (b.students?.length || 0), 0);
    const totalCapacity = batches.reduce((s, b) => s + (b.studentLimit || 30), 0);
    return { total, active, completed, totalStudents, totalCapacity };
  }, [batches]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin mx-auto mb-4 text-purple-500' />
          <h2 className='text-xl font-semibold mb-2'>Loading Batches</h2>
          <p className='text-gray-600'>Fetching your batch data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.06)_0%,_transparent_50%)]' />
      <div className='relative z-10 p-6'>
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
              <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent drop-shadow-lg'>
                My Batches
              </h1>
              <p className='text-xl text-gray-600 mt-2'>Manage and monitor your active batches</p>
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
              onClick={handleCreateBatch}
            >
              <Plus className='w-4 h-4 mr-2' />
              Add Batch
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Batches</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <BookOpen className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1'>{stats.total}</div>
              <p className='text-sm text-gray-600'>All batches</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Active</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <CheckCircle className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1'>{stats.active}</div>
              <p className='text-sm text-gray-600'>Currently running</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Completed</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <TrendingUp className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1'>{stats.completed}</div>
              <p className='text-sm text-gray-600'>Finished batches</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Students</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <Users className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1'>{stats.totalStudents}</div>
              <p className='text-sm text-gray-600'>Enrolled students</p>
            </CardContent>
          </Card>

          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Capacity</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <Calendar className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1'>{stats.totalCapacity}</div>
              <p className='text-sm text-gray-600'>Maximum capacity</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden mb-6'>
          <CardContent className='p-6 relative z-10'>
            <div className='flex flex-col md:flex-row gap-4 items-center'>
              <div className='flex-1 relative'>
                <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input placeholder='Search batches by name, course, or teacher...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='pl-10' />
              </div>
              <div className='w-48'>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='All Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Directory */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
          <CardHeader className='relative z-10'>
            <CardTitle className='text-xl font-bold text-gray-900'>Batch Directory</CardTitle>
            <CardDescription className='text-gray-600'>Monitor batch enrollment, capacity, and performance</CardDescription>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='overflow-x-auto'>
              <table className='w-full table-auto'>
                <thead>
                  <tr className='text-sm text-left text-gray-600 border-b'>
                    <th className='py-3'>Batch</th>
                    <th className='py-3'>Course</th>
                    <th className='py-3'>Teacher</th>
                    <th className='py-3'>Enrollment</th>
                    <th className='py-3'>Schedule</th>
                    <th className='py-3'>Status</th>
                    <th className='py-3'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='text-center text-gray-500 py-6'>No batches found.</td>
                    </tr>
                  ) : (
                    filteredBatches.map(batch => (
                      <tr key={batch._id || batch.id} className='border-b hover:bg-gray-50'>
                        <td className='py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white'>
                              <BookOpen className='w-5 h-5' />
                            </div>
                            <div>
                              <div className='font-medium text-gray-900'>{batch.name}</div>
                              <div className='text-xs text-gray-500'>ID: {batch._id || batch.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className='py-4 text-gray-700'>{batch.course?.title || batch.subject || 'N/A'}</td>
                        <td className='py-4 text-gray-700'>{batch.teacher?.name || 'You'}</td>
                        <td className='py-4 text-gray-700'>{(batch.students?.length || 0) + '/' + (batch.studentLimit || 30)}</td>
                        <td className='py-4 text-gray-700'>{Array.isArray(batch.schedule) ? batch.schedule.join(', ') : (batch.schedule || '—')}</td>
                        <td className='py-4'>
                          <Badge className={(batch.isActive ?? true) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {(batch.isActive ?? true) ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className='py-4'>
                          <div className='flex items-center gap-2'>
                            <Button variant='outline' size='sm' onClick={() => handleViewDetails(batch._id || batch.id)}>
                              <Eye className='w-4 h-4' />
                            </Button>
                            <Button size='sm' onClick={() => handleManageBatch(batch._id || batch.id)}>
                              <Edit className='w-4 h-4' />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='sm'>
                                  <MoreHorizontal className='w-4 h-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleStartClass(batch._id || batch.id)}>Start Class</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {/* future: export */}}>Export</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={(open) => { if (!open) setShowViewDialog(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batch Details</DialogTitle>
            </DialogHeader>
            {selectedBatch ? (
              <div className='space-y-4'>
                <div><strong>Name:</strong> {selectedBatch.name}</div>
                <div><strong>Subject:</strong> {selectedBatch.subject || 'N/A'}</div>
                <div><strong>Teacher:</strong> {selectedBatch.teacher?.name || 'N/A'}</div>
                <div><strong>Students:</strong> {(selectedBatch.students && selectedBatch.students.length) || 0}</div>
                <div><strong>Start Date:</strong> {selectedBatch.startDate || 'N/A'}</div>
                <div><strong>Description:</strong> {selectedBatch.description || '—'}</div>
              </div>
            ) : (
              <div>Loading...</div>
            )}
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowViewDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) setShowEditDialog(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Batch</DialogTitle>
            </DialogHeader>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              <div>
                <Label>Batch Name</Label>
                <Input value={editFormData.name} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={editFormData.subject} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, subject: e.target.value }))} />
              </div>
              <div>
                <Label>Grade/Level</Label>
                <Input value={editFormData.grade} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, grade: e.target.value }))} />
              </div>
              <div>
                <Label>Course ID (Optional)</Label>
                <Input value={editFormData.courseId} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, courseId: e.target.value }))} />
              </div>
              <div>
                <Label>Max Students</Label>
                <Input type='number' value={String(editFormData.maxStudents)} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, maxStudents: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Enrollment Fee (₹)</Label>
                <Input type='number' value={String(editFormData.enrollmentFee)} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, enrollmentFee: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Schedule (comma-separated days)</Label>
                <Textarea value={editFormData.schedule} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, schedule: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editFormData.description} onChange={(e: any) => setEditFormData((prev: any) => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  setIsSaving(true);
                  const payload: any = {
                    name: editFormData.name,
                    subject: editFormData.subject,
                    grade: editFormData.grade,
                    maxStudents: editFormData.maxStudents,
                    studentLimit: editFormData.maxStudents,
                    schedule: editFormData.schedule.split(',').map((s: string) => s.trim()),
                    enrollmentFee: editFormData.enrollmentFee,
                    description: editFormData.description,
                    courseId: editFormData.courseId || undefined,
                  };
                  const idToUpdate = selectedBatch._id || selectedBatch.id;
                  await apiService.updateBatch(idToUpdate, payload);
                  toast({ title: 'Success', description: 'Batch updated successfully' });
                  setShowEditDialog(false);
                  await fetchBatches();
                } catch (err) {
                  console.error('Failed to update batch', err);
                  toast({ title: 'Error', description: 'Failed to update batch', variant: 'destructive' });
                } finally {
                  setIsSaving(false);
                }
              }}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyBatches;
