import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import CourseCreationForm from '@/components/CourseCreationForm';

const TeacherCourses: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>My Courses</h1>
          <p className='text-gray-600'>Manage your courses and create new ones</p>
        </div>

        {showForm ? (
          <CourseCreationForm
            onSuccess={() => {
              setShowForm(false);
            }}
            onCancel={() => {
              setShowForm(false);
            }}
          />
        ) : (
          <div className='text-center py-12'>
            <div className='w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <BookOpen className='h-12 w-12 text-blue-600' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>No courses yet</h2>
            <p className='text-gray-600 mb-8 max-w-md mx-auto'>
              Create your first course to start building batches and teaching students.
            </p>
            <Button
              onClick={() => {
                setShowForm(true);
              }}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            >
              <Plus className='w-4 h-4 mr-2' />
              Create Your First Course
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherCourses;
