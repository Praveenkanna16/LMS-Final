import React, { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, LogOut, ChevronLeft } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeIcon: ReactNode;
  headerActions?: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  badgeText,
  badgeIcon,
  headerActions,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 shadow-sm'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-6'>
              <Button
                variant='ghost'
                onClick={() => {
                  navigate('/admin/dashboard');
                }}
                className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
              >
                <ChevronLeft className='w-4 h-4' />
                Back to Dashboard
              </Button>

              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Settings className='w-7 h-7 text-white' />
                </div>
                <div>
                  <Badge className='mb-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white border-0 px-3 py-1'>
                    {badgeIcon}
                    {badgeText}
                  </Badge>
                  <h1 className='text-3xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-orange-900 bg-clip-text text-transparent'>
                    {title}
                  </h1>
                  <p className='text-gray-600'>{subtitle}</p>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              {headerActions}
              <Button
                variant='outline'
                onClick={handleLogout}
                className='flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50'
              >
                <LogOut className='w-4 h-4' />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-6 py-8'>{children}</main>
    </div>
  );
};

export default AdminLayout;
