import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Video,
  BookOpen,
  DollarSign,
  Bell,
  LogOut,
  TrendingUp,
  Shield,
  Database,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      icon: Users,
      label: 'All Users',
      path: '/admin/users',
    },
    {
      icon: UserCheck,
      label: 'Teachers',
      path: '/admin/teachers',
    },
    {
      icon: GraduationCap,
      label: 'Students',
      path: '/admin/students',
    },
    {
      icon: GraduationCap,
      label: 'Courses',
      path: '/admin/courses',
    },
    {
      icon: Video,
      label: 'Live Classes',
      path: '/admin/live-classes',
    },
    {
      icon: BookOpen,
      label: 'Batches',
      path: '/admin/batches',
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      path: '/admin/analytics',
    },
    {
      icon: DollarSign,
      label: 'Payments',
      path: '/admin/payments',
    },
    {
      icon: DollarSign,
      label: 'Payouts',
      path: '/admin/payouts',
    },
    {
      icon: DollarSign,
      label: 'Teacher Salaries',
      path: '/admin/teacher-salaries',
    },
    {
      icon: BookOpen,
      label: 'Content Library',
      path: '/admin/recorded-content',
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/admin/notifications',
    },
    {
      icon: FileText,
      label: 'Data Management',
      path: '/admin/data-management',
    },
    {
      icon: Database,
      label: 'Database Viewer',
      path: '/admin/database-viewer',
    },
    {
      icon: Shield,
      label: 'System Settings',
      path: '/admin/settings',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div className='p-6 border-b border-gray-200'>
        <h2 className='text-xl font-bold text-purple-600'>GenZEd</h2>
        <p className='text-sm text-gray-500'>Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-2'>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
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
