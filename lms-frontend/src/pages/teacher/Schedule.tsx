import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Users, Video, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';
import { useToast } from '@/hooks/use-toast';
import { sessionManager } from '@/lib/sessionManager';

interface ScheduleItem {
  id: string;
  date: string;
  day: string;
  classes: {
    id: string;
    time: string;
    batchName: string;
    subject: string;
    studentsCount: number;
    type: string;
  }[];
}

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = sessionManager.getUser();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [viewFilter, setViewFilter] = useState<'upcoming' | 'previous' | 'cancelled'>('upcoming');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');

  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSubject, setNewBatchSubject] = useState('');
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollBatchId, setEnrollBatchId] = useState('');
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    batchId: '',
    startTime: '',
    endTime: '',
    topic: '',
    description: '',
    meetingType: 'live',
    meetingLink: '',
    maxParticipants: 50,
  });

  // Initialize socket connection
  useEffect(() => {
    if (user?._id) {
      const token = localStorage.getItem('genzed_token') || localStorage.getItem('token') || '';
      socketService.connect(user._id.toString(), token);

      // Listen for batch notifications (when schedules are created)
      const handleScheduleCreated = () => {
        // Refetch schedule when a new schedule is created
        void fetchSchedule();
        toast({
          title: 'Schedule Updated',
          description: 'A new class has been scheduled',
        });
      };

      socketService.on('batch-notification', handleScheduleCreated);

      // Join all teacher's batches to receive updates
      void fetchAndJoinBatches();

      return () => {
        socketService.off('batch-notification', handleScheduleCreated);
        socketService.disconnect();
      };
    }
  }, [user]);

  const fetchAndJoinBatches = async () => {
    try {
      const response = await apiService.getMyTeacherBatches();
      if (response && response.success && response.data && Array.isArray(response.data)) {
        response.data.forEach((batch: any) => {
          if (batch._id) {
            socketService.joinBatch(batch._id);
          }
        });
      }
    } catch (error) {
      // Silent fail - socket connection is optional
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      // Fetch actual LiveSession data instead of batch data
      const statusParam = viewFilter === 'previous' ? 'completed' : 'scheduled';
      const response = await apiService.getLiveClasses({
        teacherId: user?._id,
        status: statusParam,
        limit: 100,
      });
      
      if (response && response.success && response.data && response.data.liveClasses) {
        const liveClasses = response.data.liveClasses;
        
        // Also fetch batches for the dropdown (not filtered)
        const batchesResponse = await apiService.getMyTeacherBatches();
        const validBatches = batchesResponse.data?.filter(
          (batch: any) =>
            batch &&
            typeof batch === 'object' &&
            (batch.id || batch._id) &&
            batch.name
        ).map((batch: any) => ({
          ...batch,
          _id: batch._id || batch.id?.toString() || '',
          id: batch.id || batch._id,
          name: batch.name || '',
          subject: batch.subject || '',
          students: Array.isArray(batch.students) ? batch.students : [],
          course: batch.course || { title: 'Course' }
        })) || [];
        setBatches(validBatches);

        // Group live classes by date
        const groupedByDate: { [key: string]: any[] } = {};
        
        liveClasses.forEach((session: any) => {
          const dateKey = new Date(session.startTime).toISOString().split('T')[0];
          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
          }
          groupedByDate[dateKey].push(session);
        });

        // Transform into schedule format
        const transformedSchedule: ScheduleItem[] = Object.entries(groupedByDate)
          .map(([date, sessions]) => {
            const dateObj = new Date(date);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            let dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            if (date === today.toISOString().split('T')[0]) {
              dayName = 'Today';
            } else if (date === tomorrow.toISOString().split('T')[0]) {
              dayName = 'Tomorrow';
            }

            const classes = sessions.map((session: any) => {
              const batch = validBatches.find((b: any) => b._id === session.batchId);
              return {
                id: session.id,
                time: `${new Date(session.startTime).toLocaleTimeString()} - ${new Date(session.startTime + session.duration * 60000).toLocaleTimeString()}`,
                batchName: batch?.name || 'Unknown Batch',
                subject: batch?.course?.title || 'Course',
                studentsCount: batch?.students?.length || 0,
                type: session.isRecorded ? 'recorded' : 'live',
                sessionData: session // Store full session data for actions
              };
            });

            return {
              id: date,
              date,
              day: dayName,
              classes,
            };
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setScheduleItems(transformedSchedule);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSchedule();
  }, [toast]);

  // Derived filtered schedule based on search
  const filteredScheduleItems = React.useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') return scheduleItems;
    const q = searchTerm.trim().toLowerCase();
    return scheduleItems
      .map(day => ({
        ...day,
        classes: day.classes.filter((cls: any) => {
          return (
            String(cls.batchName || '').toLowerCase().includes(q) ||
            String(cls.subject || '').toLowerCase().includes(q) ||
            String(cls.sessionData?.title || cls.sessionData?.topic || '').toLowerCase().includes(q)
          );
        }),
      }))
      .filter(day => day.classes.length > 0);
  }, [scheduleItems, searchTerm]);

  const upcomingCount = React.useMemo(() => {
    return scheduleItems.reduce((acc, day) => acc + (day.classes?.length || 0), 0);
  }, [scheduleItems]);

  const handleStartClass = (classData: { id: string; sessionData?: { id: string } }) => {
    // Navigate to live class with session ID
    navigate(`/teacher/live-class/${classData.sessionData?.id ?? classData.id}`);
  };

  const handleEditClass = (_classData: { id: string; sessionData?: { id: string } }) => {
    // TODO: Implement edit functionality for live sessions
    toast({
      title: 'Edit',
      description: 'Edit functionality coming soon',
    });
  };

  const handleDeleteClass = async (classData: { id: string; sessionData?: { id: string } }) => {
    if (!classData.sessionData?.id) return;
    
    try {
      await apiService.deleteLiveClass(classData.sessionData.id);
      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
      void fetchSchedule();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive',
      });
    }
  };

  const handleScheduleClass = () => {
    console.log('🎯 Schedule Class button clicked!');
    console.log('📦 Available batches:', batches);
    console.log('📊 Batches count:', batches.length);
    
    alert(`🎯 BUTTON CLICKED!\nBatches: ${batches.length}\nModal will open if batches > 0`);
    
    // Check if batches are loaded
    if (batches.length === 0) {
      console.warn('⚠️ No batches available - showing toast');
      alert('⚠️ NO BATCHES! Create a batch first at "My Batches" page');
      toast({
        title: 'No Batches Available',
        description: 'Please create a batch first before scheduling a class',
        variant: 'destructive',
      });
      return;
    }

    // Set default times (1 hour from now)
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    console.log('✅ Opening schedule modal with default times:', {
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
    });

    alert('✅ OPENING MODAL NOW! You should see the schedule form.');

    setScheduleForm({
      ...scheduleForm,
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
    });
    setShowScheduleModal(true);
    console.log('🎬 Modal state set to TRUE - modal should now be visible');
  };

  // Create Batch handler
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName) {
      toast({ title: 'Error', description: 'Please enter batch name', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      await apiService.createBatch({
        name: newBatchName,
        subject: newBatchSubject || 'General',
        teacherId: user?._id || '',
        maxStudents: 100,
        startDate: new Date().toISOString(),
        isActive: true,
      } as any);
      toast({ title: 'Batch Created', description: `${newBatchName} created successfully.` });
      setShowAddBatchModal(false);
      setNewBatchName('');
      setNewBatchSubject('');
      void fetchSchedule();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create batch', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Enroll student handler
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId || !enrollBatchId) {
      toast({ title: 'Error', description: 'Please enter student ID and select batch', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      await apiService.enrollStudentInBatch(enrollStudentId, enrollBatchId);
      toast({ title: 'Student Enrolled', description: 'Student enrolled into batch successfully.' });
      setShowAddStudentModal(false);
      setEnrollStudentId('');
      setEnrollBatchId('');
      void fetchSchedule();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to enroll student', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      scheduleForm.batchId === 'no-batches' ||
      !scheduleForm.batchId ||
      !scheduleForm.startTime ||
      !scheduleForm.endTime ||
      !scheduleForm.topic
    ) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Batch, Start Time, End Time, Topic)',
        variant: 'destructive',
      });
      return;
    }

    // Validate times
    const startTime = new Date(scheduleForm.startTime);
    const endTime = new Date(scheduleForm.endTime);

    if (endTime <= startTime) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSchedulingLoading(true);
      
      console.log('📅 Creating schedule with data:', {
        batchId: scheduleForm.batchId,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        topic: scheduleForm.topic,
      });

      const response = await apiService.createSchedule({
        batchId: scheduleForm.batchId,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        topic: scheduleForm.topic,
        description: scheduleForm.description,
        meetingType: scheduleForm.meetingType,
        meetingLink: scheduleForm.meetingLink,
        maxParticipants: scheduleForm.maxParticipants,
      });

      console.log('✅ Schedule created successfully:', response);

      toast({
        title: 'Success',
        description: 'Class scheduled successfully. Students will be notified in real-time!',
      });

      // Reset form and close modal
      setScheduleForm({
        batchId: '',
        startTime: '',
        endTime: '',
        topic: '',
        description: '',
        meetingType: 'live',
        meetingLink: '',
        maxParticipants: 50,
      });
      setShowScheduleModal(false);

      // Refresh schedule (socket will also trigger a refresh for all connected users)
      void fetchSchedule();
    } catch (error: any) {
      console.error('❌ Failed to create schedule:', error);
      
      toast({
        title: 'Error',
        description: error?.message || error?.error || 'Failed to schedule class. Please check your internet connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSchedulingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin mx-auto mb-4 text-blue-500' />
          <h2 className='text-xl font-semibold mb-2'>Loading Schedule</h2>
          <p className='text-gray-600'>Fetching your class schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Floating decorative elements */}
      <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
      <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />

      <div className='relative z-10 p-6'>
        <div className='mb-8'>
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl rotate-12 animate-bounce opacity-20' />
            <div className='absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-bounce delay-300 opacity-20' />

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 relative overflow-hidden'>
                {/* Animated background pattern */}
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
                    <div className='flex items-center gap-6 mb-3'>
                      <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                        <Calendar className='w-6 h-6 text-white' />
                      </div>
                      <Badge className='bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1'>
                        Teacher Schedule
                      </Badge>
                      <div className='ml-auto flex items-center gap-6'>
                        <div>
                          <h1 className='text-3xl font-bold text-white mb-2'>My Schedule</h1>
                          <p className='text-blue-100 text-lg'>View and manage your class schedule</p>
                        </div>
                        <Button
                          onClick={handleScheduleClass}
                          size='lg'
                          className='bg-white hover:bg-gray-100 text-blue-600 font-semibold px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200'
                        >
                          <Plus className='w-6 h-6 mr-2' />
                          Schedule New Class
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Floating Action Button for Scheduling */}
        <Button
          className='fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50 flex items-center justify-center group'
          onClick={handleScheduleClass}
          size='lg'
        >
          <Plus className='h-8 w-8 text-white group-hover:scale-110 transition-transform' />
        </Button>

        <div className='space-y-6'>
          {/* Tabs */}
          <div className='flex items-center gap-3 mb-4'>
            <button className={`px-4 py-2 rounded-full ${viewFilter === 'upcoming' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/10 text-white/80'}`} onClick={() => { setViewFilter('upcoming'); void fetchSchedule(); }}>Upcoming Classes</button>
            <button className={`px-4 py-2 rounded-full ${viewFilter === 'previous' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/10 text-white/80'}`} onClick={() => { setViewFilter('previous'); void fetchSchedule(); }}>Previous Classes</button>
            <button className={`px-4 py-2 rounded-full ${viewFilter === 'cancelled' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/10 text-white/80'}`} onClick={() => { setViewFilter('cancelled'); void fetchSchedule(); }}>Cancelled</button>
            <div className='ml-auto flex items-center gap-3'>
              <Input placeholder='Filter date' type='date' value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              <Input placeholder='Filter batch' value={filterBatch} onChange={e => setFilterBatch(e.target.value)} />
              <Input placeholder='Filter subject' value={filterSubject} onChange={e => setFilterSubject(e.target.value)} />
            </div>
          </div>
          {filteredScheduleItems.length === 0 ? (
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl'>
              <CardContent className='text-center py-12'>
                <Calendar className='w-16 h-16 mx-auto mb-4 text-gray-400' />
                <h3 className='text-xl font-semibold mb-2'>No classes scheduled</h3>
                <p className='text-gray-600 mb-6'>You haven't scheduled any classes yet or your filter returned no results.</p>
                <Button
                  className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  onClick={handleScheduleClass}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Schedule Your First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredScheduleItems.map(day => (
              <Card
                key={day.id}
                className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden'
              >
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <Calendar className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                        {day.day} - {new Date(day.date).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription className='text-gray-600'>
                        {day.classes.length} class{day.classes.length !== 1 ? 'es' : ''} scheduled
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-6'>
                  <div className='space-y-4'>
                    {day.classes.map(cls => (
                      <div
                        key={cls.id}
                        onClick={() => { setSelectedClass(cls); setShowClassDetails(true); }}
                        className='cursor-pointer bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-2xl p-5 border border-blue-200 hover:shadow-lg transition-all duration-200'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <h4 className='font-semibold text-gray-900 text-lg'>{cls.batchName}</h4>
                              <Badge className='bg-green-100 text-green-700'>{cls.type}</Badge>
                            </div>
                            <p className='text-sm text-gray-600 mb-3 font-medium'>{cls.subject}</p>
                            <div className='flex items-center gap-4 text-sm text-gray-500'>
                              <span className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' />
                                {cls.time}
                              </span>
                              <span className='flex items-center gap-1'>
                                <Users className='h-3 w-3' />
                                {cls.studentsCount} students
                              </span>
                            </div>
                          </div>
              <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              className='border-gray-300 text-gray-600 hover:bg-gray-50'
                              size='sm'
                onClick={() => { handleEditClass(cls); }}
                            >
                              <Edit className='h-4 w-4 mr-2' />
                              Edit
                            </Button>
                            <Button
                              variant='outline'
                              className='border-red-300 text-red-600 hover:bg-red-50'
                              size='sm'
                onClick={() => { void handleDeleteClass(cls); }}
                            >
                              <Trash2 className='h-4 w-4 mr-2' />
                              Delete
                            </Button>
                            <Button
                              className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                              size='sm'
                onClick={() => { handleStartClass(cls); }}
                            >
                              <Video className='h-4 w-4 mr-2' />
                              Start Class
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

          {/* Class Details Modal */}
          <Dialog open={showClassDetails} onOpenChange={setShowClassDetails}>
            <DialogContent className='sm:max-w-[800px]'>
              <DialogHeader>
                <DialogTitle>Class Details</DialogTitle>
                <DialogDescription>View and manage class information</DialogDescription>
              </DialogHeader>
              <div className='p-4 space-y-4'>
                <h3 className='text-lg font-semibold'>{selectedClass?.sessionData?.title || selectedClass?.batchName || 'Class'}</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p><strong>Time:</strong> {selectedClass ? selectedClass.time : '-'}</p>
                    <p><strong>Type:</strong> {selectedClass?.type}</p>
                    <p><strong>Students:</strong> {selectedClass?.studentsCount}</p>
                  </div>
                  <div>
                    <p><strong>Duration:</strong> {selectedClass?.sessionData?.duration ? `${selectedClass.sessionData.duration} mins` : '-'}</p>
                    <p><strong>Status:</strong> <Badge className='capitalize'>{selectedClass?.sessionData?.status || 'scheduled'}</Badge></p>
                    <p><strong>Meeting Link:</strong> {selectedClass?.sessionData?.zoomLink || selectedClass?.sessionData?.meetLink || '—'}</p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button onClick={() => { /* TODO: join or start class */ }} className='bg-green-600 text-white'>Start / Join</Button>
                  <Button variant='outline' onClick={() => { /* TODO: open reschedule form */ }}>Reschedule</Button>
                  <Button variant='destructive' onClick={async () => { if (selectedClass?.sessionData?.id) { await apiService.deleteLiveClass(selectedClass.sessionData.id); setShowClassDetails(false); void fetchSchedule(); } }}>Cancel</Button>
                </div>

                <div>
                  <h4 className='font-semibold mb-2'>Students</h4>
                  <div className='space-y-2'>
                    {selectedClass?.sessionData?.students?.map((s: any) => (
                      <div key={s.id} className='flex items-center justify-between p-2 bg-gray-50 rounded-md'>
                        <div>
                          <p className='font-medium'>{s.name}</p>
                          <p className='text-xs text-gray-500'>{s.email}</p>
                        </div>
                        <div className='text-sm text-gray-600'>{s.attended ? 'Present' : 'Absent'}</div>
                      </div>
                    )) ?? <p className='text-gray-500'>No students data</p>}
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold mb-2'>Upload Recording / Notes</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const file = (e.target as HTMLFormElement).elements.namedItem('recording') as HTMLInputElement;
                    if (!file || !file.files || file.files.length === 0) return;
                    const fd = new FormData();
                    fd.append('file', file.files[0]);
                    fd.append('type', 'recording');
                    const res = await apiService.uploadContent(fd);
                    if (res?.success) {
                      toast({ title: 'Uploaded', description: 'Recording uploaded successfully' });
                      void fetchSchedule();
                    } else {
                      toast({ title: 'Upload failed', description: res?.message || 'Upload failed', variant: 'destructive' });
                    }
                  }}>
                    <input type='file' name='recording' />
                    <div className='mt-2'>
                      <Button type='submit'>Upload</Button>
                    </div>
                  </form>
                </div>
              </div>
            </DialogContent>
          </Dialog>

      {/* Schedule Class Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Schedule New Class</DialogTitle>
            <DialogDescription>
              Schedule a new class for one of your batches. Fill in all the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleScheduleSubmit(e)}>
            <div className='grid gap-4 py-4 max-h-[400px] overflow-y-auto'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='batch' className='text-right'>
                  Batch *
                </Label>
                <Select
                  value={scheduleForm.batchId}
                  onValueChange={value => {
                    setScheduleForm({ ...scheduleForm, batchId: value });
                  }}
                >
                  <SelectTrigger className='col-span-3'>
                    <SelectValue placeholder='Select a batch' />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.length === 0 ? (
                      <SelectItem value='no-batches' disabled>
                        No batches available
                      </SelectItem>
                    ) : (
                      batches
                        .filter(
                          (batch: any) =>
                            batch._id && typeof batch._id === 'string' && batch._id.trim() !== ''
                        )
                        .map((batch: any) => (
                          <SelectItem key={batch._id} value={batch._id}>
                            {batch.name} - {batch.course?.title || 'Course'} ({batch.students?.length || 0} students)
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='topic' className='text-right'>
                  Topic *
                </Label>
                <Input
                  id='topic'
                  value={scheduleForm.topic}
                  onChange={e => {
                    setScheduleForm({ ...scheduleForm, topic: e.target.value });
                  }}
                  placeholder='Class topic or title'
                  className='col-span-3'
                />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='description' className='text-right'>
                  Description
                </Label>
                <Input
                  id='description'
                  value={scheduleForm.description}
                  onChange={e => {
                    setScheduleForm({ ...scheduleForm, description: e.target.value });
                  }}
                  placeholder='Brief description of the class'
                  className='col-span-3'
                />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='startTime' className='text-right'>
                  Start Time *
                </Label>
                <Input
                  id='startTime'
                  type='datetime-local'
                  value={scheduleForm.startTime}
                  onChange={e => {
                    setScheduleForm({ ...scheduleForm, startTime: e.target.value });
                  }}
                  className='col-span-3'
                />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='endTime' className='text-right'>
                  End Time *
                </Label>
                <Input
                  id='endTime'
                  type='datetime-local'
                  value={scheduleForm.endTime}
                  onChange={e => {
                    setScheduleForm({ ...scheduleForm, endTime: e.target.value });
                  }}
                  className='col-span-3'
                />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='meetingType' className='text-right'>
                  Meeting Type
                </Label>
                <Select
                  value={scheduleForm.meetingType}
                  onValueChange={value => {
                    setScheduleForm({ ...scheduleForm, meetingType: value });
                  }}
                >
                  <SelectTrigger className='col-span-3'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='live'>Live Class</SelectItem>
                    <SelectItem value='recorded'>Recorded Session</SelectItem>
                    <SelectItem value='webinar'>Webinar</SelectItem>
                    <SelectItem value='workshop'>Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='meetingLink' className='text-right'>
                  Meeting Link
                </Label>
                <Input
                  id='meetingLink'
                  value={scheduleForm.meetingLink}
                  onChange={e => {
                    setScheduleForm({ ...scheduleForm, meetingLink: e.target.value });
                  }}
                  placeholder='Zoom, Google Meet, or other meeting link'
                  className='col-span-3'
                />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='maxParticipants' className='text-right'>
                  Max Participants
                </Label>
                <Input
                  id='maxParticipants'
                  type='number'
                  min={1}
                  max={1000}
                  value={scheduleForm.maxParticipants}
                  onChange={e => {
                    setScheduleForm({
                      ...scheduleForm,
                      maxParticipants: parseInt(e.target.value) || 50,
                    });
                  }}
                  className='col-span-3'
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setShowScheduleModal(false);
                }}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={schedulingLoading}>
                {schedulingLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Class'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Add Batch Modal */}
      <Dialog open={showAddBatchModal} onOpenChange={setShowAddBatchModal}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>Create a new batch for your classes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreateBatch(e)}>
            <div className='grid gap-4 py-4'>
              <div>
                <Label>Batch Name *</Label>
                <Input value={newBatchName} onChange={e => setNewBatchName(e.target.value)} />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={newBatchSubject} onChange={e => setNewBatchSubject(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowAddBatchModal(false)}>Cancel</Button>
              <Button type='submit'>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>Enroll a student into a batch by student ID.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleEnrollStudent(e)}>
            <div className='grid gap-4 py-4'>
              <div>
                <Label>Student ID *</Label>
                <Input value={enrollStudentId} onChange={e => setEnrollStudentId(e.target.value)} />
              </div>
              <div>
                <Label>Batch</Label>
                <Select value={enrollBatchId} onValueChange={(v) => setEnrollBatchId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select batch' />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map(b => (
                      <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowAddStudentModal(false)}>Cancel</Button>
              <Button type='submit'>Enroll</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* CUSTOM MODAL - Simple HTML Modal That Works */}
      {showScheduleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
                📅 Schedule New Class
              </h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                Create a new class for one of your batches
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleScheduleSubmit(e);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Batch Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Select Batch *
                </label>
                <select
                  value={scheduleForm.batchId}
                  onChange={e => setScheduleForm({ ...scheduleForm, batchId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value=''>-- Select a batch --</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({batch.students?.length || 0} students)
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Topic *
                </label>
                <input
                  type='text'
                  value={scheduleForm.topic}
                  onChange={e => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                  placeholder='e.g., Introduction to Algebra'
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder='Brief description of the class'
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Start Time */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Start Time *
                </label>
                <input
                  type='datetime-local'
                  value={scheduleForm.startTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* End Time */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  End Time *
                </label>
                <input
                  type='datetime-local'
                  value={scheduleForm.endTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Meeting Type */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Meeting Type
                </label>
                <select
                  value={scheduleForm.meetingType}
                  onChange={e => setScheduleForm({ ...scheduleForm, meetingType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value='zoom'>Zoom</option>
                  <option value='google_meet'>Google Meet</option>
                  <option value='in_app'>In App</option>
                </select>
              </div>

              {/* Meeting Link */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Meeting Link
                </label>
                <input
                  type='url'
                  value={scheduleForm.meetingLink}
                  onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder='https://zoom.us/j/...'
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type='button'
                  onClick={() => setShowScheduleModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#e5e5e5';
                  }}
                  onMouseOut={e => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#f5f5f5';
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={schedulingLoading}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: schedulingLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: schedulingLoading ? 0.6 : 1,
                  }}
                >
                  {schedulingLoading ? '📤 Scheduling...' : '✅ Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Schedule;
