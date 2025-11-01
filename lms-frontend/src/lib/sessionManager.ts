import type { User } from '@/types';
import { LOCAL_STORAGE_KEYS, AUTH_CONFIG } from '@/lib/constants';

export interface SessionData {
  user: User;
  token: string;
  timestamp: number;
  isActive: boolean;
}

export class SessionManager {
  private static instance: SessionManager;

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private constructor() {}

  /**
   * Store authentication session data
   */
  public setSession(user: User, token: string): void {
    const sessionData: SessionData = {
      user,
      token,
      timestamp: Date.now(),
      isActive: true,
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP, sessionData.timestamp.toString());
      localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_ACTIVE, 'true');
    } catch (error) {
      console.error('Failed to store session data:', error);
      throw new Error('Failed to save session data');
    }
  }

  /**
   * Get stored session data
   */
  public getSession(): SessionData | null {
    try {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
      const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
      const timestampStr = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);
      const isActive = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ACTIVE);

      if (!token || !userStr || !timestampStr || isActive !== 'true') {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const user = JSON.parse(userStr) as User;

      return {
        user,
        token,
        timestamp,
        isActive: true,
      };
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Check if session is valid and not expired
   */
  public isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    const now = Date.now();
    const sessionAge = now - session.timestamp;

    return sessionAge < AUTH_CONFIG.SESSION_TIMEOUT;
  }

  /**
   * Update session timestamp (extend session)
   */
  public refreshSession(): void {
    const session = this.getSession();
    if (session) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());
    }
  }

  /**
   * Clear all session data
   */
  public clearSession(): void {
    try {
      Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  /**
   * Update user data in session
   */
  public updateUser(user: Partial<User>): void {
    const session = this.getSession();
    if (session) {
      const updatedUser = { ...session.user, ...user };
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  }

  /**
   * Get stored token
   */
  public getToken(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
  }

  /**
   * Get stored user
   */
  public getUser(): User | null {
    try {
      const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
      return userStr ? (JSON.parse(userStr) as User) : null;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      this.clearSession();
      return null;
    }
  }
}

export const sessionManager = SessionManager.getInstance();
