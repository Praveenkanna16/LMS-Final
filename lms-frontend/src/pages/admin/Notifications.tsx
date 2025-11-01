import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useAllNotifications, 
  useSendNotification, 
  useScheduleNotification, 
  useDeleteNotification,
} from '@/hooks/api';
import {
  Bell,
  Search,
  Send,
  Eye,
  Edit,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  MessageSquare,
  Trash2,
  RefreshCw,
} from 'lucide-react';const NotificationsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as const,
    target: 'all' as const,
    priority: 'medium' as const,
    scheduledDate: '',
  });

  // Real API data fetching
  const {
    data: notificationData,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useAllNotifications({
    page: 1,
    limit: 20,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    search: searchTerm || undefined,
  });

  // Mutation hooks
  const sendNotificationMutation = useSendNotification();
  const scheduleNotificationMutation = useScheduleNotification();
  const deleteNotificationMutation = useDeleteNotification();

  // Extract data with fallbacks
  const notifications = notificationData?.notifications ?? [];
  const stats = notificationData?.stats ?? {
    total: 0,
    sent: 0,
    scheduled: 0,
    draft: 0,
    failed: 0,
    totalRead: 0,
    totalRecipients: 0,
  };
  
  // Calculate derived stats
  const totalUnread = stats.total - (stats.totalRead || 0);

  const handleSendNotification = async () => {
    try {
      await sendNotificationMutation.mutateAsync(newNotification);
      setShowSendDialog(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'system',
        target: 'all',
        priority: 'medium',
        scheduledDate: '',
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleScheduleNotification = async () => {
    try {
      await scheduleNotificationMutation.mutateAsync({
        ...newNotification,
        scheduledDate: newNotification.scheduledDate,
      });
      setShowScheduleDialog(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'system',
        target: 'all',
        priority: 'medium',
        scheduledDate: '',
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (notificationsLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
        
        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Notifications
            </h2>
            <p className='text-gray-600'>Preparing your notification center...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
        
        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h1 className='text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent'>
              Error Loading Notifications
            </h1>
            <p className='text-gray-600 mb-6'>Failed to load notification data</p>
            <Button 
              onClick={() => void refetchNotifications()} 
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-gray-900 shadow-xl'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <Bell className='w-8 h-8 text-gray-900' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <Send className='w-6 h-6 text-gray-900' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                    <Bell className='w-10 h-10 text-gray-900' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-gray-900 border-0 px-4 py-2 font-semibold'>
                      <Send className='w-4 h-4 mr-2' />
                      Notification Center
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Notifications
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Manage system notifications and announcements with{' '}
                      <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold'>
                        smart targeting
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Button 
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-gray-900 shadow-xl'
                  onClick={() => setShowSendDialog(true)}
                >
                  <Send className='w-4 h-4 mr-2' />
                  Send Notification
                </Button>
              </div>
            </div>
          </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mb-8'>
        <Card className='border-0 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>Total</p>
                <p className='text-3xl font-bold text-gray-900'>{stats.total}</p>
              </div>
              <Bell className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>Unread</p>
                <p className='text-3xl font-bold text-green-400'>{stats.total - (stats.totalRead || 0)}</p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>Sent</p>
                <p className='text-3xl font-bold text-blue-400'>{stats.sent ?? 0}</p>
              </div>
              <Calendar className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>Scheduled</p>
                <p className='text-3xl font-bold text-yellow-400'>{stats.scheduled ?? 0}</p>
              </div>
              <Edit className='w-8 h-8 text-yellow-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>Read</p>
                <p className='text-3xl font-bold text-red-400'>{stats.totalRead || 0}</p>
              </div>
              <XCircle className='w-8 h-8 text-red-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>Draft</p>
                <p className='text-3xl font-bold text-purple-400'>{stats.draft?.toLocaleString() ?? 0}</p>
              </div>
              <Eye className='w-8 h-8 text-purple-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>Recipients</p>
                <p className='text-3xl font-bold text-orange-400'>{stats.totalRecipients?.toLocaleString() ?? 0}</p>
              </div>
              <Users className='w-8 h-8 text-orange-400' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className='border-0 shadow-xl bg-white backdrop-blur-sm mb-6'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <div className='flex gap-4 items-center'>
              <Button
                className='bg-blue-600 hover:bg-blue-700'
                onClick={() => {
                  setShowSendDialog(true);
                }}
              >
                <Send className='w-4 h-4 mr-2' />
                Send Now
              </Button>
              <Button
                variant='outline'
                className='border-gray-300 text-gray-600 hover:bg-white'
                onClick={() => {
                  setShowScheduleDialog(true);
                }}
              >
                <Calendar className='w-4 h-4 mr-2' />
                Schedule
              </Button>
            </div>
            <div className='flex gap-4 items-center'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-32 bg-white border-gray-300 text-gray-900'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='sent'>Sent</SelectItem>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='w-32 bg-white border-gray-300 text-gray-900'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='system'>System</SelectItem>
                  <SelectItem value='course'>Course</SelectItem>
                  <SelectItem value='payment'>Payment</SelectItem>
                  <SelectItem value='achievement'>Achievement</SelectItem>
                  <SelectItem value='reminder'>Reminder</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className='w-32 bg-white border-gray-300 text-gray-900'>
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priority</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className='border-0 shadow-xl bg-white backdrop-blur-sm mb-6'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Search notifications by title or message...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
                className='pl-10 bg-white border-gray-300 text-gray-900'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card className='border-0 shadow-xl bg-white backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-gray-900'>Notification History</CardTitle>
          <CardDescription className='text-gray-600'>
            Manage all system notifications and announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-gray-200'>
                  <TableHead className='text-gray-600'>Notification</TableHead>
                  <TableHead className='text-gray-600'>Type</TableHead>
                  <TableHead className='text-gray-600'>Target</TableHead>
                  <TableHead className='text-gray-600'>Priority</TableHead>
                  <TableHead className='text-gray-600'>Status</TableHead>
                  <TableHead className='text-gray-600'>Recipients</TableHead>
                  <TableHead className='text-gray-600'>Created</TableHead>
                  <TableHead className='text-gray-600'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id} className='border-gray-200'>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
                          <Bell className='w-6 h-6 text-gray-900' />
                        </div>
                        <div>
                          <p className='font-medium text-gray-900'>{notification.title}</p>
                          <p className='text-sm text-gray-400 truncate max-w-xs'>
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          notification.type === 'system'
                            ? 'bg-red-600'
                            : notification.type === 'course'
                              ? 'bg-blue-600'
                              : notification.type === 'payment'
                                ? 'bg-green-600'
                                : notification.type === 'achievement'
                                  ? 'bg-purple-600'
                                  : 'bg-yellow-600'
                        } text-gray-900 border-0`}
                      >
                        {notification.type === 'system' && <AlertCircle className='w-3 h-3 mr-1' />}
                        {notification.type === 'course' && (
                          <MessageSquare className='w-3 h-3 mr-1' />
                        )}
                        {notification.type === 'payment' && (
                          <CheckCircle className='w-3 h-3 mr-1' />
                        )}
                        {notification.type === 'achievement' && <Edit className='w-3 h-3 mr-1' />}
                        {notification.type === 'reminder' && <Clock className='w-3 h-3 mr-1' />}
                        {notification.type?.charAt(0).toUpperCase() + notification.type?.slice(1) || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className='bg-gray-600 text-gray-900 border-0'>
                        <Users className='w-3 h-3 mr-1' />
                        All Users
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          notification.priority === 'urgent'
                            ? 'bg-red-600'
                            : notification.priority === 'high'
                              ? 'bg-orange-600'
                              : notification.priority === 'medium'
                                ? 'bg-yellow-600'
                                : 'bg-gray-600'
                        } text-gray-900 border-0`}
                      >
                        {notification.priority.charAt(0).toUpperCase() +
                          notification.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          notification.status === 'sent'
                            ? 'bg-green-600'
                            : notification.status === 'scheduled'
                              ? 'bg-blue-600'
                              : notification.status === 'draft'
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                        } text-gray-900 border-0`}
                      >
                        {notification.status === 'sent' && <CheckCircle className='w-3 h-3 mr-1' />}
                        {notification.status === 'scheduled' && (
                          <Calendar className='w-3 h-3 mr-1' />
                        )}
                        {notification.status === 'draft' && <Edit className='w-3 h-3 mr-1' />}
                        {notification.status === 'failed' && <XCircle className='w-3 h-3 mr-1' />}
                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='text-gray-900'>1</div>
                      <div className='text-sm text-gray-400'>0 read</div>
                    </TableCell>
                    <TableCell>
                      <div className='text-gray-900'>{new Date(notification.created_at || notification.createdAt || '').toLocaleDateString()}</div>
                      <div className='text-sm text-gray-400'>{new Date(notification.created_at || notification.createdAt || '').toLocaleTimeString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='border-gray-300 text-gray-600 hover:bg-white'
                        >
                          <Eye className='w-4 h-4' />
                        </Button>

                        <Button
                          size='sm'
                          variant='outline'
                          className='border-gray-300 text-gray-600 hover:bg-white'
                        >
                          <Edit className='w-4 h-4' />
                        </Button>

                        <Button
                          size='sm'
                          variant='outline'
                          className='border-red-600 text-red-400 hover:bg-red-900/20'
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className='bg-white border-gray-200'>
          <DialogHeader>
            <DialogTitle className='text-gray-900'>Send Notification</DialogTitle>
            <DialogDescription className='text-gray-600'>
              Create and send a new notification to users
            </DialogDescription>
          </DialogHeader>
          <div className='py-4 space-y-4'>
            <div>
              <Label htmlFor='title' className='text-gray-600'>
                Title
              </Label>
              <Input
                id='title'
                placeholder='Enter notification title...'
                value={newNotification.title}
                onChange={e => {
                  setNewNotification(prev => ({ ...prev, title: e.target.value }));
                }}
                className='bg-white border-gray-300 text-gray-900 mt-1'
              />
            </div>
            <div>
              <Label htmlFor='message' className='text-gray-600'>
                Message
              </Label>
              <Textarea
                id='message'
                placeholder='Enter notification message...'
                value={newNotification.message}
                onChange={e => {
                  setNewNotification(prev => ({ ...prev, message: e.target.value }));
                }}
                className='bg-white border-gray-300 text-gray-900 mt-1'
                rows={4}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label className='text-gray-600'>Type</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={value => {
                    setNewNotification(prev => ({ ...prev, type: value as any }));
                  }}
                >
                  <SelectTrigger className='bg-white border-gray-300 text-gray-900 mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='system'>System</SelectItem>
                    <SelectItem value='course'>Course</SelectItem>
                    <SelectItem value='payment'>Payment</SelectItem>
                    <SelectItem value='achievement'>Achievement</SelectItem>
                    <SelectItem value='reminder'>Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className='text-gray-600'>Priority</Label>
                <Select
                  value={newNotification.priority}
                  onValueChange={value => {
                    setNewNotification(prev => ({ ...prev, priority: value as any }));
                  }}
                >
                  <SelectTrigger className='bg-white border-gray-300 text-gray-900 mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>Low</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='urgent'>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className='text-gray-600'>Target Audience</Label>
              <Select
                value={newNotification.target}
                onValueChange={value => {
                  setNewNotification(prev => ({ ...prev, target: value as any }));
                }}
              >
                <SelectTrigger className='bg-white border-gray-300 text-gray-900 mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Users</SelectItem>
                  <SelectItem value='teachers'>Teachers Only</SelectItem>
                  <SelectItem value='students'>Students Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowSendDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button className='bg-blue-600 hover:bg-blue-700' onClick={handleSendNotification}>
              <Send className='w-4 h-4 mr-2' />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Notification Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className='bg-white border-gray-200'>
          <DialogHeader>
            <DialogTitle className='text-gray-900'>Schedule Notification</DialogTitle>
            <DialogDescription className='text-gray-600'>
              Create and schedule a notification for later
            </DialogDescription>
          </DialogHeader>
          <div className='py-4 space-y-4'>
            <div>
              <Label htmlFor='title' className='text-gray-600'>
                Title
              </Label>
              <Input
                id='title'
                placeholder='Enter notification title...'
                value={newNotification.title}
                onChange={e => {
                  setNewNotification(prev => ({ ...prev, title: e.target.value }));
                }}
                className='bg-white border-gray-300 text-gray-900 mt-1'
              />
            </div>
            <div>
              <Label htmlFor='message' className='text-gray-600'>
                Message
              </Label>
              <Textarea
                id='message'
                placeholder='Enter notification message...'
                value={newNotification.message}
                onChange={e => {
                  setNewNotification(prev => ({ ...prev, message: e.target.value }));
                }}
                className='bg-white border-gray-300 text-gray-900 mt-1'
                rows={4}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label className='text-gray-600'>Type</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={value => {
                    setNewNotification(prev => ({ ...prev, type: value as any }));
                  }}
                >
                  <SelectTrigger className='bg-white border-gray-300 text-gray-900 mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='system'>System</SelectItem>
                    <SelectItem value='course'>Course</SelectItem>
                    <SelectItem value='payment'>Payment</SelectItem>
                    <SelectItem value='achievement'>Achievement</SelectItem>
                    <SelectItem value='reminder'>Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className='text-gray-600'>Priority</Label>
                <Select
                  value={newNotification.priority}
                  onValueChange={value => {
                    setNewNotification(prev => ({ ...prev, priority: value as any }));
                  }}
                >
                  <SelectTrigger className='bg-white border-gray-300 text-gray-900 mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>Low</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='urgent'>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className='text-gray-600'>Target Audience</Label>
              <Select
                value={newNotification.target}
                onValueChange={value => {
                  setNewNotification(prev => ({ ...prev, target: value as any }));
                }}
              >
                <SelectTrigger className='bg-white border-gray-300 text-gray-900 mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Users</SelectItem>
                  <SelectItem value='teachers'>Teachers Only</SelectItem>
                  <SelectItem value='students'>Students Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='scheduledDate' className='text-gray-600'>
                Schedule Date & Time
              </Label>
              <Input
                id='scheduledDate'
                type='datetime-local'
                value={newNotification.scheduledDate}
                onChange={e => {
                  setNewNotification(prev => ({ ...prev, scheduledDate: e.target.value }));
                }}
                className='bg-white border-gray-300 text-gray-900 mt-1'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowScheduleDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button className='bg-blue-600 hover:bg-blue-700' onClick={handleScheduleNotification}>
              <Calendar className='w-4 h-4 mr-2' />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
};

export default NotificationsManagement;
