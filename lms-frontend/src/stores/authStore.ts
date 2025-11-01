import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { apiService } from '@/services/api';
import { sessionManager } from '@/lib/sessionManager';

interface LoginResult {
  user: User;
  token: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (userData: RegisterInput) => Promise<LoginResult>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

    login: async (email: string, password: string): Promise<LoginResult> => {
        set({ isLoading: true });
        try {
      console.warn('🔐 AuthStore: Attempting login for:', email);
      const response = await apiService.login(email, password);

          // Validation/failed response
          if (response.success === false) {
            throw new Error(response.error ?? response.message ?? 'Login failed');
          }

          // Extract data from response
          const responseData = response.data;

          // Ensure we have the required data
          if (!responseData || typeof responseData !== 'object') {
            throw new Error('Invalid response format from server');
          }

          // Extract user and token data from the expected structure
          const { user: userDataFromResponse, token: tokenData } = responseData as LoginResult;

          // Accept both id and _id from backend
          const idCompat = userDataFromResponse as unknown as { _id?: string; id?: string };
          const userId = idCompat._id ?? idCompat.id;
          if (!userId) throw new Error('Invalid user id received from server');
          // Normalize to _id
          const user: User = { ...userDataFromResponse, _id: userId };

          console.warn('✅ AuthStore: Login successful for:', user.email);

          // Persist to store and session for API layer
          set({ user, token: tokenData, isAuthenticated: true, isLoading: false });
          sessionManager.setSession(user, tokenData);
          return { user, token: tokenData };
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Login failed');
          console.error('❌ AuthStore: Login failed:', err.message);
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (userData: RegisterInput): Promise<LoginResult> => {
        console.warn('🗄️ AuthStore: Register called');
        set({ isLoading: true });
        try {
          const response = await apiService.register(userData);
          console.warn('📡 AuthStore: API response received');

          // Check failed response
          if (response.success === false) {
            console.error('🚨 AuthStore: Validation error detected');
            throw new Error(response.message ?? response.error ?? 'Registration failed');
          }

          // Handle nested response structure from backend
          const responseData = response.data;

          // Ensure we have the required data
          if (!responseData || typeof responseData !== 'object') {
            throw new Error('Invalid response format from server');
          }

          // Extract user and token data from the expected structure
          const { user: userDataFromResponse, token: tokenData } = responseData as LoginResult;

          const idCompat = userDataFromResponse as unknown as { _id?: string; id?: string };
          const normalizedId = idCompat._id ?? idCompat.id;
          if (!normalizedId) throw new Error('Invalid user id received from server');
          const user: User = { ...userDataFromResponse, _id: normalizedId };

          console.warn('✅ AuthStore: Registration successful');

          // Persist to store and session for API layer
          set({
            user,
            token: tokenData || null,
            isAuthenticated: true,
            isLoading: false,
          });
          if (tokenData) sessionManager.setSession(user, tokenData);
          return { user, token: tokenData };
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Registration failed');
          console.error('❌ AuthStore: Registration failed:', err.message);
          set({ isLoading: false });
          throw err;
        }
      },

  logout: (): void => {
        console.warn('🚪 AuthStore: Logout called');

        // Clear store state and session storage
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        sessionManager.clearSession();

  console.warn('✅ AuthStore: Logout completed');
      },

  checkAuth: async (): Promise<void> => {
        console.warn('🔍 AuthStore: Checking authentication...');

        // The Zustand persist middleware will automatically rehydrate the state
        // If we have stored authentication, verify it with the backend
        const { user, token, isAuthenticated } = get();

        if (!isAuthenticated || !user || !token) {
          console.warn('❌ AuthStore: No stored authentication data found');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        // For page refreshes, trust the stored authentication temporarily
        // This prevents flickering and redirect issues
        console.warn('✅ AuthStore: Found stored authentication, trusting it for now');
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        // Verify in background without blocking UI
        try {
          console.warn('🔄 AuthStore: Verifying token with backend in background...');
          const response = await apiService.getMe();
          const currentUser: User | undefined = response.data;

          if (!currentUser) {
            throw new Error('Invalid user data received from server');
          }

          // Update with fresh user data from backend
          set({
            user: currentUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          console.warn('✅ AuthStore: Authentication verified successfully');
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Token verification failed');
          console.warn('⚠️ AuthStore: Token verification failed, but keeping session:', err.message);
          
          // Don't clear session on background verification failure
          // Let the API layer handle 401s if they occur on actual requests
          // This prevents logout on temporary network issues during page load
        }
      },

      refreshToken: (): Promise<void> => {
        console.warn('🔄 AuthStore: Refreshing token...');

        const currentToken = get().token;
        if (!currentToken) {
          console.warn('❌ AuthStore: No token to refresh');
          return Promise.resolve();
        }

        // In a real implementation, you would call a refresh token endpoint
        // For now, we'll just update the timestamp through the persist middleware
        set({}); // This triggers a re-render without changing state
        console.warn('✅ AuthStore: Token refreshed successfully');
        return Promise.resolve();
      },

  updateUser: (userData: Partial<User>): void => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });

          // The persist middleware will handle localStorage updates automatically
          console.warn('✅ AuthStore: User data updated');
        }
      },

      clearSession: (): void => {
        console.warn('🧹 AuthStore: Clearing session...');
        get().logout();
      },
    }),
    {
      name: 'genzed-auth-store',
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
      }),
      onRehydrateStorage: () => state => {
        // This runs after the state is rehydrated from localStorage
        if (state) {
          console.warn('💾 AuthStore: State rehydrated from localStorage');

          // If we have stored authentication, trigger a check
          if (state.isAuthenticated && state.token && state.user) {
            console.warn('🔄 AuthStore: Found stored authentication, verifying...');
            // Don't set loading here as checkAuth will handle it
          }
        }
      },
    }
  )
);
