import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from '@/pages/student/Dashboard';
import StudentMyBatches from '@/pages/student/MyBatches';
import StudentSchedule from '@/pages/student/Schedule';
import StudentRecordedContent from '@/pages/student/RecordedContent';
import StudentAssessments from '@/pages/student/Assessments';
import StudentNotifications from '@/pages/student/Notifications';
import StudentSettings from '@/pages/student/Settings';
import PersonalizedLearning from '@/pages/student/PersonalizedLearning';
import PaymentSuccessPage from '@/pages/student/PaymentSuccessPage';
import LiveClass from '@/pages/LiveClass';

const StudentRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='dashboard' element={<StudentDashboard />} />
      <Route path='batches' element={<StudentMyBatches />} />
      <Route path='schedule' element={<StudentSchedule />} />
      <Route path='recorded-content' element={<StudentRecordedContent />} />
      <Route path='assessments' element={<StudentAssessments />} />
      <Route path='notifications' element={<StudentNotifications />} />
      <Route path='settings' element={<StudentSettings />} />
      <Route path='personalized-learning' element={<PersonalizedLearning />} />
      <Route path='live-classes' element={<LiveClass />} />
      <Route path='payment-success' element={<PaymentSuccessPage />} />
      <Route path='' element={<Navigate to='/student/dashboard' replace />} />
    </Routes>
  );
};

export default StudentRoutes;
