import type {
  User,
  Batch,
  Course,
  Payment,
  DashboardStats,
  Assessment,
  Progress,
  ProgressStats,
  BatchProgress,
} from '@/types';
import { sessionManager } from '@/lib/sessionManager';
import { toast } from 'sonner';

// Safely read Vite env var without using `any`
const envBase = (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env.VITE_API_BASE_URL;
const API_BASE_URL = envBase ?? 'http://localhost:5001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

interface LiveClass {
  id: string;
  batchId: string;
  title: string;
  description?: string;
  startTime: string;
  duration?: number;
  isRecorded?: boolean;
  status: string;
  teacherId: string;
  studentCount: number;
  recordingUrl?: string;
}

interface _AdminDashboardData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalRevenue: number;
    activeClasses: number;
    pendingPayouts: number;
  };
  recentActivity: ActivityLog[];
