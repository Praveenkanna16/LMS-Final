import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download, Plus, X } from 'lucide-react';

interface UploadFormData {
  title: string;
  description: string;
  notes: string;
  batchId: string;
  quality: string;
  isPublic: boolean;
}

const SimpleVideoUpload: React.FC = () => {
  // Video list
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Batches
  const [batches, setBatches] = useState<any[]>([]);

  // Upload form
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    notes: '',
    batchId: '',
    quality: '720p',
    isPublic: false,
  });

  // Load batches and videos on mount
  useEffect(() => {
    fetchBatches();
    fetchVideos();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await apiService.getMyTeacherBatches();
      if (response?.data) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.getContentLibrary();
      if (response?.data?.content) {
        setVideos(response.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file');
      return;
    }

    // Validate file size (max 2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setUploadError('File size must be less than 2GB');
      return;
    }

    setSelectedFile(file);
    setFormData(prev => ({
      ...prev,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
    }));
    setUploadError(null);
    setShowModal(true);
  };

  // Handle form input change
  const handleFormChange = (
    field: keyof UploadFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setUploadError('No file selected');
      return;
    }

    if (!formData.title.trim()) {
      setUploadError('Title is required');
      return;
    }

    if (!formData.batchId) {
      setUploadError('Please select a batch');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('notes', formData.notes);
      form.append('quality', formData.quality);
      form.append('isPublic', String(formData.isPublic));
      form.append('batchId', formData.batchId);

      console.log('📤 Uploading:', {
        file: selectedFile.name,
        title: formData.title,
        batch: formData.batchId,
      });

      const result: any = await apiService.uploadContent(form);

      if (result?.success) {
        alert('✅ Video uploaded successfully!');
        setShowModal(false);
        setSelectedFile(null);
        setFormData({
          title: '',
          description: '',
          notes: '',
          batchId: '',
          quality: '720p',
          isPublic: false,
        });
        setUploadProgress(0);
        await fetchVideos();
      } else {
        setUploadError(result?.message || 'Upload failed');
      }
    } catch (error: any) {
      setUploadError(error?.message || 'Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    if (!uploading) {
      setShowModal(false);
      setSelectedFile(null);
      setUploadError(null);
      setUploadProgress(0);
      setFormData({
        title: '',
        description: '',
        notes: '',
        batchId: '',
        quality: '720p',
        isPublic: false,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4'>
      <div className='max-w-6xl mx-auto space-y-8'>
        {/* Header */}
        <Card className='bg-gradient-to-r from-red-500 to-pink-500 border-0 text-white overflow-hidden'>
          <CardContent className='p-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-4xl font-bold flex items-center gap-3'>
                  <Video className='w-10 h-10' />
                  Video Library
                </h1>
                <p className='text-red-100 mt-2'>Upload and manage your recorded classes</p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size='lg'
                className='bg-white text-red-500 hover:bg-red-50'
              >
                <Plus className='w-5 h-5 mr-2' />
                Upload Video
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='video/*'
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className='grid grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-bold text-purple-600'>{videos.length}</div>
              <div className='text-sm text-gray-600 mt-1'>Total Videos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-bold text-blue-600'>0</div>
              <div className='text-sm text-gray-600 mt-1'>Total Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-bold text-green-600'>0%</div>
              <div className='text-sm text-gray-600 mt-1'>Avg Engagement</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-bold text-orange-600'>0m</div>
              <div className='text-sm text-gray-600 mt-1'>Watch Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Video List */}
        <Card>
          <CardHeader>
            <CardTitle>My Videos</CardTitle>
            <CardDescription>{videos.length} video(s) uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='text-center py-12'>
                <div className='text-gray-500'>Loading videos...</div>
              </div>
            ) : videos.length === 0 ? (
              <div className='text-center py-12'>
                <div className='text-gray-500 mb-2'>No videos yet</div>
                <div className='text-sm text-gray-400'>
                  Click "Upload Video" to add your first recorded class
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {videos.map((video) => (
                  <div key={video.id} className='border rounded-lg overflow-hidden hover:shadow-lg transition'>
                    <div className='bg-gray-200 h-40 flex items-center justify-center'>
                      <Play className='w-12 h-12 text-gray-400' />
                    </div>
                    <div className='p-4'>
                      <h3 className='font-semibold text-gray-900'>{video.title}</h3>
                      <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                        {video.description}
                      </p>
                      <div className='flex gap-2 mt-4'>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Play className='w-4 h-4 mr-1' />
                          Watch
                        </Button>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Download className='w-4 h-4 mr-1' />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-2xl max-h-[90vh] overflow-auto'>
            <CardHeader className='border-b flex flex-row items-center justify-between space-y-0'>
              <div>
                <CardTitle>Upload Video</CardTitle>
                <CardDescription>Fill in the details for your video</CardDescription>
              </div>
              <button
                onClick={closeModal}
                disabled={uploading}
                className='p-2 hover:bg-gray-100 rounded-full disabled:opacity-50'
              >
                <X className='w-5 h-5' />
              </button>
            </CardHeader>

            <form onSubmit={handleUpload} className='space-y-0'>
              <CardContent className='space-y-6 pt-6'>
                {/* File info */}
                {selectedFile && (
                  <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-sm text-gray-600'>Selected File:</p>
                    <p className='font-semibold text-gray-900'>{selectedFile.name}</p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                {/* Upload progress */}
                {uploading && (
                  <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-sm font-semibold text-blue-900 mb-2'>Uploading...</p>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className='text-xs text-blue-600 mt-1'>{uploadProgress}%</p>
                  </div>
                )}

                {/* Error message */}
                {uploadError && (
                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                    <p className='text-sm text-red-700'>{uploadError}</p>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    disabled={uploading}
                    placeholder='Enter video title'
                    className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                  />
                </div>

                {/* Description */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    disabled={uploading}
                    placeholder='What is this video about?'
                    rows={3}
                    className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Notes for Students
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    disabled={uploading}
                    placeholder='Any additional notes or resources'
                    rows={3}
                    className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                  />
                </div>

                {/* Batch Selection */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Select Batch <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => handleFormChange('batchId', e.target.value)}
                    disabled={uploading}
                    className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                  >
                    <option value=''>-- Select a Batch --</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    This video will be visible to students in this batch
                  </p>
                </div>

                {/* Quality and Public */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Quality
                    </label>
                    <select
                      value={formData.quality}
                      onChange={(e) => handleFormChange('quality', e.target.value)}
                      disabled={uploading}
                      className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                    >
                      <option value='360p'>360p</option>
                      <option value='480p'>480p</option>
                      <option value='720p'>720p (Recommended)</option>
                      <option value='1080p'>1080p</option>
                    </select>
                  </div>

                  <div>
                    <label className='flex items-center h-full pt-6'>
                      <input
                        type='checkbox'
                        checked={formData.isPublic}
                        onChange={(e) => handleFormChange('isPublic', e.target.checked)}
                        disabled={uploading}
                        className='w-4 h-4 rounded'
                      />
                      <span className='ml-2 text-sm font-medium text-gray-700'>
                        Make Public
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>

              {/* Footer */}
              <div className='border-t bg-gray-50 p-6 flex gap-3'>
                <Button
                  type='button'
                  onClick={closeModal}
                  disabled={uploading}
                  variant='outline'
                  className='flex-1'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={uploading || !formData.title.trim() || !formData.batchId}
                  className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                >
                  {uploading ? '📤 Uploading...' : '✅ Upload Video'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

const Video = ({ className }: { className?: string }) => (
  <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
  </svg>
);

export default SimpleVideoUpload;
