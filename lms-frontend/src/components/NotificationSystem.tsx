import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Send,
  Users,
  Mail,
  CheckCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  Smartphone,
  Target,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channel: 'email' | 'sms' | 'push' | 'in-app';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipientType: 'all' | 'students' | 'teachers' | 'custom';
  recipients: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  createdBy: string;
  openRate?: number;
  clickRate?: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'enrollment' | 'payment' | 'course' | 'live-class' | 'general';
  variables: string[];
  isActive: boolean;
}

interface NotificationStats {
  totalSent: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  unsubscribeRate: number;
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to GenZEd LMS',
      message: 'Welcome to our platform! Start your learning journey today.',
      type: 'info',
      channel: 'email',
      status: 'sent',
      recipientType: 'students',
      recipients: ['all-students'],
      sentAt: new Date('2024-01-20'),
      createdAt: new Date('2024-01-19'),
      createdBy: 'Admin',
      openRate: 85,
      clickRate: 12,
    },
    {
      id: '2',
      title: 'Payment Reminder',
      message: 'Your course payment is due in 3 days. Please complete your payment.',
      type: 'warning',
      channel: 'email',
      status: 'scheduled',
      recipientType: 'custom',
      recipients: ['pending-payment-students'],
      scheduledAt: new Date('2024-01-25'),
      createdAt: new Date('2024-01-21'),
      createdBy: 'System',
    },
  ]);

  const [_templates, _setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to {{platform_name}}',
      content: 'Hi {{student_name}}, welcome to our platform!',
      type: 'enrollment',
      variables: ['platform_name', 'student_name'],
      isActive: true,
    },
    {
      id: '2',
      name: 'Payment Confirmation',
      subject: 'Payment Confirmed - {{course_name}}',
      content: 'Your payment for {{course_name}} has been confirmed.',
      type: 'payment',
      variables: ['course_name', 'amount'],
      isActive: true,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [_selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Stats calculation
  const stats: NotificationStats = {
    totalSent: notifications.filter(n => n.status === 'sent').length,
    openRate: 78,
    clickRate: 12,
    deliveryRate: 96,
    unsubscribeRate: 2,
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || notification.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const _handleCreateNotification = (notificationData: Partial<Notification>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: notificationData.title ?? '',
      message: notificationData.message ?? '',
      type: notificationData.type ?? 'info',
      channel: notificationData.channel ?? 'email',
      status: 'draft' as const,
      recipientType: notificationData.recipientType ?? 'all',
      recipients: notificationData.recipients ?? [],
      createdAt: new Date(),
      createdBy: 'Admin',
    };
    setNotifications([...notifications, newNotification]);
    setShowCreateNotification(false);
  };

  const handleSendNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, status: 'sent' as const, sentAt: new Date() }
          : notification
      )
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className='min-h-screen bg-gray-50 p-3 sm:p-6'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-6'>
        {/* Header - Mobile optimized */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Notification System</h1>
            <p className='text-sm sm:text-base text-gray-600 hidden sm:block'>
              Manage and send notifications to users
            </p>
            <p className='text-sm text-gray-600 sm:hidden'>Manage notifications</p>
          </div>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
            <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
              <DialogTrigger asChild>
                <Button variant='outline' className='text-xs sm:text-sm'>
                  <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                  <span className='hidden sm:inline'>Create Template</span>
                  <span className='sm:hidden'>Template</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Create Notification Template</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Template Name</label>
                      <Input placeholder='Enter template name' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='enrollment'>Enrollment</SelectItem>
                          <SelectItem value='payment'>Payment</SelectItem>
                          <SelectItem value='course'>Course</SelectItem>
                          <SelectItem value='live-class'>Live Class</SelectItem>
                          <SelectItem value='general'>General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Subject</label>
                    <Input placeholder='Enter email subject' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Content</label>
                    <Textarea
                      placeholder='Enter notification content. Use {{variable_name}} for dynamic content.'
                      rows={6}
                    />
                  </div>
                  <div className='flex space-x-2'>
                    <Button className='flex-1'>Save Template</Button>
                    <Button variant='outline' className='flex-1'>
                      Save & Use
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showCreateNotification} onOpenChange={setShowCreateNotification}>
              <DialogTrigger asChild>
                <Button className='text-xs sm:text-sm'>
                  <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                  <span className='hidden sm:inline'>Create Notification</span>
                  <span className='sm:hidden'>Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='w-[95vw] max-w-2xl mx-auto'>
                <DialogHeader>
                  <DialogTitle>Create New Notification</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Title</label>
                      <Input placeholder='Enter notification title' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='info'>Info</SelectItem>
                          <SelectItem value='success'>Success</SelectItem>
                          <SelectItem value='warning'>Warning</SelectItem>
                          <SelectItem value='error'>Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Channel</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select channel' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='email'>Email</SelectItem>
                          <SelectItem value='sms'>SMS</SelectItem>
                          <SelectItem value='push'>Push</SelectItem>
                          <SelectItem value='in-app'>In-App</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Recipients</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select recipients' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Users</SelectItem>
                          <SelectItem value='students'>All Students</SelectItem>
                          <SelectItem value='teachers'>All Teachers</SelectItem>
                          <SelectItem value='custom'>Custom Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Message</label>
                    <Textarea placeholder='Enter your notification message' rows={4} />
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Switch />
                    <label className='text-sm'>Schedule for later</label>
                  </div>
                  <div className='flex space-x-2'>
                    <Button className='flex-1'>Send Now</Button>
                    <Button variant='outline' className='flex-1'>
                      Save as Draft
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards - Mobile optimized */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Sent</CardTitle>
              <Send className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.totalSent}</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                Notifications delivered
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>Delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Open Rate</CardTitle>
              <Eye className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.openRate}%</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Email open rate</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Opens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Click Rate</CardTitle>
              <Target className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.clickRate}%</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Click-through rate</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Delivery Rate</CardTitle>
              <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.deliveryRate}%</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Successful delivery</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Delivery</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search notifications...'
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                    }}
                    className='pl-10'
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='sent'>Sent</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filter by channel' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Channels</SelectItem>
                  <SelectItem value='email'>Email</SelectItem>
                  <SelectItem value='sms'>SMS</SelectItem>
                  <SelectItem value='push'>Push</SelectItem>
                  <SelectItem value='in-app'>In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue='notifications' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4 lg:w-fit'>
            <TabsTrigger value='notifications'>Notifications</TabsTrigger>
            <TabsTrigger value='templates'>Templates</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value='notifications' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>All Notifications ({filteredNotifications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                    >
                      <div className='flex items-center space-x-4'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            notification.type === 'info'
                              ? 'bg-blue-500'
                              : notification.type === 'success'
                                ? 'bg-green-500'
                                : notification.type === 'warning'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                          }`}
                        ></div>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-3'>
                            <h3 className='font-medium'>{notification.title}</h3>
                            <Badge
                              variant={
                                notification.status === 'sent'
                                  ? 'default'
                                  : notification.status === 'scheduled'
                                    ? 'secondary'
                                    : notification.status === 'failed'
                                      ? 'destructive'
                                      : 'outline'
                              }
                            >
                              {notification.status}
                            </Badge>
                            <Badge variant='outline' className='capitalize'>
                              {notification.channel}
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-600'>{notification.message}</p>
                          <div className='flex items-center space-x-4 mt-1 text-xs text-gray-500'>
                            <span className='flex items-center'>
                              <Users className='w-3 h-3 mr-1' />
                              {notification.recipientType}
                            </span>
                            <span>•</span>
                            <span>{notification.createdAt.toLocaleDateString()}</span>
                            {notification.openRate && (
                              <>
                                <span>•</span>
                                <span>{notification.openRate}% opened</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        {notification.status === 'draft' && (
                          <Button
                            size='sm'
                            onClick={() => {
                              handleSendNotification(notification.id);
                            }}
                          >
                            <Send className='w-4 h-4 mr-1' />
                            Send
                          </Button>
                        )}
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setSelectedNotification(notification);
                          }}
                        >
                          <Eye className='w-4 h-4 mr-1' />
                          View
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            handleDeleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value='templates' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold'>Notification Templates</h2>
              <Badge variant='outline'>
                {_templates.filter((t: NotificationTemplate) => t.isActive).length} active templates
              </Badge>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {_templates.map((template: NotificationTemplate) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{template.name}</CardTitle>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className='text-sm text-gray-600 capitalize'>{template.type} template</p>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div>
                        <p className='text-sm font-medium'>Subject:</p>
                        <p className='text-sm text-gray-600'>{template.subject}</p>
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Variables:</p>
                        <div className='flex flex-wrap gap-1 mt-1'>
                          {template.variables.map(variable => (
                            <Badge key={variable} variant='outline' className='text-xs'>
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className='flex space-x-2 pt-2'>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Edit className='w-4 h-4 mr-1' />
                          Edit
                        </Button>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Eye className='w-4 h-4 mr-1' />
                          Use
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value='analytics' className='space-y-6'>
            <h2 className='text-2xl font-bold'>Notification Analytics</h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <BarChart3 className='w-5 h-5 mr-2' />
                    Delivery Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Performance chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <TrendingUp className='w-5 h-5 mr-2' />
                    Engagement Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Engagement chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <Mail className='w-4 h-4' />
                        <span className='text-sm'>Email</span>
                      </div>
                      <span className='text-sm font-medium'>85% delivery</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <Smartphone className='w-4 h-4' />
                        <span className='text-sm'>SMS</span>
                      </div>
                      <span className='text-sm font-medium'>95% delivery</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <Bell className='w-4 h-4' />
                        <span className='text-sm'>Push</span>
                      </div>
                      <span className='text-sm font-medium'>78% delivery</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <Smartphone className='w-4 h-4' />
                        <span className='text-sm'>In-App</span>
                      </div>
                      <span className='text-sm font-medium'>92% delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Best Performing Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {_templates.slice(0, 3).map((template: NotificationTemplate, index: number) => (
                      <div key={template.id} className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center'>
                            <span className='text-xs font-medium text-blue-600'>{index + 1}</span>
                          </div>
                          <span className='text-sm font-medium'>{template.name}</span>
                        </div>
                        <span className='text-sm text-gray-500'>92% open rate</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value='settings' className='space-y-6'>
            <h2 className='text-2xl font-bold'>Notification Settings</h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Settings className='w-5 h-5 mr-2' />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Email notifications</p>
                      <p className='text-sm text-gray-500'>Send notifications via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>SMS notifications</p>
                      <p className='text-sm text-gray-500'>Send notifications via SMS</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Push notifications</p>
                      <p className='text-sm text-gray-500'>Send push notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>In-app notifications</p>
                      <p className='text-sm text-gray-500'>Show notifications in app</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>From Name</label>
                    <Input defaultValue='GenZEd LMS' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>From Email</label>
                    <Input defaultValue='noreply@genzed.com' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Reply-To Email</label>
                    <Input defaultValue='support@genzed.com' />
                  </div>
                  <Button>Save Email Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SMS Configuration</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>SMS Provider</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Select SMS provider' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='twilio'>Twilio</SelectItem>
                        <SelectItem value='aws-sns'>AWS SNS</SelectItem>
                        <SelectItem value='msg91'>MSG91</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Sender ID</label>
                    <Input placeholder='Enter sender ID' />
                  </div>
                  <Button>Save SMS Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automation Rules</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Welcome email on signup</p>
                      <p className='text-sm text-gray-500'>Automatically send welcome email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Payment confirmation</p>
                      <p className='text-sm text-gray-500'>Send payment confirmation emails</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Course reminders</p>
                      <p className='text-sm text-gray-500'>Remind about upcoming classes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationSystem;
