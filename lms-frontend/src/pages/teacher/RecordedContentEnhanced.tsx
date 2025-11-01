import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Video,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  Share2,
  Clock,
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  Maximize,
  Edit,
  CheckCircle,
  AlertCircle as AlertIcon,
} from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';
import { useToast } from '@/hooks/use-toast';

interface RecordedContent {
  id: string;
  title: string;
  description: string;
  batchName: string;
  courseTitle: string;
  duration: number;
  uploadDate: string;
  views: number;
  avgWatchTime: number;
  engagement: number;
  videoUrl: string;
  thumbnail?: string;
  status: 'published' | 'draft' | 'processing';
}

interface ContentStats {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  avgEngagement: number;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

const RecordedContentEnhanced: React.FC = () => {
  const { toast } = useToast();
  const user = sessionManager.getUser();

  const [content, setContent] = useState<RecordedContent[]>([]);
  const [stats, setStats] = useState<ContentStats>({
    totalVideos: 0,
    totalViews: 0,
    totalWatchTime: 0,
    avgEngagement: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'processing'>('all');
  const [selectedContent, setSelectedContent] = useState<RecordedContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch recorded content
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('genzed_token') || '';

        // Fetch content
        const contentRes = await fetch('/api/teacher/recorded-content', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (contentRes.ok) {
          const data = await contentRes.json();
          setContent(data.data || []);
        }

        // Fetch stats
        const statsRes = await fetch('/api/teacher/content-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recorded content',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 500MB',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('video', file);

    try {
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });

      const token = localStorage.getItem('genzed_token') || '';
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) =>
            prev ? { ...prev, progress: percentComplete } : null
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploadProgress({
            fileName: file.name,
            progress: 100,
            status: 'completed',
          });

          toast({
            title: 'Success',
            description: 'Video uploaded and processing started',
          });

          setTimeout(() => {
            setUploadProgress(null);
            setShowUploadModal(false);
            window.location.reload();
          }, 2000);
        }
      });

      xhr.addEventListener('error', () => {
        setUploadProgress({
          fileName: file.name,
          progress: 0,
          status: 'failed',
        });

        toast({
          title: 'Upload failed',
          description: 'Failed to upload video',
          variant: 'destructive',
        });
      });

