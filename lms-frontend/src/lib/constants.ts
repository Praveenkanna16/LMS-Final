/**
 * Application constants for consistent usage across the application
 */

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'genzed_token',
  USER: 'genzed_user',
  AUTH_TIMESTAMP: 'genzed_auth_timestamp',
  SESSION_ACTIVE: 'genzed_session_active',
  AUTH_STORE: 'genzed-auth-store',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  DASHBOARD: {
    STUDENT: '/student/dashboard-data',
    TEACHER: '/teacher/dashboard-data',
    ADMIN: '/admin/dashboard-data',
  },
  BATCHES: {
    MY_BATCHES: '/batches/my-batches',
    TEACHER_BATCHES: '/batches/teacher/my-batches',
    UPCOMING_SESSIONS: '/batches/upcoming-sessions',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  COURSES: '/courses',
  DASHBOARD: '/dashboard',
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    BATCHES: '/student/batches',
    SCHEDULE: '/student/schedule',
    RECORDED_CONTENT: '/student/recorded-content',
    ASSESSMENTS: '/student/assessments',
    NOTIFICATIONS: '/student/notifications',
    SETTINGS: '/student/settings',
    PERSONALIZED_LEARNING: '/student/personalized-learning',
    LIVE_CLASSES: '/student/live-classes',
  },
  TEACHER: {
    DASHBOARD: '/teacher/dashboard',
    BATCHES: '/teacher/batches',
    SCHEDULE: '/teacher/schedule',
    RECORDED_CONTENT: '/teacher/recorded-content',
    EARNINGS: '/teacher/earnings',
    PAYOUTS: '/teacher/payouts',
    REPORTS: '/teacher/reports',
    NOTIFICATIONS: '/teacher/notifications',
    SETTINGS: '/teacher/settings',
    LIVE_CLASSES: '/teacher/live-classes',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    TEACHERS: '/admin/teachers',
    STUDENTS: '/admin/students',
    COURSES: '/admin/courses',
    USERS: '/admin/users',
    LIVE_CLASSES: '/admin/live-classes',
    BATCHES: '/admin/batches',
    ANALYTICS: '/admin/analytics',
    PAYMENTS: '/admin/payments',
    RECORDED_CONTENT: '/admin/recorded-content',
    NOTIFICATIONS: '/admin/notifications',
    SETTINGS: '/admin/settings',
    DATA_MANAGEMENT: '/admin/data-management',
  },
} as const;

export const AUTH_CONFIG = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds (increased from shorter timeout)
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutes
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
} as const;
