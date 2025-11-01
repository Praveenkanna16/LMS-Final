import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
// Rendered inside `TeacherLayout`; do not wrap with global `Layout` to avoid duplicate sidebars
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  BellOff,
  CheckCircle,
  Trash2,
  Filter,
  Search,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Settings,
  Volume2,
  VolumeX,
  Info,
  Target,
  Sparkles,
  BookOpen,
  Eye,
  Edit2,
  Send,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = 'http://localhost:5001';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [viewMode, setViewMode] = useState<'inbox'|'sent'>('sent'); // Default to sent view for teachers
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [selectedNotificationReceipts, setSelectedNotificationReceipts] = useState<any>(null);
  async function fetchNotifications(params?: Record<string, any>) {
    try {
      // Fetch based on current view mode (inbox or sent)
      const resp = viewMode === 'sent' 
        ? await apiService.getSentNotifications(params || {})
        : await apiService.getNotifications(params || {});
      const data = (resp as any)?.data ?? resp;
      // API returns { notifications, pagination, summary }
      const list = Array.isArray(data) ? data : (data?.notifications ?? []);
      setNotifications(list || []);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
      setNotifications([]);
    }
  }

  useEffect(() => {
    const init = async () => {
      // For teacher view, show sent notifications by default to track what they've sent
      await fetchNotifications({ page: 1, limit: 50 });

      const token = localStorage.getItem('genzed_token') ?? localStorage.getItem('token');
      try {
        const s: Socket = io(SOCKET_URL, { auth: { token } });
        s.on('connect', () => { console.warn('notifications socket connected'); });
        s.on('notification', (notif: any) => { 
          // If in inbox mode, add to list
          if (viewMode === 'inbox') {
            setNotifications(prev => [notif, ...prev]); 
          }
        });
        s.on('batch-notification', (notif: any) => { 
          if (viewMode === 'inbox') {
            setNotifications(prev => [notif, ...prev]); 
          }
        });
        socketRef.current = s;
      } catch (e) {
        console.warn('socket init error', e);
      }
    };

    void init();

    return () => {
      try { socketRef.current?.disconnect(); } catch (e) { /* ignore */ }
    };
  }, [viewMode]);

  // Refetch when view mode changes
  useEffect(() => {
    void fetchNotifications({ page: 1, limit: 50 });
  }, [viewMode]);

  // filtered notifications for display
  const filtered = notifications.filter((n: any) => {
    const matchesSearch = !searchTerm || (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (n.message || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || (selectedFilter === 'unread' && !n.read) || selectedFilter === n.type;
    return matchesSearch && matchesFilter;
  });

  // Send dialog state
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTarget, setNewTarget] = useState<'students'|'admin'|'specific'>('students');
  const [batchOptions, setBatchOptions] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | undefined>(undefined);

  useEffect(() => {
    // load teacher batches for target selection
    (async () => {
      try {
        const resp = await apiService.getMyTeacherBatches();
        const data = (resp as any)?.data ?? resp;
        const batches = Array.isArray(data) ? data : (data?.batches ?? []);
        setBatchOptions(batches || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleSendNotification = async () => {
    if (!newTitle || !newMessage) return;
    // Prevent sending to students without a selected batch
    if (newTarget === 'students' && !selectedBatch) {
      try { toast.error('Please select a batch before sending to students'); } catch (e) { console.warn('Please select a batch'); }
      return;
    }
    try {
      const payload: any = { title: newTitle, message: newMessage, target: newTarget };
      if (newTarget === 'students' && selectedBatch) payload.batchId = selectedBatch;
      const res = await apiService.sendTeacherNotification(payload);
      if ((res as any)?.success) {
        try { toast.success((res as any)?.message || `Notification sent`); } catch (e) { /* ignore */ }
        // refresh current inbox view so teacher sees received/admin notifications immediately
        await fetchNotifications({ page: 1, limit: 50 });
        setShowSendDialog(false);
        setNewTitle(''); setNewMessage(''); setSelectedBatch(undefined);
      } else {
        // Surface server message to the user so they don't have to check DevTools
        const msg = (res as any)?.message || (res as any)?.error || JSON.stringify(res);
        try { toast.error(`Send failed: ${msg}`); } catch (e) { try { toast.error(`Send failed: ${msg}`); } catch(e){} }
      }
    } catch (err: any) {
      try { toast.error(`Send failed: ${err?.message || err}`); } catch (e) { console.error('Send failed', err); }
    }
  };

  const handleViewReceipts = async (notificationId: string | number) => {
    try {
      const resp = await apiService.getNotificationReadReceipts(String(notificationId));
      if ((resp as any)?.success) {
        setSelectedNotificationReceipts((resp as any)?.data);
        setShowReceiptsDialog(true);
      } else {
        toast.error('Failed to load read receipts');
      }
    } catch (err) {
      console.error('Failed to load read receipts', err);
      toast.error('Failed to load read receipts');
    }
  };

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='bg-gradient-to-br from-purple-50/80 via-purple-100/70 to-white rounded-2xl p-8 shadow mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold text-gray-900 inline-flex items-center gap-3'>
              <span className='bg-gradient-to-br from-purple-200 to-indigo-200 text-white p-3 rounded-lg shadow-lg inline-flex items-center justify-center'><Bell className='w-6 h-6 text-purple-700' /></span>
              Notifications
            </h1>
            <p className='text-gray-600 mt-2'>Manage system notifications and announcements with <span className='text-purple-600 font-medium'>smart targeting</span></p>
          </div>
          <div className='flex items-center gap-4'>
            <Button onClick={() => setShowSendDialog(true)} className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg px-5 py-3 rounded-full flex items-center gap-2'>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="-ml-1"><path d="M2 12L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Send Notification
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className='mt-6 grid grid-cols-2 md:grid-cols-8 gap-4'>
          {[
            { label: 'Total', value: notifications.length, icon: Bell, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Unread', value: notifications.filter(n => !n.read).length, icon: BellOff, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Sent', value: notifications.filter(n => n.status === 'sent').length, icon: CheckCircle, color: 'bg-sky-50 text-sky-600' },
            { label: 'Scheduled', value: notifications.filter(n => n.status === 'scheduled').length, icon: Calendar, color: 'bg-amber-50 text-amber-600' },
            { label: 'Read', value: notifications.filter(n => n.read).length, icon: CheckCircle, color: 'bg-rose-50 text-rose-600' },
            { label: 'Draft', value: notifications.filter(n => n.status === 'draft').length, icon: BookOpen, color: 'bg-violet-50 text-violet-600' },
            { label: 'Recipients', value: notifications.reduce((acc, n) => acc + (n.recipientsCount ?? 0), 0), icon: Users, color: 'bg-orange-50 text-orange-600' },
          ].map((s, i) => (
            <div key={i} className='bg-white rounded-lg p-4 shadow-sm flex flex-col items-start'>
              <div className='flex items-center gap-3'>
                <div className={`p-3 rounded-lg ${s.color} inline-flex items-center justify-center`}>
                  {React.createElement(s.icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <div className='text-sm text-gray-500'>{s.label}</div>
                  <div className='text-xl font-bold text-gray-900 mt-2'>{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className='mb-6 flex flex-col lg:flex-row items-start lg:items-center gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input placeholder='Search notifications by title or message...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='pl-12 py-3 rounded-xl shadow-sm w-full' />
          </div>
        </div>
        <div className='flex gap-3 items-center'>
          <Button variant={viewMode === 'sent' ? 'default' : 'outline'} size='sm' onClick={() => setViewMode('sent')} className={viewMode === 'sent' ? 'bg-purple-600 text-white' : ''}>
            <Send className='w-4 h-4 mr-1' />
            Sent
          </Button>
          <Button variant={viewMode === 'inbox' ? 'default' : 'outline'} size='sm' onClick={() => setViewMode('inbox')} className={viewMode === 'inbox' ? 'bg-purple-600 text-white' : ''}>
            <Bell className='w-4 h-4 mr-1' />
            Inbox
          </Button>
          <Button variant='outline' size='sm' onClick={() => setSelectedFilter('all')}>All Status</Button>
          <Button variant='outline' size='sm' onClick={() => setSelectedFilter('unread')}>Unread</Button>
          {viewMode === 'inbox' && (
            <Button variant='outline' size='sm' onClick={async () => { await apiService.markAllNotificationsAsRead(); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}>Mark All Read</Button>
          )}
        </div>
      </div>

      {/* Notification History */}
      <div className='bg-white rounded-2xl p-6 shadow'>
        <h3 className='text-lg font-semibold mb-4'>Notification History</h3>

        {/* Send dialog (modal) */}
        <Dialog open={showSendDialog} onOpenChange={(open) => setShowSendDialog(open)}>
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>Create and send a new notification to users</DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div>
                <Label>Title</Label>
                <Input placeholder='Enter notification title...' value={newTitle} onChange={(e) => { setNewTitle(e.target.value); }} />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea placeholder='Enter notification message...' value={newMessage} onChange={(e) => { setNewMessage(e.target.value); }} rows={4} />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label>Type</Label>
                  <Select onValueChange={(v) => { /* currently no-op for type map */ }}>
                    <SelectTrigger className='w-full'><SelectValue placeholder='System' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='system'>System</SelectItem>
                      <SelectItem value='course'>Course</SelectItem>
                      <SelectItem value='payment'>Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select onValueChange={(v) => { /* no-op */ }}>
                    <SelectTrigger className='w-full'><SelectValue placeholder='Medium' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='low'>Low</SelectItem>
                      <SelectItem value='medium'>Medium</SelectItem>
                      <SelectItem value='high'>High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Target Audience</Label>
                <Select value={newTarget} onValueChange={(v) => setNewTarget(v as any)}>
                  <SelectTrigger className='w-full'><SelectValue placeholder='All Users' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='students'>Students</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                    <SelectItem value='specific'>Specific Users</SelectItem>
                  </SelectContent>
                </Select>
                {newTarget === 'students' && (
                  <div className='mt-2'>
                    <Select value={selectedBatch} onValueChange={(v) => setSelectedBatch(v)}>
                      <SelectTrigger className='w-full'><SelectValue placeholder='Select batch' /></SelectTrigger>
                      <SelectContent>
                        {batchOptions.map((b: any) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className='flex items-center justify-between'>
              <div />
              <div className='flex items-center gap-2'>
                <Button variant='ghost' onClick={() => setShowSendDialog(false)}>Cancel</Button>
                <Button onClick={async () => { await handleSendNotification(); }} className='bg-blue-600 text-white flex items-center gap-2'><Send className='w-4 h-4'/> Send Now</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Read Receipts Dialog */}
        <Dialog open={showReceiptsDialog} onOpenChange={(open) => setShowReceiptsDialog(open)}>
          <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Read Receipts</DialogTitle>
              <DialogDescription>
                See who has received and read this notification
              </DialogDescription>
            </DialogHeader>

            {selectedNotificationReceipts && (
              <div className='space-y-4 py-4'>
                {/* Statistics */}
                <div className='grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {selectedNotificationReceipts.stats?.total || 0}
                    </div>
                    <div className='text-sm text-gray-600'>Total Recipients</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {selectedNotificationReceipts.stats?.read || 0}
                    </div>
                    <div className='text-sm text-gray-600'>Read</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-orange-600'>
                      {selectedNotificationReceipts.stats?.unread || 0}
                    </div>
                    <div className='text-sm text-gray-600'>Unread</div>
                  </div>
                </div>

                {/* Notification Info */}
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <div className='font-semibold text-gray-900 mb-1'>
                    {selectedNotificationReceipts.notification?.title}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {selectedNotificationReceipts.notification?.message}
                  </div>
                  <div className='text-xs text-gray-500 mt-2'>
                    Sent: {new Date(selectedNotificationReceipts.notification?.sentAt || Date.now()).toLocaleString()}
                  </div>
                </div>

                {/* Recipients List */}
                <div className='space-y-2'>
                  <h4 className='font-semibold text-gray-900'>Recipients</h4>
                  {selectedNotificationReceipts.receipts?.map((receipt: any, idx: number) => (
                    <div key={idx} className='flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50'>
                      <div className='flex-1'>
                        <div className='font-medium text-gray-900'>{receipt.recipientName}</div>
                        <div className='text-sm text-gray-500'>{receipt.recipientEmail}</div>
                        <div className='text-xs text-gray-400 mt-1'>
                          Role: {receipt.recipientRole}
                        </div>
                      </div>
                      <div className='text-right'>
                        {receipt.isRead ? (
                          <div className='flex items-center gap-2 text-green-600'>
                            <CheckCircle className='w-5 h-5' />
                            <div>
                              <div className='text-sm font-medium'>Read</div>
                              <div className='text-xs text-gray-500'>
                                {new Date(receipt.readAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2 text-gray-400'>
                            <BellOff className='w-5 h-5' />
                            <div className='text-sm'>Unread</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant='outline' onClick={() => setShowReceiptsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className='w-full overflow-hidden rounded-lg border'>
          <table className='w-full table-fixed'>
            <thead className='bg-gray-50'>
              <tr className='text-left text-sm text-gray-600'>
                <th className='p-4'>Notification</th>
                <th className='p-4'>Type</th>
                <th className='p-4'>Target</th>
                <th className='p-4'>Priority</th>
                <th className='p-4'>Status</th>
                <th className='p-4'>Recipients</th>
                <th className='p-4'>Created</th>
                <th className='p-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((notification: any) => (
                <tr key={notification.id} className='border-t'>
                  <td className='p-4 align-top'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center'>
                        {notification.icon ? React.createElement(notification.icon, { className: 'w-6 h-6 text-purple-600' }) : <Bell />}
                      </div>
                      <div>
                        <div className='font-semibold text-gray-900'>{notification.title}</div>
                        <div className='text-sm text-gray-500'>{notification.message}</div>
                      </div>
                    </div>
                  </td>
                  <td className='p-4 align-top'><div className='text-sm text-gray-600'>{notification.type}</div></td>
                  <td className='p-4 align-top'><div className='text-sm text-gray-600'>{notification.target || 'All Users'}</div></td>
                  <td className='p-4 align-top'><div className='inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs'>{notification.priority || 'Medium'}</div></td>
                  <td className='p-4 align-top'><div className='inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs'>{notification.status || 'Pending'}</div></td>
                  <td className='p-4 align-top'><div className='text-sm text-gray-600'>{(notification.recipientsCount ?? 0)} <div className='text-xs text-gray-400'>{(notification.readCount ?? 0)} read</div></div></td>
                  <td className='p-4 align-top text-sm text-gray-600'>{new Date(notification.createdAt || notification.timestamp || Date.now()).toLocaleString()}</td>
                  <td className='p-4 align-top'>
                    <div className='flex items-center gap-2'>
                      {viewMode === 'sent' && (
                        <Button size='sm' variant='ghost' className='text-blue-600 hover:bg-blue-50' onClick={() => handleViewReceipts(notification.id)}>
                          <Eye className='w-4 h-4 mr-1' />
                          Receipts
                        </Button>
                      )}
                      {viewMode === 'inbox' && !notification.read && (
                        <Button size='sm' variant='ghost' className='text-green-600 hover:bg-green-50' onClick={async () => { await apiService.markNotificationAsRead(String(notification.id)); setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read: true} : n)); }}>
                          <CheckCircle className='w-4 h-4 mr-1' />
                          Mark Read
                        </Button>
                      )}
                      <Button size='sm' variant='ghost' onClick={async () => { await apiService.deleteNotification(notification.id); setNotifications(prev => prev.filter((p: any) => p.id !== notification.id)); }}><Trash2 className='w-4 h-4' /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className='text-center text-gray-500 py-12'>No notifications yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