      xhr.open('POST', '/api/teacher/upload-video');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload video',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const token = localStorage.getItem('genzed_token') || '';
        const res = await fetch(`/api/teacher/recorded-content/${contentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setContent((prev) => prev.filter((c) => c.id !== contentId));
          toast({
            title: 'Success',
            description: 'Video deleted successfully',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete video',
          variant: 'destructive',
        });
      }
    }
  };

  const handleShare = (content: RecordedContent) => {
    const shareUrl = `${window.location.origin}/watch/${content.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Copied',
      description: 'Share link copied to clipboard',
    });
  };

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6'>
        <div className='max-w-7xl mx-auto space-y-8'>
          {/* Header */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-3xl rotate-12 animate-bounce opacity-20' />
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 p-8'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <Video className='w-7 h-7 text-white' />
                    </div>
                    <div>
                      <h1 className='text-4xl font-bold text-white mb-2'>Video Library 🎥</h1>
                      <p className='text-red-100'>Upload and manage your recorded classes</p>
                    </div>
                  </div>
                  <Button
                    className='bg-white text-red-600 hover:bg-red-50 shadow-lg'
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className='w-5 h-5 mr-2' />
                    Upload Video
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-purple-600 text-sm font-semibold'>Total Videos</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>{stats.totalVideos}</p>
                  </div>
                  <div className='w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center'>
                    <Video className='w-6 h-6 text-purple-600' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-blue-600 text-sm font-semibold'>Total Views</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>
                      {stats.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                    <Eye className='w-6 h-6 text-blue-600' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-green-600 text-sm font-semibold'>Avg Engagement</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>{(stats.avgEngagement || 0).toFixed(1)}%</p>
                  </div>
                  <div className='w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center'>
                    <TrendingUp className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-orange-600 text-sm font-semibold'>Watch Time</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>
                      {formatDuration(stats.totalWatchTime)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center'>
                    <Clock className='w-6 h-6 text-orange-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Grid */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <Video className='w-5 h-5 text-white' />
                  </div>
                  <CardTitle className='text-xl bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent'>
                    My Videos
                  </CardTitle>
                </div>
              </div>

              {/* Search and Filter */}
              <div className='flex gap-2 flex-col sm:flex-row'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search videos...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as 'all' | 'published' | 'draft' | 'processing')
                  }
                  className='px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
                >
                  <option value='all'>All Status</option>
                  <option value='published'>Published</option>
                  <option value='draft'>Draft</option>
                  <option value='processing'>Processing</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className='p-6'>
              {filteredContent.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {filteredContent.map((video) => (
                    <div
                      key={video.id}
                      className='group rounded-2xl overflow-hidden border border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-300 bg-white'
                    >
                      {/* Thumbnail */}
                      <div className='relative h-40 bg-gray-900 overflow-hidden'>
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900'>
                            <Video className='w-12 h-12 text-gray-400' />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className='absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100'>
                          <button
                            onClick={() => {
                              setSelectedContent(video);
                              setShowPreview(true);
                            }}
                            className='w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all'
                          >
                            <Play className='w-6 h-6 text-white ml-1' fill='currentColor' />
                          </button>
                        </div>

                        {/* Duration Badge */}
                        <div className='absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold'>
                          {formatDuration(video.duration)}
                        </div>

                        {/* Status Badge */}
                        <div className='absolute top-2 left-2'>
                          <Badge
                            className={
                              video.status === 'published'
                                ? 'bg-green-500/80'
                                : video.status === 'draft'
                                  ? 'bg-gray-500/80'
                                  : 'bg-blue-500/80'
                            }
                          >
                            {video.status === 'processing' ? (
                              <span className='flex items-center gap-1'>
                                <div className='w-2 h-2 bg-white rounded-full animate-pulse' />
                                Processing
                              </span>
                            ) : (
                              video.status.charAt(0).toUpperCase() + video.status.slice(1)
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className='p-4 space-y-3'>
                        <div>
                          <h4 className='font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2'>
                            {video.title}
                          </h4>
                          <p className='text-xs text-gray-600 mt-1 line-clamp-1'>{video.batchName}</p>
                        </div>

                        {/* Stats */}
                        <div className='grid grid-cols-3 gap-2 pt-2 border-t border-gray-100'>
                          <div className='text-center'>
                            <Eye className='w-4 h-4 text-blue-500 mx-auto mb-1' />
                            <p className='text-xs font-semibold text-gray-900'>{video.views}</p>
                            <p className='text-xs text-gray-600'>Views</p>
                          </div>
                          <div className='text-center'>
                            <Clock className='w-4 h-4 text-purple-500 mx-auto mb-1' />
                            <p className='text-xs font-semibold text-gray-900'>
                              {(video.avgWatchTime || 0).toFixed(0)}%
                            </p>
                            <p className='text-xs text-gray-600'>Watched</p>
                          </div>
                          <div className='text-center'>
                            <TrendingUp className='w-4 h-4 text-green-500 mx-auto mb-1' />
                            <p className='text-xs font-semibold text-gray-900'>
                              {(video.engagement || 0).toFixed(1)}%
                            </p>
                            <p className='text-xs text-gray-600'>Engagement</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className='flex gap-2 pt-3'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1'
                            onClick={() => handleShare(video)}
                          >
                            <Share2 className='w-4 h-4 mr-1' />
                            Share
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='hover:bg-red-50 hover:text-red-600'
                            onClick={() => handleDelete(video.id)}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <AlertCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-600 font-semibold mb-2'>No videos found</p>
                  <p className='text-sm text-gray-500'>Upload your first video to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='w-full max-w-md shadow-2xl rounded-3xl'>
              <CardHeader className='bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-3xl'>
                <CardTitle className='text-2xl'>Upload Video</CardTitle>
                <CardDescription className='text-red-100'>
                  Share your recorded class with students
                </CardDescription>
              </CardHeader>
              <CardContent className='p-6 space-y-4'>
                {!uploadProgress ? (
                  <>
                    <div className='border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer'>
                      <input
                        type='file'
                        accept='video/*'
                        onChange={handleFileUpload}
                        className='hidden'
                        id='video-upload'
                      />
                      <label htmlFor='video-upload' className='cursor-pointer block'>
                        <Video className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                        <p className='text-sm font-semibold text-gray-700'>Click to upload</p>
                        <p className='text-xs text-gray-500'>or drag and drop</p>
                        <p className='text-xs text-gray-400 mt-2'>MP4, WebM • up to 500MB</p>
                      </label>
                    </div>
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <p className='text-sm text-blue-800'>
                        💡 Videos will be automatically processed and made available to your students
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      className='w-full'
                      onClick={() => setShowUploadModal(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className='space-y-3'>
                      <p className='font-semibold text-gray-900'>{uploadProgress.fileName}</p>
                      <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                        <div
                          className='bg-gradient-to-r from-red-500 to-pink-600 h-full transition-all'
                          style={{ width: `${uploadProgress.progress}%` }}
                        />
                      </div>
                      <p className='text-sm text-gray-600 text-center'>{uploadProgress.progress}%</p>
                    </div>
                    <div className='bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2'>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                      <p className='text-sm text-green-700'>{uploadProgress.status}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Video Preview Modal */}
        {showPreview && selectedContent && (
          <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50'>
            <div className='w-full max-w-4xl'>
              <button
                onClick={() => setShowPreview(false)}
                className='absolute top-4 right-4 text-white hover:text-red-400 transition-colors'
              >
                ✕
              </button>
              <video
                src={selectedContent.videoUrl}
                controls
                autoPlay
                className='w-full rounded-2xl'
              />
              <div className='mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-white'>
                <h3 className='text-xl font-bold'>{selectedContent.title}</h3>
                <p className='text-gray-300 mt-2'>{selectedContent.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default RecordedContentEnhanced;
