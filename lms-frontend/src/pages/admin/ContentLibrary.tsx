import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  FileVideo,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Download,
  Play,
  Upload,
  Edit,
  Trash2,
  FileText,
  HardDrive,
  TrendingUp,
  RefreshCcw,
  Calendar,
  User,
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description: string;
  courseId: number;
  course: {
    id: number;
    title: string;
    category: string;
  } | null;
  batchId: number;
  batch: {
    id: number;
    name: string;
  } | null;
  teacherId: number;
  teacher: {
    id: number;
    name: string;
    email: string;
  } | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  fileSize: number;
  format: string;
  quality: string;
  status: 'processing' | 'ready' | 'failed';
  views: number;
  downloads: number;
  isPublic: boolean;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  available: number;
  processing: number;
  failed: number;
  totalViews: number;
  totalDownloads: number;
  publicContent: number;
  totalStorage: number;
  avgFileSize: number;
}

const ContentLibrary: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  
  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Form states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Fetch content
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content-library', statusFilter, courseFilter, searchTerm],
    queryFn: () => apiService.getContentLibrary({ 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      courseId: courseFilter !== 'all' ? courseFilter : undefined,
      search: searchTerm || undefined
    }),
    refetchInterval: 30000,
  });

  const content = data?.data?.content ?? [];
  const stats: Stats = data?.data?.stats ?? {
    total: 0,
    available: 0,
    processing: 0,
    failed: 0,
    totalViews: 0,
    totalDownloads: 0,
    publicContent: 0,
    totalStorage: 0,
    avgFileSize: 0
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => apiService.uploadContent(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
      toast({
        title: 'Success',
        description: 'Content uploaded successfully and is being processed',
      });
      setShowUploadDialog(false);
      resetUploadForm();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.response?.data?.message || 'Failed to upload content',
      });
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (contentId: string) => apiService.approveContent(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
      toast({
        title: 'Success',
        description: 'Content approved successfully',
      });
      setShowApproveDialog(false);
      setSelectedContent(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.response?.data?.message || 'Failed to approve content',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ contentId, reason }: { contentId: string; reason: string }) =>
      apiService.rejectContent(contentId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
      toast({
        title: 'Success',
        description: 'Content rejected',
      });
      setShowRejectDialog(false);
      setSelectedContent(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error.response?.data?.message || 'Failed to reject content',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (contentId: string) => apiService.deleteContent(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
      toast({
        title: 'Success',
        description: 'Content deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.response?.data?.message || 'Failed to delete content',
      });
    },
  });

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCourseId('');
    setUploadIsPublic(false);
  };

  const handleUpload = () => {
    if (!uploadFile || !uploadTitle) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please provide a file and title',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    if (uploadCourseId) formData.append('courseId', uploadCourseId);
    formData.append('isPublic', String(uploadIsPublic));

    uploadMutation.mutate(formData);
  };

  const handleApprove = () => {
    if (selectedContent) {
      approveMutation.mutate(selectedContent.id);
    }
  };

  const handleReject = () => {
    if (selectedContent && rejectionReason.length >= 10) {
      rejectMutation.mutate({ contentId: selectedContent.id, reason: rejectionReason });
    }
  };

  const handleDelete = (content: Content) => {
    if (confirm(`Are you sure you want to delete "${content.title}"?`)) {
      deleteMutation.mutate(content.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Available
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter content on client side for search
  const filteredContent = content.filter((item: Content) => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-red-500/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Error Loading Content</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              {(error as any)?.message || 'Failed to load content library'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FileVideo className="w-10 h-10" />
                Content Library
              </h1>
              <p className="text-purple-100 text-lg">
                Manage recorded lessons and educational materials
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => refetch()}
                variant="secondary"
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <RefreshCcw className="w-5 h-5 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowUploadDialog(true)}
                size="lg"
                className="bg-white text-purple-700 hover:bg-purple-50"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Content
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Content</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <FileVideo className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.publicContent} public
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Available</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.available}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.processing} processing
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Views</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.totalDownloads.toLocaleString()} downloads
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Storage Used</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <HardDrive className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{formatFileSize(stats.totalStorage)}</div>
              <p className="text-xs text-gray-400 mt-1">
                Avg: {formatFileSize(stats.avgFileSize)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by title, teacher, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-gray-900/50 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">All Status</SelectItem>
                  <SelectItem value="ready" className="text-white hover:bg-gray-700">Available</SelectItem>
                  <SelectItem value="processing" className="text-white hover:bg-gray-700">Processing</SelectItem>
                  <SelectItem value="failed" className="text-white hover:bg-gray-700">Failed</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || statusFilter !== 'all' || courseFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCourseFilter('all');
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Table */}
        <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileVideo className="w-5 h-5" />
              Content ({filteredContent.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage all recorded content and educational materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-12">
                <FileVideo className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No content found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Upload your first content to get started'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Content
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Title</TableHead>
                      <TableHead className="text-gray-400">Course/Teacher</TableHead>
                      <TableHead className="text-gray-400">Format</TableHead>
                      <TableHead className="text-gray-400">Size</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Engagement</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item: Content) => (
                      <TableRow key={item.id} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell className="font-medium">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                              {item.format === 'pdf' ? (
                                <FileText className="w-6 h-6 text-purple-400" />
                              ) : (
                                <Play className="w-6 h-6 text-purple-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">{item.title}</div>
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {item.description || 'No description'}
                              </div>
                              {item.isPublic && (
                                <Badge variant="outline" className="mt-1 text-xs">Public</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.course && (
                              <div className="text-white">{item.course.title}</div>
                            )}
                            {item.teacher && (
                              <div className="text-gray-400 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {item.teacher.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase">
                            {item.format}
                          </Badge>
                          {item.quality && item.format !== 'pdf' && (
                            <div className="text-xs text-gray-500 mt-1">{item.quality}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatFileSize(item.fileSize)}
                          {item.duration > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDuration(item.duration)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-400">
                              <Eye className="w-4 h-4" />
                              {item.views}
                            </span>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Download className="w-4 h-4" />
                              {item.downloads}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === 'processing' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedContent(item);
                                    setShowApproveDialog(true);
                                  }}
                                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedContent(item);
                                    setShowRejectDialog(true);
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedContent(item);
                                setShowDetailsDialog(true);
                              }}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Upload New Content
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Upload a video or PDF file to the content library
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="file" className="text-gray-300">File (Video or PDF, max 500MB)</Label>
                <Input
                  id="file"
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,application/pdf"
                  onChange={handleFileChange}
                  className="bg-gray-900 border-gray-700 text-white mt-2"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-400 mt-2">
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter content title"
                  className="bg-gray-900 border-gray-700 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter content description"
                  rows={3}
                  className="bg-gray-900 border-gray-700 text-white mt-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadIsPublic}
                  onChange={(e) => setUploadIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isPublic" className="text-gray-300 cursor-pointer">
                  Make this content publicly accessible
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  resetUploadForm();
                }}
                className="border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadTitle || uploadMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Content
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Approve Content
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to approve this content?
              </DialogDescription>
            </DialogHeader>
            {selectedContent && (
              <div className="py-4">
                <div className="text-sm text-gray-400 mb-2">Title:</div>
                <div className="text-white font-medium mb-4">{selectedContent.title}</div>
                <div className="text-sm text-gray-400 mb-2">Teacher:</div>
                <div className="text-white">{selectedContent.teacher?.name}</div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Content
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Reject Content
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Provide a reason for rejecting this content (min 10 characters)
              </DialogDescription>
            </DialogHeader>
            {selectedContent && (
              <div className="space-y-4 py-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Title:</div>
                  <div className="text-white font-medium">{selectedContent.title}</div>
                </div>
                <div>
                  <Label htmlFor="reason" className="text-gray-300">Rejection Reason *</Label>
                  <Textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                    rows={4}
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {rejectionReason.length} / 500 characters (min 10)
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                className="border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={rejectionReason.length < 10 || rejectMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Content
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-purple-400" />
                Content Details
              </DialogTitle>
            </DialogHeader>
            {selectedContent && (
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Title</div>
                    <div className="text-white font-medium">{selectedContent.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div>{getStatusBadge(selectedContent.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Course</div>
                    <div className="text-white">{selectedContent.course?.title || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Batch</div>
                    <div className="text-white">{selectedContent.batch?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Teacher</div>
                    <div className="text-white">{selectedContent.teacher?.name}</div>
                    <div className="text-xs text-gray-500">{selectedContent.teacher?.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Format & Size</div>
                    <div className="text-white uppercase">{selectedContent.format}</div>
                    <div className="text-xs text-gray-500">{formatFileSize(selectedContent.fileSize)}</div>
                  </div>
                  {selectedContent.duration > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Duration</div>
                      <div className="text-white">{formatDuration(selectedContent.duration)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Quality</div>
                    <div className="text-white">{selectedContent.quality || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Views</div>
                    <div className="text-white">{selectedContent.views.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Downloads</div>
                    <div className="text-white">{selectedContent.downloads.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Visibility</div>
                    <div className="text-white">{selectedContent.isPublic ? 'Public' : 'Private'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Uploaded</div>
                    <div className="text-white">{new Date(selectedContent.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                {selectedContent.description && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Description</div>
                    <div className="text-white text-sm bg-gray-900/50 p-3 rounded-lg">
                      {selectedContent.description}
                    </div>
                  </div>
                )}
                {selectedContent.tags && selectedContent.tags.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedContent.metadata?.rejectionReason && (
                  <div>
                    <div className="text-sm text-red-400 mb-1">Rejection Reason</div>
                    <div className="text-white text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      {selectedContent.metadata.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => setShowDetailsDialog(false)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContentLibrary;
