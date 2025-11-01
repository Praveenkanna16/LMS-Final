import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-lg mx-auto border-0 shadow-2xl bg-white/90 backdrop-blur-sm'>
            <CardHeader className='text-center'>
              <div className='w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4'>
                <AlertTriangle className='w-8 h-8 text-white' />
              </div>
              <CardTitle className='text-2xl font-bold text-gray-900'>
                Something went wrong
              </CardTitle>
              <CardDescription className='text-gray-600'>
                An unexpected error occurred. Please try again or contact support if the problem
                persists.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4'>
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  {this.state.error?.message || 'An unknown error occurred'}
                </AlertDescription>
              </Alert>

              <div className='flex flex-col sm:flex-row gap-3'>
                <Button
                  onClick={this.handleRetry}
                  className='flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Try Again
                </Button>

                <Button
                  variant='outline'
                  onClick={this.handleGoHome}
                  className='flex-1 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                >
                  <Home className='w-4 h-4 mr-2' />
                  Go Home
                </Button>
              </div>

              <details className='mt-4 p-3 bg-gray-50 rounded-lg text-sm'>
                <summary className='cursor-pointer text-gray-700 font-medium'>
                  Technical Details
                </summary>
                <pre className='mt-2 text-xs text-gray-600 overflow-auto'>
                  {this.state.error?.stack}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-6' />
            <h2 className='text-2xl font-bold mb-4 text-gray-900'>Dashboard Error</h2>
            <p className='text-gray-600 mb-6'>
              Failed to load dashboard data. Please try refreshing.
            </p>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Refresh Dashboard
            </Button>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log to error reporting service
        console.error('Dashboard error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export const AuthErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-md mx-auto border-0 shadow-2xl bg-white/90 backdrop-blur-sm'>
            <CardHeader className='text-center'>
              <div className='w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4'>
                <AlertTriangle className='w-8 h-8 text-white' />
              </div>
              <CardTitle className='text-2xl font-bold text-gray-900'>
                Authentication Error
              </CardTitle>
              <CardDescription className='text-gray-600'>
                There was a problem with authentication. Please sign in again.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                onClick={() => (window.location.href = '/login')}
                className='w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
