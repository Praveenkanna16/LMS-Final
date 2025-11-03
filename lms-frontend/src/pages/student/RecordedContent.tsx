import React, { useState } from 'react';
// FIX: Added 'Link' import
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Search,
  Filter,
  Clock,
  Eye,
  Download,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  BookmarkCheck,
  Calendar,
  BookOpen,
  Video,
  FileText,
  Image,
  Music,
  Target,
  Sparkles,
  BarChart3,
  Users,
  TrendingUp,
  PlayCircle,
} from 'lucide-react';

// TypeScript Interfaces
interface User {
  name?: string;
  email?: string;
  role?: string;
  gamification?: {
    level: number;
    experience: number;
    experienceToNext: number;
    levelProgress: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

interface CartContextType {
  cartCount: number;
  wishlistCount: number;
}
// ---------------------------------

const RecordedContent: React.FC = () => {
  const { user } = useAuth() as AuthContextType;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [recordedContent, setRecordedContent] = useState<any[]>([]);

  // Fetch recorded content from API
  React.useEffect(() => {
    const fetchRecordedContent = async () => {
      try {
        setLoading(true);
        // Mock data for demonstration as API is not available
        const mockData = [
          {
            id: '1',
            title: 'Introduction to Quantum Physics',
            description: 'A deep dive into the fundamentals of quantum mechanics, wave-particle duality, and the Heisenberg uncertainty principle.',
            tags: ['Physics', 'Quantum', 'Lecture'],
            category: 'lecture',
            subject: 'Physics',
            thumbnail: 'https://miro.medium.com/1*a8SU5sCdFEBWZzmNPGTr3g.jpeg',
            duration: '45:30',
            teacher: 'Prof. Johnson',
            views: 10200,
            likes: 1200,
            comments: 45,
            uploadDate: '2025-10-20T00:00:00Z',
            transcript: 'Available',
            notes: 'Available',
            isBookmarked: true,
          },
          {
            id: '2',
            title: 'Organic Chemistry: Lab Demo',
            description: 'Watch a step-by-step demonstration of a Grignard reaction, including setup, execution, and safety precautions.',
            tags: ['Chemistry', 'Lab', 'Demo'],
            category: 'lab_demo',
            subject: 'Chemistry',
            thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS45NvbGNudC-Vw9io1HeZ6qxNxTvrHk0FwAg&s',
            duration: '22:15',
            teacher: 'Dr. Wilson',
            views: 5400,
            likes: 600,
            comments: 12,
            uploadDate: '2025-10-18T00:00:00Z',
            transcript: 'Available',
            notes: 'Available',
            isBookmarked: false,
          },
          {
            id: '3',
            title: 'Calculus: Solving Derivatives',
            description: 'A problem-solving session focused on tackling complex derivative problems, including product rule, quotient rule, and chain rule.',
            tags: ['Mathematics', 'Calculus', 'Problem Solving'],
            category: 'problem_solving',
            subject: 'Mathematics',
            thumbnail: 'https://wordsmithofbengal.files.wordpress.com/2021/08/calculus_score-sheet.png',
            duration: '35:00',
            teacher: 'Dr. Smith',
            views: 8900,
            likes: 950,
            comments: 30,
            uploadDate: '2025-10-15T00:00:00Z',
            transcript: 'Available',
            notes: 'Not Available',
            isBookmarked: false,
          },
          {
            id: '4',
            title: 'Shakespeare: Macbeth Analysis',
            description: 'An in-depth lecture on the themes of ambition and guilt in Macbeth, with a close reading of key soliloquies.',
            tags: ['English', 'Literature', 'Lecture'],
            category: 'lecture',
            subject: 'English',
            thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
            duration: '50:10',
            teacher: 'Ms. Davis',
            views: 12000,
            likes: 2100,
            comments: 80,
            uploadDate: '2025-10-12T00:00:00Z',
            transcript: 'Available',
            notes: 'Available',
            isBookmarked: true,
          }
        ];
        
        // Simulating API delay
        setTimeout(() => {
          setRecordedContent(mockData);
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error('Failed to load recorded content:', error);
        setRecordedContent([]); // Set to empty on error
      } 
    };
    fetchRecordedContent();
  }, []);

  const categories = [
    { id: 'all', label: 'All Content', count: recordedContent.length },
    {
      id: 'lecture',
      label: 'Lectures',
      count: recordedContent.filter(c => c.category === 'lecture').length,
    },
    {
      id: 'lab_demo',
      label: 'Lab Demos',
      count: recordedContent.filter(c => c.category === 'lab_demo').length,
    },
    {
      id: 'problem_solving',
      label: 'Problem Solving',
      count: recordedContent.filter(c => c.category === 'problem_solving').length,
    },
  ];

  const subjects = [
    { id: 'all', label: 'All Subjects' },
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'Physics', label: 'Physics' },
    { id: 'Chemistry', label: 'Chemistry' },
    { id: 'English', label: 'English' },
  ];

  const filteredContent = recordedContent.filter(content => {
    const matchesSearch =
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || content.category === selectedCategory;
    const matchesSubject = selectedSubject === 'all' || content.subject === selectedSubject;

    return matchesSearch && matchesCategory && matchesSubject;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lecture':
        return <Video className='w-4 h-4' />;
      case 'lab_demo':
        return <BookOpen className='w-4 h-4' />;
      case 'problem_solving':
        return <FileText className='w-4 h-4' />;
      default:
        return <Video className='w-4 h-4' />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lecture':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'lab_demo':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'problem_solving':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading recorded content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorative elements */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500' />

        {/* Added 'pt-40' for navbar spacing */}
        <div className='relative z-10 max-w-7xl mx-auto px-4 pt-40 pb-16 space-y-8'>
          {/* Header */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl rotate-12 animate-bounce opacity-20' />
            <div className='absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-bounce delay-300 opacity-20' />

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 relative overflow-hidden'>
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
                      Video Library
                    </Badge>
                  </div>
                  <h1 className='text-4xl font-bold text-white mb-2'>Recorded Content 🎥</h1>
                  <p className='text-blue-100 text-lg mb-6'>
                    Access your recorded lectures, lab demos, and study materials
                  </p>
                  <div className='flex items-center gap-4 flex-wrap'>
                    <Button
                      size='lg'
                      className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                      onClick={() => navigate('/student/batches')}
                    >
                      <Users className='w-5 h-5 mr-2' />
                      My Batches
                    </Button>
                    
                    {/* --- THIS IS THE FIX --- */}
                    <Button
                      size='lg'
                      className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                      onClick={() => navigate('/courses')}
                    >
                      <BookOpen className='w-5 h-5 mr-2' />
                      Browse Courses
                    </Button>
                    {/* --- END OF FIX --- */}

                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex flex-col md:flex-row gap-4'>
                <div className='relative flex-1'>
                  <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    placeholder='Search videos, topics, or tags...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-12 py-3 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  />
                </div>

                <div className='flex gap-3'>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className='px-4 py-3 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white'
                  >
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className='px-4 py-3 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white'
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Main Content - Video Grid */}
            <div className='lg:col-span-3'>
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-pulse'>
                        <PlayCircle className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                          Video Library
                        </CardTitle>
                        <CardDescription>
                          {filteredContent.length} video{filteredContent.length !== 1 ? 's' : ''}{' '}
                          found
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className='bg-purple-100 text-purple-700'>
                      {filteredContent.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='p-6'>
                {filteredContent.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {filteredContent.map(video => (
                      <div
                        key={video.id}
                        className='bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02]'
                      >
                        {/* Thumbnail */}
                        <div className='relative group'>
                          <img
                            src={
                              video.thumbnail ||
                              'https://via.placeholder.com/300x200?text=No+Thumbnail'
                            }
                            alt={video.title}
                            className='w-full h-48 object-cover'
                          />
                          <div className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300'>
                            <Button
                              size='sm'
                              variant='secondary'
                              className='bg-white/90 text-gray-900 hover:bg-white shadow-lg'
                            >
                              <PlayCircle className='w-5 h-5 mr-2' />
                              Watch Now
                            </Button>
                          </div>
                          <div className='absolute top-3 right-3'>
                            <Badge
                              variant='outline'
                              className='bg-black/70 text-white border-0 backdrop-blur-sm'
                            >
                              {video.duration || 'N/A'}
                            </Badge>
                          </div>
                          <div className='absolute top-3 left-3'>
                            <Badge
                              className={`${getCategoryColor(video.category)} backdrop-blur-sm`}
                            >
                              {getCategoryIcon(video.category)}
                              <span className='ml-1 capitalize'>
                                {video.category?.replace('_', ' ') || 'N/A'}
                              </span>
                            </Badge>
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className='p-6'>
                          <h3 className='font-bold text-gray-900 mb-2 text-lg'>
                            {video.title || 'Untitled'}
                          </h3>
                          <p className='text-sm text-gray-600 mb-2'>
                            by {video.teacher || 'Unknown Teacher'}
                          </p>
                          <p className='text-sm text-gray-500 mb-4'>
                            {video.description || 'No description available'}
                          </p>

                          {/* Tags */}
                          <div className='flex flex-wrap gap-1 mb-4'>
                            {video.tags?.slice(0, 3).map((tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant='outline'
                                className='text-xs bg-gray-50 text-gray-600 border-gray-200'
                              >
                                {tag}
                              </Badge>
                            )) || []}
                          </div>

                          {/* Stats */}
                          <div className='flex items-center justify-between text-sm text-gray-500 mb-4'>
                            <div className='flex items-center gap-4'>
                              <span className='flex items-center gap-1'>
                                <Eye className='w-4 h-4 text-blue-500' />
                                {video.views?.toLocaleString() || 0}
                              </span>
                              <span className='flex items-center gap-1'>
                                <ThumbsUp className='w-4 h-4 text-green-500' />
                                {video.likes || 0}
                              </span>
                              <span className='flex items-center gap-1'>
                                <MessageSquare className='w-4 h-4 text-purple-500' />
                                {video.comments || 0}
                              </span>
                            </div>
                            <span className='flex items-center gap-1'>
                              <Calendar className='w-4 h-4 text-orange-500' />
                              {video.uploadDate
                                ? new Date(video.uploadDate).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>

                          {/* Additional Resources */}
                          <div className='flex items-center gap-2 mb-4 text-xs'>
                            <span
                              className={`px-3 py-1 rounded-full ${video.transcript === 'Available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              📝 Transcript: {video.transcript || 'Not Available'}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full ${video.notes === 'Available' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              📋 Notes: {video.notes || 'Not Available'}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Button
                                size='sm'
                                className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                              >
                                <PlayCircle className='w-4 h-4 mr-2' />
                                Watch
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                              >
                                <Download className='w-4 h-4 mr-2' />
                                Download
                              </Button>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Button size='icon' variant='ghost'>
                                <Share2 className='w-4 h-4' />
                              </Button>
                              <Button size='icon' variant='ghost'>
                                {video.isBookmarked ? (
                                  <BookmarkCheck className='w-4 h-4 text-purple-600' />
                                ) : (
                                  <Bookmark className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <div className='text-center py-12'>
                      <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                        <PlayCircle className='h-10 w-10 text-gray-400' />
                      </div>
                      <p className='text-gray-900 font-semibold mb-2 text-lg'>No videos found</p>
                      <p className='text-sm text-gray-600 mb-6'>
                        Try adjusting your search or filter criteria.
                      </p>
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                          setSelectedSubject('all');
                        }}
                      >
                        <Search className='w-4 h-4 mr-2' />
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Categories & Quick Stats */}
            <div className='space-y-6'>
              {/* Categories */}
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <Filter className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                        Categories
                      </CardTitle>
                      <CardDescription className='text-xs'>Filter by content type</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='space-y-2'>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                          selectedCategory === category.id
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-300 shadow-md'
                            : 'text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='font-medium'>{category.label}</span>
                          <Badge
                            variant='outline'
                            className={
                              selectedCategory === category.id
                                ? 'bg-white text-blue-600'
                                : 'bg-white'
                            }
                          >
                            {category.count}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <TrendingUp className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                        Study Stats
                      </CardTitle>
                      <CardDescription className='text-xs'>Your learning progress</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='space-y-4'>
                    <div className='text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50'>
                      <div className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1'>
                        {recordedContent.length}
                      </div>
                      <p className='text-sm text-gray-600'>Total Videos</p>
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div className='text-center p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200/50 hover:shadow-md transition-all'>
                        <div className='text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'>
                          {recordedContent.length > 0
                            ? `${Math.floor(
                                recordedContent.reduce(
                                  (acc, video) =>
                                    acc +
                                    (video.duration
                                      ? parseInt(video.duration.split(':')[0]) * 60 +
                                        parseInt(video.duration.split(':')[1])
                                      : 0),
                                  0
                                ) / 3600 // Changed to 3600 for hours
                              )}h`
                            : '0h'}
                        </div>
                        <p className='text-xs text-gray-600'>Watch Time</p>
                      </div>
                      <div className='text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all'>
                        <div className='text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                          {recordedContent.filter(v => v.isBookmarked).length}
                        </div>
                        <p className='text-xs text-gray-600'>Bookmarked</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recently Watched */}
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <Clock className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent'>
                        Recently Watched
                      </CardTitle>
                      <CardDescription className='text-xs'>
                        Continue where you left off
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4'>
                <div className='space-y-3'>
                  {recordedContent.slice(0, 3).map(video => (
                    <div
                      key={video.id}
                      className='bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 border border-orange-100 hover:shadow-md transition-all duration-300'
                    >
                      <div className='flex items-center gap-3'>
                        <img
                          src={video.thumbnail || 'https://via.placeholder.com/48x32?text=No+Image'}
                          alt={video.title}
                          className='w-12 h-8 object-cover rounded-lg'
                        />
                        <div className='flex-1'>
                          <p className='font-medium text-sm text-gray-900 line-clamp-1'>
                            {video.title || 'Untitled'}
                          </p>
                          <p className='text-xs text-gray-500'>{video.duration || 'N/A'}</p>
                        </div>
                        <Button size='icon' variant='ghost'>
                          <PlayCircle className='w-5 h-5' />
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className='text-center py-4'>
                      <p className='text-sm text-gray-500'>No recent videos</p>
                    </div>
                  )}
                </div>
              </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse'>
                  <Target className='w-5 h-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Access your learning tools and resources</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-6'>
              {/* --- FIX #2: Converted <button> to <Link> --- */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <Link
                  to='/student/batches'
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200/50 hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    My Batches
                  </span>
                </Link>

                <Link
                  to='/student/schedule'
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Calendar className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    Schedule
                  </span>
                </Link>

                <Link
                  to='/student/assessments'
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <FileText className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    Assessments
                  </span>
                </Link>

                <Link
                  to='/courses'
                  className='flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200/50 hover:border-orange-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <BookOpen className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-gray-700 text-center'>
                    Browse Courses
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

// --- FIX #3: Removed duplicate export ---
export default RecordedContent;