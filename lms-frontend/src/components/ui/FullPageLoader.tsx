import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='text-center'>
        <div className='relative'>
          <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-600' />
          <div className='absolute inset-0 w-16 h-16 mx-auto mb-6 border-4 border-transparent border-t-blue-600 rounded-full animate-ping'></div>
        </div>
        <h2 className='text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
          {message}
        </h2>
        <p className='text-gray-600'>Please wait while we prepare everything for you...</p>
      </div>
    </div>
  );
};
