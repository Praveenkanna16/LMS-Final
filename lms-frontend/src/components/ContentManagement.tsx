import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  BookOpen,
  Video,
  FileText,
  Image,
  Upload,
  Download,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Users,
  Star,
  MoreHorizontal,
  Copy,
  Archive,
  Share,
  Settings,
  BarChart3,
  TrendingUp,
  Target,
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'image' | 'quiz' | 'assignment';
  category: string;
  course?: string;
  chapter?: string;
  duration?: number; // in minutes for videos
  size: number; // in MB
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'course-only';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  downloads: number;
  rating: number;
  tags: string[];
  thumbnail?: string;
  url: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  status: 'draft' | 'published' | 'archived';
  students: number;
  totalContent: number;
  completedContent: number;
  createdAt: Date;
  price: number;
  rating: number;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  content: Content[];
  duration: number; // total duration in minutes
}

const ContentManagement: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([
    {
      id: '1',
      title: 'Introduction to React Hooks',
      description: 'Learn the fundamentals of React Hooks and how to use them effectively.',
      type: 'video',
      category: 'Web Development',
      course: 'React Masterclass',
      chapter: 'Getting Started',
      duration: 25,
      size: 150,
      status: 'published',
      visibility: 'course-only',
      createdBy: 'Dr. Sarah Johnson',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      views: 1250,
      downloads: 45,
      rating: 4.8,
      tags: ['react', 'hooks', 'javascript', 'frontend'],
      url: '/content/video/react-hooks-intro.mp4',
    },
    {
      id: '2',
      title: 'React Hooks Cheat Sheet',
      description: 'Quick reference guide for all React hooks with examples.',
      type: 'document',
      category: 'Web Development',
      course: 'React Masterclass',
      chapter: 'Getting Started',
      size: 2,
      status: 'published',
      visibility: 'public',
      createdBy: 'Dr. Sarah Johnson',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      views: 890,
      downloads: 234,
      rating: 4.9,
      tags: ['react', 'hooks', 'cheatsheet', 'reference'],
      url: '/content/docs/react-hooks-cheatsheet.pdf',
    },
  ]);

  const [_courses, _setCourses] = useState<Course[]>([
    {
      id: '1',
      title: 'Complete React Developer Course',
      description: 'Master React from basics to advanced concepts',
      category: 'Web Development',
      instructor: 'Dr. Sarah Johnson',
      status: 'published',
      students: 234,
      totalContent: 45,
      completedContent: 32,
      createdAt: new Date('2024-01-01'),
      price: 8999,
      rating: 4.8,
      chapters: [
        {
          id: '1',
          title: 'Getting Started',
          description: 'Introduction to React and setup',
          order: 1,
          content: [],
          duration: 120,
        },
      ],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [_categoryFilter, _setCategoryFilter] = useState('all');
  const [_sortBy, _setSortBy] = useState('created');
  const [_sortOrder, _setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [_selectedContent, _setSelectedContent] = useState<Content | null>(null);
  const [showCreateContent, setShowCreateContent] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter contents
  const filteredContents = contents.filter(content => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || content.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats calculation
  const stats = {
    totalContent: contents.length,
    publishedContent: contents.filter(c => c.status === 'published').length,
    totalViews: contents.reduce((sum, c) => sum + c.views, 0),
    totalDownloads: contents.reduce((sum, c) => sum + c.downloads, 0),
  };

  const _handleCreateContent = (contentData: Partial<Content>) => {
    const newContent: Content = {
      id: Date.now().toString(),
      title: contentData.title ?? '',
      description: contentData.description ?? '',
      type: contentData.type ?? 'video',
      category: contentData.category ?? '',
      status: contentData.status ?? 'draft',
      visibility: contentData.visibility ?? 'private',
      createdBy: contentData.createdBy ?? 'current-user',
      course: contentData.course ?? '',
      chapter: contentData.chapter ?? '',
      url: contentData.url ?? '',
      duration: contentData.duration ?? 0,
      size: contentData.size ?? 0,
      tags: contentData.tags ?? [],
      thumbnail: contentData.thumbnail,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      downloads: 0,
      rating: 0,
    };
    setContents([...contents, newContent]);
    setShowCreateContent(false);
  };

  const handleDeleteContent = (contentId: string) => {
    setContents(prev => prev.filter(c => c.id !== contentId));
  };

  const handlePublishContent = (contentId: string) => {
    setContents(prev =>
      prev.map(content =>
        content.id === contentId
          ? { ...content, status: 'published' as const, updatedAt: new Date() }
          : content
      )
    );
  };

  const handleArchiveContent = (contentId: string) => {
    setContents(prev =>
      prev.map(content =>
        content.id === contentId
          ? { ...content, status: 'archived' as const, updatedAt: new Date() }
          : content
      )
    );
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className='w-4 h-4' />;
      case 'document':
        return <FileText className='w-4 h-4' />;
      case 'image':
        return <Image className='w-4 h-4' />;
      case 'quiz':
        return <Target className='w-4 h-4' />;
      case 'assignment':
        return <BookOpen className='w-4 h-4' />;
      default:
        return <FileText className='w-4 h-4' />;
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) return `${(sizeInMB * 1024).toFixed(0)} KB`;
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className='min-h-screen bg-gray-50 p-3 sm:p-6'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-6'>
        {/* Header - Mobile optimized */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Content Management</h1>
            <p className='text-sm sm:text-base text-gray-600 hidden sm:block'>
              Manage courses, videos, documents, and learning materials
            </p>
            <p className='text-sm text-gray-600 sm:hidden'>Manage content</p>
          </div>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
            <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
              <DialogTrigger asChild>
                <Button variant='outline' className='text-xs sm:text-sm'>
                  <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                  <span className='hidden sm:inline'>Create Course</span>
                  <span className='sm:hidden'>Course</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Course Title</label>
                      <Input placeholder='Enter course title' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Category</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='web-development'>Web Development</SelectItem>
                          <SelectItem value='mobile-development'>Mobile Development</SelectItem>
                          <SelectItem value='data-science'>Data Science</SelectItem>
                          <SelectItem value='design'>Design</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Description</label>
                    <Textarea placeholder='Enter course description' rows={4} />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Price (₹)</label>
                      <Input type='number' placeholder='Enter price' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Instructor</label>
                      <Input placeholder='Enter instructor name' />
                    </div>
                  </div>
                  <Button className='w-full'>Create Course</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showCreateContent} onOpenChange={setShowCreateContent}>
              <DialogTrigger asChild>
                <Button className='text-xs sm:text-sm'>
                  <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                  <span className='hidden sm:inline'>Add Content</span>
                  <span className='sm:hidden'>Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='w-[95vw] max-w-2xl mx-auto'>
                <DialogHeader>
                  <DialogTitle>Add New Content</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Title</label>
                      <Input placeholder='Enter content title' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='video'>Video</SelectItem>
                          <SelectItem value='document'>Document</SelectItem>
                          <SelectItem value='image'>Image</SelectItem>
                          <SelectItem value='quiz'>Quiz</SelectItem>
                          <SelectItem value='assignment'>Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Description</label>
                    <Textarea placeholder='Enter content description' rows={3} />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Course</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select course' />
                        </SelectTrigger>
                        <SelectContent>
                          {_courses.map((course: Course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Chapter</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select chapter' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='getting-started'>Getting Started</SelectItem>
                          <SelectItem value='advanced'>Advanced Topics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Tags (comma-separated)</label>
                    <Input placeholder='react, javascript, frontend' />
                  </div>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                    <Upload className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                    <p className='text-sm text-gray-600'>
                      Drag and drop files here, or click to browse
                    </p>
                    <Button variant='outline' size='sm' className='mt-2'>
                      Choose File
                    </Button>
                  </div>
                  <div className='flex space-x-2'>
                    <Button className='flex-1'>Upload & Publish</Button>
                    <Button variant='outline' className='flex-1'>
                      Save as Draft
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards - Mobile optimized */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Content</CardTitle>
              <BookOpen className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.totalContent}</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                {stats.publishedContent} published
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>
                {stats.publishedContent} pub
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Views</CardTitle>
              <Eye className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>
                {(stats.totalViews / 1000).toFixed(0)}k
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Content engagement</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Engagement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Downloads</CardTitle>
              <Download className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.totalDownloads}</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Files downloaded</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Files</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Active Courses</CardTitle>
              <Users className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>
                {_courses.filter((c: Course) => c.status === 'published').length}
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Published courses</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Published</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search content by title, description, or tags...'
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                    }}
                    className='pl-10'
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filter by type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='video'>Videos</SelectItem>
                  <SelectItem value='document'>Documents</SelectItem>
                  <SelectItem value='image'>Images</SelectItem>
                  <SelectItem value='quiz'>Quizzes</SelectItem>
                  <SelectItem value='assignment'>Assignments</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='published'>Published</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
              <div className='flex items-center space-x-2'>
                <Button
                  size='sm'
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('grid');
                  }}
                >
                  Grid
                </Button>
                <Button
                  size='sm'
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('list');
                  }}
                >
                  List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue='content' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4 lg:w-fit'>
            <TabsTrigger value='content'>Content Library</TabsTrigger>
            <TabsTrigger value='courses'>Courses</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          {/* Content Library Tab */}
          <TabsContent value='content' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold'>Content Library ({filteredContents.length})</h2>
              <div className='flex items-center space-x-2'>
                <Button variant='outline' size='sm'>
                  <Upload className='w-4 h-4 mr-2' />
                  Bulk Upload
                </Button>
                <Button variant='outline' size='sm'>
                  <Download className='w-4 h-4 mr-2' />
                  Export List
                </Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredContents.map(content => (
                  <Card key={content.id} className='overflow-hidden'>
                    <div className='aspect-video bg-gray-100 flex items-center justify-center'>
                      {content.thumbnail ? (
                        <img
                          src={content.thumbnail}
                          alt={content.title}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='text-center'>
                          {getContentIcon(content.type)}
                          <p className='text-sm text-gray-500 mt-2 capitalize'>{content.type}</p>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <CardTitle className='text-lg line-clamp-2'>{content.title}</CardTitle>
                          <p className='text-sm text-gray-600 mt-1'>
                            {content.course} • {content.chapter}
                          </p>
                        </div>
                        <Badge
                          variant={
                            content.status === 'published'
                              ? 'default'
                              : content.status === 'draft'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {content.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        <p className='text-sm text-gray-600 line-clamp-2'>{content.description}</p>
                        <div className='flex items-center justify-between text-xs text-gray-500'>
                          <span className='flex items-center'>
                            <Eye className='w-3 h-3 mr-1' />
                            {content.views}
                          </span>
                          <span className='flex items-center'>
                            <Download className='w-3 h-3 mr-1' />
                            {content.downloads}
                          </span>
                          <span className='flex items-center'>
                            <Star className='w-3 h-3 mr-1' />
                            {content.rating}
                          </span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='text-xs text-gray-500'>
                            {content.duration && formatDuration(content.duration)} •{' '}
                            {formatFileSize(content.size)}
                          </div>
                          <div className='flex space-x-1'>
                            <Button size='sm' variant='outline'>
                              <Eye className='w-4 h-4 mr-1' />
                              View
                            </Button>
                            <Select>
                              <SelectTrigger className='w-8 h-8 p-0'>
                                <MoreHorizontal className='h-4 w-4' />
                              </SelectTrigger>
                              <SelectContent align='end'>
                                <SelectItem value='edit'>
                                  <Edit className='w-4 h-4 mr-2' />
                                  Edit
                                </SelectItem>
                                <SelectItem value='copy'>
                                  <Copy className='w-4 h-4 mr-2' />
                                  Duplicate
                                </SelectItem>
                                <SelectItem value='share'>
                                  <Share className='w-4 h-4 mr-2' />
                                  Share
                                </SelectItem>
                                {content.status === 'draft' && (
                                  <SelectItem
                                    value='publish'
                                    onClick={() => {
                                      handlePublishContent(content.id);
                                    }}
                                  >
                                    <Play className='w-4 h-4 mr-2' />
                                    Publish
                                  </SelectItem>
                                )}
                                {content.status === 'published' && (
                                  <SelectItem
                                    value='archive'
                                    onClick={() => {
                                      handleArchiveContent(content.id);
                                    }}
                                  >
                                    <Archive className='w-4 h-4 mr-2' />
                                    Archive
                                  </SelectItem>
                                )}
                                <SelectItem
                                  value='delete'
                                  onClick={() => {
                                    handleDeleteContent(content.id);
                                  }}
                                >
                                  <Trash2 className='w-4 h-4 mr-2' />
                                  Delete
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className='flex flex-wrap gap-1'>
                          {content.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant='outline' className='text-xs'>
                              {tag}
                            </Badge>
                          ))}
                          {content.tags.length > 3 && (
                            <Badge variant='outline' className='text-xs'>
                              +{content.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className='p-0'>
                  <div className='space-y-0'>
                    {filteredContents.map((content, index) => (
                      <div
                        key={content.id}
                        className={`flex items-center justify-between p-4 ${index !== filteredContents.length - 1 ? 'border-b' : ''}`}
                      >
                        <div className='flex items-center space-x-4 flex-1'>
                          <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
                            {getContentIcon(content.type)}
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-3'>
                              <h3 className='font-medium'>{content.title}</h3>
                              <Badge
                                variant={
                                  content.status === 'published'
                                    ? 'default'
                                    : content.status === 'draft'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {content.status}
                              </Badge>
                            </div>
                            <p className='text-sm text-gray-600'>
                              {content.course} • {content.chapter}
                            </p>
                            <div className='flex items-center space-x-4 mt-1 text-xs text-gray-500'>
                              <span>{content.type}</span>
                              {content.duration && <span>{formatDuration(content.duration)}</span>}
                              <span>{formatFileSize(content.size)}</span>
                              <span>{content.views} views</span>
                              <span>{content.downloads} downloads</span>
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Button size='sm' variant='outline'>
                            <Eye className='w-4 h-4 mr-1' />
                            View
                          </Button>
                          <Button size='sm' variant='outline'>
                            <Edit className='w-4 h-4 mr-1' />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value='courses' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold'>Courses ({_courses.length})</h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {_courses.map((course: Course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-lg'>{course.title}</CardTitle>
                        <p className='text-sm text-gray-600'>{course.category}</p>
                      </div>
                      <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <p className='text-sm text-gray-600 line-clamp-2'>{course.description}</p>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-500'>Progress</span>
                        <span className='font-medium'>
                          {course.completedContent}/{course.totalContent}
                        </span>
                      </div>
                      <Progress value={(course.completedContent / course.totalContent) * 100} />
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <p className='text-gray-500'>Students</p>
                          <p className='font-medium'>{course.students}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Rating</p>
                          <div className='flex items-center'>
                            <Star className='w-4 h-4 text-yellow-400 mr-1' />
                            <span className='font-medium'>{course.rating}</span>
                          </div>
                        </div>
                        <div>
                          <p className='text-gray-500'>Price</p>
                          <p className='font-medium'>₹{course.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Instructor</p>
                          <p className='font-medium'>{course.instructor}</p>
                        </div>
                      </div>
                      <div className='flex space-x-2'>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Eye className='w-4 h-4 mr-1' />
                          View
                        </Button>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Edit className='w-4 h-4 mr-1' />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value='analytics' className='space-y-6'>
            <h2 className='text-2xl font-bold'>Content Analytics</h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <BarChart3 className='w-5 h-5 mr-2' />
                    Content Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Performance chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <TrendingUp className='w-5 h-5 mr-2' />
                    Engagement Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Engagement chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {contents
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 5)
                      .map((content, index) => (
                        <div key={content.id} className='flex items-center space-x-4'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                            <span className='text-sm font-medium text-blue-600'>{index + 1}</span>
                          </div>
                          <div className='flex-1'>
                            <p className='font-medium text-sm'>{content.title}</p>
                            <p className='text-xs text-gray-500'>{content.course}</p>
                          </div>
                          <div className='text-right'>
                            <p className='font-medium text-sm'>{content.views} views</p>
                            <div className='flex items-center'>
                              <Star className='w-3 h-3 text-yellow-400 mr-1' />
                              <span className='text-xs text-gray-500'>{content.rating}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {['video', 'document', 'image', 'quiz', 'assignment'].map(type => {
                      const count = contents.filter(c => c.type === type).length;
                      const percentage = contents.length > 0 ? (count / contents.length) * 100 : 0;
                      return (
                        <div key={type} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-2'>
                              {getContentIcon(type)}
                              <span className='text-sm capitalize'>{type}</span>
                            </div>
                            <span className='text-sm font-medium'>{count}</span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value='settings' className='space-y-6'>
            <h2 className='text-2xl font-bold'>Content Settings</h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Settings className='w-5 h-5 mr-2' />
                    Upload Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Maximum file size (MB)</label>
                    <Input type='number' defaultValue='500' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Allowed video formats</label>
                    <Input defaultValue='mp4, avi, mov, wmv' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Allowed document formats</label>
                    <Input defaultValue='pdf, doc, docx, ppt, pptx' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Auto-generate thumbnails</p>
                      <p className='text-sm text-gray-500'>For video content</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button>Save Upload Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Storage & CDN</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Storage Provider</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Select storage provider' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='aws-s3'>AWS S3</SelectItem>
                        <SelectItem value='google-cloud'>Google Cloud Storage</SelectItem>
                        <SelectItem value='azure'>Azure Blob Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>CDN Provider</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Select CDN provider' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='cloudflare'>Cloudflare</SelectItem>
                        <SelectItem value='aws-cloudfront'>AWS CloudFront</SelectItem>
                        <SelectItem value='google-cdn'>Google Cloud CDN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Enable compression</p>
                      <p className='text-sm text-gray-500'>Reduce file sizes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button>Save Storage Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Protection</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>DRM Protection</p>
                      <p className='text-sm text-gray-500'>Protect video content</p>
                    </div>
                    <Switch />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Watermarks</p>
                      <p className='text-sm text-gray-500'>Add watermarks to content</p>
                    </div>
                    <Switch />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Download restrictions</p>
                      <p className='text-sm text-gray-500'>Limit content downloads</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button>Save Protection Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Track views</p>
                      <p className='text-sm text-gray-500'>Monitor content views</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Track downloads</p>
                      <p className='text-sm text-gray-500'>Monitor file downloads</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Engagement tracking</p>
                      <p className='text-sm text-gray-500'>Track user engagement</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button>Save Analytics Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentManagement;
