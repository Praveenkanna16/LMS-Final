import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  FileVideo,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Eye,
  Download,
  Play,
  Upload,
  Trash2,
  FileText,
  HardDrive,
  Calendar,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description: string;
  courseId: number;
  course: { id: number; title: string; category: string; } | null;
  batchId: number;
  batch: { id: number; name: string; } | null;
  teacherId: number;
  teacher: { id: number; name: string; email: string; } | null;
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

const ContentLibraryNew: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch content
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content-library', statusFilter, searchTerm],
    queryFn: () => apiService.getContentLibrary({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
    }),
    refetchInterval: 30000,
  });

  const content: Content[] = data?.data?.content || [];
  const stats: Stats = data?.data?.stats || {
    total: 0,
    available: 0,
    processing: 0,
    failed: 0,
    totalViews: 0,
    totalDownloads: 0,
    publicContent: 0,
    totalStorage: 0,
    avgFileSize: 0,
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => apiService.uploadContent(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
      toast({ title: 'Success', description: 'Content uploaded successfully' });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadIsPublic(false);
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
      toast({ title: 'Success', description: 'Content approved successfully' });
      setApproveDialogOpen(false);
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
      toast({ title: 'Success', description: 'Content rejected' });
      setRejectDialogOpen(false);
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
      toast({ title: 'Success', description: 'Content deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.response?.data?.message || 'Failed to delete content',
      });
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
    formData.append('isPublic', String(uploadIsPublic));

    uploadMutation.mutate(formData);
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
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Available
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading content library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Content</h3>
            <p className="text-gray-600 mb-4">Failed to load content library. Please try again.</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated background patterns */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>
      
      {/* Floating decorative elements */}
      <div className='absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-float'>
        <FileVideo className="w-8 h-8 text-white" />
      </div>
      <div className='absolute bottom-20 right-10 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-float-delayed'>
        <Upload className="w-6 h-6 text-white" />
      </div>
      
      {/* Header */}
      <div className="relative px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                <FileVideo className='w-8 h-8 text-white' />
              </div>
              <div>
                <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                  Content Management
                </Badge>
                <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                  Content Library
                </h1>
                <p className='text-gray-600 mt-2 text-lg'>
                  Upload, manage, and track educational content with ease
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Content</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <FileVideo className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.publicContent} public</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.available}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.processing} processing</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.totalDownloads.toLocaleString()} downloads</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <HardDrive className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{formatFileSize(stats.totalStorage)}</div>
                <p className="text-xs text-gray-500 mt-1">Avg: {formatFileSize(stats.avgFileSize)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by title, teacher, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white border-gray-300">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ready">Available</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Table */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <CardContent className="pt-6">
              {content.length === 0 ? (
                <div className="text-center py-12">
                  <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Found</h3>
                  <p className="text-gray-600 mb-4">Start by uploading your first educational content.</p>
                  <Button
                    onClick={() => setUploadDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Content
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                              {item.format === 'pdf' ? (
                                <FileText className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Play className="w-5 h-5 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              {item.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                              )}
                              {item.isPublic && (
                                <Badge variant="outline" className="mt-1 text-xs">Public</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{item.teacher?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">{item.format}</Badge>
                          {item.quality && <p className="text-xs text-gray-500 mt-1">{item.quality}</p>}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-700">{formatFileSize(item.fileSize)}</p>
                          {item.duration > 0 && (
                            <p className="text-xs text-gray-500">{formatDuration(item.duration)}</p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Eye className="w-3 h-3" />
                              <span>{item.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Download className="w-3 h-3" />
                              <span>{item.downloads.toLocaleString()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
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
                                    setApproveDialogOpen(true);
                                  }}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedContent(item);
                                    setRejectDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                                setDetailsDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Delete "${item.title}"?`)) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Upload Content</DialogTitle>
            <DialogDescription>
              Upload a video or PDF file for your course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                accept="video/*,.pdf"
                onChange={handleFileChange}
                className="mt-1"
              />
              {uploadFile && (
                <p className="text-sm text-gray-500 mt-1">
                  {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter content title"
                className="mt-1 bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Enter description (optional)"
                className="mt-1 bg-white text-gray-900 placeholder:text-gray-400"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="public"
                checked={uploadIsPublic}
                onCheckedChange={(checked) => setUploadIsPublic(checked as boolean)}
              />
              <Label htmlFor="public" className="text-sm font-normal">
                Make this content publicly accessible
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadTitle || uploadMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Approve Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this content?
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="py-4">
              <p className="font-medium">{selectedContent.title}</p>
              <p className="text-sm text-gray-500">by {selectedContent.teacher?.name}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedContent && approveMutation.mutate(selectedContent.id)}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this content
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <p className="font-medium">{selectedContent.title}</p>
              <div>
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason (min 10 characters)"
                  className="mt-1"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length} / 500 characters
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedContent && rejectMutation.mutate({ contentId: selectedContent.id, reason: rejectionReason })}
              disabled={rejectionReason.length < 10 || rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Title</Label>
                  <p className="font-medium">{selectedContent.title}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedContent.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Course</Label>
                  <p className="font-medium">{selectedContent.course?.title || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Teacher</Label>
                  <p className="font-medium">{selectedContent.teacher?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedContent.teacher?.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Format & Size</Label>
                  <p className="font-medium">{selectedContent.format.toUpperCase()} - {formatFileSize(selectedContent.fileSize)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Duration</Label>
                  <p className="font-medium">{selectedContent.duration > 0 ? formatDuration(selectedContent.duration) : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Views</Label>
                  <p className="font-medium">{selectedContent.views.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Downloads</Label>
                  <p className="font-medium">{selectedContent.downloads.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Visibility</Label>
                  <p className="font-medium">{selectedContent.isPublic ? 'Public' : 'Private'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Uploaded</Label>
                  <p className="font-medium">{new Date(selectedContent.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {selectedContent.description && (
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <p className="mt-1">{selectedContent.description}</p>
                </div>
              )}
              {selectedContent.tags && selectedContent.tags.length > 0 && (
                <div>
                  <Label className="text-gray-500">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedContent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedContent.status === 'failed' && selectedContent.metadata?.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <Label className="text-red-700 font-semibold">Rejection Reason</Label>
                  <p className="text-red-600 mt-1">{selectedContent.metadata.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentLibraryNew;
