import type { Course, Batch } from './index';

export interface Progress {
  id: number;
  userId: string;
  courseId: number;
  batchId?: number;
  completedTopics: string[];
  watchedVideos: string[];
  completedAssessments: string[];
  totalTimeSpent: number;
  progressPercentage: number;
  lastAccessedAt: Date;
  certificates: {
    id: string;
    type: string;
    issueDate: Date;
    expiryDate?: Date;
    grade?: string;
  }[];
  learningStyle?: string;
  strengths: string[];
  weaknesses: string[];
  analytics: {
    assessmentScores: number[];
    attendanceRate: number;
    participationRate: number;
    doubtsAsked: number;
    doubtsAnswered: number;
  };
  status: 'active' | 'completed' | 'dropped';
  course?: Course;
  batch?: Batch;
  created_at: Date;
  updated_at: Date;
}

export interface ProgressStats {
  totalTimeSpent: number;
  averageProgress: number;
  completedCourses: number;
  activeCourses: number;
}

export interface BatchProgress {
  totalStudents: number;
  averageProgress: number;
  averageTimeSpent: number;
  completionRate: number;
  studentProgress: {
    studentId: string;
    progress: number;
    timeSpent: number;
    lastAccessed: Date;
    status: 'active' | 'completed' | 'dropped';
    analytics: {
      assessmentScores: number[];
      attendanceRate: number;
      participationRate: number;
      doubtsAsked: number;
      doubtsAnswered: number;
    };
  }[];
}
