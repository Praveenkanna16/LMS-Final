import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentSidebar } from './StudentSidebar';
import { TeacherSidebar } from './TeacherSidebar';
import { AdminSidebar } from './AdminSidebar';
import GlobalSearch from '@/components/GlobalSearch';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return (
      <main className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600'>Please log in to access the platform.</p>
        </div>
      </main>
    );
  }

  const renderSidebar = () => {
    switch (user.role) {
      case 'student':
        return <StudentSidebar />;
      case 'teacher':
        return <TeacherSidebar />;
      case 'admin':
        return <AdminSidebar />;
      default:
        return null;
    }
  };

  const isAdmin = user.role === 'admin';
  const containerClass = `flex h-screen ${
    isAdmin
      ? 'bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'
      : 'bg-gray-100'
  }`;

  return (
    <div className={containerClass}>
      {isAdmin && (
        <>
          {/* Subtle decorative backgrounds to match Admin Dashboard theme */}
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]' />
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]' />
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20' />
        </>
      )}
      {/* Skip to main content link for screen readers */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50'
      >
        Skip to main content
      </a>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => {
            setSidebarOpen(false);
          }}
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label={`${user.role} navigation`}
        role='navigation'
      >
        <div className='flex items-center justify-between p-4 lg:hidden'>
          <h1 className='text-xl font-bold text-gray-900'>GenZEd</h1>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setSidebarOpen(false);
            }}
            aria-label='Close navigation menu'
          >
            <X className='h-6 w-6' aria-hidden='true' />
          </Button>
        </div>
        {renderSidebar()}
      </aside>

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden relative z-10'>
        {/* Header */}
        <header
          className='bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 p-4'
          role='banner'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Button
                variant='ghost'
                size='sm'
                className='lg:hidden'
                onClick={() => {
                  setSidebarOpen(true);
                }}
                aria-label='Open navigation menu'
              >
                <Menu className='h-6 w-6' aria-hidden='true' />
              </Button>
              <h1 className='text-xl lg:text-2xl font-bold text-gray-900 lg:block hidden'>
                GenZEd
              </h1>
              <span className='text-sm text-gray-500 capitalize lg:block hidden'>
                {user.role} Dashboard
              </span>
              <div className='hidden lg:block'>
                <GlobalSearch />
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='hidden lg:block text-sm text-gray-600'>Welcome back, {user.name}</div>
              <div
                className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium'
                role='img'
                aria-label={`${user.name}'s avatar`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className='mt-4 lg:hidden'>
            <GlobalSearch />
          </div>
        </header>

        {/* Page Content */}
        <main
          id='main-content'
          className={`flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 ${
            isAdmin ? 'bg-transparent' : 'bg-gray-50'
          }`}
          role='main'
          aria-label='Main content'
        >
          {children}
        </main>
      </div>
    </div>
  );
};
