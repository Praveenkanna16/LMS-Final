import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QrCode, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Batch {
  id: string;
  name: string;
}

interface QRCodeData {
  token: string;
  qrCodeImage: string;
  batchId: string;
  batchName: string;
  expiresAt: string;
  expiresIn: number;
}

interface ApiResponse {
  success: boolean;
  data?: QRCodeData;
  message?: string;
}

interface QRAttendanceGeneratorProps {
  batches: Batch[];
}

export const QRAttendanceGenerator: React.FC<QRAttendanceGeneratorProps> = ({ batches }) => {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [duration, setDuration] = useState<number>(300); // 5 minutes default
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { toast } = useToast();

  React.useEffect(() => {
    if (qrData && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setQrData(null);
            toast({
              title: 'QR Code Expired',
              description: 'Please generate a new QR code',
              variant: 'destructive',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [qrData, timeRemaining, toast]);

  const generateQRCode = async () => {
    if (!selectedBatch) {
      toast({
        title: 'Error',
        description: 'Please select a batch',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const requestBody = {
        batchId: selectedBatch,
        expiresIn: duration,
      };

      const response = await fetch('/api/attendance/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = (await response.json()) as ApiResponse;

      if (result.success && result.data) {
        setQrData(result.data);
        setTimeRemaining(duration);
        toast({
          title: 'Success',
          description: 'QR code generated successfully',
        });
      } else {
        throw new Error(result.message ?? 'Failed to generate QR code');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <QrCode className='w-5 h-5' />
          QR Code Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {!qrData ? (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Select Batch</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder='Choose a batch' />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>QR Code Validity</label>
              <Select
                value={duration.toString()}
                onValueChange={val => setDuration(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='180'>3 minutes</SelectItem>
                  <SelectItem value='300'>5 minutes</SelectItem>
                  <SelectItem value='600'>10 minutes</SelectItem>
                  <SelectItem value='900'>15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateQRCode}
              disabled={isGenerating || !selectedBatch}
              className='w-full'
            >
              {isGenerating ? (
                <>
                  <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className='w-4 h-4 mr-2' />
                  Generate QR Code
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='w-5 h-5 text-green-600' />
                <div>
                  <p className='font-semibold text-green-900'>{qrData.batchName}</p>
                  <p className='text-sm text-green-700'>QR Code Active</p>
                </div>
              </div>
              <Badge variant='outline' className='flex items-center gap-1'>
                <Clock className='w-3 h-3' />
                {formatTime(timeRemaining)}
              </Badge>
            </div>

            <div className='flex justify-center p-8 bg-white rounded-lg border-2 border-gray-200'>
              <img
                src={qrData.qrCodeImage}
                alt='Attendance QR Code'
                className='w-64 h-64'
              />
            </div>

            <div className='text-center text-sm text-gray-600'>
              <p>Students can scan this QR code to mark their attendance</p>
              <p className='mt-1'>Code expires in {formatTime(timeRemaining)}</p>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={() => setQrData(null)}
                variant='outline'
                className='flex-1'
              >
                Close
              </Button>
              <Button
                onClick={generateQRCode}
                className='flex-1'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                Generate New
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
