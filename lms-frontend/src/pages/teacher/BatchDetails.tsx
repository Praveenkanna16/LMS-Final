import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar, BookOpen, TrendingUp } from 'lucide-react';

const BatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <Button
          variant='outline'
          onClick={() => {
            navigate('/teacher/batches');
          }}
          className='mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Batches
        </Button>

        <div className='bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Batch Details</h1>
              <p className='text-purple-100 text-lg'>Detailed view for batch {id}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className='border-0 shadow-xl bg-white'>
        <CardContent className='text-center py-12'>
          <BookOpen className='w-16 h-16 mx-auto mb-4 text-gray-400' />
          <h3 className='text-xl font-semibold mb-2'>Batch Details Coming Soon</h3>
          <p className='text-gray-600 mb-6'>
            Detailed batch management and student progress tracking will be available here.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto'>
            <div className='p-4 bg-purple-50 rounded-lg'>
              <Users className='h-8 w-8 mx-auto mb-2 text-purple-600' />
              <p className='text-sm text-gray-600'>Student Management</p>
            </div>
            <div className='p-4 bg-blue-50 rounded-lg'>
              <Calendar className='h-8 w-8 mx-auto mb-2 text-blue-600' />
              <p className='text-sm text-gray-600'>Schedule Management</p>
            </div>
            <div className='p-4 bg-green-50 rounded-lg'>
              <TrendingUp className='h-8 w-8 mx-auto mb-2 text-green-600' />
              <p className='text-sm text-gray-600'>Progress Analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchDetails;
