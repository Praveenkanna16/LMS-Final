/**
 * FCM (Firebase Cloud Messaging) Service
 * Handles notification token registration and management
 * 
 * NOTE: This requires Firebase SDK to be installed and configured.
 * Run: npm install firebase
 * Add firebase-messaging-sw.js to public folder
 */

interface FCMTokenResponse {
  success: boolean;
  message?: string;
}

/**
 * Request notification permission from browser
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Get FCM token
 * NOTE: Requires Firebase messaging instance
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Check if Firebase is available
    // In production, you would:
    // import { getMessaging, getToken } from 'firebase/messaging';
    // const messaging = getMessaging(app);
    // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
    
    // For now, return null and handle gracefully
    console.warn('Firebase SDK not configured. Please install: npm install firebase');
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFCMToken = async (token: string): Promise<FCMTokenResponse> => {
  try {
    const response = await fetch('/api/notifications/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        fcmToken: token,
        platform: 'web',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to register token',
    };
  }
};

/**
 * Initialize FCM on login
 * Call this after successful authentication
 */
export const initializeFCM = async (): Promise<boolean> => {
  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return false;
    }

    // Get FCM token
    const token = await getFCMToken();
    
    if (!token) {
      console.log('Could not retrieve FCM token');
      return false;
    }

    // Register with backend
    const result = await registerFCMToken(token);
    
    if (result.success) {
      console.log('FCM token registered successfully');
      localStorage.setItem('fcm_token', token);
      return true;
    } else {
      console.error('Failed to register FCM token:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return false;
  }
};

/**
 * Check if user has notification permissions
 */
export const hasNotificationPermission = (): boolean => {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

/**
 * Get current notification permission status
 */
export const getNotificationPermissionStatus = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};
