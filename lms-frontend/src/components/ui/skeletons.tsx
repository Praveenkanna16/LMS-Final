import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Header Skeleton */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <Skeleton className='w-16 h-16 rounded-3xl' />
            <div className='space-y-2'>
              <Skeleton className='w-32 h-6' />
              <Skeleton className='w-80 h-8' />
              <Skeleton className='w-64 h-5' />
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <Skeleton className='w-32 h-12' />
            <Skeleton className='w-32 h-12' />
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='p-6 bg-white rounded-2xl shadow-lg'>
            <div className='flex items-center justify-between mb-4'>
              <Skeleton className='w-24 h-5' />
              <Skeleton className='w-12 h-12 rounded-2xl' />
            </div>
            <Skeleton className='w-16 h-8 mb-2' />
            <Skeleton className='w-32 h-4' />
            <div className='flex items-center mt-3'>
              <Skeleton className='w-4 h-4 mr-2' />
              <Skeleton className='w-20 h-3' />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        {/* Left Column */}
        <div className='p-6 bg-white rounded-2xl shadow-xl'>
          <Skeleton className='w-40 h-6 mb-4' />
          <Skeleton className='w-48 h-4 mb-6' />
          <div className='space-y-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='p-4 rounded-2xl border'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <Skeleton className='w-32 h-5 mb-2' />
                    <Skeleton className='w-40 h-4 mb-2' />
                    <div className='flex items-center gap-4'>
                      <Skeleton className='w-16 h-3' />
                      <Skeleton className='w-20 h-3' />
                    </div>
                  </div>
                  <Skeleton className='w-20 h-8' />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className='p-6 bg-white rounded-2xl shadow-xl'>
          <Skeleton className='w-32 h-6 mb-4' />
          <Skeleton className='w-40 h-4 mb-6' />
          <div className='space-y-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='p-4 rounded-2xl border'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <Skeleton className='w-28 h-5 mb-2' />
                    <Skeleton className='w-36 h-4 mb-2' />
                    <div className='flex items-center gap-2'>
                      <Skeleton className='w-6 h-6 rounded-full' />
                      <Skeleton className='w-24 h-3' />
                    </div>
                  </div>
                  <Skeleton className='w-16 h-8' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className='p-6 bg-white rounded-2xl shadow-xl'>
        <Skeleton className='w-32 h-6 mb-4' />
        <Skeleton className='w-48 h-4 mb-6' />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='w-full h-24' />
          ))}
        </div>
      </div>
    </div>
  );
};

export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className='p-6 bg-white rounded-2xl shadow-lg'>
      <div className='flex items-center justify-between mb-4'>
        <Skeleton className='w-24 h-5' />
        <Skeleton className='w-12 h-12 rounded-2xl' />
      </div>
      <Skeleton className='w-16 h-8 mb-2' />
      <Skeleton className='w-32 h-4' />
      <div className='flex items-center mt-3'>
        <Skeleton className='w-4 h-4 mr-2' />
        <Skeleton className='w-20 h-3' />
      </div>
    </div>
  );
};

export const UpcomingClassesSkeleton: React.FC = () => {
  return (
    <div className='p-6 bg-white rounded-2xl shadow-xl'>
      <Skeleton className='w-40 h-6 mb-4' />
      <Skeleton className='w-48 h-4 mb-6' />
      <div className='space-y-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='p-4 rounded-2xl border'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <Skeleton className='w-32 h-5 mb-2' />
                <Skeleton className='w-40 h-4 mb-2' />
                <div className='flex items-center gap-4'>
                  <Skeleton className='w-16 h-3' />
                  <Skeleton className='w-20 h-3' />
                </div>
              </div>
              <Skeleton className='w-20 h-8' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MyBatchesSkeleton: React.FC = () => {
  return (
    <div className='p-6 bg-white rounded-2xl shadow-xl'>
      <Skeleton className='w-32 h-6 mb-4' />
      <Skeleton className='w-40 h-4 mb-6' />
      <div className='space-y-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='p-4 rounded-2xl border'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <Skeleton className='w-28 h-5 mb-2' />
                <Skeleton className='w-36 h-4 mb-2' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='w-6 h-6 rounded-full' />
                  <Skeleton className='w-24 h-3' />
                </div>
              </div>
              <Skeleton className='w-16 h-8' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QuickActionsSkeleton: React.FC = () => {
  return (
    <div className='p-6 bg-white rounded-2xl shadow-xl'>
      <Skeleton className='w-32 h-6 mb-4' />
      <Skeleton className='w-48 h-4 mb-6' />
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='w-full h-24' />
        ))}
      </div>
    </div>
  );
};
