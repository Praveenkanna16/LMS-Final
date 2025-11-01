import type { ReactNode } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export const StudentButton: React.FC<StudentButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  icon,
}) => {
  const baseClasses =
    'transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-blue-500/25',
    secondary:
      'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-green-500/25',
    outline:
      'border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 bg-white',
    ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <Button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className='mr-2'>{icon}</span>}
      {children}
    </Button>
  );
};

export default StudentButton;
