import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Search, Download, Eye, Award, Loader2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'at-risk';
  grade?: string;
}

interface BatchProgressProps {
  batchId?: string;
}

const StudentProgress: React.FC<BatchProgressProps> = ({ batchId }) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // For now, we'll show empty state since no students are enrolled yet
        setStudents([]);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load student progress',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchStudents();
  }, [batchId, toast]);

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-12'>
          <Loader2 className='w-12 h-12 animate-spin mx-auto mb-4 text-blue-500' />
          <h3 className='text-xl font-semibold mb-2'>Loading Student Progress</h3>
          <p className='text-gray-600'>Fetching student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Student Progress</h2>
          <p className='text-gray-600'>Monitor and track student learning progress</p>
        </div>
        <Button className='bg-blue-600 hover:bg-blue-700'>
          <Download className='h-4 w-4 mr-2' />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card className='border-0 shadow-xl bg-white'>
        <CardContent className='p-4'>
          <div className='flex flex-col md:flex-row gap-4 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Search students...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
                className='pl-10 border-gray-200'
              />
            </div>
            <div className='flex gap-2'>
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setFilterStatus('all');
                }}
                className='border-gray-300'
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setFilterStatus('active');
                }}
                className='border-gray-300'
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'at-risk' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setFilterStatus('at-risk');
                }}
                className='border-gray-300'
              >
                At Risk
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setFilterStatus('inactive');
                }}
                className='border-gray-300'
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Progress Cards */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {students.length === 0 ? (
          <Card className='col-span-full border-0 shadow-xl bg-white'>
            <CardContent className='text-center py-12'>
              <Users className='w-16 h-16 mx-auto mb-4 text-gray-400' />
              <h3 className='text-xl font-semibold mb-2'>No students enrolled yet</h3>
              <p className='text-gray-600 mb-6'>
                {batchId
                  ? "This batch doesn't have any enrolled students yet."
                  : "You haven't enrolled any students in your batches yet."}
              </p>
              <div className='space-y-2'>
                <p className='text-sm text-gray-500'>To see student progress:</p>
                <div className='flex flex-wrap gap-2 justify-center'>
                  <span className='text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded'>
                    1. Create batches
                  </span>
                  <span className='text-xs bg-green-50 text-green-600 px-2 py-1 rounded'>
                    2. Enroll students
                  </span>
                  <span className='text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded'>
                    3. Track progress
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          students.map(student => {
            const getStatusBadgeClass = (status: string) => {
              switch (status) {
                case 'active':
                  return 'bg-green-600 text-white';
                case 'at-risk':
                  return 'bg-yellow-600 text-white';
                case 'inactive':
                  return 'bg-red-600 text-white';
                default:
                  return 'bg-gray-600 text-white';
              }
            };

            return (
              <Card
                key={student.id}
                className='border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300'
              >
                <CardHeader className='pb-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center'>
                        <span className='text-white font-bold'>{student.name.charAt(0)}</span>
                      </div>
                      <div>
                        <CardTitle className='text-lg text-gray-900'>{student.name}</CardTitle>
                        <CardDescription className='text-gray-600'>{student.email}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusBadgeClass(student.status)}>{student.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Progress Bar */}
                  <div>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-sm font-medium text-gray-600'>Overall Progress</span>
                      <span className='text-sm text-gray-500'>{student.progress}%</span>
                    </div>
                    <Progress value={student.progress} className='h-2' />
                  </div>

                  {/* Stats */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='flex items-center space-x-2'>
                      <BookOpen className='h-4 w-4 text-blue-400' />
                      <div>
                        <p className='text-sm text-gray-600'>Lessons</p>
                        <p className='text-gray-900 font-medium'>
                          {student.completedLessons}/{student.totalLessons}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Clock className='h-4 w-4 text-green-400' />
                      <div>
                        <p className='text-sm text-gray-600'>Last Activity</p>
                        <p className='text-gray-900 font-medium'>{student.lastActivity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Grade and Actions */}
                  <div className='flex items-center justify-between pt-2 border-t border-gray-200'>
                    {student.grade && (
                      <div className='flex items-center space-x-2'>
                        <Award className='h-4 w-4 text-yellow-400' />
                        <span className='text-gray-900 font-medium'>Grade: {student.grade}</span>
                      </div>
                    )}
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-gray-300 text-gray-600 hover:bg-gray-50'
                      >
                        <Eye className='h-4 w-4 mr-2' />
                        View Details
                      </Button>
                      <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                        Send Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Stats - Only show when there are students */}
      {students.length > 0 && (
        <Card className='border-0 shadow-xl bg-white'>
          <CardHeader>
            <CardTitle className='text-gray-900'>Class Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {students.filter(s => s.status === 'active').length}
                </div>
                <div className='text-sm text-gray-600'>Active Students</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {students.filter(s => s.status === 'at-risk').length}
                </div>
                <div className='text-sm text-gray-600'>At Risk</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {students.filter(s => s.status === 'inactive').length}
                </div>
                <div className='text-sm text-gray-600'>Inactive</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)}%
                </div>
                <div className='text-sm text-gray-600'>Avg Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentProgress;
