import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface Test {
  id: string;
  title: string;
  courseTitle?: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'graded';
  score?: number;
  totalMarks?: number;
  duration?: number;
}

const StudentTests: React.FC = () => {
  const { data: testsData, isLoading } = useQuery({
    queryKey: ['student-tests'],
    queryFn: async () => {
      const response = await apiService.getAssessments();
      return response.data;
    },
  });

  const tests: Test[] = Array.isArray(testsData) ? (testsData as unknown as Test[]) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'graded':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className='w-4 h-4' />;
      case 'graded':
        return <CheckCircle2 className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  return (
    <Layout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              My Tests
            </h1>
            <p className='text-gray-600 mt-2'>View and manage your assessments</p>
          </div>
        </div>

        {/* Tests Grid */}
        <div className='grid gap-6'>
          {isLoading ? (
            <Card>
              <CardContent className='p-12 text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto' />
                <p className='mt-4 text-gray-600'>Loading tests...</p>
              </CardContent>
            </Card>
          ) : tests.length > 0 ? (
            tests.map((test) => (
              <Card key={test.id} className='hover:shadow-lg transition-shadow'>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center'>
                          <FileText className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <h3 className='text-lg font-bold text-gray-900'>{test.title}</h3>
                          {test.courseTitle && (
                            <p className='text-sm text-gray-600'>{test.courseTitle}</p>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-6 text-sm text-gray-600 mb-4'>
                        {test.dueDate && (
                          <div className='flex items-center gap-2'>
                            <Clock className='w-4 h-4' />
                            <span>
                              Due: {new Date(test.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                        {test.duration && (
                          <div className='flex items-center gap-2'>
                            <Clock className='w-4 h-4' />
                            <span>{test.duration} mins</span>
                          </div>
                        )}
                        {test.score !== undefined && test.totalMarks !== undefined && (
                          <div className='flex items-center gap-2'>
                            <CheckCircle2 className='w-4 h-4' />
                            <span>Score: {test.score}/{test.totalMarks}</span>
                          </div>
                        )}
                      </div>

                      <div className='flex items-center gap-3'>
                        <Badge className={getStatusColor(test.status)}>
                          <div className='flex items-center gap-1'>
                            {getStatusIcon(test.status)}
                            <span className='capitalize'>{test.status}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      {test.status === 'pending' && (
                        <Button className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'>
                          Start Test
                        </Button>
                      )}
                      {test.status === 'graded' && (
                        <Button variant='outline'>View Results</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className='p-12 text-center'>
                <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>No Tests Available</h3>
                <p className='text-gray-600'>You don't have any tests at the moment.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentTests;
