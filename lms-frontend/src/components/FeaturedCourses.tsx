import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Users, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { usePayment } from '@/hooks/usePayment';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/types';

const getRandomGradient = () => {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-violet-500 to-purple-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

export const FeaturedCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { initiateCashfreePayment } = usePayment();
  const { toast } = useToast();

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFeaturedCourses();
      setCourses(response);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load featured courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (course: Course) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to enroll in courses',
      });
      navigate('/auth/login');
      return;
    }

    if (user?.role !== 'student') {
      toast({
        title: 'Access Denied',
        description: 'Only students can enroll in courses',
        variant: 'destructive',
      });
      return;
    }

    setEnrollingCourse(course._id);

    try {
      // Get course details with available batches
      const courseDetails = await apiService.getCourseById(course._id);

      if (!courseDetails.availableBatches || courseDetails.availableBatches.length === 0) {
        toast({
          title: 'No batches available',
          description: 'This course has no available batches at the moment',
          variant: 'destructive',
        });
        return;
      }

      // Use the first available batch
      const batch = courseDetails.availableBatches[0];
      await initiateCashfreePayment(batch._id, 'platform');
    } catch (error: any) {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to start enrollment process',
        variant: 'destructive',
      });
    } finally {
      setEnrollingCourse(null);
    }
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <section className='py-20 px-4 bg-background'>
        <div className='container mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-4xl font-bold mb-4'>Featured Courses</h2>
            <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              Handpicked courses designed by industry experts to accelerate your learning journey
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3].map(i => (
              <Card key={i} className='animate-pulse'>
                <div className='h-2 bg-gray-200' />
                <CardHeader>
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                  <div className='h-3 bg-gray-200 rounded w-full mb-2'></div>
                  <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                </CardHeader>
                <CardContent>
                  <div className='flex gap-4'>
                    <div className='h-3 bg-gray-200 rounded w-20'></div>
                    <div className='h-3 bg-gray-200 rounded w-20'></div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className='h-10 bg-gray-200 rounded w-full'></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='py-20 px-4 bg-background'>
      <div className='container mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold mb-4'>Featured Courses</h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Handpicked courses designed by industry experts to accelerate your learning journey
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {courses.map(course => (
            <Card
              key={course._id}
              className='group overflow-hidden hover:shadow-lg transition-shadow'
            >
              <div className={`h-2 bg-gradient-to-r ${getRandomGradient()}`} />

              <CardHeader>
                <div className='flex justify-between items-start mb-2'>
                  <Badge variant='secondary'>
                    {course.price === 0 ? 'Free' : `₹${course.price}`}
                  </Badge>
                  <div className='flex items-center gap-1 text-sm'>
                    <Star className='w-4 h-4 fill-accent text-accent' />
                    <span className='font-semibold'>{course.rating || '4.8'}</span>
                  </div>
                </div>
                <CardTitle
                  className='group-hover:text-primary transition-colors cursor-pointer'
                  onClick={() => {
                    handleViewCourse(course._id);
                  }}
                >
                  {course.title}
                </CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className='flex gap-4 text-sm text-muted-foreground mb-4'>
                  <div className='flex items-center gap-1'>
                    <Clock className='w-4 h-4' />8 weeks
                  </div>
                  <div className='flex items-center gap-1'>
                    <Users className='w-4 h-4' />
                    {course.studentsEnrolled || 0} students
                  </div>
                </div>

                <div className='text-sm text-muted-foreground'>
                  <p>By {course.teacher?.name || 'Expert Instructor'}</p>
                </div>
              </CardContent>

              <CardFooter className='flex gap-2'>
                <Button
                  className='flex-1'
                  onClick={() => {
                    handleViewCourse(course._id);
                  }}
                  variant='outline'
                >
                  View Details
                </Button>
                <Button
                  className='flex-1'
                  onClick={() => handleEnroll(course)}
                  disabled={enrollingCourse === course._id}
                >
                  {enrollingCourse === course._id ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Processing...
                    </>
                  ) : course.price === 0 ? (
                    'Enroll Free'
                  ) : (
                    'Enroll Now'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
