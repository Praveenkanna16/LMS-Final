import React, { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCourses, useBatches, useAllUsers } from '@/hooks/api';
import {
  Search,
  Eye,
  Download,
  Loader2,
  FileVideo,
  HardDrive,
  EyeOff,
  Video,
  Play,
  Clock,
  Share,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
}

interface Batch {
  id: string;
  name: string;
}

interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface RecordedContent {
  id: string;
  title: string;
  courseId: string;
  course: {
    title: string;
    subject: string;
  };
  batchId: string;
  batch: {
    name: string;
  };
  teacherId: string;
  teacher: {
    name: string;
    email: string;
  };
  duration: number;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl: string;
  recordingDate: Date;
  views: number;
  downloads: number;
  isPublic: boolean;
  status: 'available' | 'processing' | 'failed';
  description?: string;
}

const ContentLibraryManagement: React.FC = () => {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const { data: users, isLoading: usersLoading } = useAllUsers();

  // Ensure we have arrays to work with
  const coursesArray = React.useMemo(
    () => (Array.isArray(courses) ? (courses as Course[]) : []),
    [courses]
  );
  const batchesArray = React.useMemo(
    () => (Array.isArray(batches) ? (batches as Batch[]) : []),
    [batches]
  );
  const usersArray = React.useMemo(() => (Array.isArray(users) ? (users as User[]) : []), [users]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [_selectedContent, _setSelectedContent] = useState<RecordedContent | null>(null);

  // Generate recorded content data
  const recordedContent = React.useMemo(() => {
    if (!coursesArray.length || !batchesArray.length || !usersArray.length) return [];

    const teachers = usersArray.filter(u => u.role === 'teacher');

    return coursesArray.slice(0, 5).flatMap(course =>
      batchesArray.slice(0, 3).map(batch => ({
        id: `rec_${course.id}_${batch.id}`,
        title: `${course.title} - Session ${Math.floor(Math.random() * 10) + 1}`,
        courseId: course.id,
        course: {
          title: course.title,
          subject: course.category,
        },
        batchId: batch.id,
        batch: {
          name: batch.name,
        },
        teacherId: teachers[Math.floor(Math.random() * teachers.length)]?.id ?? '',
        teacher: teachers[Math.floor(Math.random() * teachers.length)] ?? {
          name: 'Unknown',
          email: '',
        },
        duration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        fileSize: Math.floor(Math.random() * 500) + 100, // 100-600 MB
        fileUrl: `https://example.com/recordings/${course.id}/${batch.id}/recording.mp4`,
        thumbnailUrl: `https://example.com/thumbnails/${course.id}/${batch.id}/thumb.jpg`,
        recordingDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        views: Math.floor(Math.random() * 1000) + 100,
        downloads: Math.floor(Math.random() * 200) + 20,
        isPublic: Math.random() > 0.3,
        status: (['available', 'processing', 'failed'] as const)[Math.floor(Math.random() * 3)],
        description: `Live class recording for ${course.title} batch ${batch.name}`,
      }))
    );
  }, [coursesArray, batchesArray, usersArray]);

  // Filter content
  const filteredContent = React.useMemo(() => {
    return recordedContent
      .filter(content => {
        const matchesSearch =
          content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.teacher.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
        const matchesCourse = courseFilter === 'all' || content.courseId === courseFilter;
        return matchesSearch && matchesStatus && matchesCourse;
      })
      .map(content => ({
        ...content,
        formattedDuration: `${Math.floor(content.duration / 60)}h ${content.duration % 60}m`,
        formattedFileSize: `${content.fileSize}MB`,
        formattedDate: content.recordingDate.toLocaleDateString(),
        formattedViews: content.views.toLocaleString(),
        formattedDownloads: content.downloads.toLocaleString(),
      }));
  }, [recordedContent, searchTerm, statusFilter, courseFilter]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = recordedContent.length;
    const available = recordedContent.filter(c => c.status === 'available').length;
    const processing = recordedContent.filter(c => c.status === 'processing').length;
    const failed = recordedContent.filter(c => c.status === 'failed').length;
    const totalViews = recordedContent.reduce((sum, c) => {
      const views = Number(c.views);
      return sum + (isNaN(views) ? 0 : views);
    }, 0);
    const totalDownloads = recordedContent.reduce((sum, c) => {
      const downloads = Number(c.downloads);
      return sum + (isNaN(downloads) ? 0 : downloads);
    }, 0);
    const totalSize = recordedContent.reduce((sum, c) => {
      const size = Number(c.fileSize);
      return sum + (isNaN(size) ? 0 : size);
    }, 0);
    const publicContent = recordedContent.filter(c => c.isPublic).length;

    return {
      total,
      available,
      processing,
      failed,
      totalViews,
      totalDownloads,
      totalSize,
      publicContent,
    };
  }, [recordedContent]);

  const handleToggleVisibility = (contentId: string, currentVisibility: boolean) => {
    // API call to toggle content visibility
    console.warn('Toggling visibility for:', contentId, 'to:', !currentVisibility);
  };

  const handleDownload = (content: RecordedContent) => {
    // API call to download content
    window.open(content.fileUrl, '_blank');
  };

  const isLoading = coursesLoading || batchesLoading || usersLoading;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-blue-400' />
          <p className='text-gray-300'>Loading content library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6'>
      {/* Header */}
      <div className='mb-8'>
        <div className='bg-gradient-to-br from-slate-800 via-purple-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]'></div>
          <div className='flex items-center justify-between relative z-10'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Content Library</h1>
              <p className='text-slate-200 text-lg'>
                Manage recorded classes and educational content
              </p>
            </div>
            <div className='hidden md:block'>
              <div className='w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm'>
                <FileVideo className='w-10 h-10 text-white' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-300 mb-1'>Total Recordings</p>
                <p className='text-3xl font-bold text-white'>{stats.total}</p>
              </div>
              <FileVideo className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-300 mb-1'>Available</p>
                <p className='text-3xl font-bold text-green-400'>{stats.available}</p>
              </div>
              <Play className='w-8 h-8 text-green-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-300 mb-1'>Total Views</p>
                <p className='text-3xl font-bold text-purple-400'>
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <Eye className='w-8 h-8 text-purple-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-300 mb-1'>Downloads</p>
                <p className='text-3xl font-bold text-orange-400'>
                  {stats.totalDownloads.toLocaleString()}
                </p>
              </div>
              <Download className='w-8 h-8 text-orange-400' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Overview */}
      <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm mb-6'>
        <CardHeader>
          <CardTitle className='text-white'>Storage Overview</CardTitle>
          <CardDescription className='text-gray-300'>
            Content storage usage and distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl p-6 border border-blue-700'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-blue-300 mb-1'>Total Storage</p>
                  <p className='text-3xl font-bold text-white'>{stats.totalSize}MB</p>
                </div>
                <HardDrive className='w-8 h-8 text-blue-400' />
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-6 border border-green-700'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-green-300 mb-1'>Public Content</p>
                  <p className='text-3xl font-bold text-white'>{stats.publicContent}</p>
                </div>
                <Share className='w-8 h-8 text-green-400' />
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-6 border border-purple-700'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-purple-300 mb-1'>Avg File Size</p>
                  <p className='text-3xl font-bold text-white'>
                    {Math.round(stats.totalSize / stats.total)}MB
                  </p>
                </div>
                <TrendingUp className='w-8 h-8 text-purple-400' />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm mb-6'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Search by title, course, or teacher...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
                className='pl-10 bg-gray-700 border-gray-600 text-white'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full md:w-48 bg-gray-700 border-gray-600 text-white'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='available'>Available</SelectItem>
                <SelectItem value='processing'>Processing</SelectItem>
                <SelectItem value='failed'>Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className='w-full md:w-48 bg-gray-700 border-gray-600 text-white'>
                <SelectValue placeholder='Filter by course' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Courses</SelectItem>
                {coursesArray.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-white'>Recorded Content</CardTitle>
          <CardDescription className='text-gray-300'>
            Manage all recorded classes and educational videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-gray-700'>
                  <TableHead className='text-gray-300'>Content</TableHead>
                  <TableHead className='text-gray-300'>Course</TableHead>
                  <TableHead className='text-gray-300'>Teacher</TableHead>
                  <TableHead className='text-gray-300'>Duration</TableHead>
                  <TableHead className='text-gray-300'>Size</TableHead>
                  <TableHead className='text-gray-300'>Views</TableHead>
                  <TableHead className='text-gray-300'>Downloads</TableHead>
                  <TableHead className='text-gray-300'>Status</TableHead>
                  <TableHead className='text-gray-300'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map(content => (
                  <TableRow key={content.id} className='border-gray-700'>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center'>
                          <Video className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <p className='font-medium text-white'>{content.title}</p>
                          <p className='text-sm text-gray-400'>Recorded {content.formattedDate}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-medium text-white'>{content.course.title}</p>
                        <p className='text-sm text-gray-400'>{content.batch.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-medium text-white'>{content.teacher.name}</p>
                        <p className='text-sm text-gray-400'>{content.teacher.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-4 h-4 text-gray-400' />
                        <span className='text-white'>{content.formattedDuration}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-white'>{content.formattedFileSize}</div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Eye className='w-4 h-4 text-gray-400' />
                        <span className='text-white'>{content.formattedViews}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Download className='w-4 h-4 text-gray-400' />
                        <span className='text-white'>{content.formattedDownloads}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Badge
                          className={`${
                            content.status === 'available'
                              ? 'bg-green-600'
                              : content.status === 'processing'
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                          } text-white border-0`}
                        >
                          {content.status === 'available' && <Play className='w-3 h-3 mr-1' />}
                          {content.status === 'processing' && <Clock className='w-3 h-3 mr-1' />}
                          {content.status === 'failed' && <AlertCircle className='w-3 h-3 mr-1' />}
                          {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                        </Badge>

                        <Badge
                          className={`${
                            content.isPublic ? 'bg-blue-600' : 'bg-gray-600'
                          } text-white border-0`}
                        >
                          {content.isPublic ? (
                            <>
                              <Share className='w-3 h-3 mr-1' />
                              Public
                            </>
                          ) : (
                            <>
                              <EyeOff className='w-3 h-3 mr-1' />
                              Private
                            </>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='border-gray-600 text-gray-300 hover:bg-gray-700'
                        >
                          <Eye className='w-4 h-4' />
                        </Button>

                        <Button
                          size='sm'
                          variant='outline'
                          className='border-gray-600 text-gray-300 hover:bg-gray-700'
                          onClick={() => {
                            handleDownload(content);
                          }}
                        >
                          <Download className='w-4 h-4' />
                        </Button>

                        {content.status === 'available' && (
                          <Button
                            size='sm'
                            variant='outline'
                            className={`border-gray-600 hover:bg-gray-700 ${
                              content.isPublic ? 'text-red-400' : 'text-green-400'
                            }`}
                            onClick={() => {
                              handleToggleVisibility(content.id, content.isPublic);
                            }}
                          >
                            {content.isPublic ? (
                              <>
                                <EyeOff className='w-4 h-4 mr-1' />
                                Hide
                              </>
                            ) : (
                              <>
                                <Share className='w-4 h-4 mr-1' />
                                Share
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Content Analytics */}
      <Card className='border-0 shadow-xl bg-gray-800/90 backdrop-blur-sm mt-6'>
        <CardHeader>
          <CardTitle className='text-white'>Content Analytics</CardTitle>
          <CardDescription className='text-gray-300'>
            Viewership and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-6 border border-purple-700'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-purple-300 mb-1'>Avg Views per Video</p>
                  <p className='text-3xl font-bold text-white'>
                    {Math.round(stats.totalViews / stats.total)}
                  </p>
                </div>
                <Eye className='w-8 h-8 text-purple-400' />
              </div>
            </div>

            <div className='bg-gradient-to-br from-orange-900/50 to-orange-800/50 rounded-xl p-6 border border-orange-700'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-orange-300 mb-1'>Avg Downloads</p>
                  <p className='text-3xl font-bold text-white'>
                    {Math.round(stats.totalDownloads / stats.total)}
                  </p>
                </div>
                <Download className='w-8 h-8 text-orange-400' />
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-6 border border-green-700'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-green-300 mb-1'>Engagement Rate</p>
                  <p className='text-3xl font-bold text-white'>
                    {Math.round((stats.totalDownloads / stats.totalViews) * 100)}%
                  </p>
                </div>
                <TrendingUp className='w-8 h-8 text-green-400' />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentLibraryManagement;
