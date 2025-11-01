import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'action';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  icon: Icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'font-bold transform hover:scale-105 transition-all duration-300';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-2xl rounded-2xl',
    secondary:
      'border-2 border-gray-600 text-gray-900 hover:bg-gray-100 hover:border-blue-400 shadow-xl rounded-2xl backdrop-blur-sm',
    action:
      'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-xl',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-6 text-xl',
  };

  return (
    <Button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className='flex items-center justify-center'>
          <svg className='animate-spin h-5 w-5 mr-3' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={cn('w-5 h-5', size === 'xl' && 'w-6 h-6', children && 'mr-2')} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={cn('w-5 h-5', size === 'xl' && 'w-6 h-6', children && 'ml-2')} />}
        </>
      )}
    </Button>
  );
};
