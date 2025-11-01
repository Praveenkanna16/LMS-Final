import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Authentication hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiService.login(email, password),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: { name: string; email: string; password: string; role: string }) =>
      apiService.register(userData),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData: {
      name?: string;
      email?: string;
      bio?: string;
      website?: string;
      linkedin?: string;
      github?: string;
    }) => apiService.updateProfile(profileData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => apiService.getCourseById(id),
    enabled: !!id,
  });
};

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await apiService.getCourses();
      // Extract courses array from nested response structure
      return response.data?.courses || [];
    },
  });
};

export const useMyCourses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myCourses', user?._id],
    queryFn: () => apiService.getCourses(),
    enabled: !!user,
  });
};

// Payment hooks
export const useCreatePaymentOrder = () => {
  return useMutation({
    mutationFn: ({
      batchId,
      revenueShareType,
    }: {
      batchId: string;
      revenueShareType: 'platform' | 'teacher';
    }) => apiService.createOrder(batchId, revenueShareType),
  });
};

export const usePaymentStatus = (orderId: string) => {
  return useQuery({
    queryKey: ['paymentStatus', orderId],
    queryFn: () => apiService.getPayments(),
    enabled: !!orderId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};

export const useMyPayments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myPayments', user?._id],
    queryFn: () => apiService.getPayments(),
    enabled: !!user,
  });
};

export const useTeacherPayments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacherPayments', user?._id],
    queryFn: () => apiService.getPayments(),
    enabled: !!user && user.role === 'teacher',
  });
};

// Batch hooks
export const useBatches = () => {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
  const response = await apiService.getAllBatches();
      // Extract batches array from nested response structure
      return response.data?.batches || [];
    },
  });
};

export const useMyBatches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myBatches', user?._id],
    queryFn: () => apiService.getMyBatches(),
    enabled: !!user,
  });
};

export const useBatch = (id: string) => {
  // TODO: Replace with real endpoint once available
  return useQuery({
    queryKey: ['batch', id],
    queryFn: () => Promise.resolve(null as unknown),
    enabled: !!id,
  });
};

// Notification hooks
export const useNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?._id],
  queryFn: () => apiService.getNotifications(user?._id ?? ''),
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => apiService.markNotificationAsRead(notificationId),
    onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Live class hooks - Using real API endpoints
export const useLiveClasses = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  teacherId?: string;
  batchId?: string;
}) => {
  return useQuery({
    queryKey: ['liveClasses', params],
    queryFn: async () => {
      const response = await apiService.getLiveClasses(params);
      return response.data || { liveClasses: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

export const useCreateLiveSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      batchId: string;
      title: string;
      description?: string;
      startTime: string;
      duration?: number;
      isRecorded?: boolean;
    }) => apiService.createLiveSession(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
      void queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

export const useStartLiveClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiService.joinLiveClass(sessionId);
      return response.data;
    },
    onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
    },
  });
};

export const useEndLiveClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, recordingUrl }: { sessionId: string; recordingUrl?: string }) =>
      apiService.endLiveClass(sessionId, recordingUrl),
    onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
    },
  });
};

// Enrollment hooks
export const useEnrollInCourse = () => {
  return useMutation({
    mutationFn: (courseId: string) => apiService.enrollInCourse(courseId),
  });
};

export const useEnrollInBatch = () => {
  return useMutation({
    mutationFn: ({ studentId, batchId }: { studentId: string; batchId: string }) =>
      apiService.enrollStudentInBatch(studentId, batchId),
  });
};

// Admin hooks
export const useAdminStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => apiService.getAdminStats(),
    enabled: !!user && user.role === 'admin',
  });
};

export const useAllUsers = () => {
  const { user } = useAuth();

  return useQuery<unknown[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const resp = await apiService.getAllUsers();
      const raw = (resp as { data?: unknown }).data;
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === 'object') {
        const maybe = (raw as { users?: unknown }).users;
        if (Array.isArray(maybe)) return maybe;
      }
      return [] as unknown[];
    },
    enabled: !!user && user.role === 'admin',
  });
};

