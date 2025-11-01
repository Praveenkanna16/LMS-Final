import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Video,
  FileText,
  Bell,
  Settings,
  LogOut,
  Home,
  PlayCircle,
  Brain,
  User,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const StudentSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/student/dashboard',
    },
    {
      icon: Video,
      label: 'Live Classes',
      path: '/student/live-classes',
    },
    {
      icon: BookOpen,
      label: 'My Batches',
      path: '/student/batches',
    },
    {
      icon: Calendar,
      label: 'Schedule',
      path: '/student/schedule',
    },
    {
      icon: PlayCircle,
      label: 'Recorded Content',
      path: '/student/recorded-content',
    },
    {
      icon: FileText,
      label: 'Assessments',
      path: '/student/assessments',
    },
    {
      icon: Brain,
      label: 'Personalized Learning',
      path: '/student/personalized-learning',
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/student/notifications',
    },
    {
      icon: User,
      label: 'Profile',
      path: '/student/profile',
    },
    {
      icon: CreditCard,
      label: 'Payments',
      path: '/student/payments',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/student/settings',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div className='p-6 border-b border-gray-200'>
        <h2 className='text-xl font-bold text-blue-600'>GenZEd</h2>
        <p className='text-sm text-gray-500'>Student Portal</p>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-2'>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className='w-5 h-5' />
            <span className='font-medium'>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className='p-4 border-t border-gray-200'>
        <button
          onClick={logout}
          className='flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full'
        >
          <LogOut className='w-5 h-5' />
          <span className='font-medium'>Logout</span>
        </button>
      </div>
    </div>
  );
};
