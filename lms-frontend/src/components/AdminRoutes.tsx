import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '@/pages/admin/Dashboard';
import TeachersManagement from '@/pages/admin/Teachers';
import SystemSettingsManagement from '@/pages/admin/Settings';
import DataManagement from '@/pages/admin/DataManagement';
import DatabaseViewer from '@/pages/admin/DatabaseViewer';
import LiveClassesManagement from '@/pages/admin/LiveClasses';
import BatchesManagement from '@/pages/admin/Batches';
import AnalyticsManagement from '@/pages/admin/Analytics';
import PaymentsManagement from '@/pages/admin/Payments';
import ContentLibraryManagement from '@/pages/admin/RecordedContent';
import StudentsManagement from '@/pages/admin/Students';
import CoursesManagement from '@/pages/admin/Courses';
import UsersManagement from '@/pages/admin/Users';
import NotificationsManagement from '@/pages/admin/Notifications';
import PayoutsManagement from '@/pages/admin/Payouts';
import TeacherSalaryManagement from '@/pages/admin/TeacherSalary';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='dashboard' element={<AdminDashboard />} />
      <Route path='teachers' element={<TeachersManagement />} />
      <Route path='students' element={<StudentsManagement />} />
      <Route path='courses' element={<CoursesManagement />} />
      <Route path='users' element={<UsersManagement />} />
      <Route path='live-classes' element={<LiveClassesManagement />} />
      <Route path='batches' element={<BatchesManagement />} />
      <Route path='payments' element={<PaymentsManagement />} />
      <Route path='recorded-content' element={<ContentLibraryManagement />} />
      <Route path='analytics' element={<AnalyticsManagement />} />
      <Route path='payouts' element={<PayoutsManagement />} />
      <Route path='teacher-salaries' element={<TeacherSalaryManagement />} />
      <Route path='notifications' element={<NotificationsManagement />} />
      <Route path='settings' element={<SystemSettingsManagement />} />
      <Route path='data-management' element={<DataManagement />} />
      <Route path='database-viewer' element={<DatabaseViewer />} />
      <Route path='' element={<Navigate to='/admin/dashboard' replace />} />
    </Routes>
  );
};

export default AdminRoutes;
