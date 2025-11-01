import type { ReactNode } from 'react';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Target,
  Star,
  Users,
  Calendar,
  Video,
  Settings,
  Bell,
  BarChart3,
  PlayCircle,
} from 'lucide-react';

interface StudentLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeIcon?: ReactNode;
  headerActions?: ReactNode;
  showBackButton?: boolean;
  backButtonAction?: () => void;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  title,
  subtitle,
  badgeText = 'Student Portal',
  badgeIcon = <Sparkles className='w-4 h-4' />,
  headerActions,
  showBackButton = false,
  backButtonAction,
}) => {
  const { user } = useAuth();

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <GraduationCap className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <BookOpen className='w-6 h-6 text-white' />
        </div>
      </div>
      <div className='absolute bottom-20 left-20 animate-bounce delay-3000'>
        <div className='w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
          <Target className='w-7 h-7 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                    <GraduationCap className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                      {badgeIcon}
                      {badgeText}
                    </Badge>
                    <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                      {title}
                    </h1>
                    {subtitle && <p className='text-lg text-gray-600 mt-2'>{subtitle}</p>}
                    {user && (
                      <p className='text-sm text-gray-500 mt-1'>
                        Welcome back,{' '}
                        <span className='font-semibold text-blue-600'>{user.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {headerActions && <div className='flex items-center gap-4'>{headerActions}</div>}
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
