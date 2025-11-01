import React, { useState, useRef } from 'react';
import * as tus from 'tus-js-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Pause, Play, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChunkedUploaderProps {
  onUploadComplete: (fileUrl: string) => void;
  onCancel?: () => void;
}

export const ChunkedUploader: React.FC<ChunkedUploaderProps> = ({
  onUploadComplete,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'paused' | 'completed' | 'error'>('idle');
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s');
  const [timeRemaining, setTimeRemaining] = useState('Calculating...');
  const uploadRef = useRef<tus.Upload | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadProgress(0);
      setUploadStatus('idle');
    }
  };

  const startUpload = () => {
    if (!file) return;

    const upload = new tus.Upload(file, {
      endpoint: `${import.meta.env.VITE_API_URL}/api/videos/upload/chunk`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      metadata: {
        filename: file.name,
        filetype: file.type,
        token: localStorage.getItem('token') || ''
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      onError: (error) => {
        console.error('Upload failed:', error);
        setUploadStatus('error');
        toast({
          title: 'Upload Failed',
          description: error.message,
          variant: 'destructive'
        });
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = (bytesUploaded / bytesTotal) * 100;
        setUploadProgress(percentage);

        const speed = (bytesUploaded / 1024 / 1024).toFixed(2);
        setUploadSpeed(`${speed} MB/s`);

        const remaining = ((bytesTotal - bytesUploaded) / (bytesUploaded / 1)).toFixed(0);
        setTimeRemaining(`${remaining}s`);
      },
      onSuccess: () => {
        setUploadStatus('completed');
        toast({
          title: 'Upload Complete',
          description: 'Video uploaded successfully'
        });
        if (upload.url) {
          onUploadComplete(upload.url);
        }
      }
    });

    uploadRef.current = upload;
    upload.start();
    setUploadStatus('uploading');
  };

  const pauseUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setUploadStatus('paused');
    }
  };

  const resumeUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.start();
      setUploadStatus('uploading');
    }
  };

  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort(true);
    }
    setFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    if (onCancel) onCancel();
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Upload className='w-5 h-5' />
          Chunked Video Upload
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!file ? (
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'>
            <Upload className='w-12 h-12 mx-auto mb-4 text-gray-400' />
            <p className='text-gray-600 mb-4'>Select a video file to upload</p>
            <input
              type='file'
              accept='video/*'
              onChange={handleFileSelect}
              className='hidden'
              id='video-upload'
            />
            <label htmlFor='video-upload'>
              <Button as Child>
                <span>Select File</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
              <div>
                <p className='font-medium'>{file.name}</p>
                <p className='text-sm text-gray-500'>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {uploadStatus === 'completed' && (
                <CheckCircle className='w-6 h-6 text-green-600' />
              )}
            </div>

            {uploadStatus !== 'idle' && uploadStatus !== 'completed' && (
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Progress: {uploadProgress.toFixed(1)}%</span>
                  <span>{uploadSpeed}</span>
                </div>
                <Progress value={uploadProgress} />
                <div className='flex justify-between text-xs text-gray-500'>
                  <span>Time remaining: {timeRemaining}</span>
                  <span>Chunk size: 5 MB</span>
                </div>
              </div>
            )}

            <div className='flex gap-2'>
              {uploadStatus === 'idle' && (
                <>
                  <Button onClick={startUpload} className='flex-1'>
                    <Upload className='w-4 h-4 mr-2' />
                    Start Upload
                  </Button>
                  <Button onClick={cancelUpload} variant='outline'>
                    <X className='w-4 h-4' />
                  </Button>
                </>
              )}

              {uploadStatus === 'uploading' && (
                <>
                  <Button onClick={pauseUpload} variant='secondary' className='flex-1'>
                    <Pause className='w-4 h-4 mr-2' />
                    Pause
                  </Button>
                  <Button onClick={cancelUpload} variant='destructive'>
                    <X className='w-4 h-4' />
                  </Button>
                </>
              )}

              {uploadStatus === 'paused' && (
                <>
                  <Button onClick={resumeUpload} className='flex-1'>
                    <Play className='w-4 h-4 mr-2' />
                    Resume
                  </Button>
                  <Button onClick={cancelUpload} variant='destructive'>
                    <X className='w-4 h-4' />
                  </Button>
                </>
              )}

              {uploadStatus === 'completed' && (
                <Button onClick={() => setFile(null)} className='w-full'>
                  Upload Another File
                </Button>
              )}

              {uploadStatus === 'error' && (
                <>
                  <Button onClick={startUpload} variant='secondary' className='flex-1'>
                    Retry Upload
                  </Button>
                  <Button onClick={cancelUpload} variant='destructive'>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
