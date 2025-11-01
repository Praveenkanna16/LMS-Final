import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { TeacherLayout as Layout } from '@/components/TeacherLayout';
// import { apiService } from '@/services/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Users, Clock, Calendar, ArrowLeft } from 'lucide-react';

interface LiveClassData {
  _id: string;
  batch: {
    _id: string;
    name: string;
    course: {
      title: string;
      description: string;
    };
  };
  scheduleId: string;
  status: 'scheduled' | 'live' | 'ended';
  startTime: Date;
  endTime: Date;
  students: string[];
}

const LiveClass = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartClass = () => {
    toast({
      title: 'Success',
      description: 'Live class started successfully.',
    });
  };

  const handleNavigateToBatches = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    navigate('/teacher/batches');
  };

  const [classData, setClassData] = useState<LiveClassData | null>(null);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Placeholder: In absence of a concrete API, show a mock class derived from route param
    setLoading(true);
    setTimeout(() => {
      setClassData({
        _id: id ?? 'live-1',
        batch: {
          _id: 'batch-1',
          name: 'Sample Batch',
          course: { title: 'Sample Course', description: 'Demo' },
        },
        scheduleId: 'sched-1',
        status: 'scheduled',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        students: [],
      });
      setLoading(false);
    }, 300);
  }, [id, toast]);

  const handleEndClass = () => {
    toast({
      title: 'Success',
      description: 'The live class has been ended successfully.',
    });
    navigate('/teacher/batches');
  };

  if (loading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading live class...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // if (error) {
  //   return (
  //     <Layout>
  //       <Card className='w-96 mx-auto'>
  //         <CardHeader>
  //           <CardTitle className='text-red-600'>Error</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //           <p className='text-gray-600 mb-4'>{error}</p>
  //           <Button
  //             onClick={() => {
  //               navigate('/teacher/batches');
  //             }}
  //             variant='outline'
  //           >
  //             <ArrowLeft className='w-4 h-4 mr-2' />
  //             Back to Batches
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </Layout>
  //   );
  // }

  if (!classData) {
    return (
      <Layout>
        <Card className='w-96 mx-auto'>
          <CardHeader>
            <CardTitle>Class Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                navigate('/teacher/batches');
              }}
              variant='outline'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Batches
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white border-b px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button
                onClick={() => {
                  navigate('/teacher/batches');
                }}
                variant='ghost'
                size='sm'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back
              </Button>
              <div>
                <h1 className='text-xl font-semibold'>{classData.batch.name}</h1>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='w-4 h-4' />
                  {classData.batch.course.title}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      classData.status === 'live'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {classData.status}
                  </span>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 text-sm text-gray-600'>
                <Users className='w-4 h-4' />
                {classData.students.length}
              </div>
              <div className='flex items-center gap-1 text-sm text-gray-600'>
                <Clock className='w-4 h-4' />
                {new Date(classData.startTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 flex items-center justify-center p-8'>
          <Card className='w-full max-w-2xl'>
            <CardHeader className='text-center'>
              <Video className='w-16 h-16 mx-auto mb-4 text-gray-400' />
              <CardTitle className='text-2xl'>Start Live Class</CardTitle>
              <CardDescription className='text-lg'>
                {classData.status === 'live'
                  ? 'Live class is in progress'
                  : 'Ready to start the class'}
              </CardDescription>
            </CardHeader>
            <CardContent className='text-center space-y-4'>
              <p className='text-gray-600'>
                {classData.status === 'live'
                  ? 'Your live class is currently active. You can interact with students and share your screen.'
                  : 'Click the button below to start your live class session.'}
              </p>
              <div className='flex justify-center gap-4'>
                <Button onClick={handleNavigateToBatches} variant='outline'>
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Back to Batches
                </Button>
                {classData.status === 'live' ? (
                  <Button
                    onClick={() => {
                      handleEndClass();
                    }}
                    variant='destructive'
                  >
                    End Class
                  </Button>
                ) : (
                  <Button onClick={handleStartClass}>Start Class</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default LiveClass;
