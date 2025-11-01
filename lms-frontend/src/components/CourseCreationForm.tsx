import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface CourseCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CourseCreationForm: React.FC<CourseCreationFormProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'Beginner',
    price: 0,
    duration: '',
    thumbnail: '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validate required fields
      if (!formData.title || !formData.description) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      await (
        apiService as unknown as { createCourse: (data: unknown) => Promise<unknown> }
      ).createCourse(formData);

      toast({
        title: 'Success',
        description: 'Course created successfully',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create course');
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
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={onCancel} className='hover:bg-gray-100'>
            <ArrowLeft className='w-4 h-4' />
          </Button>
          <div>
            <CardTitle className='text-2xl font-bold'>Create New Course</CardTitle>
            <CardDescription>Set up a new course to teach students</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
          className='space-y-6'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Course Title */}
            <div className='space-y-2'>
              <Label htmlFor='title'>Course Title *</Label>
              <Input
                id='title'
                placeholder='e.g., Advanced Web Development'
                value={formData.title}
                onChange={e => {
                  handleInputChange('title', e.target.value);
                }}
                required
                className='bg-gray-50 border-gray-200'
              />
            </div>

            {/* Category */}
            <div className='space-y-2'>
              <Label htmlFor='category'>Category</Label>
              <Select
                value={formData.category}
                onValueChange={value => {
                  handleInputChange('category', value);
                }}
              >
                <SelectTrigger className='bg-gray-50 border-gray-200'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Programming'>Programming</SelectItem>
                  <SelectItem value='Web Development'>Web Development</SelectItem>
                  <SelectItem value='Mobile Development'>Mobile Development</SelectItem>
                  <SelectItem value='Data Science'>Data Science</SelectItem>
                  <SelectItem value='Design'>Design</SelectItem>
                  <SelectItem value='Business'>Business</SelectItem>
                  <SelectItem value='Mathematics'>Mathematics</SelectItem>
                  <SelectItem value='Science'>Science</SelectItem>
                  <SelectItem value='Languages'>Languages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className='space-y-2'>
              <Label htmlFor='level'>Level</Label>
              <Select
                value={formData.level}
                onValueChange={value => {
                  handleInputChange('level', value);
                }}
              >
                <SelectTrigger className='bg-gray-50 border-gray-200'>
                  <SelectValue placeholder='Select level' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Beginner'>Beginner</SelectItem>
                  <SelectItem value='Intermediate'>Intermediate</SelectItem>
                  <SelectItem value='Advanced'>Advanced</SelectItem>
                  <SelectItem value='Expert'>Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className='space-y-2'>
              <Label htmlFor='price'>Price (₹) *</Label>
              <Input
                id='price'
                type='number'
                min={0}
                step={100}
                placeholder='Enter course price'
                value={formData.price}
                onChange={e => {
                  handleInputChange('price', parseInt(e.target.value) || 0);
                }}
                className='bg-gray-50 border-gray-200'
              />
              <p className='text-sm text-gray-500'>
                Students will need to pay this amount to access the course
              </p>
            </div>

            {/* Duration */}
            <div className='space-y-2'>
              <Label htmlFor='duration'>Duration (e.g., "4 weeks")</Label>
              <Input
                id='duration'
                placeholder='e.g., 4 weeks, 2 months'
                value={formData.duration}
                onChange={e => {
                  handleInputChange('duration', e.target.value);
                }}
                className='bg-gray-50 border-gray-200'
              />
            </div>

            {/* Thumbnail */}
            <div className='space-y-2'>
              <Label htmlFor='thumbnail'>Thumbnail URL</Label>
              <Input
                id='thumbnail'
                placeholder='https://example.com/thumbnail.jpg'
                value={formData.thumbnail}
                onChange={e => {
                  handleInputChange('thumbnail', e.target.value);
                }}
                className='bg-gray-50 border-gray-200'
              />
            </div>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Course Description *</Label>
            <Textarea
              id='description'
              placeholder='Describe your course, what students will learn, prerequisites, etc.'
              value={formData.description}
              onChange={e => {
                handleInputChange('description', e.target.value);
              }}
              className='bg-gray-50 border-gray-200 min-h-[150px]'
              required
            />
          </div>

          {/* Pricing Info Box */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h4 className='font-semibold text-blue-900 mb-2'>💳 Pricing & Payments</h4>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>
                ✓ Course Price: <strong>₹{formData.price.toLocaleString('en-IN')}</strong>
              </li>
              <li>✓ Students pay this amount to access the course</li>
              <li>
                ✓ Platform takes 40% (₹{Math.round(formData.price * 0.4).toLocaleString('en-IN')}),
                You get 60% (₹{Math.round(formData.price * 0.6).toLocaleString('en-IN')})
              </li>
              <li>✓ Payment processed via Cashfree (secure & instant)</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-4'>
            <Button type='button' variant='outline' onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={loading}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[150px]'
            >
              {loading ? (
                <div className='flex items-center gap-2'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Creating...
                </div>
              ) : (
                'Create Course'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseCreationForm;
