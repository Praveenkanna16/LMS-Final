import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Search,
  Download,
  RefreshCw,
  Eye,
  Send,
  Receipt,
  IndianRupee,
  PieChart,
  BarChart3,
} from 'lucide-react';

interface Payment {
  id: string;
  orderId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  course: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'netbanking' | 'upi' | 'wallet';
  gateway: 'cashfree' | 'razorpay' | 'stripe';
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
  failureReason?: string;
  receipt?: string;
}

interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface RefundRequest {
  id: string;
  paymentId: string;
  studentName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedAt: Date;
  processedAt?: Date;
}

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      orderId: 'ORD_2024_001',
      studentId: 'STU_001',
      studentName: 'Rahul Sharma',
      studentEmail: 'rahul.sharma@email.com',
      course: 'Complete React Developer Course',
      amount: 8999,
      currency: 'INR',
      status: 'success',
      paymentMethod: 'upi',
      gateway: 'cashfree',
      transactionId: 'TXN_12345',
      createdAt: new Date('2024-01-20'),
      completedAt: new Date('2024-01-20'),
      receipt: 'REC_001',
    },
    {
      id: '2',
      orderId: 'ORD_2024_002',
      studentId: 'STU_002',
      studentName: 'Priya Patel',
      studentEmail: 'priya.patel@email.com',
      course: 'Node.js Backend Bootcamp',
      amount: 12999,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'card',
      gateway: 'cashfree',
      createdAt: new Date('2024-01-21'),
    },
    {
      id: '3',
      orderId: 'ORD_2024_003',
      studentId: 'STU_003',
      studentName: 'Amit Singh',
      studentEmail: 'amit.singh@email.com',
      course: 'Full Stack Development',
      amount: 18999,
      currency: 'INR',
      status: 'failed',
      paymentMethod: 'netbanking',
      gateway: 'cashfree',
      createdAt: new Date('2024-01-19'),
      failureReason: 'Card declined by bank',
    },
  ]);

  const [_refundRequests, _setRefundRequests] = useState<RefundRequest[]>([
    {
      id: '1',
      paymentId: '1',
      studentName: 'Rahul Sharma',
      amount: 8999,
      reason: 'Course not as expected',
      status: 'pending',
      requestedAt: new Date('2024-01-21'),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [_showRefundDialog, setShowRefundDialog] = useState(false);

  // Calculate stats
  const stats: PaymentStats = {
    totalRevenue: payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0),
    monthlyRevenue: payments
      .filter(
        p =>
          p.status === 'success' &&
          p.completedAt &&
          p.completedAt.getMonth() === new Date().getMonth()
      )
      .reduce((sum, p) => sum + p.amount, 0),
    successfulPayments: payments.filter(p => p.status === 'success').length,
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    failedPayments: payments.filter(p => p.status === 'failed').length,
    refundedAmount: payments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0),
    averageOrderValue:
      payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
    conversionRate:
      payments.length > 0
        ? (payments.filter(p => p.status === 'success').length / payments.length) * 100
        : 0,
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesGateway = gatewayFilter === 'all' || payment.gateway === gatewayFilter;
    return matchesSearch && matchesStatus && matchesGateway;
  });

  // Handle payment actions
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const _handleRefund = (paymentId: string) => {
    // TODO: Implement refund logic
    setPayments(prev =>
      prev.map(payment =>
        payment.id === paymentId
          ? { ...payment, status: 'refunded' as const, refundedAt: new Date() }
          : payment
      )
    );
  };

  const handleRetryPayment = (paymentId: string) => {
    // TODO: Implement payment retry logic
    setPayments(prev =>
      prev.map(payment =>
        payment.id === paymentId ? { ...payment, status: 'pending' as const } : payment
      )
    );
  };

  const handleSendReceipt = (paymentId: string) => {
    // TODO: Implement send receipt logic
    console.warn(`Sending receipt for payment ${paymentId}`);
  };

  return (
    <div className='min-h-screen bg-gray-50 p-3 sm:p-6'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-6'>
        {/* Header - Mobile optimized */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Payment Management</h1>
            <p className='text-sm sm:text-base text-gray-600 hidden sm:block'>
              Track and manage all course payments
            </p>
            <p className='text-sm text-gray-600 sm:hidden'>Manage payments</p>
          </div>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
            <Button variant='outline' className='text-xs sm:text-sm'>
              <Download className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
              <span className='hidden sm:inline'>Export Report</span>
              <span className='sm:hidden'>Export</span>
            </Button>
            <Button variant='outline' className='text-xs sm:text-sm'>
              <RefreshCw className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
              <span className='hidden sm:inline'>Sync Payments</span>
              <span className='sm:hidden'>Sync</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Mobile optimized */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Revenue</CardTitle>
              <IndianRupee className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>
                ₹{(stats.totalRevenue / 1000).toFixed(0)}k
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                ₹{stats.monthlyRevenue.toLocaleString()} this month
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>
                ₹{(stats.monthlyRevenue / 1000).toFixed(0)}k/mo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Successful</CardTitle>
              <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold text-green-600'>
                {stats.successfulPayments}
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                {stats.conversionRate.toFixed(1)}% conversion rate
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>
                {stats.conversionRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Pending</CardTitle>
              <Clock className='h-3 w-3 sm:h-4 sm:w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold text-yellow-600'>
                {stats.pendingPayments}
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Awaiting completion</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Awaiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Avg Order</CardTitle>
              <TrendingUp className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>
                ₹{(stats.averageOrderValue / 1000).toFixed(0)}k
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Per transaction</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Per order</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Mobile optimized */}
        <Card>
          <CardContent className='p-3 sm:p-6'>
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search payments...'
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                    }}
                    className='pl-10 text-sm'
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='success'>Success</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                  <SelectItem value='refunded'>Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filter by gateway' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Gateways</SelectItem>
                  <SelectItem value='cashfree'>Cashfree</SelectItem>
                  <SelectItem value='razorpay'>Razorpay</SelectItem>
                  <SelectItem value='stripe'>Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue='payments' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4 lg:w-fit'>
            <TabsTrigger value='payments'>Payments</TabsTrigger>
            <TabsTrigger value='refunds'>Refunds</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value='payments' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>All Payments ({filteredPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 sm:space-y-4'>
                  {filteredPayments.map(payment => (
                    <div
                      key={payment.id}
                      className='flex items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50'
                    >
                      <div className='flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1'>
                        <div
                          className={`w-3 h-3 rounded-full mt-1 sm:mt-0 ${
                            payment.status === 'success'
                              ? 'bg-green-500'
                              : payment.status === 'pending'
                                ? 'bg-yellow-500'
                                : payment.status === 'failed'
                                  ? 'bg-red-500'
                                  : 'bg-gray-500'
                          }`}
                        ></div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                            <h3 className='font-medium text-sm sm:text-base truncate'>
                              {payment.orderId}
                            </h3>
                            <div className='flex space-x-2'>
                              <Badge
                                variant={
                                  payment.status === 'success'
                                    ? 'default'
                                    : payment.status === 'pending'
                                      ? 'secondary'
                                      : payment.status === 'failed'
                                        ? 'destructive'
                                        : 'secondary'
                                }
                                className='text-xs'
                              >
                                {payment.status}
                              </Badge>
                              <Badge variant='outline' className='text-xs'>
                                {payment.gateway}
                              </Badge>
                            </div>
                          </div>
                          <p className='text-xs sm:text-sm text-gray-600 truncate'>
                            {payment.studentName}
                          </p>
                          <p className='text-xs sm:text-sm text-gray-500 truncate'>
                            {payment.course}
                          </p>
                          <div className='flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 text-xs text-gray-500'>
                            <span>{payment.paymentMethod}</span>
                            <span>•</span>
                            <span className='hidden sm:inline'>
                              {payment.createdAt.toLocaleDateString()}
                            </span>
                            <span className='sm:hidden'>
                              {payment.createdAt.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {payment.transactionId && (
                              <>
                                <span className='hidden sm:inline'>•</span>
                                <span className='hidden sm:inline'>
                                  TXN: {payment.transactionId}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='text-right'>
                          <p className='font-bold text-lg'>₹{payment.amount.toLocaleString()}</p>
                          <p className='text-sm text-gray-500'>{payment.currency}</p>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              handleViewPayment(payment);
                            }}
                          >
                            <Eye className='w-4 h-4 mr-1' />
                            View
                          </Button>
                          {payment.status === 'success' && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => {
                                handleSendReceipt(payment.id);
                              }}
                            >
                              <Receipt className='w-4 h-4 mr-1' />
                              Receipt
                            </Button>
                          )}
                          {payment.status === 'failed' && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => {
                                handleRetryPayment(payment.id);
                              }}
                            >
                              <RefreshCw className='w-4 h-4 mr-1' />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value='refunds' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold'>Refund Requests</h2>
              <Badge variant='outline'>
                {_refundRequests.filter((r: RefundRequest) => r.status === 'pending').length}{' '}
                pending
              </Badge>
            </div>

            <Card>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {_refundRequests.map((refund: RefundRequest) => (
                    <div
                      key={refund.id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3'>
                          <h3 className='font-medium'>{refund.studentName}</h3>
                          <Badge
                            variant={
                              refund.status === 'pending'
                                ? 'secondary'
                                : refund.status === 'approved'
                                  ? 'default'
                                  : refund.status === 'processed'
                                    ? 'default'
                                    : 'destructive'
                            }
                          >
                            {refund.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600'>
                          Amount: ₹{refund.amount.toLocaleString()}
                        </p>
                        <p className='text-sm text-gray-500'>Reason: {refund.reason}</p>
                        <p className='text-xs text-gray-400'>
                          Requested on {refund.requestedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className='flex items-center space-x-2'>
                        {refund.status === 'pending' && (
                          <>
                            <Button size='sm' variant='outline'>
                              Approve
                            </Button>
                            <Button size='sm' variant='destructive'>
                              Reject
                            </Button>
                          </>
                        )}
                        {refund.status === 'approved' && (
                          <Button size='sm' variant='default'>
                            Process Refund
                          </Button>
                        )}
                        <Button size='sm' variant='ghost'>
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value='analytics' className='space-y-6'>
            <h2 className='text-2xl font-bold'>Payment Analytics</h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <BarChart3 className='w-5 h-5 mr-2' />
                    Revenue Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Revenue chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <PieChart className='w-5 h-5 mr-2' />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>UPI</span>
                      <span className='text-sm font-medium'>45%</span>
                    </div>
                    <Progress value={45} />
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Credit/Debit Card</span>
                      <span className='text-sm font-medium'>30%</span>
                    </div>
                    <Progress value={30} />
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Net Banking</span>
                      <span className='text-sm font-medium'>20%</span>
                    </div>
                    <Progress value={20} />
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Wallet</span>
                      <span className='text-sm font-medium'>5%</span>
                    </div>
                    <Progress value={5} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='text-center'>
                      <div className='text-4xl font-bold text-green-600'>
                        {stats.conversionRate.toFixed(1)}%
                      </div>
                      <p className='text-sm text-gray-500'>Overall success rate</p>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>Successful</span>
                        <span className='text-green-600'>{stats.successfulPayments}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span>Failed</span>
                        <span className='text-red-600'>{stats.failedPayments}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span>Pending</span>
                        <span className='text-yellow-600'>{stats.pendingPayments}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gateway Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {['Cashfree', 'Razorpay', 'Stripe'].map(gateway => (
                      <div key={gateway} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium'>{gateway}</span>
                          <span className='text-sm text-gray-500'>95% success</span>
                        </div>
                        <Progress value={95} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value='settings' className='space-y-6'>
            <h2 className='text-2xl font-bold'>Payment Settings</h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Gateway Configuration</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Primary Gateway</label>
                    <Select defaultValue='cashfree'>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='cashfree'>Cashfree</SelectItem>
                        <SelectItem value='razorpay'>Razorpay</SelectItem>
                        <SelectItem value='stripe'>Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Currency</label>
                    <Select defaultValue='INR'>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='INR'>INR (₹)</SelectItem>
                        <SelectItem value='USD'>USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Auto-refund failed payments</span>
                    <Button size='sm' variant='outline'>
                      Toggle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Payment success emails</span>
                    <Button size='sm' variant='outline'>
                      Enabled
                    </Button>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Payment failure alerts</span>
                    <Button size='sm' variant='outline'>
                      Enabled
                    </Button>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Refund notifications</span>
                    <Button size='sm' variant='outline'>
                      Enabled
                    </Button>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Daily revenue reports</span>
                    <Button size='sm' variant='outline'>
                      Disabled
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Details Modal */}
        <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className='space-y-6'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Order ID</label>
                    <p className='font-medium'>{selectedPayment.orderId}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Status</label>
                    <Badge
                      className='ml-2'
                      variant={
                        selectedPayment.status === 'success'
                          ? 'default'
                          : selectedPayment.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Student</label>
                    <p className='font-medium'>{selectedPayment.studentName}</p>
                    <p className='text-sm text-gray-600'>{selectedPayment.studentEmail}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Amount</label>
                    <p className='font-bold text-lg'>₹{selectedPayment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Payment Method</label>
                    <p className='font-medium capitalize'>{selectedPayment.paymentMethod}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Gateway</label>
                    <p className='font-medium capitalize'>{selectedPayment.gateway}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Created</label>
                    <p className='font-medium'>{selectedPayment.createdAt.toLocaleString()}</p>
                  </div>
                  {selectedPayment.completedAt && (
                    <div>
                      <label className='text-sm font-medium text-gray-500'>Completed</label>
                      <p className='font-medium'>{selectedPayment.completedAt.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedPayment.transactionId && (
                    <div className='col-span-2'>
                      <label className='text-sm font-medium text-gray-500'>Transaction ID</label>
                      <p className='font-medium'>{selectedPayment.transactionId}</p>
                    </div>
                  )}
                  {selectedPayment.failureReason && (
                    <div className='col-span-2'>
                      <label className='text-sm font-medium text-gray-500'>Failure Reason</label>
                      <p className='text-red-600'>{selectedPayment.failureReason}</p>
                    </div>
                  )}
                </div>
                <div className='flex space-x-2'>
                  {selectedPayment.status === 'success' && (
                    <>
                      <Button
                        onClick={() => {
                          handleSendReceipt(selectedPayment.id);
                        }}
                      >
                        <Send className='w-4 h-4 mr-2' />
                        Send Receipt
                      </Button>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setShowRefundDialog(true);
                        }}
                      >
                        Initiate Refund
                      </Button>
                    </>
                  )}
                  {selectedPayment.status === 'failed' && (
                    <Button
                      onClick={() => {
                        handleRetryPayment(selectedPayment.id);
                      }}
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Retry Payment
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentManagement;
