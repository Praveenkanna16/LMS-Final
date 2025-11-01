import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Save,
  ArrowLeft,
  Loader2,
  Users,
  AlertCircle,
  GraduationCap,
  Calendar,
  Clock,
} from 'lucide-react';

interface ErrorWithMessage {
  message?: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BatchFormData {
  name: string;
  subject: string;
  grade: string;
  description: string;
  teacherId: string;
  maxStudents: string;
  schedule: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const AddBatch: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<BatchFormData>({
    name: '',
    subject: '',
    grade: '',
    description: '',
    teacherId: undefined as any, // undefined for controlled Select component
    maxStudents: '30',
    schedule: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const usersRes = await apiService.getAllUsers();

      const usersData = 'data' in usersRes ? usersRes.data : usersRes;
      const usersList = Array.isArray(usersData) ? usersData : [];
      
      const teachersList = usersList.filter((user: { role: string }) => user.role === 'teacher');
      const studentsList = usersList.filter((user: { role: string }) => user.role === 'student');
      
      setTeachers(teachersList as Teacher[]);
      setStudents(studentsList as Student[]);
    } catch (error) {
      const errorWithMessage = error as ErrorWithMessage;
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: errorWithMessage.message ?? 'Failed to load teachers and students',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.subject || !formData.teacherId || !formData.startDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    void (async () => {
      try {
        setLoading(true);

        const submitData = {
          name: formData.name,
          subject: formData.subject,
          grade: formData.grade,
          description: formData.description,
          teacherId: formData.teacherId,
          maxStudents: parseInt(formData.maxStudents),
          schedule: formData.schedule,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          isActive: formData.isActive,
          studentIds: selectedStudents,
        };

        const res = await apiService.createBatch(submitData);

        // Ensure backend actually succeeded
        if (!res || !(res as any).success) {
          const errMsg = (res && ((res as any).message || (res as any).error)) || 'Failed to create batch';
          throw new Error(errMsg);
        }

        toast({
          title: 'Success',
          description: 'Batch created successfully!',
        });

        navigate('/admin/batches');
      } catch (error) {
        console.error('Error creating batch:', error);
        toast({
          title: 'Error',
          description: 'Failed to create batch. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loadingData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-purple-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'>
              Loading Data
            </h2>
            <p className='text-gray-600'>Fetching teachers and students...</p>
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

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <BookOpen className='w-8 h-8 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <Button
              variant='outline'
              onClick={() => {
                navigate('/admin/batches');
              }}
              className='mb-6 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Batches
            </Button>

            <div className='flex items-center gap-4 mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                <BookOpen className='w-10 h-10 text-white' />
              </div>
              <div>
                <Badge className='mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                  <BookOpen className='w-4 h-4 mr-2' />
                  Batch Creation
                </Badge>
                <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent drop-shadow-lg'>
                  Create New Batch
                </h1>
                <p className='text-xl text-gray-600 mt-2'>Set up a new batch with students and teacher</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <GraduationCap className='h-6 w-6 text-purple-600' />
                  Basic Information
                </CardTitle>
                <CardDescription>Core details about the batch</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='name' className='text-gray-900 font-semibold flex items-center gap-2'>
                    <BookOpen className='w-4 h-4 text-purple-600' />
                    Batch Name *
                  </Label>
                  <Input
                    id='name'
                    name='name'
                    placeholder='e.g., Python Development Batch 2024'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='subject' className='text-gray-900 font-semibold'>
                      Subject *
                    </Label>
                    <Input
                      id='subject'
                      name='subject'
                      placeholder='e.g., Python, Mathematics, Science'
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='grade' className='text-gray-900 font-semibold'>
                      Grade/Level
                    </Label>
                    <Input
                      id='grade'
                      name='grade'
                      placeholder='e.g., Grade 10, Beginner, Advanced'
                      value={formData.grade}
                      onChange={handleInputChange}
                      className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description' className='text-gray-900 font-semibold'>
                    Description
                  </Label>
                  <Textarea
                    id='description'
                    name='description'
                    placeholder='Brief description of the batch...'
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='teacherId' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <Users className='w-4 h-4 text-blue-600' />
                      Teacher *
                    </Label>
                    <Select
                      name='teacherId'
                      value={formData.teacherId || undefined}
                      onValueChange={value => {
                        handleSelectChange('teacherId', value);
                      }}
                    >
                      <SelectTrigger className='border-2 border-gray-200 bg-white focus:border-purple-500'>
                        <SelectValue placeholder='Select teacher' />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name} ({teacher.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='maxStudents' className='text-gray-900 font-semibold'>
                      Maximum Students
                    </Label>
                    <Input
                      id='maxStudents'
                      name='maxStudents'
                      type='number'
                      placeholder='30'
                      value={formData.maxStudents}
                      onChange={handleInputChange}
                      min='1'
                      className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Dates */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <Calendar className='h-6 w-6 text-blue-600' />
                  Schedule & Dates
                </CardTitle>
                <CardDescription>Set batch timing and duration</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='schedule' className='text-gray-900 font-semibold flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-blue-600' />
                    Schedule
                  </Label>
                  <Input
                    id='schedule'
                    name='schedule'
                    placeholder='e.g., Mon/Wed/Fri 10:00 AM - 12:00 PM'
                    value={formData.schedule}
                    onChange={handleInputChange}
                    className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='startDate' className='text-gray-900 font-semibold'>
                      Start Date *
                    </Label>
                    <Input
                      id='startDate'
                      name='startDate'
                      type='date'
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='endDate' className='text-gray-900 font-semibold'>
                      End Date
                    </Label>
                    <Input
                      id='endDate'
                      name='endDate'
                      type='date'
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className='border-2 border-gray-200 bg-white focus:border-purple-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='isActive'
                    checked={formData.isActive}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, isActive: e.target.checked }));
                    }}
                    className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
                  />
                  <Label htmlFor='isActive' className='text-gray-900 font-medium cursor-pointer'>
                    Mark batch as active
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Add Students */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <Users className='h-6 w-6 text-green-600' />
                  Add Students (Optional)
                </CardTitle>
                <CardDescription>Select students to enroll in this batch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='max-h-64 overflow-y-auto border-2 border-gray-200 rounded-lg p-4 bg-gray-50'>
                  {students.length === 0 ? (
                    <p className='text-gray-500 text-center py-4'>No students available</p>
                  ) : (
                    <div className='space-y-2'>
                      {students.map(student => (
                        <div
                          key={student.id}
                          className='flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors'
                        >
                          <input
                            type='checkbox'
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => {
                              toggleStudentSelection(student.id);
                            }}
                            className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
                          />
                          <Label
                            htmlFor={`student-${student.id}`}
                            className='flex-1 cursor-pointer text-gray-900'
                          >
                            <span className='font-medium'>{student.name}</span>
                            <span className='text-sm text-gray-500 ml-2'>({student.email})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className='text-sm text-gray-600 mt-3'>
                  Selected: {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <AlertCircle className='w-4 h-4' />
                    <span>* Required fields</span>
                  </div>
                  <div className='flex gap-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        navigate('/admin/batches');
                      }}
                      className='border-2 border-gray-300 hover:border-red-500 hover:bg-red-50'
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={loading}
                      className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl'
                    >
                      {loading ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className='w-4 h-4 mr-2' />
                          Create Batch
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBatch;
