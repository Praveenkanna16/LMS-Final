import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { socketService } from '@/services/socket';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Trash2,
  CheckCircle,
  Filter,
  Search,
  Calendar,
  Clock,
  Video,
  FileText,
  Users,
  Award,
  
  Info,
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationData {
  id: string | number;
  title: string;
  message: string;
  type: string;
  priority?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
}

const Notifications: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Setup socket connection to receive realtime notifications
  useEffect(() => {
    if (!user) return;

  const userId = String((user as any).id || (user as any)._id || (user as any).userId || '');
  const resolvedToken = localStorage.getItem('genzed_token') || localStorage.getItem('token') || token || '';
  socketService.connect(userId, resolvedToken);

    const handleIncoming = (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socketService.on('notification', handleIncoming);
    socketService.on('batch-notification', handleIncoming);

    return () => {
      socketService.off('notification', handleIncoming);
      socketService.off('batch-notification', handleIncoming);
      socketService.disconnect();
    };
  }, [user, token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      
      if (response.success && response.data) {
        const notificationList = (response.data as any).notifications || response.data;
        const unread = (response.data as any).unreadCount || 
                      notificationList.filter((n: any) => !n.isRead).length;
        
        setNotifications(Array.isArray(notificationList) ? notificationList : []);
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string | number) => {
    try {
      const response = await apiService.markNotificationAsRead(String(notificationId));
      
      if (response.success) {
        toast.success('Notification marked as read');
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      await Promise.all(
        unreadNotifications.map(n => apiService.markNotificationAsRead(String(n.id)))
      );
      
      toast.success('All notifications marked as read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string | number) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'class_reminder':
      case 'class':
        return { icon: Video, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'deadline_reminder':
      case 'assignment':
        return { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'content_update':
      case 'course':
        return { icon: BookOpen, color: 'text-green-600', bg: 'bg-green-100' };
      case 'grade_update':
      case 'assessment':
        return { icon: Award, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'achievement':
        return { icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'social':
        return { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' };
      case 'system':
      case 'reminder':
        return { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'unread' && !notification.isRead) ||
      selectedFilter === notification.type;

    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/50';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50/50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50/50';
      default:
        return 'border-l-gray-500 bg-gray-50/50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className='bg-red-100 text-red-800 text-xs border-red-200'>High</Badge>;
      case 'medium':
        return <Badge className='bg-orange-100 text-orange-800 text-xs border-orange-200'>Medium</Badge>;
      case 'low':
        return <Badge className='bg-blue-100 text-blue-800 text-xs border-blue-200'>Low</Badge>;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Layout>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
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

                <div className='relative z-10'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <Sparkles className='w-6 h-6 text-white' />
                    </div>
                    <Badge className='bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1'>
                      Student Portal
                    </Badge>
                    {unreadCount > 0 && (
                      <Badge className='bg-red-500 text-white border-0 px-3 py-1 animate-pulse'>
                        {unreadCount} New
                      </Badge>
                    )}
                  </div>
                  <h1 className='text-4xl font-bold text-white mb-2'>Notifications 🔔</h1>
                  <p className='text-blue-100 text-lg mb-6'>
                    Stay updated with your learning activities and announcements
                  </p>
                  <div className='flex items-center gap-4 flex-wrap'>
                    <Button
                      size='lg'
                      className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                      onClick={() => navigate('/student/batches')}
                    >
                      <Users className='w-5 h-5 mr-2' />
                      My Batches
                    </Button>
                    <Button
                      size='lg'
                      variant='outline'
                      className='border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm'
                      onClick={() => navigate('/courses')}
                    >
                      <BookOpen className='w-5 h-5 mr-2' />
                      Browse Courses
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
                <div className='flex flex-col sm:flex-row gap-4 flex-1'>
                  <div className='relative flex-1 max-w-md'>
                    <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                    <Input
                      placeholder='Search notifications...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    />
                  </div>

                  <div className='flex gap-3 flex-wrap'>
                    {['all', 'unread', 'class', 'assignment', 'course', 'assessment'].map(
                      filter => (
                        <Button
                          key={filter}
                          variant={selectedFilter === filter ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setSelectedFilter(filter)}
                          className={
                            selectedFilter === filter
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600'
                          }
                        >
                          {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`border-2 ${soundEnabled ? 'text-green-600 border-green-300 bg-green-50' : 'text-gray-400 border-gray-300'}`}
                  >
                    {soundEnabled ? <Volume2 className='w-4 h-4 mr-1' /> : <VolumeX className='w-4 h-4 mr-1' />}
                    Sound
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleMarkAllAsRead}
                    className='border-2 border-blue-300 text-blue-600 hover:bg-blue-50'
                    disabled={unreadCount === 0}
                  >
                    <CheckCircle className='w-4 h-4 mr-1' />
                    Mark All Read
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            <div className='lg:col-span-3'>
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse'>
                      <Bell className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                        Recent Notifications
                      </CardTitle>
                      <CardDescription>
                        {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} found
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className='p-6'>
                  {loading ? (
                    <div className='text-center py-12'>
                      <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
                      <p className='text-gray-600'>Loading notifications...</p>
                    </div>
                  ) : filteredNotifications.length > 0 ? (
                    <div className='space-y-4'>
                      {filteredNotifications.map(notification => {
                        const iconData = getNotificationIcon(notification.type);
                        const IconComponent = iconData.icon;
                        
                        return (
                          <div
                            key={notification.id}
                            className={`rounded-2xl p-6 border-l-4 hover:shadow-lg transition-all duration-300 ${
                              notification.priority 
                                ? getPriorityColor(notification.priority)
                                : 'border-l-blue-500 bg-blue-50/50'
                            } ${!notification.isRead ? 'ring-2 ring-blue-300/50' : ''}`}
                          >
                            <div className='flex items-start gap-4'>
                              <div className={`w-12 h-12 rounded-xl ${iconData.bg} flex items-center justify-center shadow-md`}>
                                <IconComponent className={`w-6 h-6 ${iconData.color}`} />
                              </div>
                              <div className='flex-1'>
                                <div className='flex items-start justify-between mb-3'>
                                  <div className='flex-1'>
                                    <h3 className='font-bold text-gray-900 mb-1 flex items-center gap-2 text-lg'>
                                      {notification.title}
                                      {!notification.isRead && (
                                        <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
                                      )}
                                    </h3>
                                    <div className='flex items-center gap-2 mb-2 flex-wrap'>
                                      {notification.priority && getPriorityBadge(notification.priority)}
                                      <Badge variant='outline' className='text-xs border-gray-300 bg-white'>
                                        {notification.type.replace('_', ' ')}
                                      </Badge>
                                      <span className='text-xs text-gray-500 flex items-center gap-1'>
                                        <Clock className='w-3 h-3' />
                                        {formatTimeAgo(notification.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    {!notification.isRead && (
                                      <Button
                                        size='sm'
                                        variant='ghost'
                                        className='text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                                        onClick={() => handleMarkAsRead(notification.id)}
                                      >
                                        <CheckCircle className='w-4 h-4 mr-1' />
                                        Mark Read
                                      </Button>
                                    )}
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      className='text-gray-400 hover:text-red-600 hover:bg-red-50'
                                      onClick={() => handleDeleteNotification(notification.id)}
                                    >
                                      <Trash2 className='w-4 h-4' />
                                    </Button>
                                  </div>
                                </div>

                                <p className='text-sm text-gray-600 mb-4 leading-relaxed'>{notification.message}</p>

                                {notification.actionText && notification.actionUrl && (
                                  <div className='flex items-center gap-2'>
                                    <Button
                                      size='sm'
                                      className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                                      onClick={() => navigate(notification.actionUrl || '/')}
                                    >
                                      <TrendingUp className='w-4 h-4 mr-1' />
                                      {notification.actionText}
                                    </Button>
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      className='border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='text-center py-12'>
                      <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                        <Bell className='h-10 w-10 text-gray-400' />
                      </div>
                      <p className='text-gray-900 font-semibold mb-2 text-lg'>No notifications found</p>
                      <p className='text-sm text-gray-600 mb-6'>
                        {searchTerm || selectedFilter !== 'all'
                          ? "Try adjusting your filters or search term"
                          : "You're all caught up! New notifications will appear here."}
                      </p>
                      <Button
                        className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedFilter('all');
                        }}
                      >
                        <Search className='w-4 h-4 mr-2' />
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className='space-y-6'>
              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                      <Info className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                        Summary
                      </CardTitle>
                      <CardDescription className='text-xs'>Your notification overview</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-6 space-y-4'>
                  <div className='text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50'>
                    <div className='text-3xl font-bold text-blue-600 mb-1'>
                      {unreadCount}
                    </div>
                    <p className='text-sm text-gray-600'>Unread Notifications</p>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div className='text-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50'>
                      <div className='text-lg font-bold text-blue-600'>
                        {notifications.filter(n => n.type === 'class' || n.type === 'class_reminder').length}
                      </div>
                      <p className='text-xs text-gray-600'>Classes</p>
                    </div>
                    <div className='text-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200/50'>
                      <div className='text-lg font-bold text-orange-600'>
                        {notifications.filter(n => n.type === 'assignment' || n.type === 'deadline_reminder').length}
                      </div>
                      <p className='text-xs text-gray-600'>Deadlines</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                      <Settings className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                        Settings
                      </CardTitle>
                      <CardDescription className='text-xs'>Notification preferences</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-6 space-y-3'>
                  <div className='flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300'>
                    <div>
                      <p className='font-medium text-sm text-gray-900'>Class Reminders</p>
                      <p className='text-xs text-gray-500'>Before classes start</p>
                    </div>
                    <Button size='sm' variant='ghost' className='text-green-600'>
                      <Bell className='w-4 h-4' />
                    </Button>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-md transition-all duration-300'>
                    <div>
                      <p className='font-medium text-sm text-gray-900'>Deadlines</p>
                      <p className='text-xs text-gray-500'>Assignment reminders</p>
                    </div>
                    <Button size='sm' variant='ghost' className='text-green-600'>
                      <Bell className='w-4 h-4' />
                    </Button>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300'>
                    <div>
                      <p className='font-medium text-sm text-gray-900'>Grade Updates</p>
                      <p className='text-xs text-gray-500'>When grades are posted</p>
                    </div>
                    <Button size='sm' variant='ghost' className='text-green-600'>
                      <Bell className='w-4 h-4' />
                    </Button>
                  </div>

                  <div className='pt-3 border-t border-gray-200'>
                    <Button
                      variant='outline'
                      className='w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                    >
                      <Settings className='w-4 h-4 mr-2' />
                      Advanced Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
                <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center'>
                      <Target className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent'>
                        Quick Actions
                      </CardTitle>
                      <CardDescription className='text-xs'>Manage notifications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-6 space-y-3'>
                  <Button
                    className='w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                    size='sm'
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCircle className='w-4 h-4 mr-2' />
                    Mark All as Read
                  </Button>
                  <Button
                    className='w-full justify-start'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedFilter('all');
                    }}
                  >
                    <Filter className='w-4 h-4 mr-2' />
                    Clear Filters
                  </Button>
                  <Button
                    className='w-full justify-start'
                    variant='outline'
                    size='sm'
                    onClick={fetchNotifications}
                  >
                    <TrendingUp className='w-4 h-4 mr-2' />
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center'>
                  <Target className='w-5 h-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-xl bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent'>
                    Quick Navigation
                  </CardTitle>
                  <CardDescription>Access your learning tools</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <button
                  onClick={() => navigate('/student/batches')}
                  className='flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200/50 hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                  <span className='font-semibold text-gray-900'>My Batches</span>
                </button>

                <button
                  onClick={() => navigate('/student/schedule')}
                  className='flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Calendar className='w-6 h-6 text-white' />
                  </div>
                  <span className='font-semibold text-gray-900'>Schedule</span>
                </button>

                <button
                  onClick={() => navigate('/student/recorded-content')}
                  className='flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Video className='w-6 h-6 text-white' />
                  </div>
                  <span className='font-semibold text-gray-900'>Recordings</span>
                </button>

                <button
                  onClick={() => navigate('/courses')}
                  className='flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200/50 hover:border-orange-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <BookOpen className='w-6 h-6 text-white' />
                  </div>
                  <span className='font-semibold text-gray-900'>Browse Courses</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