export const usePayments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments'],
    queryFn: () => apiService.getPayments(),
    enabled: !!user && user.role === 'admin',
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      apiService.updateUserStatus(userId, status),
    onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiService.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiService.getUserById(userId),
    enabled: !!userId,
  });
};

export const useGetUserAnalytics = (userId: string) => {
  return useQuery({
    queryKey: ['userAnalytics', userId],
    queryFn: () => apiService.getUserAnalytics(userId),
    enabled: !!userId,
  });
};

// Teacher Management Hooks
export const useAllTeachers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  subject?: string;
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['allTeachers', params],
    queryFn: async () => {
      const response = await apiService.getAllTeachers(params);
      return response.data ?? [];
    },
    enabled: !!user && user.role === 'admin',
  });
};

export const useGetTeacherById = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => apiService.getTeacherById(teacherId),
    enabled: !!teacherId,
  });
};

export const useToggleTeacherSuspension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, suspend, reason }: { teacherId: string; suspend: boolean; reason?: string }) =>
      apiService.toggleTeacherSuspension(teacherId, { suspend, reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['allTeachers'] });
      void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
};

export const useApproveTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teacherId: string) => apiService.approveTeacher(teacherId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['allTeachers'] });
      void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
};

export const useUpdateTeacherCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, commissionRate }: { teacherId: string; commissionRate: number }) =>
      apiService.updateTeacherCommission(teacherId, commissionRate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['allTeachers'] });
    },
  });
};

// Analytics hooks
export const useAdminAnalytics = (timeRange?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['adminAnalytics', timeRange],
    queryFn: async () => {
      const response = await apiService.getAdminAnalytics(timeRange);
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
    refetchInterval: 60000, // Refetch every minute for real-time data
  });
};

// Notification Management Hooks
export const useAllNotifications = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  priority?: string;
  search?: string;
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['allNotifications', params],
    queryFn: async () => {
      const response = await apiService.getAllNotifications(params);
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

export const useSendNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      message: string;
      type?: 'system' | 'course' | 'payment' | 'achievement' | 'reminder';
      target: 'all' | 'teachers' | 'students' | 'specific';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      userIds?: string[];
    }) => apiService.sendNotification(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notificationAnalytics'] });
    },
  });
};

export const useScheduleNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      message: string;
      type?: 'system' | 'course' | 'payment' | 'achievement' | 'reminder';
      target: 'all' | 'teachers' | 'students' | 'specific';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      userIds?: string[];
      scheduledDate: string;
    }) => apiService.scheduleNotification(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notificationAnalytics'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteNotification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notificationAnalytics'] });
    },
  });
};

export const useNotificationAnalytics = (timeRange?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notificationAnalytics', timeRange],
    queryFn: async () => {
      const response = await apiService.getNotificationAnalytics(timeRange);
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
    refetchInterval: 60000, // Refetch every minute for real-time data
  });
};

// Data Management Hooks
export const useDataStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dataStats'],
    queryFn: async () => {
      const response = await apiService.getDataStats();
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if the request was cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useDatabaseTables = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['databaseTables'],
    queryFn: async () => {
      const response = await apiService.getDatabaseTables();
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });
};

export const useTableData = (
  tableName: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tableData', tableName, params],
    queryFn: async () => {
      const response = await apiService.getTableData(tableName, params);
      return response.data;
    },
    enabled: !!user && user.role === 'admin' && !!tableName,
  });
};

export const useBackupHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['backupHistory'],
    queryFn: async () => {
      const response = await apiService.getBackupHistory();
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if the request was cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { type?: 'full' | 'incremental' | 'manual'; description?: string }) =>
      apiService.createBackup(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['backupHistory'] });
      void queryClient.invalidateQueries({ queryKey: ['dataStats'] });
    },
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteBackup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['backupHistory'] });
      void queryClient.invalidateQueries({ queryKey: ['dataStats'] });
    },
  });
};
