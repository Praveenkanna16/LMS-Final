import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  Video,
  DollarSign,
  Settings,
  ChevronLeft,
  Bell,
} from 'lucide-react';

export const TeacherNavbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.includes(path);

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/teacher/dashboard',
    },
    {
      label: 'Batches',
      icon: Users,
      href: '/teacher/batches',
    },
    {
      label: 'Schedule',
      icon: Calendar,
      href: '/teacher/schedule',
    },
    {
      label: 'Live Classes',
      icon: Video,
      href: '/teacher/live-classes',
    },
    {
      label: 'Recorded Content',
      icon: Video,
      href: '/teacher/recorded-content',
    },
    {
      label: 'Earnings',
      icon: DollarSign,
      href: '/teacher/earnings',
    },
    {
      label: 'Payouts',
      icon: DollarSign,
      href: '/teacher/payouts',
    },
    {
      label: 'Reports',
      icon: LayoutDashboard,
      href: '/teacher/reports',
    },
    {
      label: 'Notifications',
      icon: Bell,
      href: '/teacher/notifications',
    },
  ];

  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center h-16'>
          {/* Logo */}
          <Link to='/teacher/dashboard' className='flex items-center space-x-3 mr-10'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg'>
              <GraduationCap className='w-6 h-6 text-white' />
            </div>
            <div>
              <span className='text-xl font-bold text-gray-900'>GenZEd</span>
              <span className='block text-xs text-gray-500'>Teacher Portal</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className='hidden md:flex items-center space-x-1 flex-1 overflow-x-auto'>
            <div className='flex items-center space-x-1'>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className='w-4 h-4 mr-1' />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Back to Dashboard */}
          {!isActive('/dashboard') && (
            <Button variant='ghost' size='sm' asChild className='mr-4'>
              <Link to='/teacher/dashboard'>
                <ChevronLeft className='w-4 h-4 mr-1' />
                Back to Dashboard
              </Link>
            </Button>
          )}

          {/* Settings */}
          <Button variant='ghost' size='sm' asChild className='hidden md:flex'>
            <Link to='/teacher/settings'>
              <Settings className='w-4 h-4 mr-2' />
              Settings
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <Button variant='ghost' size='sm' className='md:hidden'>
            <Settings className='w-5 h-5' />
          </Button>
        </div>
      </div>
    </div>
  );
};
