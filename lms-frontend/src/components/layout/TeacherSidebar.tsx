import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Bell,
  Settings,
  LogOut,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const TeacherSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/teacher/dashboard',
    },
    {
      icon: Video,
      label: 'Live Classes',
      path: '/teacher/live-classes',
    },
    {
      icon: Users,
      label: 'My Batches',
      path: '/teacher/batches',
    },
    {
      icon: Users,
      label: 'My Students',
      path: '/teacher/students',
    },
    {
      icon: Calendar,
      label: 'Schedule',
      path: '/teacher/schedule',
    },
    {
      icon: BookOpen,
      label: 'Recorded Content',
      path: '/teacher/recorded-content',
    },
    {
      icon: TrendingUp,
      label: 'Earnings',
      path: '/teacher/earnings',
    },
    {
      icon: DollarSign,
      label: 'Payouts',
      path: '/teacher/payouts',
    },
    {
      icon: FileText,
      label: 'Reports',
      path: '/teacher/reports',
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/teacher/notifications',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/teacher/settings',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div className='p-6 border-b border-gray-200'>
        <h2 className='text-xl font-bold text-green-600'>GenZEd</h2>
        <p className='text-sm text-gray-500'>Teacher Portal</p>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-2'>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
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
