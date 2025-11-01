import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Video,
  Search,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Play,
  Square,
  Calendar,
} from 'lucide-react';

interface ErrorWithMessage {
  message?: string;
}

interface LiveClass {
  id: string;
  title: string;
  batchId: string;
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  batch?: {
    id: string;
    name: string;
    subject: string;
  };
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetingId?: string;
  zoomLink?: string;
  participants?: number;
  recordingUrl?: string;
  createdAt?: string;
}

const LiveClassesManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'ended'>('all');

  const fetchLiveClasses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getLiveClasses();
      const classesData = 'data' in response ? response.data : response;
      const liveClassesList = classesData && 'liveClasses' in classesData ? classesData.liveClasses : classesData;
      const classList = Array.isArray(liveClassesList) ? liveClassesList : [];
      setLiveClasses(classList as LiveClass[]);
      setFilteredClasses(classList as LiveClass[]);
    } catch (error) {
      const errorWithMessage = error as ErrorWithMessage;
      console.error('Live classes fetch error:', error);
      toast({
        title: 'Error',
        description: errorWithMessage.message ?? 'Failed to load live classes data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshClasses = async () => {
    setRefreshing(true);
    await fetchLiveClasses();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Live classes data refreshed',
    });
  };

  useEffect(() => {
    void fetchLiveClasses();
  }, [fetchLiveClasses]);

  useEffect(() => {
    let filtered = liveClasses;

    if (searchTerm) {
      filtered = filtered.filter(
        cls =>
          cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.batch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(cls => cls.status === filterStatus);
    }

    setFilteredClasses(filtered);
  }, [searchTerm, filterStatus, liveClasses]);

  const totalClasses = liveClasses.length;
  const liveNow = liveClasses.filter(c => c.status === 'live').length;
  const scheduledClasses = liveClasses.filter(c => c.status === 'scheduled').length;
  const endedClasses = liveClasses.filter(c => c.status === 'ended').length;

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        <div className='absolute top-20 left-10 animate-bounce delay-1000'>
          <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
            <Video className='w-8 h-8 text-white' />
          </div>
        </div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Live Classes
            </h2>
            <p className='text-gray-600'>Fetching live class information...</p>
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
          <Video className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <Play className='w-6 h-6 text-white' />
        </div>
      </div>
      <div className='absolute bottom-20 left-20 animate-bounce delay-3000'>
        <div className='w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
          <Calendar className='w-7 h-7 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                    <Video className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                      <Video className='w-4 h-4 mr-2' />
                      Live Class Management
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Live Classes
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Manage and monitor all platform{' '}
                      <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold'>
                        live classes
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Button
                  onClick={() => {
                    void refreshClasses();
                  }}
                  variant='outline'
                  className='border-2 border-gray-300 hover:border-green-500 hover:bg-green-50'
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  className='bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-xl'
                  onClick={() => {
                    navigate('/admin/live-classes/new');
                  }}
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Schedule Class
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>Total Classes</CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Video className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {totalClasses}
                </div>
                <p className='text-sm text-gray-600'>All live classes</p>
                <div className='flex items-center mt-2'>
                  <TrendingUp className='w-4 h-4 text-blue-500 mr-1' />
                  <span className='text-xs text-blue-600 font-medium'>Active</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>Live Now</CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Play className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {liveNow}
                </div>
                <p className='text-sm text-gray-600'>Currently broadcasting</p>
                <div className='flex items-center mt-2'>
                  <Play className='w-4 h-4 text-red-500 mr-1' />
                  <span className='text-xs text-red-600 font-medium'>Live</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>Scheduled</CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Calendar className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {scheduledClasses}
                </div>
                <p className='text-sm text-gray-600'>Upcoming classes</p>
                <div className='flex items-center mt-2'>
                  <Clock className='w-4 h-4 text-yellow-500 mr-1' />
                  <span className='text-xs text-yellow-600 font-medium'>Pending</span>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
                <CardTitle className='text-sm font-semibold text-gray-900'>Completed</CardTitle>
                <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Square className='h-6 w-6 text-white' />
                </div>
              </CardHeader>
              <CardContent className='relative z-10'>
                <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                  {endedClasses}
                </div>
                <p className='text-sm text-gray-600'>Ended classes</p>
                <div className='flex items-center mt-2'>
                  <Square className='w-4 h-4 text-green-500 mr-1' />
                  <span className='text-xs text-green-600 font-medium'>Finished</span>
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
                    placeholder='Search by class name, teacher, or batch...'
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
                      setFilterStatus('live');
                    }}
                    className={
                      filterStatus === 'live'
                        ? 'bg-red-50 border-red-500 text-red-700 hover:bg-red-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }
                  >
                    Live
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setFilterStatus('scheduled');
                    }}
                    className={
                      filterStatus === 'scheduled'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-700 hover:bg-yellow-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }
                  >
                    Scheduled
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setFilterStatus('ended');
                    }}
                    className={
                      filterStatus === 'ended'
                        ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }
                  >
                    Ended
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Classes Table */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
            <CardHeader className='relative z-10'>
              <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                <Video className='h-6 w-6 text-blue-600' />
                All Live Classes ({filteredClasses.length})
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Comprehensive list of all live classes
              </CardDescription>
            </CardHeader>
            <CardContent className='relative z-10'>
              {filteredClasses.length === 0 ? (
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Video className='h-10 w-10 text-blue-500' />
                  </div>
                  <p className='text-gray-900 font-semibold mb-2 text-lg'>No live classes found</p>
                  <p className='text-sm text-gray-600'>
                    {searchTerm
                      ? 'Try adjusting your search criteria'
                      : 'Live classes will appear here once scheduled'}
                  </p>
                </div>
              ) : (
                <div className='rounded-lg border border-gray-200 overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-gradient-to-r from-gray-50 to-blue-50/50'>
                        <TableHead className='font-bold text-gray-900'>Class</TableHead>
                        <TableHead className='font-bold text-gray-900'>Teacher</TableHead>
                        <TableHead className='font-bold text-gray-900'>Batch</TableHead>
                        <TableHead className='font-bold text-gray-900'>Time</TableHead>
                        <TableHead className='font-bold text-gray-900'>Participants</TableHead>
                        <TableHead className='font-bold text-gray-900'>Status</TableHead>
                        <TableHead className='font-bold text-gray-900 text-right'>
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClasses.map(cls => (
                        <TableRow key={cls.id} className='hover:bg-blue-50/50 transition-colors'>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md'>
                                <Video className='w-5 h-5 text-white' />
                              </div>
                              <div>
                                <p className='font-semibold text-gray-900'>{cls.title}</p>
                                <p className='text-sm text-gray-600'>{cls.duration ?? 'N/A'} min</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className='text-gray-900 font-medium'>{cls.teacher?.name ?? 'N/A'}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'>
                              {cls.batch?.name ?? 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Clock className='w-4 h-4 text-blue-500' />
                              <span className='text-gray-900 text-sm'>
                                {new Date(cls.startTime).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Users className='w-4 h-4 text-purple-500' />
                              <span className='text-gray-900 font-medium'>
                                {cls.participants ?? 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                cls.status === 'live'
                                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0'
                                  : cls.status === 'scheduled'
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0'
                                    : cls.status === 'ended'
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0'
                              }
                            >
                              {cls.status}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-blue-300 text-blue-600 hover:bg-blue-50'
                                onClick={() => {
                                  navigate(`/admin/live-classes/${cls.id}`);
                                }}
                              >
                                <Eye className='w-4 h-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-purple-300 text-purple-600 hover:bg-purple-50'
                                onClick={() => {
                                  navigate(`/admin/live-classes/${cls.id}/edit`);
                                }}
                              >
                                <Edit className='w-4 h-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-red-300 text-red-600 hover:bg-red-50'
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete "${cls.title}"?`)) {
                                    try {
                                      await apiService.deleteLiveClass(String(cls.id));
                                      toast({
                                        title: 'Success',
                                        description: 'Live class deleted successfully',
                                      });
                                      await fetchLiveClasses();
                                    } catch (error) {
                                      console.error('Error deleting live class:', error);
                                      toast({
                                        title: 'Error',
                                        description: 'Failed to delete live class',
                                        variant: 'destructive',
                                      });
                                    }
                                  }
                                }}
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
    </div>
  );
};

export default LiveClassesManagement;
