import React, { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea'; // Imported Textarea
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Camera,
  Save,
  Eye,
  EyeOff,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  Volume2,
  VolumeX,
  Monitor,
  Moon,
  Sun,
  Sparkles,
  Users,
  Video,
  Target,
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mock current settings - replace with actual API calls
  const [profile, setProfile] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '2000-01-15',
    location: 'New York, USA',
    bio: 'Passionate student eager to learn and grow in mathematics and physics.',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    classReminders: true,
    assignmentDeadlines: true,
    gradeUpdates: true,
    studyMaterials: true,
    achievements: true,
    soundEnabled: true,
    darkMode: false,
    language: 'en',
    timezone: 'America/New_York',
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showProgress: true,
    showAchievements: true,
    showActivity: true,
    allowMessages: true,
    showOnlineStatus: true,
  });

  const handleSaveProfile = () => {
    // TODO: Implement API call to save profile
    setIsEditing(false);
  };

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePrivacyChange = (key: string, value: boolean | string) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Layout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold mb-2'>Settings</h1>
                <p className='text-indigo-100 text-lg'>
                  Customize your learning experience and preferences
                </p>
              </div>
              <div className='hidden md:block'>
                <div className='w-20 h-20 bg-white/20 rounded-full flex items-center justify-center'>
                  <Settings className='w-10 h-10' />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-4xl mx-auto'>
          <Tabs defaultValue='profile' className='space-y-8'>
            <TabsList className='grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-2 shadow-lg'>
              <TabsTrigger
                value='profile'
                className='flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300'
              >
                <User className='w-4 h-4' />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value='notifications'
                className='flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300'
              >
                <Bell className='w-4 h-4' />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value='privacy'
                className='flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300'
              >
                <Shield className='w-4 h-4' />
                Privacy
              </TabsTrigger>
              <TabsTrigger
                value='preferences'
                className='flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300'
              >
                <Palette className='w-4 h-4' />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value='profile'>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-indigo-600'>
                    <User className='w-5 h-5' />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Profile Picture */}
                  <div className='flex items-center gap-6'>
                    <div className='relative'>
                      <img
                        src={profile.profilePicture}
                        alt='Profile'
                        className='w-20 h-20 rounded-full border-4 border-white shadow-lg'
                      />
                      <Button
                        size='sm'
                        variant='outline'
                        className='absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0'
                      >
                        <Camera className='w-4 h-4' />
                      </Button>
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-900'>{profile.name}</h3>
                      <p className='text-sm text-gray-600'>Student</p>
                      {/* Changed from StudentButton to Button */}
                      <Button size='sm' variant='outline' className='mt-2'>
                        Change Photo
                      </Button>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Full Name</Label>
                      <Input
                        id='name'
                        value={profile.name}
                        onChange={e => {
                          setProfile(prev => ({ ...prev, name: e.target.value }));
                        }}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='email'>Email Address</Label>
                      <Input
                        id='email'
                        type='email'
                        value={profile.email}
                        onChange={e => {
                          setProfile(prev => ({ ...prev, email: e.target.value }));
                        }}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='phone'>Phone Number</Label>
                      <Input
                        id='phone'
                        value={profile.phone}
                        onChange={e => {
                          setProfile(prev => ({ ...prev, phone: e.target.value }));
                        }}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='dob'>Date of Birth</Label>
                      <Input
                        id='dob'
                        type='date'
                        value={profile.dateOfBirth}
                        onChange={e => {
                          setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }));
                        }}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='location'>Location</Label>
                      <Input
                        id='location'
                        value={profile.location}
                        onChange={e => {
                          setProfile(prev => ({ ...prev, location: e.target.value }));
                        }}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bio'>Bio</Label>
                    {/* Replaced manual textarea with shadcn/ui Textarea */}
                    <Textarea
                      id='bio'
                      rows={3}
                      value={profile.bio}
                      onChange={e => {
                        setProfile(prev => ({ ...prev, bio: e.target.value }));
                      }}
                      disabled={!isEditing}
                      placeholder='Tell us about yourself...'
                    />
                  </div>

                  <div className='flex items-center justify-between pt-4'>
                    {isEditing ? (
                      <div className='flex gap-2'>
                        {/* Changed from StudentButton to Button */}
                        <Button
                          onClick={handleSaveProfile}
                          className='bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
                        >
                          <Save className='w-4 h-4 mr-2' />
                          Save Changes
                        </Button>
                        {/* Changed from StudentButton to Button */}
                        <Button
                          variant='outline'
                          onClick={() => {
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      // Changed from StudentButton to Button
                      <Button
                        onClick={() => {
                          setIsEditing(true);
                        }}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value='notifications'>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-blue-600'>
                    <Bell className='w-5 h-5' />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Email Notifications</Label>
                        <p className='text-sm text-gray-500'>Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={checked => {
                          handlePreferenceChange('emailNotifications', checked);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Push Notifications</Label>
                        <p className='text-sm text-gray-500'>
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={preferences.pushNotifications}
                        onCheckedChange={checked => {
                          handlePreferenceChange('pushNotifications', checked);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>SMS Notifications</Label>
                        <p className='text-sm text-gray-500'>
                          Receive important notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={preferences.smsNotifications}
                        onCheckedChange={checked => {
                          handlePreferenceChange('smsNotifications', checked);
                        }}
                      />
                    </div>
                  </div>

                  <div className='pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Notification Types</h3>
                    <div className='space-y-4'>
                      {[
                        {
                          key: 'classReminders',
                          label: 'Class Reminders',
                          desc: 'Get notified before classes start',
                        },
                        {
                          key: 'assignmentDeadlines',
                          label: 'Assignment Deadlines',
                          desc: 'Reminders for upcoming deadlines',
                        },
                        {
                          key: 'gradeUpdates',
                          label: 'Grade Updates',
                          desc: 'When new grades are posted',
                        },
                        {
                          key: 'studyMaterials',
                          label: 'Study Materials',
                          desc: 'When new content is uploaded',
                        },
                        {
                          key: 'achievements',
                          label: 'Achievements',
                          desc: 'When you earn badges',
                        },
                      ].map(item => (
                        <div key={item.key} className='flex items-center justify-between'>
                          <div className='space-y-0.5'>
                            <Label className='text-base'>{item.label}</Label>
                            <p className='text-sm text-gray-500'>{item.desc}</p>
                          </div>
                          <Switch
                            checked={preferences[item.key as keyof typeof preferences] as boolean}
                            onCheckedChange={checked => {
                              handlePreferenceChange(item.key, checked);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value='privacy'>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-purple-600'>
                    <Shield className='w-5 h-5' />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription>
                    Control your privacy settings and data visibility
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Profile Visibility</Label>
                        <p className='text-sm text-gray-500'>
                          Who can see your profile information
                        </p>
                      </div>
                      <select
                        value={privacy.profileVisibility}
                        onChange={e => {
                          handlePrivacyChange('profileVisibility', e.target.value);
                        }}
                        className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500'
                      >
                        <option value='public'>Public</option>
                        <option value='teachers'>Teachers Only</option>
                        <option value='private'>Private</option>
                      </select>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Show Learning Progress</Label>
                        <p className='text-sm text-gray-500'>
                          Display your course progress to others
                        </p>
                      </div>
                      <Switch
                        checked={privacy.showProgress}
                        onCheckedChange={checked => {
                          handlePrivacyChange('showProgress', checked);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Show Achievements</Label>
                        <p className='text-sm text-gray-500'>
                          Display earned badges and achievements
                        </p>
                      </div>
                      <Switch
                        checked={privacy.showAchievements}
                        onCheckedChange={checked => {
                          handlePrivacyChange('showAchievements', checked);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Show Activity Status</Label>
                        <p className='text-sm text-gray-500'>Let others see when you're online</p>
                      </div>
                      <Switch
                        checked={privacy.showOnlineStatus}
                        onCheckedChange={checked => {
                          handlePrivacyChange('showOnlineStatus', checked);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Allow Direct Messages</Label>
                        <p className='text-sm text-gray-500'>
                          Receive messages from other students
                        </p>
                      </div>
                      <Switch
                        checked={privacy.allowMessages}
                        onCheckedChange={checked => {
                          handlePrivacyChange('allowMessages', checked);
                        }}
                      />
                    </div>
                  </div>

                  <div className='pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Security</h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-0.5'>
                          <Label className='text-base'>Two-Factor Authentication</Label>
                          <p className='text-sm text-gray-500'>
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        {/* Changed from StudentButton to Button */}
                        <Button variant='outline'>Enable 2FA</Button>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='space-y-0.5'>
                          <Label className='text-base'>Change Password</Label>
                          <p className='text-sm text-gray-500'>Update your account password</p>
                        </div>
                        {/* Changed from StudentButton to Button */}
                        <Button variant='outline'>Change Password</Button>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='space-y-0.5'>
                          <Label className='text-base'>Download My Data</Label>
                          <p className='text-sm text-gray-500'>Export all your account data</p>
                        </div>
                        {/* Changed from StudentButton to Button */}
                        <Button variant='outline'>Download</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value='preferences'>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-indigo-600'>
                    <Palette className='w-5 h-5' />
                    App Preferences
                  </CardTitle>
                  <CardDescription>Customize your learning environment</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Dark Mode</Label>
                        <p className='text-sm text-gray-500'>
                          Switch between light and dark themes
                        </p>
                      </div>
                      <Switch
                        checked={preferences.darkMode}
                        onCheckedChange={checked => {
                          handlePreferenceChange('darkMode', checked);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Sound Effects</Label>
                        <p className='text-sm text-gray-500'>
                          Play sounds for notifications and interactions
                        </p>
                      </div>
                      <Switch
                        checked={preferences.soundEnabled}
                        onCheckedChange={checked => {
                          handlePreferenceChange('soundEnabled', checked);
                        }}
                      />
                    </div>
                  </div>

                  <div className='pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Language & Region</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <Label htmlFor='language'>Language</Label>
                        <select
                          id='language'
                          value={preferences.language}
                          onChange={e => {
                            handlePreferenceChange('language', e.target.value);
                          }}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        >
                          <option value='en'>English</option>
                          <option value='es'>Español</option>
                          <option value='fr'>Français</option>
                          <option value='de'>Deutsch</option>
                        </select>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='timezone'>Timezone</Label>
                        <select
                          id='timezone'
                          value={preferences.timezone}
                          onChange={e => {
                            handlePreferenceChange('timezone', e.target.value);
                          }}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        >
                          <option value='America/New_York'>Eastern Time</option>
                          <option value='America/Chicago'>Central Time</option>
                          <option value='America/Denver'>Mountain Time</option>
                          <option value='America/Los_Angeles'>Pacific Time</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className='pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Study Preferences</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <Label htmlFor='studyGoal'>Daily Study Goal (hours)</Label>
                        <Input id='studyGoal' type='number' defaultValue='2' className='w-full' />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='reminderTime'>Study Reminder Time</Label>
                        <Input
                          id='reminderTime'
                          type='time'
                          defaultValue='19:00'
                          className='w-full'
                        />
                      </div>
                    </div>
                  </div>

                  <div className='pt-6 border-t border-gray-200'>
                    {/* Changed from StudentButton to Button */}
                    <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'>
                      <Save className='w-4 h-4 mr-2' />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
