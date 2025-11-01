import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, BookOpen, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Batch {
  id: number;
  name: string;
  subject: string;
  grade: string;
  teacher: string;
  schedule: string;
  maxStudents: number;
  currentStudents: number;
  fee: number;
}

export const BrowseBatches: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/batches`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      const batchesData = data.data || [];
      
      // Transform backend batch data to match interface
      const transformedBatches = batchesData.map((batch: any) => ({
        id: batch.id,
        name: batch.name || 'Batch',
        subject: batch.subject || 'Subject',
        grade: batch.grade || 'Grade',
        teacher: batch.teacher?.name || 'Unknown Teacher',
        schedule: batch.schedule || '',
        maxStudents: batch.studentLimit || 30,
        currentStudents: Array.isArray(batch.students) ? batch.students.length : 0,
        fee: batch.enrollmentFee || 0
      }));
      
      setBatches(transformedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestEnrollment = async (batchId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/batches/${batchId}/enroll-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        toast({
          title: 'Request Sent',
          description: 'Your enrollment request has been sent to the teacher'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send enrollment request',
        variant: 'destructive'
      });
    }
  };

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold mb-2'>Browse Batches</h1>
        <p className='text-gray-600'>Find and join batches that match your interests</p>
      </div>

      <div className='mb-6'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by name, subject, or grade...'
            className='pl-10'
          />
        </div>
      </div>

      {loading ? (
        <div className='text-center py-12'>
          <div className='animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto' />
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredBatches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <CardTitle className='text-lg'>{batch.name}</CardTitle>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <BookOpen className='w-4 h-4' />
                  {batch.subject} • {batch.grade}
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>Teacher:</span>
                  <span className='font-medium'>{batch.teacher}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 flex items-center gap-1'>
                    <Clock className='w-4 h-4' />
                    Schedule:
                  </span>
                  <span className='font-medium'>{batch.schedule}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 flex items-center gap-1'>
                    <Users className='w-4 h-4' />
                    Students:
                  </span>
                  <Badge variant='secondary'>
                    {batch.currentStudents}/{batch.maxStudents}
                  </Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>Fee:</span>
                  <span className='font-bold text-lg'>₹{batch.fee.toLocaleString()}</span>
                </div>
                <Button
                  onClick={() => requestEnrollment(batch.id)}
                  className='w-full'
                  disabled={batch.currentStudents >= batch.maxStudents}
                >
                  {batch.currentStudents >= batch.maxStudents
                    ? 'Batch Full'
                    : 'Request to Join'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
