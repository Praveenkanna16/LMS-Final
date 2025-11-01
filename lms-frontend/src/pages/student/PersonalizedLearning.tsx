import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  ArrowRight,
  Award,
  Zap,
  Brain,
  Sparkles,
  Users,
} from 'lucide-react';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalCourses: number;
  completedCourses: number;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  courses: Course[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  duration: string;
  completed: boolean;
}

const PersonalizedLearning: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);

  // Fetch personalized learning paths from API
  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await apiService.getPersonalizedLearningPaths();
        // setLearningPaths(response.data || response);

        // Temporary empty array until API is implemented
        setLearningPaths([]);
      } catch (error) {
        console.error('Failed to load learning paths:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPaths();
  }, []);

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

  if (loading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading personalized learning paths...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Background with gradient matching dashboard */}
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorative elements */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          {/* Header matching dashboard style */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl rotate-12 animate-bounce opacity-20' />
            <div className='absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-bounce delay-300 opacity-20' />

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 relative overflow-hidden'>
                {/* Animated background pattern */}
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute top-0 left-0 w-full h-full'>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className='absolute bg-white rounded-full'
                        style={{
                          width: `${Math.random() * 100 + 50}px`,
                          height: `${Math.random() * 100 + 50}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className='relative z-10'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <Sparkles className='w-6 h-6 text-white' />
                    </div>
                    <Badge className='bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1'>
                      AI-Powered
                    </Badge>
                  </div>
                  <h1 className='text-4xl font-bold text-white mb-2'>
                    Personalized Learning 🎯
                  </h1>
                  <p className='text-blue-100 text-lg mb-6'>
                    AI-powered learning paths tailored to your goals and progress
                  </p>
                  <div className='flex items-center gap-4 flex-wrap'>
                    <Button
                      size='lg'
                      className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                      onClick={() => navigate('/student/batches')}
                    >
                      <Users className='w-5 h-5 mr-2' />
                      Browse Batches
                    </Button>
                    <Button
                      size='lg'
                      variant='outline'
                      className='border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm'
                      onClick={() => navigate('/courses')}
                    >
                      <Target className='w-5 h-5 mr-2' />
                      Explore Courses
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {learningPaths.length > 0 ? (
            <div className='space-y-8'>
            {learningPaths.map(path => (
              <Card
                key={path.id}
                className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300'
              >
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 pb-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center'>
                        <Target className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                          {path.title}
                        </CardTitle>
                        <CardDescription className='text-gray-600'>
                          {path.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge className={`${getDifficultyColor(path.difficulty)} text-white`}>
                        {path.difficulty}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='border-purple-200 bg-purple-50 text-purple-700'
                      >
                        {path.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className='p-6 space-y-6'>
                  {/* Progress Overview */}
                  <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200/50'>
                    <div className='flex justify-between items-center mb-3'>
                      <span className='text-sm font-medium text-gray-700'>Overall Progress</span>
                      <span className='text-sm text-gray-600'>
                        {path.completedCourses}/{path.totalCourses} courses • {path.progress}%
                      </span>
                    </div>
                    <Progress value={path.progress} className='h-3' />
                    <div className='flex justify-between items-center mt-2 text-sm text-gray-600'>
                      <span>{path.estimatedTime} estimated</span>
                      <span className='font-medium text-blue-600'>Continue learning</span>
                    </div>
                  </div>

                  {/* Course List */}
                  <div className='space-y-4'>
                    <h4 className='text-lg font-semibold text-gray-900'>Courses in this path</h4>
                    {path.courses.map((course, index) => (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                          course.completed
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className='flex items-center space-x-4'>
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              course.completed
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                : 'bg-gradient-to-br from-blue-500 to-purple-500'
                            }`}
                          >
                            {course.completed ? (
                              <CheckCircle className='w-5 h-5 text-white' />
                            ) : (
                              <span className='text-white font-bold'>{index + 1}</span>
                            )}
                          </div>
                          <div className='flex-1'>
                            <h5
                              className={`font-medium ${course.completed ? 'text-green-700' : 'text-gray-900'}`}
                            >
                              {course.title}
                            </h5>
                            <p className='text-sm text-gray-600'>{course.description}</p>
                            <div className='flex items-center space-x-4 mt-2'>
                              <div className='flex items-center space-x-1 text-xs text-gray-500'>
                                <Clock className='w-3 h-3' />
                                <span>{course.duration}</span>
                              </div>
                              {!course.completed && (
                                <div className='flex items-center space-x-1 text-xs text-blue-600'>
                                  <TrendingUp className='w-3 h-3' />
                                  <span>{course.progress}% complete</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center space-x-2'>
                          {course.completed ? (
                            <Badge className='bg-gradient-to-r from-green-500 to-emerald-500 text-white'>
                              <Award className='w-3 h-3 mr-1' />
                              Completed
                            </Badge>
                          ) : (
                            <Button
                              size='sm'
                              className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                            >
                              {course.progress > 0 ? 'Continue' : 'Start'}
                              <ArrowRight className='w-4 h-4 ml-1' />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                    <div className='flex items-center space-x-4 text-sm text-gray-600'>
                      <span className='font-medium'>{path.totalCourses} courses</span>
                      <span>•</span>
                      <span>{path.estimatedTime}</span>
                      <span>•</span>
                      <div className='flex items-center space-x-1'>
                        <Star className='w-4 h-4 text-yellow-500 fill-yellow-500' />
                        <span className='font-medium'>4.8 rating</span>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      className='border-2 border-blue-200 text-blue-600 hover:bg-blue-50'
                    >
                      View Full Path
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='text-center pt-12'>
              <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse'>
                <Brain className='h-10 w-10 text-white' />
              </div>
              <CardTitle className='text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                No Personalized Learning Paths Yet
              </CardTitle>
              <CardDescription className='text-gray-600 mt-2'>
                Complete some courses and assessments to get AI-powered learning recommendations
                tailored to your goals.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6 pb-12'>
              <p className='text-gray-600 text-center max-w-2xl mx-auto'>
                Our AI system analyzes your learning patterns, preferences, and progress to create
                personalized learning paths just for you.
              </p>
              <div className='flex justify-center gap-4'>
                <Button
                  size='lg'
                  className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                  onClick={() => navigate('/student/batches')}
                >
                  <BookOpen className='w-4 h-4 mr-2' />
                  Browse Batches
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-2 border-blue-200 text-blue-600 hover:bg-blue-50'
                  onClick={() => navigate('/courses')}
                >
                  <Target className='w-4 h-4 mr-2' />
                  Explore Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
          <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center animate-pulse'>
                <Sparkles className='w-5 h-5 text-white' />
              </div>
              <div>
                <CardTitle className='text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'>
                  Discover More Learning Options
                </CardTitle>
                <CardDescription>Explore different types of learning experiences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <button
                onClick={() => navigate('/student/recorded-content')}
                className='flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200/50 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
              >
                <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                  <Zap className='w-6 h-6 text-white' />
                </div>
                <span className='font-semibold text-gray-900'>Recorded Content</span>
                <span className='text-sm text-gray-600 text-center'>
                  Watch pre-recorded lectures
                </span>
              </button>

              <button
                onClick={() => navigate('/courses')}
                className='flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200/50 hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
              >
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                  <BookOpen className='w-6 h-6 text-white' />
                </div>
                <span className='font-semibold text-gray-900'>Course Catalog</span>
                <span className='text-sm text-gray-600 text-center'>
                  Browse all available courses
                </span>
              </button>

              <button
                onClick={() => navigate('/student/assessments')}
                className='flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
              >
                <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                  <Target className='w-6 h-6 text-white' />
                </div>
                <span className='font-semibold text-gray-900'>Assessments</span>
                <span className='text-sm text-gray-600 text-center'>Test your knowledge</span>
              </button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PersonalizedLearning;
