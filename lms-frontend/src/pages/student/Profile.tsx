import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  User,
  Mail,
  Lock,
  Settings,
  Bell,
  Shield,
  LogOut,
  Camera,
  Save,
  Sparkles,
  Globe,
  MapPin,
  Briefcase,
  Link as LinkIcon,
  Github,
  Linkedin,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLogin: string;
  createdAt: string;
  profile?: {
    bio?: string;
    location?: string;
    timezone?: string;
    learningStyle?: string;
    company?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'privacy'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Profile form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [classReminders, setClassReminders] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudentProfile();

      if (response.success && response.data) {
        setProfileData(response.data);
        setName(response.data.name || '');
        setBio(response.data.profile?.bio || '');
        setLocation(response.data.profile?.location || '');
        setCompany(response.data.profile?.company || '');
        setWebsite(response.data.profile?.website || '');
        setLinkedinUrl(response.data.profile?.linkedin || '');
        setGithubUrl(response.data.profile?.github || '');
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.updateStudentProfile({
        name: name.trim(),
        bio,
        location,
        company,
        website,
        linkedin: linkedinUrl,
        github: githubUrl,
      });

      if (response.success) {
        toast.success('Profile updated successfully');
        fetchProfile();
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.changeStudentPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
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

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (strength <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Layout>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          {/* Header */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl rotate-12 animate-bounce opacity-20' />
            <div className='absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-bounce delay-300 opacity-20' />

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 relative overflow-hidden'>
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute top-0 left-0 w-full h-full'>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className='absolute bg-white rounded-full'
                        style={{
                          width: `${Math.random() * 100 + 50}px`,
                          height: `${Math.random() * 100 + 50}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className='relative z-10 flex items-center justify-between'>
                  <div className='flex items-center gap-6'>
                    <div className='relative'>
                      <div className='w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl'>
                        {name.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <button className='absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow'>
                        <Camera className='w-5 h-5 text-blue-600' />
                      </button>
                    </div>
                    <div>
                      <div className='flex items-center gap-3 mb-2'>
                        <h1 className='text-3xl font-bold text-white'>{name || 'User'}</h1>
                        <Badge className='bg-white/20 backdrop-blur-sm text-white border-white/30'>
                          {profileData?.role || 'Student'}
                        </Badge>
                        {profileData?.emailVerified && (
                          <Badge className='bg-green-500 text-white border-0'>
                            <CheckCircle className='w-3 h-3 mr-1' />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className='text-blue-100 text-lg'>{profileData?.email}</p>
                      <p className='text-blue-200 text-sm mt-1'>
                        Member since {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="border-2 border-white/50 text-white hover:bg-white/10 hover:text-red-400 backdrop-blur-sm transition-all duration-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </Button>


                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex gap-3 flex-wrap'>
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'password', label: 'Password', icon: Lock },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'privacy', label: 'Privacy', icon: Shield },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'default' : 'outline'}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50/50'
                      }
                    >
                      <Icon className='w-4 h-4 mr-2' />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl'>
              <CardContent className='p-12'>
                <div className='text-center'>
                  <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
                  <p className='text-gray-600'>Loading profile...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                  <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center'>
                        <User className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                          Profile Information
                        </CardTitle>
                        <CardDescription>Update your personal details and information</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='p-6'>
                    <form onSubmit={handleUpdateProfile} className='space-y-6'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-2'>
                          <Label htmlFor='name' className='text-sm font-medium text-gray-700'>
                            Full Name *
                          </Label>
                          <div className='relative'>
                            <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <Input
                              id='name'
                              value={name}
                              onChange={e => setName(e.target.value)}
                              placeholder='Enter your full name'
                              className='pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                              required
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='email' className='text-sm font-medium text-gray-700'>
                            Email Address
                          </Label>
                          <div className='relative'>
                            <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <Input
                              id='email'
                              value={profileData?.email || ''}
                              disabled
                              className='pl-11 py-3 border-2 border-gray-200 rounded-xl bg-gray-50'
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='location' className='text-sm font-medium text-gray-700'>
                            Location
                          </Label>
                          <div className='relative'>
                            <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <Input
                              id='location'
                              value={location}
                              onChange={e => setLocation(e.target.value)}
                              placeholder='City, Country'
                              className='pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='company' className='text-sm font-medium text-gray-700'>
                            School/Company
                          </Label>
                          <div className='relative'>
                            <Briefcase className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <Input
                              id='company'
                              value={company}
                              onChange={e => setCompany(e.target.value)}
                              placeholder='Your school or company'
                              className='pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='website' className='text-sm font-medium text-gray-700'>
                            Website
                          </Label>
                          <div className='relative'>
                            <Globe className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <Input
                              id='website'
                              value={website}
                              onChange={e => setWebsite(e.target.value)}
                              placeholder='https://yourwebsite.com'
                              className='pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='linkedin' className='text-sm font-medium text-gray-700'>
                            LinkedIn
                          </Label>
                          <div className='relative'>
                            <Linkedin className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <Input
                              id='linkedin'
                              value={linkedinUrl}
                              onChange={e => setLinkedinUrl(e.target.value)}
                              placeholder='https://linkedin.com/in/username'
                              className='pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            />
                          </div>
                        </div>

                        <div className='space-y-2 md:col-span-2'>
                          <Label htmlFor='github' className='text-sm font-medium text-gray-700'>
                            GitHub
                          </Label>
                          <div className='relative'>
                            <Github className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <Input
                              id='github'
                              value={githubUrl}
                              onChange={e => setGithubUrl(e.target.value)}
                              placeholder='https://github.com/username'
                              className='pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            />
                          </div>
                        </div>

                        <div className='space-y-2 md:col-span-2'>
                          <Label htmlFor='bio' className='text-sm font-medium text-gray-700'>
                            Bio
                          </Label>
                          <Textarea
                            id='bio'
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder='Tell us about yourself...'
                            className='border-2 border-gray-200 rounded-xl focus:border-blue-500 min-h-[100px]'
                          />
                        </div>
                      </div>

                      <div className='flex justify-end pt-4'>
                        <Button
                          type='submit'
                          size='lg'
                          disabled={saving}
                          className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        >
                          {saving ? (
                            <>
                              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className='w-5 h-5 mr-2' />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                  <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center'>
                        <Lock className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent'>
                          Change Password
                        </CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='p-6'>
                    <form onSubmit={handleChangePassword} className='space-y-6 max-w-2xl'>
                      <div className='space-y-2'>
                        <Label htmlFor='currentPassword' className='text-sm font-medium text-gray-700'>
                          Current Password *
                        </Label>
                        <div className='relative'>
                          <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                          <Input
                            id='currentPassword'
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder='Enter current password'
                            className='pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            required
                          />
                          <button
                            type='button'
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                          >
                            {showCurrentPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                          </button>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='newPassword' className='text-sm font-medium text-gray-700'>
                          New Password *
                        </Label>
                        <div className='relative'>
                          <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                          <Input
                            id='newPassword'
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder='Enter new password'
                            className='pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            required
                          />
                          <button
                            type='button'
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                          >
                            {showNewPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                          </button>
                        </div>
                        {newPassword && (
                          <div className='space-y-2 mt-2'>
                            <div className='flex items-center justify-between text-sm'>
                              <span className='text-gray-600'>Password Strength:</span>
                              <span className={`font-medium ${passwordStrength.label === 'Weak' ? 'text-red-600' : passwordStrength.label === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                              <div
                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                style={{ width: passwordStrength.width }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='confirmPassword' className='text-sm font-medium text-gray-700'>
                          Confirm New Password *
                        </Label>
                        <div className='relative'>
                          <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                          <Input
                            id='confirmPassword'
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder='Confirm new password'
                            className='pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                            required
                          />
                          <button
                            type='button'
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                          >
                            {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                          </button>
                        </div>
                      </div>

                      <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
                        <div className='flex gap-3'>
                          <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                          <div className='space-y-1'>
                            <p className='text-sm font-medium text-blue-900'>Password Requirements:</p>
                            <ul className='text-sm text-blue-700 space-y-1'>
                              <li>• At least 8 characters long</li>
                              <li>• Contains uppercase and lowercase letters</li>
                              <li>• Contains at least one number</li>
                              <li>• Contains at least one special character (!@#$%^&*)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className='flex justify-end pt-4'>
                        <Button
                          type='submit'
                          size='lg'
                          disabled={saving}
                          className='bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white'
                        >
                          {saving ? (
                            <>
                              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                              Changing...
                            </>
                          ) : (
                            <>
                              <Lock className='w-5 h-5 mr-2' />
                              Change Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                  <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                        <Bell className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                          Notification Preferences
                        </CardTitle>
                        <CardDescription>Manage how you receive notifications</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='p-6'>
                    <div className='space-y-6 max-w-2xl'>
                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200'>
                        <div>
                          <p className='font-medium text-gray-900'>Email Notifications</p>
                          <p className='text-sm text-gray-600'>Receive notifications via email</p>
                        </div>
                        <Button
                          variant={emailNotifications ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={emailNotifications ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {emailNotifications ? 'On' : 'Off'}
                        </Button>
                      </div>

                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200'>
                        <div>
                          <p className='font-medium text-gray-900'>Push Notifications</p>
                          <p className='text-sm text-gray-600'>Receive push notifications in browser</p>
                        </div>
                        <Button
                          variant={pushNotifications ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setPushNotifications(!pushNotifications)}
                          className={pushNotifications ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {pushNotifications ? 'On' : 'Off'}
                        </Button>
                      </div>

                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200'>
                        <div>
                          <p className='font-medium text-gray-900'>Class Reminders</p>
                          <p className='text-sm text-gray-600'>Get notified before classes start</p>
                        </div>
                        <Button
                          variant={classReminders ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setClassReminders(!classReminders)}
                          className={classReminders ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {classReminders ? 'On' : 'Off'}
                        </Button>
                      </div>

                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200'>
                        <div>
                          <p className='font-medium text-gray-900'>Assignment Reminders</p>
                          <p className='text-sm text-gray-600'>Get notified about assignment deadlines</p>
                        </div>
                        <Button
                          variant={assignmentReminders ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setAssignmentReminders(!assignmentReminders)}
                          className={assignmentReminders ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {assignmentReminders ? 'On' : 'Off'}
                        </Button>
                      </div>

                      <div className='flex justify-end pt-4'>
                        <Button
                          size='lg'
                          className='bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                          onClick={() => toast.success('Notification preferences saved')}
                        >
                          <Save className='w-5 h-5 mr-2' />
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                  <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center'>
                        <Shield className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'>
                          Privacy & Security
                        </CardTitle>
                        <CardDescription>Manage your privacy and security settings</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='p-6'>
                    <div className='space-y-6 max-w-2xl'>
                      <div className='p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200'>
                        <div className='flex items-start gap-3'>
                          <CheckCircle className='w-5 h-5 text-blue-600 mt-0.5' />
                          <div>
                            <p className='font-medium text-gray-900'>Profile Visibility</p>
                            <p className='text-sm text-gray-600 mt-1'>Your profile is visible to other students and teachers in your batches</p>
                          </div>
                        </div>
                      </div>

                      <div className='p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200'>
                        <div className='flex items-start gap-3'>
                          <CheckCircle className='w-5 h-5 text-green-600 mt-0.5' />
                          <div>
                            <p className='font-medium text-gray-900'>Data Encryption</p>
                            <p className='text-sm text-gray-600 mt-1'>Your data is encrypted and securely stored</p>
                          </div>
                        </div>
                      </div>

                      <div className='p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200'>
                        <div className='flex items-start gap-3'>
                          <CheckCircle className='w-5 h-5 text-purple-600 mt-0.5' />
                          <div>
                            <p className='font-medium text-gray-900'>Two-Factor Authentication</p>
                            <p className='text-sm text-gray-600 mt-1'>Coming soon - Add an extra layer of security</p>
                          </div>
                        </div>
                      </div>

                      <div className='p-6 bg-red-50 border-2 border-red-200 rounded-xl'>
                        <div className='flex items-start gap-3 mb-4'>
                          <AlertCircle className='w-6 h-6 text-red-600 flex-shrink-0 mt-0.5' />
                          <div>
                            <p className='font-bold text-red-900 text-lg'>Danger Zone</p>
                            <p className='text-sm text-red-700 mt-1'>Actions in this section are permanent and cannot be undone</p>
                          </div>
                        </div>
                        <div className='space-y-3 mt-4'>
                          <Button
                            variant='outline'
                            className='w-full border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                            onClick={handleLogout}
                          >
                            <LogOut className='w-4 h-4 mr-2' />
                            Logout from All Devices
                          </Button>
                          <Button
                            variant='outline'
                            className='w-full border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                toast.error('Account deletion is not available at this time');
                              }
                            }}
                          >
                            <AlertCircle className='w-4 h-4 mr-2' />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
