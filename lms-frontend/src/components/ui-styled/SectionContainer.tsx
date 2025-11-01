import React from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'gradient' | 'white';
  withOverlay?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl';
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  className,
  variant = 'light',
  withOverlay = false,
  maxWidth = '7xl',
}) => {
  const variantStyles = {
    light: 'bg-gradient-to-br from-slate-50 via-white to-blue-50',
    dark: 'bg-gradient-to-br from-slate-900 via-gray-900 to-black',
    gradient: 'bg-gradient-to-br from-white via-blue-50 to-purple-50',
    white: 'bg-white',
  };

  const maxWidthStyles = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '7xl': 'max-w-7xl',
  };

  return (
    <section className={cn('py-24 px-4 relative', variantStyles[variant], className)}>
      {withOverlay && variant === 'dark' && (
        <>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
        </>
      )}
      <div className={cn('mx-auto relative z-10', maxWidthStyles[maxWidth])}>{children}</div>
    </section>
  );
};

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'gradient';
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className, variant = 'light' }) => {
  const variantStyles = {
    light: 'bg-gradient-to-br from-slate-50 via-white to-blue-50',
    dark: 'bg-gradient-to-br from-slate-900 via-gray-900 to-black',
    gradient: 'bg-gradient-to-br from-white via-blue-50 to-purple-50',
  };

  return <div className={cn('min-h-screen', variantStyles[variant], className)}>{children}</div>;
};
