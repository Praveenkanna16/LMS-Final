import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface GradientBadgeProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  gradient?: string;
  className?: string;
}

export const GradientBadge: React.FC<GradientBadgeProps> = ({
  children,
  icon: Icon,
  gradient = 'from-blue-600 to-purple-600',
  className,
}) => {
  return (
    <Badge className={cn('bg-gradient-to-r text-white border-0 px-4 py-2', gradient, className)}>
      {Icon && <Icon className='w-4 h-4 mr-2' />}
      {children}
    </Badge>
  );
};

interface IconBadgeProps {
  icon: LucideIcon;
  gradient?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const IconBadge: React.FC<IconBadgeProps> = ({ icon: Icon, gradient = 'from-blue-500 to-purple-500', size = 'md', className }) => {
  const sizeStyles = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const iconSizeStyles = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center shadow-lg',
        'bg-gradient-to-br',
        gradient,
        sizeStyles[size],
        className
      )}
    >
      <Icon className={cn('text-white', iconSizeStyles[size])} />
    </div>
  );
};
