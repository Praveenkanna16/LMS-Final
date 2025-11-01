import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Search,
  Filter,
  Star,
  Clock,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  PlayCircle,
  Heart,
  Eye,
  Loader2,
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { Course } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CartButton, WishlistButton } from '@/components/CartWishlistButtons';
import PaymentButton from '@/components/payment/PaymentButton';

const Courses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCourses();
      // Handle both array response and object with data property
      const coursesData = Array.isArray(response) ? response : (response?.data || []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Development', 'Data Science', 'Design', 'Business'];
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.studentsEnrolled - a.studentsEnrolled;
      case 'rating':
        return b.rating - a.rating;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-500 to-green-500 rounded-b-3xl p-8 mb-8'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-white mb-4'>Course Catalog</h1>
          <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
            Discover thousands of courses from expert instructors and advance your career
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='px-8 mb-8'>
        <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
          <CardContent className='p-6'>
            <div className='flex flex-col lg:flex-row gap-4 items-center'>
              {/* Search */}
              <div className='relative flex-1 w-full'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  placeholder='Search courses, topics, or instructors...'
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                  }}
                  className='pl-10'
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className='w-full lg:w-48'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className='w-full lg:w-48'>
                  <SelectValue placeholder='Level' />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level === 'all'
                        ? 'All Levels'
                        : level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className='w-full lg:w-48'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='popular'>Most Popular</SelectItem>
                  <SelectItem value='rating'>Highest Rated</SelectItem>
                  <SelectItem value='newest'>Newest</SelectItem>
                  <SelectItem value='price-low'>Price: Low to High</SelectItem>
                  <SelectItem value='price-high'>Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Header */}
      <div className='px-8 mb-6'>
        <div className='flex items-center justify-between'>
          <p className='text-muted-foreground'>
            Showing {sortedCourses.length} of {courses.length} courses
          </p>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Filter className='h-4 w-4 mr-2' />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className='px-8 pb-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {sortedCourses.map(course => (
            <Card
              key={course._id}
              className='group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden'
            >
              <div className='relative'>
                <img
                  src={course.media?.thumbnail || 'https://picsum.photos/300/200?random=1'}
                  alt={course.title}
                  className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                <WishlistButton
                  courseId={course._id}
                  className='absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                />
                {course.price === 0 && (
                  <Badge className='absolute top-2 left-2 bg-green-500 text-white'>FREE</Badge>
                )}
              </div>

              <CardContent className='p-6'>
                <div className='mb-3'>
                  <h3 className='font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors'>
                    {course.title}
                  </h3>
                  <p className='text-sm text-muted-foreground line-clamp-2 mb-3'>
                    {course.description}
                  </p>
                </div>

                <div className='flex items-center gap-2 mb-3'>
                  <img
                    src={
                      course.teacher?.profile?.avatar ||
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher'
                    }
                    alt={course.teacher?.name || 'Teacher'}
                    className='w-6 h-6 rounded-full'
                  />
                  <span className='text-sm text-muted-foreground'>
                    {course.teacher?.name || 'Teacher'}
                  </span>
                </div>

                <div className='flex items-center gap-4 text-sm text-muted-foreground mb-3'>
                  <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                    <span>{course.rating || 0}</span>
                    <span>(0)</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Users className='h-4 w-4' />
                    <span>{course.studentsEnrolled?.toLocaleString() || 0}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Clock className='h-4 w-4' />
                    <span>
                      {formatDuration(typeof course.duration === 'number' ? course.duration : 0)}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between gap-2'>
                  <div className='text-2xl font-bold'>
                    {course.price === 0 ? 'Free' : `₹${course.price}`}
                  </div>
                  <div className='flex gap-2'>
                    {/* Direct Payment Button - Only for paid courses */}
                    {course.price > 0 && (
                      <PaymentButton
                        courseId={typeof course.id === 'string' ? parseInt(course.id) : course.id}
                        amount={course.price}
                        buttonText='Enroll'
                        className='flex-1'
                      />
                    )}
                    {/* Cart Button */}
                    <CartButton
                      courseId={course.id}
                      className='bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedCourses.length === 0 && (
          <div className='text-center py-12'>
            <BookOpen className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No courses found</h3>
            <p className='text-muted-foreground'>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
