import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useStudentDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-dashboard', user?._id],
    // Use a resilient queryFn: try the consolidated dashboard endpoint, but
    // fall back to smaller API calls (my-batches + me) when the endpoint fails.
    queryFn: async () => {
      try {
        const resp = await apiService.getStudentDashboardData();
        // If API returned a formal error shape, surface it to trigger retries
        if (!resp || (resp as any).success === false) {
          throw new Error((resp as any)?.message || 'Dashboard API failed');
        }
        return resp as any;
      } catch (err) {
        // Fallback: fetch minimal data so UI can render a usable dashboard
        try {
          const [batchesRes, meRes, classesRes] = await Promise.all([
            apiService.getMyBatches(),
            apiService.getMe(),
            apiService.getLiveClasses() // Try to get upcoming live classes
          ]);
          const batches = (batchesRes && (batchesRes as any).data) || [];
          const userData = (meRes && (meRes as any).data) || null;
          
          // Get upcoming classes from live classes endpoint
          let upcomingClasses: any[] = [];
          if (classesRes && (classesRes as any).data) {
            const now = new Date();
            upcomingClasses = ((classesRes as any).data || [])
              .filter((session: any) => 
                new Date(session.startTime) > now && 
                ['scheduled', 'live'].includes(session.status)
              )
              .map((session: any) => ({
                id: session.id,
                batchId: session.batchId,
                batchName: session.batch?.name || 'Unknown Batch',
                courseTitle: session.batch?.course?.title || 'Course',
                topic: session.title,
                description: session.description,
                startTime: session.startTime,
                endTime: session.endTime,
                duration: session.duration,
                teacher: session.batch?.teacher?.name || 'Teacher',
                meetingId: session.meetingId,
                zoomLink: session.zoomLink,
                status: session.status
              }))
              .slice(0, 10);
          }

          return {
            success: true,
            data: {
              user: userData,
              stats: {
                attendancePercentage: 0,
                recentTestScore: 0,
                notificationsCount: 0,
                studyStreak: userData?.gamification?.streak?.current ?? 0,
              },
              batches,
              upcomingClasses,
              recentActivities: [],
              achievements: [],
              weeklyProgress: {
                classesAttended: { value: 0, max: 10 },
                testsCompleted: { value: 0, max: 4 },
                assignmentsDone: { value: 0, max: 5 },
              },
            },
          } as any;
        } catch (fallbackErr) {
          // If fallback also fails, rethrow original error to let UI show the
          // existing error state and toast.
          throw err;
        }
      }
    },
    enabled: !!user && user.role === 'student',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: (query) => {
      // Stop auto-refetch if there are errors
      return query.state.error ? false : 10 * 60 * 1000;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors or server errors
      if (error?.status === 401 || error?.status >= 500) return false;
      return failureCount < 1; // Only retry once for other errors
    },
  });
};

export const useTeacherDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-dashboard', user?._id],
    queryFn: () => apiService.getTeacherDashboardData(),
    enabled: !!user && user.role === 'teacher',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

export const useAdminDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-dashboard', user?._id],
    queryFn: () => apiService.getAdminDashboardData(),
    enabled: !!user && user.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });
};
