import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  DollarSign,
  Download,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Calendar,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string | number;
  amount: number;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  created_at: string;
  batch?: {
    id: number;
    name: string;
  };
  description?: string;
}

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [retrying, setRetrying] = useState<string | number | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [selectedFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const statusParam = selectedFilter !== 'all' ? selectedFilter : undefined;
      const response = await apiService.getStudentPayments(statusParam);

      if (response.success && response.data) {
        setPayments(response.data.payments || []);
        setSummary(response.data.summary || {
          total: 0,
          success: 0,
          pending: 0,
          failed: 0,
          totalAmount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (paymentId: string | number) => {
    try {
      setRetrying(paymentId);
      const response = await apiService.retryPayment(String(paymentId));

      if (response.success) {
        toast.success('Payment retry initiated');
        // Open payment link in new tab
        if (response.data?.paymentLink) {
          window.open(response.data.paymentLink, '_blank');
        }
        fetchPayments();
      } else {
        toast.error(response.message ?? 'Failed to retry payment');
      }
    } catch (error) {
      console.error('Failed to retry payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setRetrying(null);
    }
  };

  const handleDownloadInvoice = async (paymentId: string | number) => {
    try {
      const response = await apiService.getInvoice(String(paymentId));

      if (response.success && response.data) {
        toast.success('Invoice downloaded');
        // In a real implementation, you would generate PDF here
        console.log('Invoice data:', response.data);
      } else {
        toast.error('Failed to download invoice');
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return (
          <Badge className='bg-green-100 text-green-800 border-green-200'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge className='bg-red-100 text-red-800 border-red-200'>
            <XCircle className='w-3 h-3 mr-1' />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-yellow-800 border-yellow-200'>
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800 border-gray-200'>
            {status}
          </Badge>
        );
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.batch?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Layout>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        {/* Floating decorations */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          {/* Header */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
            <div className='bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 relative overflow-hidden'>
              <div className='absolute inset-0 opacity-10'>
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

              <div className='relative z-10'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center'>
                    <DollarSign className='w-6 h-6 text-white' />
                  </div>
                  <Badge className='bg-white/20 backdrop-blur-sm text-white border-white/30'>
                    Student Portal
                  </Badge>
                </div>
                <h1 className='text-4xl font-bold text-white mb-2'>Payments & Transactions 💳</h1>
                <p className='text-green-100 text-lg'>Track all your payments and download invoices</p>
              </div>
            </div>
          </Card>

          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                    <CreditCard className='w-6 h-6 text-white' />
                  </div>
                  <TrendingUp className='w-5 h-5 text-gray-400' />
                </div>
                <p className='text-sm text-gray-600 mb-1'>Total Payments</p>
                <p className='text-3xl font-bold text-gray-900'>{summary.total}</p>
              </CardContent>
            </Card>

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                    <CheckCircle className='w-6 h-6 text-white' />
                  </div>
                  <TrendingUp className='w-5 h-5 text-gray-400' />
                </div>
                <p className='text-sm text-gray-600 mb-1'>Successful</p>
                <p className='text-3xl font-bold text-green-600'>{summary.success}</p>
              </CardContent>
            </Card>

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center'>
                    <Clock className='w-6 h-6 text-white' />
                  </div>
                  <AlertCircle className='w-5 h-5 text-gray-400' />
                </div>
                <p className='text-sm text-gray-600 mb-1'>Pending</p>
                <p className='text-3xl font-bold text-yellow-600'>{summary.pending}</p>
              </CardContent>
            </Card>

            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                    <DollarSign className='w-6 h-6 text-white' />
                  </div>
                  <TrendingUp className='w-5 h-5 text-gray-400' />
                </div>
                <p className='text-sm text-gray-600 mb-1'>Total Amount</p>
                <p className='text-2xl font-bold text-purple-600'>{formatCurrency(summary.totalAmount)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
                <div className='relative flex-1 max-w-md'>
                  <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    placeholder='Search by batch, transaction ID...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500'
                  />
                </div>

                <div className='flex gap-3 flex-wrap'>
                  {['all', 'success', 'pending', 'failed'].map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setSelectedFilter(filter)}
                      className={
                        selectedFilter === filter
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : 'border-2 border-gray-300 hover:border-green-500 hover:bg-green-50'
                      }
                    >
                      <Filter className='w-4 h-4 mr-1' />
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-6'>
              {loading ? (
                <div className='text-center py-12'>
                  <div className='w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
                  <p className='text-gray-600'>Loading payments...</p>
                </div>
              ) : filteredPayments.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b-2 border-gray-200'>
                        <th className='text-left p-4 font-semibold text-gray-700'>Date</th>
                        <th className='text-left p-4 font-semibold text-gray-700'>Batch/Description</th>
                        <th className='text-left p-4 font-semibold text-gray-700'>Transaction ID</th>
                        <th className='text-right p-4 font-semibold text-gray-700'>Amount</th>
                        <th className='text-center p-4 font-semibold text-gray-700'>Status</th>
                        <th className='text-center p-4 font-semibold text-gray-700'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                          <td className='p-4'>
                            <div className='flex items-center gap-2 text-sm text-gray-600'>
                              <Calendar className='w-4 h-4' />
                              {formatDate(payment.created_at)}
                            </div>
                          </td>
                          <td className='p-4'>
                            <p className='font-medium text-gray-900'>{payment.batch?.name || 'N/A'}</p>
                            {payment.description && (
                              <p className='text-sm text-gray-500'>{payment.description}</p>
                            )}
                          </td>
                          <td className='p-4'>
                            <code className='text-sm bg-gray-100 px-2 py-1 rounded'>
                              {payment.transactionId || 'N/A'}
                            </code>
                          </td>
                          <td className='p-4 text-right'>
                            <p className='font-bold text-lg text-gray-900'>
                              {formatCurrency(payment.amount)}
                            </p>
                          </td>
                          <td className='p-4 text-center'>{getStatusBadge(payment.status)}</td>
                          <td className='p-4'>
                            <div className='flex items-center justify-center gap-2'>
                              {payment.status === 'success' && (
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='border-2 border-blue-300 text-blue-600 hover:bg-blue-50'
                                  onClick={() => handleDownloadInvoice(payment.id)}
                                >
                                  <Download className='w-4 h-4 mr-1' />
                                  Invoice
                                </Button>
                              )}
                              {payment.status === 'failed' && (
                                <Button
                                  size='sm'
                                  className='bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                                  onClick={() => handleRetryPayment(payment.id)}
                                  disabled={retrying === payment.id}
                                >
                                  {retrying === payment.id ? (
                                    <>
                                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1' />
                                      Retrying...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className='w-4 h-4 mr-1' />
                                      Retry
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <CreditCard className='w-10 h-10 text-gray-400' />
                  </div>
                  <p className='text-gray-900 font-semibold mb-2 text-lg'>No payments found</p>
                  <p className='text-sm text-gray-600'>
                    {searchTerm || selectedFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Your payment history will appear here'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Payments;
