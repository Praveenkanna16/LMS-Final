import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface GradientCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconGradient?: string;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  hover?: boolean;
  decorative?: boolean;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  title,
  description,
  icon: Icon,
  iconGradient = 'from-blue-500 to-purple-500',
  children,
  className,
  headerClassName,
  hover = true,
  decorative = true,
}) => {
  return (
    <Card
      className={cn(
        'group border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden',
        hover && 'hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2',
        className
      )}
    >
      {decorative && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16"></div>
      )}
      
      <CardHeader className={cn('relative z-10', headerClassName)}>
        {Icon && (
          <div className={cn(
            'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg',
            'bg-gradient-to-br',
            iconGradient,
            hover && 'group-hover:shadow-xl transition-all duration-300 group-hover:scale-110'
          )}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        )}
        
        <CardTitle className="text-xl font-bold text-gray-900 mb-3">
          {title}
        </CardTitle>
        
        {description && (
          <CardDescription className="text-gray-600 leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      {children && (
        <CardContent className="relative z-10">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  icon?: LucideIcon;
  iconGradient?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  trend,
  trendPositive,
  icon: Icon,
  iconGradient = 'from-blue-500 to-purple-500',
  className,
}) => {
  return (
    <Card className={cn(
      'group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-gray-200',
      className
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">
              {label}
            </CardTitle>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <p className={cn(
                'text-sm mt-1 font-medium',
                trendPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
              'bg-gradient-to-br',
              iconGradient,
              'group-hover:shadow-xl transition-all'
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient?: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  iconGradient = 'from-blue-500 to-cyan-500',
  className,
}) => {
  return (
    <Card className={cn(
      'group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2',
      'border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center',
      className
    )}>
      <CardHeader className="pb-6">
        <div className={cn(
          'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg',
          'bg-gradient-to-br',
          iconGradient,
          'group-hover:shadow-xl transition-all duration-300 group-hover:scale-110'
        )}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 leading-relaxed text-base">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
