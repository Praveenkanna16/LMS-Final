import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Phone, UserPlus, UserMinus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@/types';

interface Student {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  enrolledAt?: string;
}

interface Batch {
  id: string;
  _id?: string;
  name: string;
  students: Student[];
  studentLimit?: number;
}

const BatchStudents: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    void fetchBatchStudents();
  }, [id, toast]);

  const fetchBatchStudents = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await apiService.getBatchById(id);
      const batchData = response?.data?.batch;
      
      if (batchData) {
        setBatch(batchData);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load batch students',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch batch students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load batch students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async (searchQuery = '') => {
    if (!id) return;
    
    try {
      setLoadingAvailable(true);
      const response = await apiService.getAvailableStudentsForBatch(id, searchQuery);
      
      if (response.data) {
        setAvailableStudents(response.data as User[]);
      }
    } catch (error) {
      console.error('Failed to fetch available students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available students',
        variant: 'destructive',
      });
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!id || !confirm('Are you sure you want to remove this student from the batch?')) {
      return;
    }

    try {
      await apiService.removeStudentFromBatchById(id, studentId);
      
      toast({
        title: 'Success',
        description: 'Student removed from batch successfully',
      });

      // Refresh batch data
      await fetchBatchStudents();
    } catch (error) {
      console.error('Failed to remove student:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove student from batch',
        variant: 'destructive',
      });
    }
  };

  const handleOpenAddDialog = async () => {
    setAddDialogOpen(true);
    setDialogSearchQuery('');
    await fetchAvailableStudents('');
  };

  const handleDialogSearchChange = (value: string) => {
    setDialogSearchQuery(value);
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    // Set new timer for debounced search
    const timer = setTimeout(() => {
      void fetchAvailableStudents(value);
    }, 300); // 300ms debounce
    
    setSearchDebounceTimer(timer);
  };

  const handleAddStudents = async () => {
    if (!id || selectedStudents.length === 0) return;

    try {
      setAddingStudents(true);
      
      // Add students one by one
      for (const studentId of selectedStudents) {
        await apiService.enrollStudentInBatch(studentId, id).catch(err => {
          console.error(`Failed to enroll student ${studentId}:`, err);
        });
      }

      toast({
        title: 'Success',
        description: `Successfully added ${selectedStudents.length} student(s) to batch`,
      });

      setSelectedStudents([]);
      setAddDialogOpen(false);
      setDialogSearchQuery('');
      
      // Refresh batch data
      await fetchBatchStudents();
    } catch (error) {
      console.error('Failed to add students:', error);
      toast({
        title: 'Error',
        description: 'Failed to add students to batch',
        variant: 'destructive',
      });
    } finally {
      setAddingStudents(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Users className='w-12 h-12 animate-pulse mx-auto mb-4 text-purple-500' />
          <h2 className='text-xl font-semibold mb-2'>Loading Students</h2>
          <p className='text-gray-600'>Fetching student list...</p>
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
          <Button onClick={() => navigate('/teacher/batches')}>Back to Batches</Button>
        </div>
      </div>
    );
  }

  const students = Array.isArray(batch.students) ? batch.students : [];
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <Button
          variant='outline'
          onClick={() => navigate(`/teacher/batches/${id}/manage`)}
          className='mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Batch Management
        </Button>

        <div className='bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Student Management</h1>
              <p className='text-purple-100 text-lg'>
                {batch.name} • {students.length} Students
                {batch.studentLimit && ` of ${batch.studentLimit}`}
              </p>
            </div>
            <Badge className='bg-white/20 text-white border-white/30 text-lg px-4 py-2'>
              {students.length}/{batch.studentLimit || '∞'}
            </Badge>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        <Card className='border-0 shadow-xl bg-white'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-purple-600'>Enrolled Students</CardTitle>
                <CardDescription>Manage students in this batch</CardDescription>
              </div>
              <Button
                className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                onClick={handleOpenAddDialog}
              >
                <UserPlus className='h-4 w-4 mr-2' />
                Add Student
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='mb-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search students by name or email...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className='text-center py-12'>
                <Users className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                <h3 className='text-lg font-semibold mb-2'>No Students Found</h3>
                <p className='text-gray-600 mb-4'>
                  {searchQuery ? 'No students match your search.' : 'This batch has no enrolled students yet.'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleOpenAddDialog}>
                    <UserPlus className='h-4 w-4 mr-2' />
                    Add First Student
                  </Button>
                )}
              </div>
            ) : (
              <div className='space-y-3'>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold'>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className='font-semibold text-gray-900'>{student.name}</h4>
                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <Mail className='h-3 w-3' />
                            <span>{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className='flex items-center gap-1'>
                              <Phone className='h-3 w-3' />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleRemoveStudent(student.id)}
                      className='text-red-600 hover:text-red-700 hover:bg-red-50'
                    >
                      <UserMinus className='h-4 w-4 mr-2' />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Students Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Add Students to Batch</DialogTitle>
            <DialogDescription>
              Select students to add to {batch?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className='space-y-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search students by name or email...'
                value={dialogSearchQuery}
                onChange={(e) => handleDialogSearchChange(e.target.value)}
                className='pl-10'
              />
              {dialogSearchQuery && (
                <p className='text-xs text-gray-500 mt-1'>
                  Searching for "{dialogSearchQuery}"...
                </p>
              )}
            </div>

            {loadingAvailable ? (
              <div className='text-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-purple-500' />
                <p className='text-gray-500'>
                  {dialogSearchQuery ? 'Searching...' : 'Loading available students...'}
                </p>
              </div>
            ) : (
              <div className='space-y-2 max-h-96 overflow-y-auto'>
                {availableStudents.length === 0 ? (
                  <div className='text-center py-12'>
                    <Users className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                    <p className='text-gray-500'>
                      {dialogSearchQuery 
                        ? 'No students match your search' 
                        : 'No available students to add'}
                    </p>
                  </div>
                ) : (
                  availableStudents.map((student) => (
                    <div
                      key={student._id}
                      className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'
                      onClick={() => {
                        if (selectedStudents.includes(student._id)) {
                          setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                        } else {
                          setSelectedStudents([...selectedStudents, student._id]);
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, student._id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                          }
                        }}
                      />
                      <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm'>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium'>{student.name}</p>
                        <p className='text-sm text-gray-500'>{student.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className='flex justify-between items-center pt-4 border-t'>
              <p className='text-sm text-gray-600'>
                {selectedStudents.length} student(s) selected
              </p>
              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setAddDialogOpen(false);
                    setSelectedStudents([]);
                    setDialogSearchQuery('');
                  }}
                  disabled={addingStudents}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudents}
                  disabled={addingStudents || selectedStudents.length === 0}
                  className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                >
                  {addingStudents ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Adding...
                    </>
                  ) : (
                    <>Add {selectedStudents.length} Student(s)</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchStudents;
