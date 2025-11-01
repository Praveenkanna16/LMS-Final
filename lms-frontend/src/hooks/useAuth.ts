import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { sessionManager } from '@/lib/sessionManager';
import { toast } from 'sonner';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
}

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiService.login(credentials.email, credentials.password);

      if (!response.success || !response.data?.token) {
        throw new Error(response.error || 'Login failed');
      }

      // Get user details after successful login
      const userResponse = await apiService.getMe();

      if (!userResponse.success || !userResponse.data) {
        throw new Error('Failed to get user details');
      }

      const user = userResponse.data;
      const token = response.data.token;

      // Store session using session manager
      sessionManager.setSession(user, token);

      return { user, token };
    },
    onSuccess: data => {
      // Update React Query cache with user data
      queryClient.setQueryData(['user'], data.user);

      toast.success(`Welcome back, ${data.user.name}!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiService.register(userData);

      if (!response.success || !response.data?.token) {
        throw new Error(response.error || 'Registration failed');
      }

      // Get user details after successful registration
      const userResponse = await apiService.getMe();

      if (!userResponse.success || !userResponse.data) {
        throw new Error('Failed to get user details');
      }

      const user = userResponse.data;
      const token = response.data.token;

      // Store session using session manager
      sessionManager.setSession(user, token);

      return { user, token };
    },
    onSuccess: data => {
      // Update React Query cache with user data
      queryClient.setQueryData(['user'], data.user);

      toast.success(`Welcome to LMS, ${data.user.name}!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear session using session manager
      sessionManager.clearSession();

      // Cancel all ongoing queries
      await queryClient.cancelQueries();

      // Clear all cached data
      queryClient.clear();
    },
    onSuccess: () => {
      toast.success('Logged out successfully');
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      sessionManager.clearSession();
      queryClient.clear();
    },
  });
};
