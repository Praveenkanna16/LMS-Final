import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Upload,
  Save,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Video,
  DollarSign,
  Clock,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  subcategory: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  price: string;
  duration: string;
  language: string;
  thumbnail: File | null;
  trailer: File | null;
  tags: string;
  learningObjectives: string;
  prerequisites: string;
  targetAudience: string;
}

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    level: 'All Levels',
    price: '',
    duration: '',
    language: 'English',
    thumbnail: null,
    trailer: null,
    tags: '',
    learningObjectives: '',
    prerequisites: '',
    targetAudience: '',
  });

  const categories = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
    'Economics',
    'History',
    'Geography',
    'Art',
    'Music',
    'Programming',
    'Other',
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTrailerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, trailer: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.category || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('shortDescription', formData.shortDescription);
      submitData.append('category', formData.category);
      submitData.append('subcategory', formData.subcategory);
      submitData.append('level', formData.level);
      submitData.append('price', formData.price);
      submitData.append('duration', formData.duration);
      submitData.append('language', formData.language);

      // Parse and add arrays
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim());
        submitData.append('tags', JSON.stringify(tagsArray));
      }

      if (formData.learningObjectives) {
        const objectives = formData.learningObjectives
          .split('\n')
          .filter(obj => obj.trim())
          .map((obj, index) => ({ objective: obj.trim(), order: index + 1 }));
        submitData.append('learningObjectives', JSON.stringify(objectives));
      }

      if (formData.prerequisites) {
        const prereqs = formData.prerequisites
          .split('\n')
          .filter(pre => pre.trim())
          .map(pre => ({ skill: pre.trim(), isRequired: true }));
        submitData.append('prerequisites', JSON.stringify(prereqs));
      }

      if (formData.targetAudience) {
        const audience = formData.targetAudience.split('\n').filter(aud => aud.trim());
        submitData.append('targetAudience', JSON.stringify(audience));
      }

      // Add files
      if (formData.thumbnail) {
        submitData.append('thumbnail', formData.thumbnail);
      }
      if (formData.trailer) {
        submitData.append('trailer', formData.trailer);
      }

      // Submit to API
      await apiService.createCourse(submitData);

      toast({
        title: 'Success',
        description: 'Course created successfully!',
      });

      navigate('/admin/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <BookOpen className='w-8 h-8 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-5xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <Button
              variant='outline'
              onClick={() => {
                navigate('/admin/courses');
              }}
              className='mb-6 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Courses
            </Button>

            <div className='flex items-center gap-4 mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                <BookOpen className='w-10 h-10 text-white' />
              </div>
              <div>
                <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                  <BookOpen className='w-4 h-4 mr-2' />
                  Course Creation
                </Badge>
                <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                  Add New Course
                </h1>
                <p className='text-xl text-gray-600 mt-2'>
                  Create a comprehensive course with all details
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <FileText className='h-6 w-6 text-blue-600' />
                  Basic Information
                </CardTitle>
                <CardDescription>Core details about the course</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='title' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <BookOpen className='w-4 h-4 text-blue-600' />
                      Course Title *
                    </Label>
                    <Input
                      id='title'
                      name='title'
                      placeholder='e.g., Complete Python Programming Masterclass'
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='shortDescription' className='text-gray-900 font-semibold'>
                      Short Description
                    </Label>
                    <Input
                      id='shortDescription'
                      name='shortDescription'
                      placeholder='Brief one-line description (max 100 characters)'
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      maxLength={100}
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='description' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <FileText className='w-4 h-4 text-blue-600' />
                      Full Description *
                    </Label>
                    <Textarea
                      id='description'
                      name='description'
                      placeholder='Detailed course description, what students will learn...'
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='category' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <Tag className='w-4 h-4 text-blue-600' />
                      Category *
                    </Label>
                    <Select
                      name='category'
                      value={formData.category}
                      onValueChange={value => {
                        handleSelectChange('category', value);
                      }}
                    >
                      <SelectTrigger className='border-2 border-gray-200 bg-white focus:border-blue-500'>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='subcategory' className='text-gray-900 font-semibold'>
                      Subcategory
                    </Label>
                    <Input
                      id='subcategory'
                      name='subcategory'
                      placeholder='e.g., Web Development, Data Science'
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='level' className='text-gray-900 font-semibold'>
                      Difficulty Level *
                    </Label>
                    <Select
                      name='level'
                      value={formData.level}
                      onValueChange={value => {
                        handleSelectChange('level', value as CourseFormData['level']);
                      }}
                    >
                      <SelectTrigger className='border-2 border-gray-200 bg-white focus:border-blue-500'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map(level => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='language' className='text-gray-900 font-semibold'>
                      Language
                    </Label>
                    <Input
                      id='language'
                      name='language'
                      placeholder='e.g., English, Hindi'
                      value={formData.language}
                      onChange={handleInputChange}
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Duration */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <DollarSign className='h-6 w-6 text-green-600' />
                  Pricing & Duration
                </CardTitle>
                <CardDescription>Set course price and duration</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='price' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <DollarSign className='w-4 h-4 text-green-600' />
                      Price (₹) *
                    </Label>
                    <Input
                      id='price'
                      name='price'
                      type='number'
                      placeholder='e.g., 999'
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min='0'
                      step='0.01'
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='duration' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-blue-600' />
                      Duration
                    </Label>
                    <Input
                      id='duration'
                      name='duration'
                      placeholder='e.g., 10 hours, 6 weeks'
                      value={formData.duration}
                      onChange={handleInputChange}
                      className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <Upload className='h-6 w-6 text-purple-600' />
                  Media & Assets
                </CardTitle>
                <CardDescription>Upload course thumbnail and promotional video</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='thumbnail' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <ImageIcon className='w-4 h-4 text-purple-600' />
                      Course Thumbnail
                    </Label>
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors'>
                      {thumbnailPreview ? (
                        <div className='space-y-4'>
                          <img
                            src={thumbnailPreview}
                            alt='Thumbnail preview'
                            className='w-full h-48 object-cover rounded-lg'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => {
                              setThumbnailPreview(null);
                              setFormData(prev => ({ ...prev, thumbnail: null }));
                            }}
                            className='w-full'
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor='thumbnail' className='cursor-pointer'>
                          <ImageIcon className='w-12 h-12 mx-auto text-gray-400 mb-2' />
                          <p className='text-sm text-gray-600 mb-2'>
                            Click to upload thumbnail
                          </p>
                          <p className='text-xs text-gray-400'>PNG, JPG up to 5MB</p>
                          <input
                            id='thumbnail'
                            type='file'
                            accept='image/*'
                            onChange={handleThumbnailChange}
                            className='hidden'
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='trailer' className='text-gray-900 font-semibold flex items-center gap-2'>
                      <Video className='w-4 h-4 text-purple-600' />
                      Course Trailer Video
                    </Label>
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors'>
                      <label htmlFor='trailer' className='cursor-pointer'>
                        <Video className='w-12 h-12 mx-auto text-gray-400 mb-2' />
                        <p className='text-sm text-gray-600 mb-2'>
                          {formData.trailer ? formData.trailer.name : 'Click to upload video'}
                        </p>
                        <p className='text-xs text-gray-400'>MP4, MOV up to 100MB</p>
                        <input
                          id='trailer'
                          type='file'
                          accept='video/*'
                          onChange={handleTrailerChange}
                          className='hidden'
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='tags' className='text-gray-900 font-semibold'>
                    Tags (comma-separated)
                  </Label>
                  <Input
                    id='tags'
                    name='tags'
                    placeholder='e.g., python, programming, web development, beginners'
                    value={formData.tags}
                    onChange={handleInputChange}
                    className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Course Content Details */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
                  <BookOpen className='h-6 w-6 text-blue-600' />
                  Course Content
                </CardTitle>
                <CardDescription>Learning objectives, prerequisites, and target audience</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='learningObjectives' className='text-gray-900 font-semibold'>
                    Learning Objectives (one per line)
                  </Label>
                  <Textarea
                    id='learningObjectives'
                    name='learningObjectives'
                    placeholder={'Master Python fundamentals\nBuild web applications with Flask\nUnderstand OOP concepts'}
                    value={formData.learningObjectives}
                    onChange={handleInputChange}
                    rows={5}
                    className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                  />
                  <p className='text-xs text-gray-500'>
                    Enter each learning objective on a new line
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='prerequisites' className='text-gray-900 font-semibold'>
                    Prerequisites (one per line)
                  </Label>
                  <Textarea
                    id='prerequisites'
                    name='prerequisites'
                    placeholder={'Basic computer skills\nNo prior programming experience needed'}
                    value={formData.prerequisites}
                    onChange={handleInputChange}
                    rows={4}
                    className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='targetAudience' className='text-gray-900 font-semibold'>
                    Target Audience (one per line)
                  </Label>
                  <Textarea
                    id='targetAudience'
                    name='targetAudience'
                    placeholder={'Aspiring programmers\nStudents wanting to learn Python\nCareer switchers'}
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    rows={4}
                    className='border-2 border-gray-200 bg-white focus:border-blue-500 focus:bg-white placeholder:text-gray-500'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <AlertCircle className='w-4 h-4' />
                    <span>* Required fields</span>
                  </div>
                  <div className='flex gap-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        navigate('/admin/courses');
                      }}
                      className='border-2 border-gray-300 hover:border-red-500 hover:bg-red-50'
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={loading}
                      className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl'
                    >
                      {loading ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Creating Course...
                        </>
                      ) : (
                        <>
                          <Save className='w-4 h-4 mr-2' />
                          Create Course
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
