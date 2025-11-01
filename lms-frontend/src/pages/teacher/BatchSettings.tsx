import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Settings, Loader2, Save, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Batch } from '@/types';

const BatchSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    name: '',
    studentLimit: 30,
    enrollmentType: 'open',
    isActive: true,
    isPublished: true,
    allowWaitlist: true,
    autoEnrollment: false,
    notificationsEnabled: true,
    recordingEnabled: true,
    chatEnabled: true,
  });

  useEffect(() => {
    const fetchBatchDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await apiService.getBatchById(id);
        const batchData = (response?.data as any)?.batch;
        
        if (batchData) {
          setBatch(batchData);
          
          // Parse settings from batch data
          const batchSettings = typeof batchData.settings === 'string' 
            ? JSON.parse(batchData.settings || '{}')
            : batchData.settings || {};

          setSettings({
            name: batchData.name || '',
            studentLimit: batchData.studentLimit || 30,
            enrollmentType: batchData.enrollmentType || 'open',
            isActive: batchSettings.isActive !== undefined ? batchSettings.isActive : true,
            isPublished: batchSettings.isPublished !== undefined ? batchSettings.isPublished : true,
            allowWaitlist: batchSettings.allowWaitlist !== undefined ? batchSettings.allowWaitlist : true,
            autoEnrollment: batchSettings.autoEnrollment !== undefined ? batchSettings.autoEnrollment : false,
            notificationsEnabled: batchSettings.notificationsEnabled !== undefined ? batchSettings.notificationsEnabled : true,
            recordingEnabled: batchSettings.recordingEnabled !== undefined ? batchSettings.recordingEnabled : true,
            chatEnabled: batchSettings.chatEnabled !== undefined ? batchSettings.chatEnabled : true,
          });
        }
      } catch (error) {
        console.error('Failed to fetch batch details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load batch settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchBatchDetails();
  }, [id, toast]);

  const handleSaveSettings = async () => {
    if (!id) return;

    try {
      setSaving(true);

      // Update batch basic info
      await apiService.updateBatch(id, {
        name: settings.name,
        maxStudents: settings.studentLimit,
      });

      // Update batch settings
      await apiService.updateBatchSettings(id, {
        isActive: settings.isActive,
        isPublished: settings.isPublished,
        allowWaitlist: settings.allowWaitlist,
        autoEnrollment: settings.autoEnrollment,
        notificationsEnabled: settings.notificationsEnabled,
        recordingEnabled: settings.recordingEnabled,
        chatEnabled: settings.chatEnabled,
      });

      toast({
        title: 'Success',
        description: 'Batch settings updated successfully',
      });

      // Refresh batch data
      const response = await apiService.getBatchById(id);
      const batchData = (response?.data as any)?.batch;
      if (batchData) {
        setBatch(batchData);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update batch settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin mx-auto mb-4 text-purple-500' />
          <h2 className='text-xl font-semibold mb-2'>Loading Settings</h2>
          <p className='text-gray-600'>Fetching batch settings...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Batch Not Found</h2>
          <p className='text-gray-600 mb-4'>The batch you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/teacher/batches')}>
            Back to Batches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <Button
          variant='outline'
          onClick={() => navigate(`/teacher/batches/${id}/manage`)}
          className='mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Management
        </Button>

        <div className='bg-gradient-to-br from-orange-600 via-red-600 to-pink-700 rounded-2xl p-8 text-white shadow-2xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Batch Settings</h1>
              <p className='text-orange-100 text-lg'>{batch.name} - Configure enrollment and limits</p>
            </div>
            <Settings className='w-12 h-12' />
          </div>
        </div>
      </div>

      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Basic Settings */}
        <Card className='border-0 shadow-xl bg-white'>
          <CardHeader>
            <CardTitle className='text-orange-600'>Basic Settings</CardTitle>
            <CardDescription>Update batch name and enrollment limits</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='batchName'>Batch Name</Label>
              <Input
                id='batchName'
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder='Enter batch name'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='studentLimit'>Student Limit</Label>
              <Input
                id='studentLimit'
                type='number'
                min='1'
                max='100'
                value={settings.studentLimit}
                onChange={(e) => setSettings({ ...settings, studentLimit: parseInt(e.target.value) })}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='enrollmentType'>Enrollment Type</Label>
              <Select
                value={settings.enrollmentType}
                onValueChange={(value) => setSettings({ ...settings, enrollmentType: value })}
              >
                <SelectTrigger id='enrollmentType'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='open'>Open Enrollment</SelectItem>
                  <SelectItem value='invite_only'>Invite Only</SelectItem>
                  <SelectItem value='approval_required'>Approval Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Status Settings */}
        <Card className='border-0 shadow-xl bg-white'>
          <CardHeader>
            <CardTitle className='text-orange-600'>Status Settings</CardTitle>
            <CardDescription>Control batch visibility and status</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Batch Active</Label>
                <p className='text-sm text-gray-500'>Enable or disable this batch</p>
              </div>
              <Switch
                checked={settings.isActive}
                onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Published</Label>
                <p className='text-sm text-gray-500'>Make batch visible to students</p>
              </div>
              <Switch
                checked={settings.isPublished}
                onCheckedChange={(checked) => setSettings({ ...settings, isPublished: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card className='border-0 shadow-xl bg-white'>
          <CardHeader>
            <CardTitle className='text-orange-600'>Feature Settings</CardTitle>
            <CardDescription>Enable or disable batch features</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Allow Waitlist</Label>
                <p className='text-sm text-gray-500'>Enable waitlist when batch is full</p>
              </div>
              <Switch
                checked={settings.allowWaitlist}
                onCheckedChange={(checked) => setSettings({ ...settings, allowWaitlist: checked })}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Auto Enrollment</Label>
                <p className='text-sm text-gray-500'>Automatically enroll students from waitlist</p>
              </div>
              <Switch
                checked={settings.autoEnrollment}
                onCheckedChange={(checked) => setSettings({ ...settings, autoEnrollment: checked })}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Notifications Enabled</Label>
                <p className='text-sm text-gray-500'>Send notifications to batch students</p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Recording Enabled</Label>
                <p className='text-sm text-gray-500'>Allow recording of live classes</p>
              </div>
              <Switch
                checked={settings.recordingEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, recordingEnabled: checked })}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Chat Enabled</Label>
                <p className='text-sm text-gray-500'>Enable chat during live classes</p>
              </div>
              <Switch
                checked={settings.chatEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, chatEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Status Summary */}
        <Card className='border-0 shadow-xl bg-gradient-to-br from-orange-50 to-red-50'>
          <CardHeader>
            <CardTitle className='text-orange-600 flex items-center gap-2'>
              <AlertCircle className='w-5 h-5' />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Status</span>
              <Badge className={settings.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                {settings.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Visibility</span>
              <Badge className={settings.isPublished ? 'bg-blue-500' : 'bg-yellow-500'}>
                {settings.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Students Enrolled</span>
              <span className='font-semibold'>{Array.isArray(batch.students) ? batch.students.length : 0} / {settings.studentLimit}</span>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className='flex justify-end gap-3'>
          <Button
            variant='outline'
            onClick={() => navigate(`/teacher/batches/${id}/manage`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className='bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='w-4 h-4 mr-2' />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchSettings;
