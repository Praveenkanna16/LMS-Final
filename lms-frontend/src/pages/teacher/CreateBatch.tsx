import React from 'react';
import BatchCreationForm from '@/components/BatchCreationForm';

const CreateBatch: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6'>
      <div className='max-w-4xl mx-auto'>
        <BatchCreationForm />
      </div>
    </div>
  );
};

export default CreateBatch;
