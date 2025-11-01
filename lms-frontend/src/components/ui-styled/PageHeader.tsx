import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { GradientBadge } from './GradientBadge';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    icon?: LucideIcon;
  };
  gradient?: boolean;
  centered?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, gradient = true, centered = false, className, children }) => {
  return (
    <div className={cn('mb-8', centered && 'text-center', className)}>
      {badge && (
        <div className={cn('mb-4', centered && 'flex justify-center')}>
          <GradientBadge icon={badge.icon}>{badge.text}</GradientBadge>
        </div>
      )}

      <h1
        className={cn(
          'text-4xl md:text-5xl font-bold mb-2',
          gradient ? 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent' : 'text-gray-900'
        )}
      >
        {title}
      </h1>

      {subtitle && <p className='text-gray-600 text-lg'>{subtitle}</p>}

      {children && <div className='mt-4'>{children}</div>}
    </div>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    icon?: LucideIcon;
  };
  centered?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, badge, centered = true, className }) => {
  return (
    <div className={cn('mb-16', centered && 'text-center', className)}>
      {badge && (
        <div className={cn('mb-6', centered && 'flex justify-center')}>
          <GradientBadge icon={badge.icon}>{badge.text}</GradientBadge>
        </div>
      )}

      <h2 className='text-5xl md:text-6xl font-bold text-gray-900 mb-6'>
        {title.includes('|') ? (
          <>
            {title.split('|')[0]}
            <span className='block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              {title.split('|')[1]}
            </span>
          </>
        ) : (
          title
        )}
      </h2>

      {subtitle && <p className='text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>{subtitle}</p>}
    </div>
  );
};
