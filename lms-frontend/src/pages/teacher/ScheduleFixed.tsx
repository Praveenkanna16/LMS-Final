import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';
import { useToast } from '@/hooks/use-toast';
import { sessionManager } from '@/lib/sessionManager';

const ScheduleFixed: React.FC = () => {
  const { toast } = useToast();
  const user = sessionManager.getUser();
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    batchId: '',
    startTime: '',
    endTime: '',
    topic: '',
    description: '',
    meetingType: 'zoom',
    meetingLink: '',
  });

  // Fetch schedules and batches
  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [schedulesRes, batchesRes] = await Promise.all([
          apiService.getLiveClasses({ teacherId: user._id, limit: 100 }),
          apiService.getMyTeacherBatches(),
        ]);

        if (schedulesRes?.success) {
          setSchedules(schedulesRes.data?.liveClasses || []);
        }
        if (batchesRes?.success) {
          setBatches(batchesRes.data || []);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id, toast]);

  // Socket for real-time updates
  useEffect(() => {
    if (user?._id) {
      const token = localStorage.getItem('genzed_token') || '';
      socketService.connect(user._id.toString(), token);

      const handleScheduleCreated = () => {
        location.reload();
      };

      socketService.on('batch-notification', handleScheduleCreated);
      return () => {
        socketService.off('batch-notification', handleScheduleCreated);
        socketService.disconnect();
      };
    }
  }, [user?._id]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !scheduleForm.batchId ||
      !scheduleForm.startTime ||
      !scheduleForm.endTime ||
      !scheduleForm.topic
    ) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

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
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const response = await apiService.createSchedule({
        batchId: scheduleForm.batchId,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        topic: scheduleForm.topic,
        description: scheduleForm.description,
        meetingType: scheduleForm.meetingType,
        meetingLink: scheduleForm.meetingLink,
        duration,
      });

      toast({
        title: 'Success',
        description: 'Class scheduled successfully!',
      });

      setShowScheduleModal(false);
      setScheduleForm({
        batchId: '',
        startTime: '',
        endTime: '',
        topic: '',
        description: '',
        meetingType: 'zoom',
        meetingLink: '',
      });

      // Reload data
      location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to schedule class',
        variant: 'destructive',
      });
    } finally {
      setSchedulingLoading(false);
    }
  };

  const openScheduleModal = () => {
    if (batches.length === 0) {
      toast({
        title: 'No Batches',
        description: 'Create a batch first in "My Batches"',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    setScheduleForm({
      ...scheduleForm,
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
    });
    setShowScheduleModal(true);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Loader2 className='w-12 h-12 animate-spin text-blue-500' />
      </div>
    );
  }

  return (
    <>
      {/* SCHEDULE MODAL */}
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
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
              📅 Schedule New Class
            </h2>
            <p style={{ color: '#666', margin: 0, marginBottom: '24px', fontSize: '14px' }}>
              Create a new live class
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleScheduleSubmit(e);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
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
                    <option key={batch._id || batch.id} value={batch._id || batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>

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

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder='Brief description'
                  rows={3}
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

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Meeting Link
                </label>
                <input
                  type='url'
                  value={scheduleForm.meetingLink}
                  onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder='https://...'
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
                  {schedulingLoading ? '⏳ Scheduling...' : '✅ Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden mb-8'>
            <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <Calendar className='w-10 h-10 text-white' />
                  <div>
                    <h1 className='text-4xl font-bold text-white mb-2'>Class Schedule 📅</h1>
                    <p className='text-blue-100'>Manage your live classes</p>
                  </div>
                </div>
                <Button
                  className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                  onClick={openScheduleModal}
                >
                  <Plus className='w-5 h-5 mr-2' />
                  Schedule New Class
                </Button>
              </div>
            </div>
          </Card>

          {/* Schedule List */}
          {schedules.length === 0 ? (
            <Card className='border-0 shadow-xl bg-white/90 rounded-3xl'>
              <CardContent className='text-center py-12'>
                <Calendar className='w-16 h-16 mx-auto mb-4 text-gray-400' />
                <h3 className='text-xl font-semibold mb-2'>No classes scheduled</h3>
                <p className='text-gray-600 mb-6'>You haven't scheduled any classes yet.</p>
                <Button
                  className='bg-gradient-to-r from-blue-600 to-indigo-600'
                  onClick={openScheduleModal}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Schedule Your First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {schedules.map(schedule => (
                <Card key={schedule.id} className='border-0 shadow-lg bg-white/90 rounded-2xl'>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-lg font-bold text-gray-900'>{schedule.title || schedule.topic}</h3>
                        <p className='text-sm text-gray-600 mt-1'>
                          {new Date(schedule.startTime).toLocaleString()}
                        </p>
                        <p className='text-sm text-gray-600 mt-1'>{schedule.description}</p>
                      </div>
                      <Badge className='bg-blue-100 text-blue-700'>{schedule.status || 'Scheduled'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ScheduleFixed;
