import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Mail, MessageSquare, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  requestNotificationPermission,
  hasNotificationPermission,
  initializeFCM,
} from '@/services/fcm';

interface NotificationPreferences {
  email: {
    enabled: boolean;
    assignments: boolean;
    grades: boolean;
    announcements: boolean;
    reminders: boolean;
  };
  push: {
    enabled: boolean;
    assignments: boolean;
    grades: boolean;
    announcements: boolean;
    liveClasses: boolean;
  };
  sms: {
    enabled: boolean;
    urgentOnly: boolean;
  };
}

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      assignments: true,
      grades: true,
      announcements: true,
      reminders: true,
    },
    push: {
      enabled: false,
      assignments: true,
      grades: true,
      announcements: true,
      liveClasses: true,
    },
    sms: {
      enabled: false,
      urgentOnly: true,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notification-preferences/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setPreferences(result.data);
          }
        }

        // Check notification permission
        setHasPermission(hasNotificationPermission());
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPreferences();
  }, []);

  const handleTogglePushNotifications = async (enabled: boolean) => {
    if (enabled) {
      // Request permission and initialize FCM
      const hasPermissionNow = await requestNotificationPermission();
      
      if (!hasPermissionNow) {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return;
      }

      // Initialize FCM
      const initialized = await initializeFCM();
      
      if (initialized) {
        setHasPermission(true);
        setPreferences(prev => ({
          ...prev,
          push: { ...prev.push, enabled: true },
        }));
        
        toast({
          title: 'Success',
          description: 'Push notifications enabled successfully',
        });
      } else {
        toast({
          title: 'Configuration Required',
          description: 'Firebase SDK needs to be configured for push notifications',
          variant: 'destructive',
        });
      }
    } else {
      setPreferences(prev => ({
        ...prev,
        push: { ...prev.push, enabled: false },
      }));
    }
  };

  const updatePreference = (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/notification-preferences/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Notification preferences saved',
        });
      } else {
        throw new Error(result.message ?? 'Failed to save preferences');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center h-48'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-0'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-6 w-6 text-blue-600' />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications about your courses and activities
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Browser Permission Warning */}
      {!hasPermission && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Browser notifications are currently disabled. Enable push notifications below to receive
            real-time alerts.
          </AlertDescription>
        </Alert>
      )}

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5 text-purple-600' />
            Push Notifications
          </CardTitle>
          <CardDescription>Get instant alerts on this device</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='font-medium'>Enable Push Notifications</p>
              <p className='text-sm text-gray-500'>Receive browser notifications</p>
            </div>
            <Switch
              checked={preferences.push.enabled}
              onCheckedChange={value => {
                void handleTogglePushNotifications(value);
              }}
            />
          </div>

          {preferences.push.enabled && (
            <div className='space-y-3 pl-4 border-l-2 border-purple-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <BookOpen className='h-4 w-4 text-gray-600' />
                  <span className='text-sm'>New Assignments</span>
                </div>
                <Switch
                  checked={preferences.push.assignments}
                  onCheckedChange={value => {
                    updatePreference('push', 'assignments', value);
                  }}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <MessageSquare className='h-4 w-4 text-gray-600' />
                  <span className='text-sm'>Grades Posted</span>
                </div>
                <Switch
                  checked={preferences.push.grades}
                  onCheckedChange={value => {
                    updatePreference('push', 'grades', value);
                  }}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Bell className='h-4 w-4 text-gray-600' />
                  <span className='text-sm'>Announcements</span>
                </div>
                <Switch
                  checked={preferences.push.announcements}
                  onCheckedChange={value => {
                    updatePreference('push', 'announcements', value);
                  }}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-gray-600' />
                  <span className='text-sm'>Live Class Reminders</span>
                </div>
                <Switch
                  checked={preferences.push.liveClasses}
                  onCheckedChange={value => {
                    updatePreference('push', 'liveClasses', value);
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Mail className='h-5 w-5 text-blue-600' />
            Email Notifications
          </CardTitle>
          <CardDescription>Receive updates via email</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='font-medium'>Enable Email Notifications</p>
              <p className='text-sm text-gray-500'>Receive email updates</p>
            </div>
            <Switch
              checked={preferences.email.enabled}
              onCheckedChange={value => {
                updatePreference('email', 'enabled', value);
              }}
            />
          </div>

          {preferences.email.enabled && (
            <div className='space-y-3 pl-4 border-l-2 border-blue-200'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Assignment Notifications</span>
                <Switch
                  checked={preferences.email.assignments}
                  onCheckedChange={value => {
                    updatePreference('email', 'assignments', value);
                  }}
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm'>Grade Updates</span>
                <Switch
                  checked={preferences.email.grades}
                  onCheckedChange={value => {
                    updatePreference('email', 'grades', value);
                  }}
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm'>Announcements</span>
                <Switch
                  checked={preferences.email.announcements}
                  onCheckedChange={value => {
                    updatePreference('email', 'announcements', value);
                  }}
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm'>Class Reminders</span>
                <Switch
                  checked={preferences.email.reminders}
                  onCheckedChange={value => {
                    updatePreference('email', 'reminders', value);
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5 text-green-600' />
            SMS Notifications
          </CardTitle>
          <CardDescription>Get text messages for important updates</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='font-medium'>Enable SMS Notifications</p>
              <p className='text-sm text-gray-500'>Receive text message alerts</p>
            </div>
            <Switch
              checked={preferences.sms.enabled}
              onCheckedChange={value => {
                updatePreference('sms', 'enabled', value);
              }}
            />
          </div>

          {preferences.sms.enabled && (
            <div className='space-y-3 pl-4 border-l-2 border-green-200'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Urgent Only</span>
                  <p className='text-xs text-gray-500'>
                    Only send SMS for critical updates
                  </p>
                </div>
                <Switch
                  checked={preferences.sms.urgentOnly}
                  onCheckedChange={value => {
                    updatePreference('sms', 'urgentOnly', value);
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end gap-3'>
        <Button
          variant='outline'
          onClick={() => {
            window.location.reload();
          }}
        >
          <BellOff className='mr-2 h-4 w-4' />
          Cancel
        </Button>
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};
