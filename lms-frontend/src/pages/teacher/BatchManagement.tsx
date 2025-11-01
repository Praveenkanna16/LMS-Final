import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar, BookOpen, Clock, Settings, Edit, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Batch } from '@/types';

const BatchManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await apiService.getBatchById(id);
        console.warn('Batch details response:', response);
        
        // Backend returns {data: {batch: Batch, isEnrolled, userProgress}}
        const batchData = (response?.data as any)?.batch;
        if (batchData) {
          setBatch(batchData);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load batch details',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to fetch batch details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load batch details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchBatchDetails();
  }, [id, toast]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin mx-auto mb-4 text-purple-500' />
          <h2 className='text-xl font-semibold mb-2'>Loading Batch</h2>
          <p className='text-gray-600'>Fetching batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Batch Not Found</h2>
          <p className='text-gray-600 mb-4'>The batch you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/teacher/batches')}>
            Back to Batches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <Button
          variant='outline'
          onClick={() => {
            navigate('/teacher/batches');
          }}
          className='mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Batches
        </Button>

        <div className='bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Manage: {batch.name}</h1>
              <p className='text-purple-100 text-lg'>
                {batch.course.title} • {Array.isArray(batch.students) ? batch.students.length : 0}{' '}
                Students
              </p>
            </div>
            <Badge className={`text-lg px-4 py-2 ${(batch as any).settings?.isActive ? 'bg-green-500/90 text-white border-green-300' : 'bg-gray-500/90 text-white border-gray-300'}`}>
              {(batch as any).settings?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card className='border-0 shadow-xl bg-white'>
            <CardHeader>
              <CardTitle className='text-purple-600'>Batch Settings</CardTitle>
              <CardDescription>Configure batch settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div 
                  className='p-4 border border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all cursor-pointer hover:scale-105'
                  onClick={() => {
                    navigate(`/teacher/batches/${id}/students`);
                  }}
                >
                  <Users className='h-8 w-8 mb-2 text-purple-600' />
                  <h3 className='font-semibold mb-1'>Student Management</h3>
                  <p className='text-sm text-gray-600'>Add, remove, and manage enrolled students</p>
                </div>
                <div 
                  className='p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer hover:scale-105'
                  onClick={() => {
                    navigate(`/teacher/batches/${id}/schedule`);
                  }}
                >
                  <Calendar className='h-8 w-8 mb-2 text-blue-600' />
                  <h3 className='font-semibold mb-1'>Schedule Management</h3>
                  <p className='text-sm text-gray-600'>Create and modify class schedules</p>
                </div>
                <div 
                  className='p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all cursor-pointer hover:scale-105'
                  onClick={() => {
                    navigate(`/teacher/batches/${id}/content`);
                  }}
                >
                  <BookOpen className='h-8 w-8 mb-2 text-green-600' />
                  <h3 className='font-semibold mb-1'>Content Management</h3>
                  <p className='text-sm text-gray-600'>Assign lessons and materials</p>
                </div>
                <div 
                  className='p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all cursor-pointer hover:scale-105'
                  onClick={() => {
                    navigate(`/teacher/batches/${id}/settings`);
                  }}
                >
                  <Settings className='h-8 w-8 mb-2 text-orange-600' />
                  <h3 className='font-semibold mb-1'>Batch Settings</h3>
                  <p className='text-sm text-gray-600'>Configure enrollment and limits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white'>
            <CardHeader>
              <CardTitle className='text-purple-600'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                <Button 
                  className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  onClick={() => {
                    toast({
                      title: 'Coming Soon',
                      description: 'Student management feature is under development',
                    });
                  }}
                >
                  <Users className='h-4 w-4 mr-2' />
                  Manage Students
                </Button>
                <Button
                  variant='outline'
                  className='border-gray-300 text-gray-600 hover:bg-gray-50'
                  onClick={() => {
                    navigate(`/teacher/schedule?batch=${id}`);
                  }}
                >
                  <Calendar className='h-4 w-4 mr-2' />
                  Schedule Class
                </Button>
                <Button
                  variant='outline'
                  className='border-gray-300 text-gray-600 hover:bg-gray-50'
                  onClick={() => {
                    navigate(`/teacher/batches/${id}`);
                  }}
                >
                  <Edit className='h-4 w-4 mr-2' />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card className='border-0 shadow-xl bg-white'>
            <CardHeader>
              <CardTitle className='text-purple-600'>Batch Info</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Batch Name</span>
                <span className='text-sm font-medium'>{batch.name}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Course</span>
                <span className='text-sm font-medium'>{batch.course.title}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Teacher</span>
                <span className='text-sm font-medium'>{batch.teacher.name}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Students Enrolled</span>
                <span className='text-lg font-semibold'>{Array.isArray(batch.students) ? batch.students.length : 0}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Student Limit</span>
                <span className='text-lg font-semibold'>{batch.studentLimit || 30}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Schedule</span>
                <span className='text-sm font-medium uppercase'>
                  {batch.schedule || 'Not set'}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Enrollment</span>
                <span className='text-sm font-medium capitalize'>
                  {batch.enrollmentType || 'Open'}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Status</span>
                <Badge className={batch.settings?.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                  {batch.settings?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white'>
            <CardHeader>
              <CardTitle className='text-purple-600'>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <Clock className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                <p className='text-gray-600'>No recent activity</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BatchManagement;
