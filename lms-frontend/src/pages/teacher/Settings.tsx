import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, User, Shield, Bell, CreditCard, Camera, Edit, Save, Key, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editedProfile, setEditedProfile] = useState<any>({});
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeacherProfile();
      if (response.success && response.data) {
        const profile = response.data;
        // Parse subjects if it's a string
        if (typeof profile.subjects === 'string') {
          try {
            profile.subjects = JSON.parse(profile.subjects);
          } catch (e) {
            profile.subjects = [];
          }
        }
        setUserProfile(profile);
        setEditedProfile(profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await apiService.updateTeacherProfile({
        name: editedProfile.name,
        phone: editedProfile.phone,
        bio: editedProfile.bio,
        subjects: editedProfile.subjects,
        experience: editedProfile.experience
      });
      
      if (response.success) {
        toast.success('Profile updated successfully');
        await fetchProfile();
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        toast.success('Password changed successfully');
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-12 h-12 animate-spin text-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Settings className='w-10 h-10 text-red-600' />
            </div>
            <p className='text-xl mb-4 text-gray-900 font-semibold'>Failed to load profile</p>
            <p className='text-gray-600 mb-6'>Please check your connection and try again</p>
            <Button onClick={fetchProfile} className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'>
              <Loader2 className='w-4 h-4 mr-2' />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden p-6'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      
      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <Settings className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <User className='w-6 h-6 text-white' />
        </div>
      </div>

      <div className='relative z-10'>
        <div className='mb-8'>
          <div className='bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)]'></div>
            <div className='flex items-center justify-between relative z-10'>
              <div>
                <h1 className='text-3xl font-bold mb-2 flex items-center gap-3'>
                  <Settings className='w-8 h-8' />
                  Settings
                </h1>
                <p className='text-blue-100 text-lg'>Manage your profile and preferences</p>
              </div>
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className='bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg'
              >
                {saving ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className='relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Profile Settings */}
          <div className='lg:col-span-2 space-y-6'>
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-gray-900'>
                  <User className='w-5 h-5 text-blue-600' />
                  Profile Information
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <div className='w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg'>
                    <span className='text-2xl font-bold text-white'>{userProfile?.name?.charAt(0) || 'T'}</span>
                  </div>
                  <div className='flex-1'>
                    <Button
                      variant='outline'
                      className='border-gray-300 text-gray-700 hover:bg-gray-50'
                    >
                      <Camera className='h-4 w-4 mr-2' />
                      Change Photo
                    </Button>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Full Name</label>
                    <input
                      type='text'
                      value={editedProfile.name || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      className='w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Email</label>
                    <input
                      type='email'
                      value={userProfile.email || ''}
                      disabled
                      className='w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Phone</label>
                    <input
                      type='tel'
                      value={editedProfile.phone || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      className='w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Experience</label>
                    <input
                      type='text'
                      value={editedProfile.experience || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, experience: e.target.value })}
                      className='w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='e.g., 5 years'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Bio</label>
                  <textarea
                    rows={3}
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    className='w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Tell students about yourself...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Subjects</label>
                  <div className='flex flex-wrap gap-2'>
                    {(editedProfile.subjects || []).map((subject: string, index: number) => (
                      <Badge key={index} className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
                        {subject}
                      </Badge>
                    ))}
                    <Button
                      variant='outline'
                      className='border-gray-300 text-gray-700 hover:bg-gray-50'
                      size='sm'
                    >
                      <Edit className='h-4 w-4 mr-2' />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-gray-900'>
                  <Shield className='w-5 h-5 text-green-600' />
                  Security
                </CardTitle>
                <CardDescription className='text-gray-600'>
                  Manage your account security
                </CardDescription>
              </CardHeader>
            <CardContent className='space-y-4'>
              <Button 
                onClick={() => setShowPasswordDialog(true)}
                className='w-full justify-start bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white'
              >
                <Key className='h-4 w-4 mr-2' />
                Change Password
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                Enable Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardHeader>
              <CardTitle className='text-gray-900'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                className='w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                size='sm'
              >
                <Bell className='h-4 w-4 mr-2' />
                Notification Settings
              </Button>
              <Button
                className='w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50'
                variant='outline'
                size='sm'
              >
                <CreditCard className='h-4 w-4 mr-2' />
                Payment Methods
              </Button>
              <Button
                className='w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50'
                variant='outline'
                size='sm'
              >
                <Settings className='h-4 w-4 mr-2' />
                App Preferences
              </Button>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardHeader>
              <CardTitle className='text-gray-900'>Account Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-700'>Email Verified</span>
                <Badge className={userProfile.emailVerified ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>
                  {userProfile.emailVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-700'>Phone Verified</span>
                <Badge className={userProfile.phoneVerified ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>
                  {userProfile.phoneVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-700'>Account Status</span>
                <Badge className={userProfile.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                  {userProfile.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className='bg-white text-gray-900 border-gray-200'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Key className='h-5 w-5' />
              Change Password
            </DialogTitle>
            <DialogDescription className='text-gray-400'>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='currentPassword' className='text-gray-300'>
                Current Password
              </Label>
              <Input
                id='currentPassword'
                type='password'
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className='bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                placeholder='Enter current password'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='newPassword' className='text-gray-300'>
                New Password
              </Label>
              <Input
                id='newPassword'
                type='password'
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className='bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                placeholder='Enter new password'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='text-gray-300'>
                Confirm New Password
              </Label>
              <Input
                id='confirmPassword'
                type='password'
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className='bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                placeholder='Confirm new password'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className='border-gray-600 text-gray-300 hover:bg-gray-700'
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={saving}
              className='bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700'
            >
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
