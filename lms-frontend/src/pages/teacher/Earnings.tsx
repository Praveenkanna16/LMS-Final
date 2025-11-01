import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  IndianRupee,
  Loader2,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Search as SearchIcon,
  Eye,
  Edit,
  MoreHorizontal,
  Users,
  BookOpen,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import io from 'socket.io-client';
// socket types not required here

interface EarningsData {
  totals: {
    totalEarnings: number;
    thisMonthEarnings: number;
    pendingPayouts: number;
    paidOut: number;
  };
  batchEarnings: {
    batchName: string;
    students: number;
    source: string;
    grossRevenue: number;
    teacherShare: number;
    status: string;
  }[];
  payoutHistory: {
    date: string;
    amount: number;
    mode: string;
    status: string;
    transactionId?: string;
  }[];
}

const Earnings: React.FC = () => {
  const { user: _user } = useAuth();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // no persistent socket state needed here - we manage socket instance locally

  // Payout form state
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    paymentMethod: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: '',
    note: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    // fetch and socket setup; setupWebSocket returns a connected socket
    void fetchEarningsData();
    const s = setupWebSocket();
    return () => {
      if (s) {
        s.disconnect();
      }
    };
    // intentionally leaving deps empty so this runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupWebSocket = () => {
    const newSocket = io('http://localhost:5001', {
      auth: {
        token: localStorage.getItem('genzed_token'),
      },
    });

    newSocket.on('connect', () => {
      console.warn('Connected to WebSocket for earnings updates');
    });

    newSocket.on('payout-update', (data: { status: string; amount: number }) => {
      console.warn('Payout update received:', data);
      // Refresh earnings data when payout status changes
      void fetchEarningsData();
      toast.success(`Payout ${data.status}: ₹${data.amount}`);
    });

    newSocket.on('disconnect', () => {
      console.warn('Disconnected from WebSocket');
    });

  // return socket instance so caller can clean up
  return newSocket;
  };

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTeacherEarnings() as any as { success: boolean; data?: EarningsData; message?: string };
      if (response && response.success) {
        setEarningsData(response.data ?? null);
      } else {
        const msg = response?.message ?? 'Failed to load earnings data';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Failed to load earnings data:', msg);
      setError(msg || 'Failed to load earnings data');
      toast.error(msg || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (!payoutForm.amount || !payoutForm.paymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(payoutForm.amount);
    if (amount < 1000) {
      toast.error('Minimum payout amount is ₹1000');
      return;
    }

    if (!earningsData || amount > (earningsData.totals.totalEarnings - earningsData.totals.pendingPayouts - earningsData.totals.paidOut)) {
      toast.error('Insufficient balance');
      return;
    }

    setPayoutLoading(true);
    try {
      const paymentDetails = payoutForm.paymentMethod === 'bank_transfer'
        ? {
            accountNumber: payoutForm.accountNumber,
            ifscCode: payoutForm.ifscCode,
            accountHolderName: payoutForm.accountHolderName,
          }
        : {
            upiId: payoutForm.upiId,
          };

      const response = await apiService.requestPayout({
        amount,
        paymentMethod: payoutForm.paymentMethod,
        paymentDetails,
        note: payoutForm.note
      });

      if (response.success) {
        toast.success('Payout request submitted successfully!');
        setPayoutModalOpen(false);
        setPayoutForm({
          amount: '',
          paymentMethod: '',
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          upiId: '',
          note: '',
        });
  // Refresh data
  void fetchEarningsData();
      } else {
        toast.error(response.message || 'Failed to submit payout request');
      }
    } catch (error: any) {
      console.warn('Payout request failed:', error);
      toast.error('Failed to submit payout request');
    } finally {
      setPayoutLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'requested':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700 hover:bg-green-200',
      requested: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      processing: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
      paid: 'bg-green-100 text-green-700 hover:bg-green-200',
    };

    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} capitalize`}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        {/* Floating Elements */}
        <div className='absolute top-20 left-10 animate-bounce delay-1000'>
          <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
            <DollarSign className='w-8 h-8 text-white' />
          </div>
        </div>
        <div className='absolute top-32 right-16 animate-bounce delay-2000'>
          <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
            <TrendingUp className='w-6 h-6 text-white' />
          </div>
        </div>

        <div className='relative z-10 flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Earnings
            </h2>
            <p className='text-gray-600'>Fetching your earnings data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Safely read totals; backend may return an object missing `totals` so guard property access
  const totals = earningsData?.totals;
  const availableForPayout = totals
    ? (totals.totalEarnings ?? 0) - (totals.pendingPayouts ?? 0) - (totals.paidOut ?? 0)
    : 0;

  const formatCurrency = (value: number | undefined | null) => {
    const val = Number(value ?? 0);
    return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden'>
      {/* Background blobs */}
      <div className='absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400 rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none'></div>
      <div className='absolute -bottom-20 -right-20 w-72 h-72 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none'></div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header - admin-like */}
          <div className='mb-8'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                <BookOpen className='w-10 h-10 text-white' />
              </div>
              <div>
                <Badge className='mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white border-0 px-4 py-2 font-semibold'>
                  <BookOpen className='w-4 h-4 mr-2' />
                  Earnings Overview
                </Badge>
                <h1 className='text-4xl md:text-5xl font-extrabold mb-1'>My Earnings</h1>
                <p className='text-base text-gray-600'>Overview of your batch earnings, available payouts and history</p>
              </div>
            </div>

            <div className='flex gap-4'>
              <Button
                variant='outline'
                onClick={async () => { setRefreshing(true); await fetchEarningsData(); setRefreshing(false); }}
                className='border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50'
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl'
                onClick={() => setPayoutModalOpen(true)}
              >
                <Plus className='w-4 h-4 mr-2' />
                Request Payout
              </Button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className='mb-6 max-w-7xl mx-auto'>
              <div className='bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-center justify-between'>
                <div>
                  <p className='text-sm text-red-700 font-semibold'>Failed to load earnings</p>
                  <p className='text-xs text-red-600'>{error}</p>
                </div>
                <div>
                  <Button variant='outline' onClick={() => { setError(null); void fetchEarningsData(); }}>Retry</Button>
                </div>
              </div>
            </div>
          )}

        {/* Stats Cards */}
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
          {/* Total Earnings */}
          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-70 blur-xl transform translate-x-6 translate-y-6'></div>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Earnings</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg -mt-2'>
                <DollarSign className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10 py-4'>
              <div className='text-3xl font-bold text-green-600 mb-1 group-hover:scale-110 transition-transform duration-300'>{formatCurrency(earningsData?.totals?.totalEarnings ?? 0)}</div>
              <p className='text-sm text-gray-600'>Lifetime earnings</p>
              <div className='flex items-center mt-2'>
                <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
                <span className='text-xs text-green-600 font-medium'>Excellent work!</span>
              </div>
            </CardContent>
          </Card>

          {/* Available for Payout */}
          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-70 blur-xl transform translate-x-6 translate-y-6'></div>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Available for Payout</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg -mt-2'>
                <IndianRupee className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10 py-4'>
              <div className='text-3xl font-bold text-blue-600 mb-1'>{formatCurrency(availableForPayout)}</div>
              <p className='text-sm text-gray-600'>Ready to withdraw</p>
              <div className='flex items-center mt-2'>
                <span className='text-xs text-blue-600 font-medium'>Available now!</span>
              </div>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-70 blur-xl transform translate-x-6 translate-y-6'></div>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>This Month</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg -mt-2'>
                <Calendar className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10 py-4'>
              <div className='text-3xl font-bold text-purple-600 mb-1'>{formatCurrency(earningsData?.totals?.thisMonthEarnings ?? 0)}</div>
              <div className='flex items-center text-sm'>
                <ArrowUpRight className='w-4 h-4 text-green-400 mr-1' />
                <span className='text-green-400'>+12.5%</span>
              </div>
            </CardContent>
          </Card>

          {/* Pending Payouts */}
          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-orange-400 to-red-400 rounded-full opacity-70 blur-xl transform translate-x-6 translate-y-6'></div>
            <CardHeader className='flex items-center justify-between pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Pending Payouts</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg -mt-2'>
                <Clock className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10 py-4'>
              <div className='text-3xl font-bold text-orange-600 mb-1'>{formatCurrency(earningsData?.totals?.pendingPayouts ?? 0)}</div>
              <p className='text-sm text-gray-600'>Under review</p>
              <div className='flex items-center mt-2'>
                <span className='text-xs text-orange-600 font-medium'>Processing</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Batches card */}
          <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full -translate-y-12 translate-x-12'></div>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
              <CardTitle className='text-sm font-semibold text-gray-900'>Total Batches</CardTitle>
              <div className='w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg'>
                <Users className='h-6 w-6 text-white' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-300'>
                {earningsData?.batchEarnings?.length ?? 0}
              </div>
              <p className='text-sm text-gray-600'>Active & completed batches</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden mb-6'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
          <CardContent className='p-6 relative z-10'>
            <div className='flex flex-col md:flex-row gap-4 items-center'>
              <div className='flex-1'>
                <div className='relative'>
                  <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <Input
                    placeholder='Search batches by name, course, or source...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <div className='w-48'>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='All Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Payout Button */}
        <div className='flex justify-center mb-8'>
          <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
            <DialogTrigger asChild>
              <Button
                className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl px-8 py-3 text-lg'
                disabled={availableForPayout < 1000}
              >
                <IndianRupee className='w-5 h-5 mr-2' />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[500px]'>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>
                  Available balance: ₹{availableForPayout}
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='amount'>Amount (₹)</Label>
                  <Input
                    id='amount'
                    type='number'
                    placeholder='Enter amount'
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                    min='1000'
                    max={availableForPayout}
                  />
                </div>

                <div>
                  <Label htmlFor='paymentMethod'>Payment Method</Label>
                  <Select value={payoutForm.paymentMethod} onValueChange={(value) => setPayoutForm(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select payment method' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='bank_transfer'>Bank Transfer</SelectItem>
                      <SelectItem value='upi'>UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payoutForm.paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <Label htmlFor='accountHolderName'>Account Holder Name</Label>
                      <Input
                        id='accountHolderName'
                        placeholder='Enter account holder name'
                        value={payoutForm.accountHolderName}
                        onChange={(e) => setPayoutForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor='accountNumber'>Account Number</Label>
                      <Input
                        id='accountNumber'
                        placeholder='Enter account number'
                        value={payoutForm.accountNumber}
                        onChange={(e) => setPayoutForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor='ifscCode'>IFSC Code</Label>
                      <Input
                        id='ifscCode'
                        placeholder='Enter IFSC code'
                        value={payoutForm.ifscCode}
                        onChange={(e) => setPayoutForm(prev => ({ ...prev, ifscCode: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {payoutForm.paymentMethod === 'upi' && (
                  <div>
                    <Label htmlFor='upiId'>UPI ID</Label>
                    <Input
                      id='upiId'
                      placeholder='Enter UPI ID (e.g., user@paytm)'
                      value={payoutForm.upiId}
                      onChange={(e) => setPayoutForm(prev => ({ ...prev, upiId: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor='note'>Note (Optional)</Label>
                  <Textarea
                    id='note'
                    placeholder='Add a note for this payout request'
                    value={payoutForm.note}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={() => setPayoutModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePayoutRequest} disabled={payoutLoading}>
                  {payoutLoading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Batch-wise Earnings Table */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full -translate-y-16 translate-x-16'></div>
          <CardHeader className='relative z-10'>
            <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
              <DollarSign className='h-6 w-6 text-green-600' />
              Batch-wise Earnings
            </CardTitle>
            <CardDescription className='text-gray-600'>Earnings breakdown by batch</CardDescription>
          </CardHeader>
          <CardContent className='relative z-10'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-gray-900 font-semibold'>Batch Name</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Students</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Source</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Gross Revenue</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Teacher Share</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earningsData?.batchEarnings && earningsData.batchEarnings.length > 0 ? (
                  earningsData.batchEarnings.map((batch, index) => (
                    <TableRow key={index} className='border-gray-200 hover:bg-gray-50/50'>
                      <TableCell className='text-gray-900 font-medium'>{batch.batchName}</TableCell>
                      <TableCell className='text-gray-700'>{batch.students}</TableCell>
                      <TableCell>
                        <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-200'>
                          {batch.source}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-gray-900 font-semibold'>{formatCurrency(batch.grossRevenue)}</TableCell>
                      <TableCell className='text-green-600 font-semibold'>{formatCurrency(batch.teacherShare)}</TableCell>
                      <TableCell>{getStatusBadge(batch.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center text-gray-500 py-6'>No batch earnings available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payout History Table */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-16 translate-x-16'></div>
          <CardHeader className='relative z-10'>
            <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-900'>
              <Banknote className='h-6 w-6 text-purple-600' />
              Payout History
            </CardTitle>
            <CardDescription className='text-gray-600'>Your payout requests and their status</CardDescription>
          </CardHeader>
          <CardContent className='relative z-10'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-gray-900 font-semibold'>Date</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Amount</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Mode</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Status</TableHead>
                  <TableHead className='text-gray-900 font-semibold'>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earningsData?.payoutHistory && earningsData.payoutHistory.length > 0 ? (
                  earningsData.payoutHistory.map((payout, index) => (
                    <TableRow key={index} className='border-gray-200 hover:bg-gray-50/50'>
                      <TableCell className='text-gray-900'>
                        {new Date(payout.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-gray-900 font-semibold'>{formatCurrency(payout.amount)}</TableCell>
                      <TableCell className='text-gray-700 capitalize'>{payout.mode.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          {getStatusIcon(payout.status)}
                          {getStatusBadge(payout.status)}
                        </div>
                      </TableCell>
                      <TableCell className='text-gray-500 text-sm'>
                        {payout.transactionId || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center text-gray-500 py-6'>No payout history available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
