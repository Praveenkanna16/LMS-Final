import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
// import { Calendar } from '@/components/ui/calendar';
// Icons reserved for future enhancements

interface BatchCreationFormProps {
  onSuccess?: () => void;
}

const BatchCreationForm: React.FC<BatchCreationFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    studentLimit: 50,
    enrollmentType: 'open',
    enrollmentFee: 0,
    schedule: [], // Will be populated with date/time slots
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      // TODO: implement in apiService with proper types
      await (
        apiService as unknown as { createBatch: (data: unknown) => Promise<unknown> }
      ).createBatch(formData);

      toast({
        title: 'Success',
        description: 'Batch created successfully',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/teacher/batches');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create batch');
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Create New Batch</CardTitle>
        <CardDescription>Set up a new learning batch for your students</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
          className='space-y-6'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Batch Name */}
            <div className='space-y-2'>
              <Label htmlFor='name'>Batch Name</Label>
              <Input
                id='name'
                placeholder='Enter batch name'
                value={formData.name}
                onChange={e => {
                  setFormData({ ...formData, name: e.target.value });
                }}
                required
                className='bg-gray-50 border-gray-200'
              />
            </div>

            {/* Course Selection */}
            <div className='space-y-2'>
              <Label htmlFor='courseId'>Course</Label>
              <Select
                value={formData.courseId}
                onValueChange={value => {
                  setFormData({ ...formData, courseId: value });
                }}
              >
                <SelectTrigger className='bg-gray-50 border-gray-200'>
                  <SelectValue placeholder='Select a course' />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Load courses from API */}
                  <SelectItem value='course-1'>Web Development Fundamentals</SelectItem>
                  <SelectItem value='course-2'>Advanced JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student Limit */}
            <div className='space-y-2'>
              <Label htmlFor='studentLimit'>Student Limit</Label>
              <Input
                id='studentLimit'
                type='number'
                min={1}
                max={100}
                value={formData.studentLimit}
                onChange={e => {
                  setFormData({ ...formData, studentLimit: parseInt(e.target.value) });
                }}
                className='bg-gray-50 border-gray-200'
              />
            </div>

            {/* Enrollment Type */}
            <div className='space-y-2'>
              <Label htmlFor='enrollmentType'>Enrollment Type</Label>
              <Select
                value={formData.enrollmentType}
                onValueChange={value => {
                  setFormData({ ...formData, enrollmentType: value });
                }}
              >
                <SelectTrigger className='bg-gray-50 border-gray-200'>
                  <SelectValue placeholder='Select enrollment type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='open'>Open Enrollment</SelectItem>
                  <SelectItem value='invite_only'>Invite Only</SelectItem>
                  <SelectItem value='approval_required'>Approval Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Enrollment Fee */}
            <div className='space-y-2'>
              <Label htmlFor='enrollmentFee'>Enrollment Fee (₹)</Label>
              <Input
                id='enrollmentFee'
                type='number'
                min={0}
                value={formData.enrollmentFee}
                onChange={e => {
                  setFormData({ ...formData, enrollmentFee: parseInt(e.target.value) });
                }}
                className='bg-gray-50 border-gray-200'
              />
            </div>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Batch Description</Label>
            <Textarea
              id='description'
              placeholder='Enter batch description and additional information'
              value={formData.description}
              onChange={e => {
                setFormData({ ...formData, description: e.target.value });
              }}
              className='bg-gray-50 border-gray-200 min-h-[100px]'
            />
          </div>

          {/* Submit Button */}
          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={loading}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[150px]'
            >
              {loading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin' />
                  Creating...
                </div>
              ) : (
                'Create Batch'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BatchCreationForm;
