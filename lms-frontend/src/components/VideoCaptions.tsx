import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Subtitles, FileText, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface CaptionFile {
  id: number;
  language: string;
  label: string;
  fileName: string;
  url: string;
}

interface VideoCaptionsProps {
  videoId: number;
  existingCaptions?: CaptionFile[];
  onCaptionsUpdate?: (captions: CaptionFile[]) => void;
}

export const VideoCaptions: React.FC<VideoCaptionsProps> = ({
  videoId,
  existingCaptions = [],
  onCaptionsUpdate
}) => {
  const [captions, setCaptions] = useState<CaptionFile[]>(existingCaptions);
  const [uploading, setUploading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [customLabel, setCustomLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'ta', label: 'Tamil' },
    { code: 'te', label: 'Telugu' },
    { code: 'kn', label: 'Kannada' },
    { code: 'ml', label: 'Malayalam' },
    { code: 'bn', label: 'Bengali' }
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['srt', 'vtt', 'sub'].includes(fileExtension || '')) {
      toast.error('Invalid file format. Please upload .srt, .vtt, or .sub files.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('caption', file);
      formData.append('language', selectedLanguage);
      formData.append('label', customLabel || languages.find(l => l.code === selectedLanguage)?.label || 'Unknown');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/videos/${videoId}/captions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload caption');
      }

      const data = await response.json();
      const newCaptions = [...captions, data.caption];
      setCaptions(newCaptions);
      onCaptionsUpdate?.(newCaptions);
      
      toast.success('Caption uploaded successfully!');
      setCustomLabel('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Caption upload error:', error);
      toast.error('Failed to upload caption. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (captionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/videos/${videoId}/captions/${captionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete caption');
      }

      const newCaptions = captions.filter(c => c.id !== captionId);
      setCaptions(newCaptions);
      onCaptionsUpdate?.(newCaptions);
      
      toast.success('Caption deleted successfully!');
    } catch (error) {
      console.error('Caption delete error:', error);
      toast.error('Failed to delete caption. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Subtitles className='h-5 w-5' />
          Video Captions/Subtitles
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Upload Section */}
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder='Select language' />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Custom Label (Optional)</Label>
              <Input
                placeholder='e.g., English (SDH)'
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Caption File (.srt, .vtt, .sub)</Label>
            <div className='flex gap-2'>
              <Input
                ref={fileInputRef}
                type='file'
                accept='.srt,.vtt,.sub'
                onChange={handleFileSelect}
                disabled={uploading}
                className='flex-1'
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant='outline'
              >
                <Upload className='h-4 w-4 mr-2' />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Supported formats: SubRip (.srt), WebVTT (.vtt), MicroDVD (.sub)
            </p>
          </div>
        </div>

        {/* Existing Captions List */}
        {captions.length > 0 && (
          <div className='space-y-2'>
            <Label>Existing Captions</Label>
            <div className='space-y-2'>
              {captions.map(caption => (
                <div
                  key={caption.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <FileText className='h-5 w-5 text-muted-foreground' />
                    <div>
                      <p className='font-medium'>{caption.label}</p>
                      <p className='text-xs text-muted-foreground'>{caption.fileName}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Check className='h-4 w-4 text-green-500' />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(caption.id)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {captions.length === 0 && (
          <div className='text-center p-8 border-2 border-dashed rounded-lg'>
            <Subtitles className='h-12 w-12 mx-auto text-muted-foreground mb-2' />
            <p className='text-muted-foreground'>No captions uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
