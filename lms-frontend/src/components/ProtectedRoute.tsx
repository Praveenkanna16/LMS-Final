import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading, isInitializing } = useAuth();
  const location = useLocation();

  console.warn('🛡️ ProtectedRoute: Checking access for', location.pathname, {
    isAuthenticated,
    loading,
    isInitializing,
    userRole: user?.role,
    requiredRole,
  });

  // Show loading spinner while authentication is being checked
  if (loading || isInitializing) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-blue-600' />
          <p className='text-gray-600'>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    console.warn('🚫 ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    const safeRole = user.role || 'student';
    const redirectPath = `/${safeRole}/dashboard`;
    console.warn('🚫 ProtectedRoute: Role mismatch, redirecting to role dashboard', {
      userRole: user.role,
      requiredRole,
      redirectPath,
    });

    // If user's role is missing, fallback to a safe default instead of '/undefined/dashboard'
    return <Navigate to={redirectPath} replace />;
  }

  console.warn('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
};
