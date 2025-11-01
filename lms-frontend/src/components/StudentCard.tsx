import type { ReactNode } from 'react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  gradientColor?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  icon?: ReactNode;
  className?: string;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  children,
  title,
  description,
  gradientColor = 'blue',
  icon,
  className = '',
}) => {
  const gradientClasses = {
    blue: 'from-blue-500/20 to-purple-500/20',
    green: 'from-green-500/20 to-emerald-500/20',
    purple: 'from-purple-500/20 to-pink-500/20',
    orange: 'from-orange-500/20 to-red-500/20',
    pink: 'from-pink-500/20 to-purple-500/20',
  };

  return (
    <Card
      className={`group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden ${className}`}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradientClasses[gradientColor]} rounded-full -translate-y-12 translate-x-12`}
      ></div>
      {(title || description) && (
        <CardHeader className='relative z-10'>
          {title && (
            <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
              {icon}
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className='text-gray-600'>{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className='relative z-10'>{children}</CardContent>
    </Card>
  );
};

export default StudentCard;
