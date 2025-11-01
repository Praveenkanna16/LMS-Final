import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Download,
  ArrowRight,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Award,
  Zap,
  BarChart3,
  PieChart,
  Eye,
  PieChartIcon,
} from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';
import { useToast } from '@/hooks/use-toast';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingWithdrawals: number;
  thisMonthEarnings: number;
  previousMonthEarnings: number;
  earningsTrend: number;
  batchEarnings: Array<{
    id: string;
    batchName: string;
    students: number;
    totalEarnings: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    batchName: string;
    amount: number;
    type: 'payment' | 'refund' | 'withdrawal';
    status: 'completed' | 'pending' | 'failed';
  }>;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount?: string;
}

const EarningsPage: React.FC = () => {
  const { toast } = useToast();
  const user = sessionManager.getUser();

  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    availableBalance: 0,
    pendingWithdrawals: 0,
    thisMonthEarnings: 0,
    previousMonthEarnings: 0,
    earningsTrend: 0,
    batchEarnings: [],
    recentTransactions: [],
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch earnings data
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('genzed_token') || '';

        const res = await fetch('/api/teacher/earnings', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setEarnings(data.data);
        }

        // Fetch withdrawals
        const withdrawRes = await fetch('/api/teacher/withdrawals', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (withdrawRes.ok) {
          const data = await withdrawRes.json();
          setWithdrawals(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load earnings data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  const handleWithdrawalRequest = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (parseFloat(withdrawalAmount) > earnings.availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'Amount exceeds available balance',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('genzed_token') || '';
      const res = await fetch('/api/teacher/request-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parseFloat(withdrawalAmount) }),
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Withdrawal request submitted',
        });
        setWithdrawalAmount('');
        setShowWithdrawalModal(false);
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit withdrawal request',
        variant: 'destructive',
      });
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      ['Date', 'Batch', 'Amount', 'Type', 'Status'],
      ...earnings.recentTransactions.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.batchName,
        `₹${t.amount.toFixed(2)}`,
        t.type,
        t.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6'>
        <div className='max-w-7xl mx-auto space-y-8'>
          {/* Header */}
          <div className='relative'>
            <div className='absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl rotate-12 animate-bounce opacity-20' />
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <DollarSign className='w-7 h-7 text-white' />
                    </div>
                    <div>
                      <h1 className='text-4xl font-bold text-white mb-2'>Earnings Dashboard 💰</h1>
                      <p className='text-green-100'>Track your teaching income and payouts</p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      className='bg-white/20 border-white/30 text-white hover:bg-white/30'
                      onClick={handleExportReport}
                    >
                      <Download className='w-4 h-4 mr-2' />
                      Export
                    </Button>
                    <Button
                      className='bg-white text-green-600 hover:bg-green-50 shadow-lg'
                      onClick={() => setShowWithdrawalModal(true)}
                    >
                      <Wallet className='w-5 h-5 mr-2' />
                      Request Payout
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Total Earnings */}
            <Card className='bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 shadow-lg hover:shadow-xl transition-all'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-green-600 font-semibold'>Total Earnings</p>
                  <div className='w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center'>
                    <TrendingUp className='w-5 h-5 text-green-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-4xl font-bold text-gray-900'>
                    ₹{earnings.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className='text-sm text-gray-600'>All-time earnings</p>
                </div>
              </CardContent>
            </Card>

            {/* Available Balance */}
            <Card className='bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 shadow-lg hover:shadow-xl transition-all'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-blue-600 font-semibold'>Available Balance</p>
                  <div className='w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                    <Wallet className='w-5 h-5 text-blue-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-4xl font-bold text-gray-900'>
                    ₹{earnings.availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className='text-sm text-gray-600'>Ready to withdraw</p>
                </div>
              </CardContent>
            </Card>

            {/* This Month */}
            <Card className='bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 shadow-lg hover:shadow-xl transition-all'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-purple-600 font-semibold'>This Month</p>
                  <div className='w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center'>
                    <Calendar className='w-5 h-5 text-purple-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-4xl font-bold text-gray-900'>
                    ₹{earnings.thisMonthEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <div className='flex items-center gap-1 text-sm'>
                    {earnings.earningsTrend >= 0 ? (
                      <>
                        <TrendingUp className='w-4 h-4 text-green-600' />
                        <span className='text-green-600'>
                          {earnings.earningsTrend.toFixed(1)}% vs last month
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className='w-4 h-4 text-red-600' />
                        <span className='text-red-600'>
                          {Math.abs(earnings.earningsTrend).toFixed(1)}% vs last month
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Withdrawals */}
            <Card className='bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 shadow-lg hover:shadow-xl transition-all'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-orange-600 font-semibold'>Pending</p>
                  <div className='w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center'>
                    <Zap className='w-5 h-5 text-orange-600 animate-pulse' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-4xl font-bold text-gray-900'>
                    ₹{earnings.pendingWithdrawals.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className='text-sm text-gray-600'>Under processing</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Batch-wise Earnings */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center animate-pulse'>
                  <PieChartIcon className='w-5 h-5 text-white' />
                </div>
                <CardTitle className='text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                  Batch-wise Earnings Breakdown
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className='p-6'>
              {earnings.batchEarnings.length > 0 ? (
                <div className='space-y-4'>
                  {earnings.batchEarnings.map((batch) => (
                    <div
                      key={batch.id}
                      className='group p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <div>
                          <h4 className='font-semibold text-gray-900'>{batch.batchName}</h4>
                          <p className='text-sm text-gray-600'>{batch.students} students enrolled</p>
                        </div>
                        <div className='text-right'>
                          <p className='text-xl font-bold text-green-600'>
                            ₹{batch.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                          <Badge className='bg-green-100 text-green-700 border-0 mt-1'>
                            {batch.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                        <div
                          className='bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all'
                          style={{ width: `${batch.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <AlertCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-600'>No earnings data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <BarChart3 className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                      Recent Transactions
                    </CardTitle>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className='flex gap-2'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search transactions...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className='px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='all'>All Transactions</option>
                  <option value='payment'>Payments</option>
                  <option value='refund'>Refunds</option>
                  <option value='withdrawal'>Withdrawals</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className='p-6'>
              {earnings.recentTransactions.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-200'>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Date</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Batch</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Type</th>
                        <th className='text-right py-3 px-4 font-semibold text-gray-700'>Amount</th>
                        <th className='text-center py-3 px-4 font-semibold text-gray-700'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                          <td className='py-3 px-4 text-sm'>
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className='py-3 px-4 text-sm font-medium'>{transaction.batchName}</td>
                          <td className='py-3 px-4 text-sm'>
                            <Badge
                              className={
                                transaction.type === 'payment'
                                  ? 'bg-green-100 text-green-700'
                                  : transaction.type === 'refund'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                              }
                            >
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Badge>
                          </td>
                          <td className='py-3 px-4 text-sm text-right font-semibold'>
                            ₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className='py-3 px-4 text-sm text-center'>
                            <Badge
                              className={
                                transaction.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }
                            >
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='text-center py-12'>
                  <AlertCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-600'>No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Requests History */}
          {withdrawals.length > 0 && (
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <Wallet className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'>
                      Payout Requests
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className='flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all'
                    >
                      <div>
                        <p className='font-semibold text-gray-900'>
                          ₹{withdrawal.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Requested: {new Date(withdrawal.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          withdrawal.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : withdrawal.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : withdrawal.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                        }
                      >
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='w-full max-w-md shadow-2xl rounded-3xl'>
              <CardHeader className='bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-3xl'>
                <CardTitle className='text-2xl'>Request Payout</CardTitle>
                <CardDescription className='text-green-100'>
                  Withdraw your available earnings
                </CardDescription>
              </CardHeader>
              <CardContent className='p-6 space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Available Balance
                  </label>
                  <p className='text-2xl font-bold text-green-600'>
                    ₹{earnings.availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Withdrawal Amount
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600'>₹</span>
                    <input
                      type='number'
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder='Enter amount'
                      className='w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500'
                    />
                  </div>
                </div>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-sm text-blue-800'>
                    💡 Processing usually takes 2-3 business days after approval
                  </p>
                </div>
                <div className='flex gap-2 pt-4'>
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={() => setShowWithdrawalModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className='flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    onClick={handleWithdrawalRequest}
                  >
                    Request Payout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
};

export default EarningsPage;
