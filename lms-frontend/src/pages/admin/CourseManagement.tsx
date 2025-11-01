import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Users,
  Clock,
  Star,
  Filter,
  Download,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  price: number;
  duration?: string;
  rating: number;
  studentsEnrolled: number;
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCourses();
      setCourses(response);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.teacher?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-600';
      case 'draft':
        return 'bg-yellow-600';
      case 'archived':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-600';
      case 'Intermediate':
        return 'bg-yellow-600';
      case 'Advanced':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const handleCreateCourse = async (formData: any) => {
    try {
      await apiService.createCourse(formData);
      toast({
        title: 'Success',
        description: 'Course created successfully',
      });
      setIsCreateDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course',
        variant: 'destructive',
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleSaveEdit = async (formData: any) => {
    try {
      if (editingCourse) {
        await apiService.updateCourse(editingCourse.id, formData);
        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
        setEditingCourse(null);
        fetchCourses();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-blue-400' />
          <p className='text-gray-300'>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6'>
      <div className='mb-8'>
        <div className='bg-gradient-to-br from-green-800 via-emerald-800 to-teal-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]'></div>
          <div className='flex items-center justify-between relative z-10'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Course Management</h1>
              <p className='text-green-100 text-lg'>
                Create, edit, and manage all courses on the platform
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className='bg-gray-800 border-gray-600 text-white'>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                  <DialogDescription className='text-gray-300'>
                    Fill in the details to create a new course.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='title'>Course Title</Label>
                    <Input
                      id='title'
                      placeholder='Enter course title'
                      className='bg-gray-700 border-gray-600 text-white'
                    />
                  </div>
                  <div>
                    <Label htmlFor='description'>Description</Label>
                    <Textarea
                      id='description'
                      placeholder='Enter course description'
                      className='bg-gray-700 border-gray-600 text-white'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='category'>Category</Label>
                      <Select>
                        <SelectTrigger className='bg-gray-700 border-gray-600 text-white'>
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='mathematics'>Mathematics</SelectItem>
                          <SelectItem value='physics'>Physics</SelectItem>
                          <SelectItem value='chemistry'>Chemistry</SelectItem>
                          <SelectItem value='technology'>Technology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor='difficulty'>Difficulty</Label>
                      <Select>
                        <SelectTrigger className='bg-gray-700 border-gray-600 text-white'>
                          <SelectValue placeholder='Select difficulty' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='beginner'>Beginner</SelectItem>
                          <SelectItem value='intermediate'>Intermediate</SelectItem>
                          <SelectItem value='advanced'>Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='price'>Price ($)</Label>
                      <Input
                        id='price'
                        type='number'
                        placeholder='0'
                        className='bg-gray-700 border-gray-600 text-white'
                      />
                    </div>
                    <div>
                      <Label htmlFor='duration'>Duration</Label>
                      <Input
                        id='duration'
                        placeholder='e.g., 40 hours'
                        className='bg-gray-700 border-gray-600 text-white'
                      />
                    </div>
                  </div>
                  <div className='flex justify-end space-x-2'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                      }}
                      className='border-gray-600 text-gray-300'
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCourse}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      Create Course
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm mb-6'>
        <CardContent className='p-4'>
          <div className='flex flex-col md:flex-row gap-4 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Search courses...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
                className='pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              />
            </div>
            <div className='flex gap-2'>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className='w-40 bg-gray-700 border-gray-600 text-white'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  <SelectItem value='mathematics'>Mathematics</SelectItem>
                  <SelectItem value='physics'>Physics</SelectItem>
                  <SelectItem value='chemistry'>Chemistry</SelectItem>
                  <SelectItem value='technology'>Technology</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='w-32 bg-gray-700 border-gray-600 text-white'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='published'>Published</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button className='bg-blue-600 hover:bg-blue-700'>
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {filteredCourses.map(course => (
          <Card
            key={course.id}
            className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm hover:border-green-500 transition-all duration-300'
          >
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center'>
                    <BookOpen className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg text-white'>{course.title}</CardTitle>
                    <CardDescription className='text-gray-300'>
                      by {course.instructor}
                    </CardDescription>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Badge className={`${getStatusColor(course.status)} text-white`}>
                    {course.status}
                  </Badge>
                  <Badge className={`${getDifficultyColor(course.difficulty)} text-white`}>
                    {course.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-4'>
              <p className='text-sm text-gray-300'>{course.description}</p>

              {/* Course Stats */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Users className='h-4 w-4 text-blue-400' />
                  <div>
                    <p className='text-sm text-gray-400'>Students</p>
                    <p className='text-white font-medium'>{course.students.toLocaleString()}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Clock className='h-4 w-4 text-green-400' />
                  <div>
                    <p className='text-sm text-gray-400'>Duration</p>
                    <p className='text-white font-medium'>{course.duration}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Star className='h-4 w-4 text-yellow-400' />
                  <div>
                    <p className='text-sm text-gray-400'>Rating</p>
                    <p className='text-white font-medium'>{course.rating}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-green-400 font-bold'>${course.price}</span>
                  <div>
                    <p className='text-sm text-gray-400'>Price</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center justify-between pt-4 border-t border-gray-600'>
                <span className='text-sm text-gray-400'>
                  Created: {new Date(course.createdAt).toLocaleDateString()}
                </span>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-gray-600 text-gray-300 hover:bg-gray-700'
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    Preview
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-gray-600 text-gray-300 hover:bg-gray-700'
                  >
                    <Edit className='h-4 w-4 mr-2' />
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-red-600 text-red-400 hover:bg-red-900'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm'>
          <CardContent className='p-12 text-center'>
            <BookOpen className='w-16 h-16 mx-auto mb-4 text-gray-600' />
            <h3 className='text-xl font-semibold text-white mb-2'>No courses found</h3>
            <p className='text-gray-400 mb-4'>
              {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first course'}
            </p>
            <Button
              onClick={() => {
                setIsCreateDialogOpen(true);
              }}
              className='bg-green-600 hover:bg-green-700'
            >
              <Plus className='h-4 w-4 mr-2' />
              Create Course
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseManagement;
