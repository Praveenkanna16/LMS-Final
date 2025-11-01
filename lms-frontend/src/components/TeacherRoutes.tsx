import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TeacherLayout } from '@/components/TeacherLayout';
import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherMyBatches from '@/pages/teacher/MyBatches';
import TeacherSchedule from '@/pages/teacher/Schedule';
import TeacherRecordedContent from '@/pages/teacher/RecordedContent';
import TeacherEarnings from '@/pages/teacher/Earnings';
import TeacherPayouts from '@/pages/teacher/Payouts';
import TeacherReports from '@/pages/teacher/Reports';
import TeacherNotifications from '@/pages/teacher/Notifications';
import TeacherSettings from '@/pages/teacher/Settings';
import LiveClass from '@/pages/LiveClass';
import CreateBatch from '@/pages/teacher/CreateBatch';
import MyStudents from '@/pages/teacher/MyStudents';

const TeacherRoutes: React.FC = () => {
  return (
    <TeacherLayout>
      <Routes>
        <Route path='dashboard' element={<TeacherDashboard />} />
        <Route path='batches' element={<TeacherMyBatches />} />
        <Route path='batches/create' element={<CreateBatch />} />
        <Route path='schedule' element={<TeacherSchedule />} />
        <Route path='recorded-content' element={<TeacherRecordedContent />} />
        <Route path='earnings' element={<TeacherEarnings />} />
        <Route path='payouts' element={<TeacherPayouts />} />
        <Route path='reports' element={<TeacherReports />} />
        <Route path='notifications' element={<TeacherNotifications />} />
        <Route path='settings' element={<TeacherSettings />} />
        <Route path='students' element={<MyStudents />} />
        <Route path='live-classes' element={<LiveClass />} />
        <Route path='' element={<Navigate to='/teacher/dashboard' replace />} />
      </Routes>
    </TeacherLayout>
  );
};

export default TeacherRoutes;
