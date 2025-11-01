import React, { useState, useEffect, useRef, useCallback } from 'react';
// no auth import needed here
import { apiService } from '@/services/api';
// Page is rendered inside `TeacherLayout` at the route level; do not wrap with global `Layout` to avoid duplicate sidebars
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Download,
  Loader2,
  TrendingUp,
  Search,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = 'http://localhost:5001';

function formatCurrency(value: number) {
  if (typeof value !== 'number') return '₹0';
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

const Payouts: React.FC = () => {
  // no auth usage in this page
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any | null>(null);

  const fetchPayoutDataCb = useCallback(async () => {
    await fetchPayoutData();
  }, []);

  useEffect(() => {
    void fetchPayoutDataCb();

    // setup socket once
  const token = localStorage.getItem('genzed_token') ?? localStorage.getItem('token');
    try {
      const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
      s.on('connect', () => {
        console.warn('Socket connected for payouts');
      });
      s.on('payout-update', (_data: unknown) => {
        void fetchPayoutDataCb();
        toast.success('Payouts updated');
      });
      socketRef.current = s;
    } catch (err) {
      console.warn('Socket init failed', err);
    }

    return () => {
      try {
        socketRef.current?.disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, [fetchPayoutDataCb]);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      // use the consolidated teacher earnings endpoint which provides totals and payout history
      const resp = (await apiService.getTeacherEarnings()) as any;
      const payload = resp?.data ?? resp;
  // payload expected shape: { totals: { availableForPayout: number, ... }, payoutHistory: [] }
      setAvailableBalance(Number(payload?.totals?.availableForPayout ?? 0));
      setPayoutRequests(Array.isArray(payload?.payoutHistory) ? payload.payoutHistory : []);
    } catch (error: any) {
      console.error('Failed to load payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      // request full available balance by default
      const payload = { amount: availableBalance, paymentMethod: 'bank', paymentDetails: {} };
      const result = await apiService.requestPayout(payload as any);
      if ((result as any)?.success) {
        toast.success('Payout requested');
        void fetchPayoutData();
      } else {
        toast.error((result as any)?.message || 'Failed to request payout');
      }
    } catch (error: any) {
      console.error('Failed to request payout:', error);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden flex items-center justify-center'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]' />
        <div className='text-center'>
          <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-purple-600' />
          <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'>
            Loading Payouts
          </h2>
          <p className='text-gray-600'>Fetching your payout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(139,92,246,0.08)_0%,_transparent_50%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.06)_0%,_transparent_50%)]' />

      <div className='relative z-10 p-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 animate-pulse' />
            <div className='absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 animate-pulse delay-700' />
            <div className='flex items-center justify-between relative z-10'>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='bg-white/20 backdrop-blur-sm p-3 rounded-xl'>
                    <DollarSign className='w-8 h-8' />
                  </div>
                  <h1 className='text-4xl font-bold'>Payouts</h1>
                </div>
                <p className='text-purple-100 text-lg'>
                  Manage your payout requests and history
                </p>
              </div>
              <div className='hidden md:flex gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => fetchPayoutData()}
                  className='bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0 text-white'
                >
                  <Loader2 className='w-4 h-4 mr-2' />
                  Refresh
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    // export teacher payouts (simple JSON export)
                    const dataStr = JSON.stringify({ payouts: payoutRequests, exportedAt: new Date().toISOString() }, null, 2);
                    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', `payouts-${new Date().toISOString().split('T')[0]}.json`);
                    linkElement.click();
                  }}
                  className='bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0 text-white'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Export
                </Button>
                <Button
                  className='bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                  onClick={handleRequestPayout}
                  disabled={availableBalance < 1000}
                >
                  <Loader2 className='w-4 h-4 mr-2' />
                  Request Payout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Available Balance</p>
                  <p className='text-3xl font-bold text-gray-900'>{formatCurrency(availableBalance)}</p>
                </div>
                <div className='bg-gradient-to-br from-cyan-500 to-blue-500 p-4 rounded-xl'>
                  <Wallet className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Pending</p>
                  <p className='text-3xl font-bold text-gray-900'>{payoutRequests.filter(p => p.status === 'pending').length}</p>
                </div>
                <div className='bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-xl'>
                  <Clock className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Completed</p>
                  <p className='text-3xl font-bold text-gray-900'>{payoutRequests.filter(p => p.status === 'completed').length}</p>
                </div>
                <div className='bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl'>
                  <CheckCircle className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Avg Payout</p>
                  <p className='text-3xl font-bold text-gray-900'>
                    {payoutRequests.length ? `₹${Math.round(payoutRequests.reduce((s, p) => s + (p.amount || 0), 0) / payoutRequests.length).toLocaleString('en-IN')}` : '₹0'}
                  </p>
                </div>
                <div className='bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl'>
                  <TrendingUp className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8'>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='md:col-span-2'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    type='text'
                    placeholder='Search payouts by ID, method, or date...'
                    value={''}
                    onChange={() => {}}
                    className='pl-10 w-full border-gray-200 focus:ring-2 focus:ring-purple-500 rounded-md p-2'
                  />
                </div>
              </div>

              <div>
                <select className='w-full border-gray-200 rounded-md p-2'>
                  <option value='all'>All Status</option>
                  <option value='requested'>Pending</option>
                  <option value='processing'>Processing</option>
                  <option value='completed'>Completed</option>
                </select>
              </div>

              <div>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => { /* clear filters placeholder */ }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payouts List */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Wallet className='w-5 h-5 text-purple-600' />
              Payout Requests
            </CardTitle>
            <CardDescription>
              Showing {payoutRequests.length} payout requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payoutRequests.length === 0 ? (
              <div className='text-center py-12'>
                <DollarSign className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-500 mb-2'>No payout requests found</p>
                <p className='text-sm text-gray-400'>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {payoutRequests.map((payout: any) => (
                  <div key={payout.id} className='flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h4 className='font-semibold text-gray-900'>{formatCurrency(payout.amount)}</h4>
                        <Badge className={payout.status === 'completed' ? 'bg-green-100 text-green-700' : payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                          {payout.status}
                        </Badge>
                      </div>
                      <p className='text-sm text-gray-600 mb-1'>Requested: {new Date(payout.requestedAt || payout.requestedDate).toLocaleDateString()}</p>
                      <p className='text-sm text-gray-500'>Method: {payout.method}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      {payout.status === 'completed' && <CheckCircle className='w-5 h-5 text-green-500' />}
                      {payout.status === 'pending' && <Clock className='w-5 h-5 text-yellow-500' />}
                      {payout.status === 'rejected' && <XCircle className='w-5 h-5 text-red-500' />}
                      <Button variant='outline' size='sm' className='border-gray-200' onClick={() => { /* download receipt */ }}>
                        <Download className='w-4 h-4 mr-2' />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payouts;
