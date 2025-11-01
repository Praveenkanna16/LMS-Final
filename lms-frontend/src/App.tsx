import React, { Suspense } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/FullPageLoader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
const Index = React.lazy(() => import('./pages/Index'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Courses = React.lazy(() => import('./pages/Courses'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const TeacherDashboard = React.lazy(() => import('./pages/teacher/Dashboard'));
const TeacherMyBatches = React.lazy(() => import('./pages/teacher/MyBatches'));
const TeacherSchedule = React.lazy(() => import('./pages/teacher/TeacherSchedule'));
const TeacherRecordedContent = React.lazy(() => import('./pages/teacher/SimpleVideoUpload'));
const TeacherEarnings = React.lazy(() => import('./pages/teacher/EarningsEnhanced'));
const TeacherPayouts = React.lazy(() => import('./pages/teacher/PayoutsEnhanced'));
const TeacherReports = React.lazy(() => import('./pages/teacher/ReportsEnhanced'));
const TeacherNotifications = React.lazy(() => import('./pages/teacher/Notifications'));
const TeacherSettings = React.lazy(() => import('./pages/teacher/Settings'));
const TeacherAttendance = React.lazy(() => import('./pages/teacher/Attendance'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const TeachersManagement = React.lazy(() => import('./pages/admin/Teachers'));
const StudentsManagement = React.lazy(() => import('./pages/admin/Students'));
const CoursesManagement = React.lazy(() => import('./pages/admin/Courses'));
const AddCourse = React.lazy(() => import('./pages/admin/AddCourse'));
const UsersManagement = React.lazy(() => import('./pages/admin/Users'));
const LiveClassesManagement = React.lazy(() => import('./pages/admin/LiveClasses'));
const AddLiveClass = React.lazy(() => import('./pages/admin/AddLiveClass'));
const BatchesManagement = React.lazy(() => import('./pages/admin/Batches'));
const AddBatch = React.lazy(() => import('./pages/admin/AddBatch'));
const AnalyticsManagement = React.lazy(() => import('./pages/admin/Analytics'));
const PaymentsManagement = React.lazy(() => import('./pages/admin/Payments'));
const ContentLibraryManagement = React.lazy(() => import('./pages/admin/ContentLibraryNew'));
const NotificationsManagement = React.lazy(() => import('./pages/admin/Notifications'));
const SystemSettingsManagement = React.lazy(() => import('./pages/admin/Settings'));
const DataManagement = React.lazy(() => import('./pages/admin/DataManagement'));
const StudentMyBatches = React.lazy(() => import('./pages/student/MyBatches'));
const StudentRecordedContent = React.lazy(() => import('./pages/student/RecordedContent'));
const StudentTests = React.lazy(() => import('./pages/student/Tests'));
const StudentRecordings = React.lazy(() => import('./pages/student/Recordings'));
const StudentAttendance = React.lazy(() => import('./pages/student/Attendance'));
const StudentPerformance = React.lazy(() => import('./pages/student/Performance'));
const StudentSupport = React.lazy(() => import('./pages/student/Support'));
const PayoutsManagement = React.lazy(() => import('./pages/admin/Payouts'));
const TeacherSalaryManagement = React.lazy(() => import('./pages/admin/TeacherSalary'));
const DatabaseViewer = React.lazy(() => import('./pages/admin/DatabaseViewer'));
const StudentAssessments = React.lazy(() => import('./pages/student/Assessments'));
const StudentNotifications = React.lazy(() => import('./pages/student/Notifications'));
const StudentProfile = React.lazy(() => import('./pages/student/Profile'));
const StudentSettings = React.lazy(() => import('./pages/student/Settings'));
const StudentPayments = React.lazy(() => import('./pages/student/Payments'));
const StudentAttendanceDetail = React.lazy(() => import('./pages/student/AttendanceDetail'));
const PersonalizedLearning = React.lazy(() => import('./pages/student/PersonalizedLearning'));
const StudentSchedule = React.lazy(() => import('./pages/student/Schedule'));
const Payment = React.lazy(() => import('./pages/Payment'));
const LiveClass = React.lazy(() => import('./pages/LiveClass'));
const TeacherMyStudents = React.lazy(() => import('./pages/teacher/MyStudents'));
const TeacherLayout = React.lazy(() =>
  import('@/components/TeacherLayout').then(module => ({ default: module.TeacherLayout }))
);
const Layout = React.lazy(() =>
  import('@/components/layout/Layout').then(module => ({ default: module.Layout }))
);
const NotFound = React.lazy(() => import('./pages/NotFound'));
const BatchManagement = React.lazy(() => import('./pages/teacher/BatchManagement'));
const BatchDetails = React.lazy(() => import('./pages/teacher/BatchDetails'));
const BatchStudents = React.lazy(() => import('./pages/teacher/BatchStudents'));
const BatchSchedule = React.lazy(() => import('./pages/teacher/BatchSchedule'));
const BatchContent = React.lazy(() => import('./pages/teacher/BatchContent'));
const BatchSettingsPage = React.lazy(() => import('./pages/teacher/BatchSettingsPage'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));

type QueryError = { status?: number } | Error;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: QueryError) => {
        // Don't retry on 401, 403, or 404 errors
        const err = error as { status?: number };
        if (err.status === 401 || err.status === 403 || err.status === 404) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: (error: QueryError) => {
        // Handle mutation errors globally
        const err = error as { status?: number };
        if (err.status === 401) {
          // Redirect to login on unauthorized mutations
          window.location.href = '/login';
        }
      },
    },
  },
});

const AppRoutes = () => {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  console.warn('AppRoutes: Current user', user);
  console.warn('AppRoutes: Current location', location.pathname);
  console.warn('AppRoutes: Is initializing', isInitializing);

  // Show full-page loader while authentication is being initialized
  if (isInitializing) {
    return <FullPageLoader message='Initializing your session...' />;
  }

  return (
    <Suspense fallback={<FullPageLoader message='Loading page...' />}>
      <Routes>
        {/* Landing Page - Public */}
        <Route path='/' element={<Index />} />

        {/* Auth Routes - Public */}
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* Courses Catalog - Public */}
        <Route path='/courses' element={<Courses />} />
        
        {/* Cart and Wishlist - Public for browsing, functionality requires login */}
        <Route path='/cart' element={<Cart />} />
        <Route path='/wishlist' element={<Wishlist />} />

        {/* Payment - Protected but accessible via navigation */}
        <Route
          path='/payment'
          element={
            <ProtectedRoute requiredRole='student'>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* Payment Success - Student completes payment and returns here */}
        <Route
          path='/student/payment-success'
          element={
            <ProtectedRoute requiredRole='student'>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* Default redirects based on role */}
        <Route
          path='/dashboard'
          element={
            user?.role ? (
              <Navigate to={`/${user.role}/dashboard`} replace />
            ) : (
              // Safe fallback when role is missing
              <Navigate to='/login' replace />
            )
          }
        />

        {/* Catch undefined role paths */}
        <Route path='/undefined/dashboard' element={<Navigate to='/login' replace />} />

        {/* Protected Routes */}
        <Route
          path='/student/*'
          element={
            <ProtectedRoute requiredRole='student'>
              <Routes>
                <Route path='dashboard' element={<StudentDashboard />} />
                <Route path='batches' element={<StudentMyBatches />} />
                <Route path='schedule' element={<StudentSchedule />} />
                <Route path='recorded-content' element={<StudentRecordedContent />} />
                <Route path='assessments' element={<StudentAssessments />} />
                <Route path='tests' element={<StudentTests />} />
                <Route path='recordings' element={<StudentRecordings />} />
                <Route path='attendance' element={<StudentAttendance />} />
                <Route path='performance' element={<StudentPerformance />} />
                <Route path='notifications' element={<StudentNotifications />} />
                <Route path='support' element={<StudentSupport />} />
                <Route path='profile' element={<StudentProfile />} />
                <Route path='payments' element={<StudentPayments />} />
                <Route path='attendance-detail' element={<StudentAttendanceDetail />} />
                <Route path='settings' element={<StudentSettings />} />
                <Route path='personalized-learning' element={<PersonalizedLearning />} />
                <Route path='live-classes' element={<LiveClass />} />
                <Route path='' element={<Navigate to='/student/dashboard' replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        <Route
          path='/teacher/*'
          element={
            <ProtectedRoute requiredRole='teacher'>
              <TeacherLayout>
                <Routes>
                  <Route path='dashboard' element={<TeacherDashboard />} />
                  <Route path='batches' element={<TeacherMyBatches />} />
                  <Route path='batches/:id' element={<BatchDetails />} />
                  <Route path='batches/:id/manage' element={<BatchManagement />} />
                  <Route path='batches/:id/students' element={<BatchStudents />} />
                  <Route path='batches/:id/schedule' element={<BatchSchedule />} />
                  <Route path='batches/:id/content' element={<BatchContent />} />
                  <Route path='batches/:id/settings' element={<BatchSettingsPage />} />
                  <Route path='students' element={<TeacherMyStudents />} />
                  <Route path='schedule' element={<TeacherSchedule />} />
                  <Route path='recorded-content' element={<TeacherRecordedContent />} />
                  <Route path='attendance' element={<TeacherAttendance />} />
                  <Route path='earnings' element={<TeacherEarnings />} />
                  <Route path='payouts' element={<TeacherPayouts />} />
                  <Route path='reports' element={<TeacherReports />} />
                  <Route path='notifications' element={<TeacherNotifications />} />
                  <Route path='settings' element={<TeacherSettings />} />
                  <Route path='live-classes' element={<LiveClass />} />
                  <Route path='' element={<Navigate to='/teacher/dashboard' replace />} />
                </Routes>
              </TeacherLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin/*'
          element={
            <ProtectedRoute requiredRole='admin'>
              <Layout>
                <Routes>
                  <Route path='dashboard' element={<AdminDashboard />} />
                  <Route path='teachers' element={<TeachersManagement />} />
                  <Route path='students' element={<StudentsManagement />} />
                  <Route path='courses' element={<CoursesManagement />} />
                  <Route path='courses/new' element={<AddCourse />} />
                  <Route path='users' element={<UsersManagement />} />
                  <Route path='live-classes' element={<LiveClassesManagement />} />
                  <Route path='live-classes/new' element={<AddLiveClass />} />
                  <Route path='batches' element={<BatchesManagement />} />
                  <Route path='batches/new' element={<AddBatch />} />
                  <Route path='analytics' element={<AnalyticsManagement />} />
                  <Route path='payments' element={<PaymentsManagement />} />
                  <Route path='payouts' element={<PayoutsManagement />} />
                  <Route path='teacher-salaries' element={<TeacherSalaryManagement />} />
                  <Route path='recorded-content' element={<ContentLibraryManagement />} />
                  <Route path='notifications' element={<NotificationsManagement />} />
                  <Route path='settings' element={<SystemSettingsManagement />} />
                  <Route path='data-management' element={<DataManagement />} />
                  <Route path='database-viewer' element={<DatabaseViewer />} />
                  <Route path='' element={<Navigate to='/admin/dashboard' replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
