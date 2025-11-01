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
  DollarSign,
  CreditCard,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

const PaymentsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Fetch payments data
  const {
    data: paymentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payments', statusFilter, methodFilter, searchTerm],
    queryFn: async () => {
      const response = await apiService.getPayments();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleRetryPayment = async (paymentId: string) => {
    try {
      toast.loading(`Retrying payment ${paymentId}...`);
      // Implement retry logic
      await apiService.retryPayment(paymentId);
      toast.success('Payment retry initiated successfully');
      void refetch();
    } catch (error) {
      toast.error('Failed to retry payment');
      console.error(error);
    }
  };

  const exportReport = () => {
    toast.success('Exporting payments report...');
    const data = {
      type: 'payments',
      generatedAt: new Date().toISOString(),
      filters: { status: statusFilter, method: methodFilter, search: searchTerm },
      data: filteredPayments,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-6 text-blue-500' />
            <h2 className='text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Loading Payments
            </h2>
            <p className='text-gray-600'>Fetching transaction data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Error Loading Payments</h2>
            <p className='text-gray-600 mb-6'>
              {error instanceof Error ? error.message : 'Failed to load payments data'}
            </p>
            <Button
              onClick={() => void refetch()}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const payments = paymentsData?.payments || [];
  const stats = paymentsData?.stats || {
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalRevenue: 0,
    successRate: 0,
    avgTransaction: 0,
    thisMonth: 0,
  };

  // Filter payments
  const filteredPayments = payments.filter((payment: any) => {
    const matchesSearch =
      payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return (
          <Badge className='bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0'>
            <RefreshCw className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className='bg-gradient-to-r from-red-600 to-pink-600 text-white border-0'>
            <XCircle className='w-3 h-3 mr-1' />
            Failed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0'>
            <RotateCcw className='w-3 h-3 mr-1' />
            Refunded
          </Badge>
        );
      default:
        return <Badge className='bg-gray-500 text-white border-0'>{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    return (
      <Badge variant='outline' className='border-gray-300 text-gray-700'>
        <CreditCard className='w-3 h-3 mr-1' />
        {method || 'N/A'}
      </Badge>
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg'>
          <DollarSign className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg'>
          <CreditCard className='w-6 h-6 text-white' />
        </div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl'>
                    <DollarSign className='w-10 h-10 text-white' />
                  </div>
                  <div>
                    <Badge className='mb-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white border-0 px-4 py-2 font-semibold'>
                      <TrendingUp className='w-4 h-4 mr-2' />
                      Payments Management
                    </Badge>
                    <h1 className='text-5xl font-bold bg-gradient-to-r from-gray-900 via-green-900 to-emerald-900 bg-clip-text text-transparent drop-shadow-lg'>
                      Transaction Center
                    </h1>
                    <p className='text-xl text-gray-600 mt-2'>
                      Monitor and manage all{' '}
                      <span className='bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-semibold'>
                        platform transactions
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Button
                  onClick={() => void refetch()}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Refresh
                </Button>

                <Button
                  onClick={exportReport}
                  className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Total Transactions</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {stats.total}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <CreditCard className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Completed</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {stats.completed}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <CheckCircle className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Pending</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {stats.pending}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <RefreshCw className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full -translate-y-12 translate-x-12'></div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Failed</p>
                    <p className='text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300'>
                      {stats.failed}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <XCircle className='w-6 h-6 text-white' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Summary */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg'>
                    <DollarSign className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Total Revenue</p>
                    <p className='text-2xl font-bold text-gray-900'>₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg'>
                    <TrendingUp className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Success Rate</p>
                    <p className='text-2xl font-bold text-gray-900'>{stats.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg'>
                    <Calendar className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>This Month</p>
                    <p className='text-2xl font-bold text-gray-900'>₹{stats.thisMonth.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8'>
            <CardContent className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    type='text'
                    placeholder='Search by user, course, or transaction ID...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 bg-white border-gray-200'
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='bg-white border-gray-200'>
                    <Filter className='w-4 h-4 mr-2' />
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='failed'>Failed</SelectItem>
                    <SelectItem value='refunded'>Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className='bg-white border-gray-200'>
                    <CreditCard className='w-4 h-4 mr-2' />
                    <SelectValue placeholder='Filter by method' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Methods</SelectItem>
                    <SelectItem value='cashfree'>Cashfree</SelectItem>
                    <SelectItem value='card'>Card</SelectItem>
                    <SelectItem value='upi'>UPI</SelectItem>
                    <SelectItem value='netbanking'>Net Banking</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setMethodFilter('all');
                  }}
                  className='border-gray-200 hover:bg-gray-50'
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
            <CardHeader>
              <CardTitle className='text-gray-900 flex items-center gap-2'>
                <CreditCard className='w-5 h-5 text-green-600' />
                Payment Transactions
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Complete transaction history and payment management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-lg border border-gray-200 overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50 hover:bg-gray-50'>
                      <TableHead className='text-gray-900 font-semibold'>Transaction ID</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>User</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Course/Batch</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Amount</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Method</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Status</TableHead>
                      <TableHead className='text-gray-900 font-semibold'>Date</TableHead>
                      <TableHead className='text-gray-900 font-semibold text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className='text-center py-12'>
                          <div className='flex flex-col items-center gap-2'>
                            <CreditCard className='w-12 h-12 text-gray-300' />
                            <p className='text-gray-500 font-medium'>No payments found</p>
                            <p className='text-gray-400 text-sm'>
                              {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Payments will appear here once transactions are made'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id} className='hover:bg-blue-50/50 transition-colors'>
                          <TableCell className='font-mono text-sm text-gray-900'>
                            {payment.transactionId || payment.id}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <User className='w-4 h-4 text-gray-400' />
                              <span className='text-gray-900'>{payment.user?.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <BookOpen className='w-4 h-4 text-gray-400' />
                              <span className='text-gray-900'>
                                {payment.course?.title || payment.batch?.name || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='font-semibold text-gray-900'>
                            ₹{payment.amount?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell>{getMethodBadge(payment.method)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className='text-gray-600'>
                            {payment.createdAt
                              ? new Date(payment.createdAt).toLocaleDateString('en-IN')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className='text-right'>
                            {payment.status === 'failed' && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => {
                                  void handleRetryPayment(payment.id);
                                }}
                                className='border-red-200 text-red-600 hover:bg-red-50'
                              >
                                <RotateCcw className='w-3 h-3 mr-1' />
                                Retry
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentsManagement;
