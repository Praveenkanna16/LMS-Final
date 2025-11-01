import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Users, Clock, Calendar, ArrowLeft, Sparkles, Zap, Radio, Home } from 'lucide-react';

const LiveClass = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveClass();
  }, [id]);

  const fetchLiveClass = async () => {
    try {
      setLoading(true);
      // Mock data since WebSocket functionality is removed
      setClassData({
        _id: id,
        batch: {
          _id: id,
          name: 'Sample Live Class',
          course: {
            title: 'Sample Course',
            description: 'This is a sample course for demonstration',
          },
        },
        scheduleId: 'schedule_123',
        status: 'ended', // Since WebSocket is removed, no live functionality
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load live class');
    } finally {
      setLoading(false);
    }
  };

  const handleEndClass = async () => {
    try {
      toast({
        title: 'Class Ended',
        description: 'The live class has been ended successfully.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to end class',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorative elements */}
        <div className='absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse' />
        <div className='absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-700' />
        
        <div className='relative flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='relative'>
              <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6'></div>
              <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 animate-pulse' />
            </div>
            <p className='text-gray-700 font-medium text-lg'>Loading live class...</p>
            <p className='text-gray-500 text-sm mt-2'>Preparing your classroom</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center p-6'>
        {/* Floating decorative elements */}
        <div className='absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse' />
        
        <Card className='w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl'>
          <CardHeader className='text-center pb-4'>
            <div className='w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <Zap className='w-8 h-8 text-white' />
            </div>
            <CardTitle className='text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent'>
              Oops! Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className='text-center space-y-4'>
            <p className='text-gray-600'>{error}</p>
            <Button
              onClick={() => navigate('/student/batches')}
              className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12'
            >
              <ArrowLeft className='w-5 h-5 mr-2' />
              Back to Batches
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center p-6'>
        <Card className='w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl'>
          <CardHeader className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <Video className='w-8 h-8 text-white' />
            </div>
            <CardTitle className='text-2xl font-bold text-gray-800'>Class Not Found</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='flex gap-3'>
              <Button
                onClick={() => navigate('/student/dashboard')}
                className='flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12'
              >
                <Home className='w-5 h-5 mr-2' />
                Dashboard
              </Button>
              <Button
                onClick={() => navigate('/student/batches')}
                variant='outline'
                className='flex-1 h-12 rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300'
              >
                <ArrowLeft className='w-5 h-5 mr-2' />
                Batches
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Floating decorative elements */}
      <div className='absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse' />
      <div className='absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-300' />
      <div className='absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-500' />
      <div className='absolute bottom-40 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse delay-700' />

      <div className='relative'>
        {/* Enhanced Header */}
        <div className='bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-10'>
          <div className='max-w-7xl mx-auto px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Button
                  onClick={() => navigate('/student/batches')}
                  variant='ghost'
                  className='hover:bg-blue-50 rounded-xl transition-all duration-300'
                >
                  <ArrowLeft className='w-5 h-5 mr-2' />
                  Back
                </Button>
                <div className='h-8 w-px bg-gray-300' />
                <div>
                  <h1 className='text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                    {classData.batch.name}
                  </h1>
                  <div className='flex items-center gap-3 text-sm text-gray-600 mt-1'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='w-4 h-4' />
                      {classData.batch.course.title}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        classData.status === 'live'
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/50'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`}
                    >
                      {classData.status === 'live' && <Radio className='w-3 h-3 animate-pulse' />}
                      {classData.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl'>
                  <Users className='w-4 h-4 text-blue-600' />
                  <span className='text-sm font-semibold text-gray-700'>0 participants</span>
                </div>
                <div className='flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl'>
                  <Clock className='w-4 h-4 text-purple-600' />
                  <span className='text-sm font-semibold text-gray-700'>
                    {new Date(classData.startTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex items-center justify-center min-h-[calc(100vh-100px)] p-8'>
          <Card className='w-full max-w-3xl bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden'>
            <div className='bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1'>
              <div className='bg-white rounded-3xl'>
                <CardHeader className='text-center pt-12 pb-6'>
                  <div className='relative inline-block mb-6'>
                    <div className='absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl blur-2xl opacity-50 animate-pulse'></div>
                    <div className='relative w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl'>
                      <Video className='w-12 h-12 text-white' />
                    </div>
                  </div>
                  <CardTitle className='text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3'>
                    Live Class Not Available
                  </CardTitle>
                  <CardDescription className='text-lg text-gray-600 max-w-xl mx-auto'>
                    Real-time streaming features are currently unavailable
                  </CardDescription>
                </CardHeader>
                <CardContent className='text-center space-y-6 pb-12 px-8'>
                  <div className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100'>
                    <p className='text-gray-700 leading-relaxed'>
                      This live class feature requires real-time WebSocket connections which have been
                      temporarily disabled. Please check back later or contact support for assistance.
                    </p>
                  </div>
                  
                  <div className='flex flex-col sm:flex-row justify-center gap-4 pt-4'>
                    <Button
                      onClick={() => navigate('/student/dashboard')}
                      className='h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold'
                    >
                      <Home className='w-5 h-5 mr-2' />
                      Go to Dashboard
                    </Button>
                    <Button
                      onClick={() => navigate('/student/batches')}
                      variant='outline'
                      className='h-12 px-8 rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-gray-700 font-semibold'
                    >
                      <ArrowLeft className='w-5 h-5 mr-2' />
                      Back to Batches
                    </Button>
                    <Button
                      onClick={handleEndClass}
                      variant='outline'
                      className='h-12 px-8 rounded-xl border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 text-purple-700 font-semibold'
                    >
                      <Sparkles className='w-5 h-5 mr-2' />
                      End Class
                    </Button>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveClass;
