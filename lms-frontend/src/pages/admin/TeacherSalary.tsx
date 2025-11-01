import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  CreditCard,
  Calendar,
  Loader2,
  Ban,
  Plus,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Teacher {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  bankAccount?: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    isVerified: boolean;
  };
  salaryStats: {
    totalPaid: number;
    totalPayments: number;
    pendingPayments: number;
    lastPaymentDate: string | null;
    lastPaymentAmount: number;
  };
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  transactionId: string | null;
  metadata: string;
}

const TeacherSalaryManagement: React.FC = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    completedAmount: 0,
    pendingPayments: 0,
    pendingAmount: 0,
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: '',
    paymentMode: 'bank_transfer',
  });

  // Bank account form state
  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    branchName: '',
  });

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchStats();
  }, [statusFilter]);

    const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllTeachersWithSalaryInfo({ limit: 100 });
      // API returns { success: true, data: { teachers: [...], pagination: {...} } }
      const teachers = response.data?.data?.teachers || response.data?.teachers || [];
      setTeachers(teachers);
    } catch (error: any) {
      console.error('Failed to load teachers:', error);
      toast.error(error.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getSalaryStats();
      // API returns { success: true, data: { stats: {...} } }
      const stats = response.data?.data?.stats || response.data?.stats || {
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        completedAmount: 0,
        pendingPayments: 0,
        pendingAmount: 0,
      };
      setStats(stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPaymentHistory = async (teacherId: number) => {
    try {
      const response = await apiService.getTeacherPaymentHistory(teacherId);
      // API returns { success: true, data: { payments: [...], stats: {...} } }
      const payments = response.data?.data?.payments || response.data?.payments || [];
      setPaymentHistory(payments);
    } catch (error: any) {
      console.error('Failed to load payment history:', error);
      toast.error(error.message || 'Failed to load payment history');
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedTeacher) return;

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);
      const response = await apiService.initiateSalaryPayment({
        teacherId: selectedTeacher.id,
        amount: parseFloat(paymentForm.amount),
        month: paymentForm.month.toString(),
        year: paymentForm.year.toString(),
        description: paymentForm.description,
        paymentMode: paymentForm.paymentMode,
      });

      toast.success(response.message || 'Salary payment initiated successfully');
      setShowPaymentDialog(false);
      setPaymentForm({
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        description: '',
        paymentMode: 'bank_transfer',
      });
      fetchTeachers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateBankAccount = async () => {
    if (!selectedTeacher) return;

    if (!bankForm.accountNumber || !bankForm.ifscCode || !bankForm.accountHolderName || !bankForm.bankName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setProcessing(true);
      const response = await apiService.updateTeacherBankAccount(selectedTeacher.id, bankForm);
      toast.success(response.message || 'Bank account updated successfully');
      setShowBankDialog(false);
      setBankForm({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
        branchName: '',
      });
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update bank account');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkCompleted = async (paymentId: number) => {
    try {
      const transactionId = prompt('Enter transaction ID:');
      if (!transactionId) return;

      const response = await apiService.markPaymentCompleted(paymentId, { transactionId });
      toast.success(response.message || 'Payment marked as completed');
      fetchPaymentHistory(selectedTeacher!.id);
      fetchTeachers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark payment as completed');
    }
  };

  const handleCancelPayment = async (paymentId: number) => {
    try {
      const reason = prompt('Enter cancellation reason:');
      if (!reason) return;

      const response = await apiService.cancelPayment(paymentId, { reason });
      toast.success(response.message || 'Payment cancelled');
      fetchPaymentHistory(selectedTeacher!.id);
      fetchTeachers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel payment');
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center'>
        <Loader2 className='w-12 h-12 animate-spin text-blue-600' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6'>
      {/* Header */}
      <div className='bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold mb-2 flex items-center gap-3'>
              <DollarSign className='w-8 h-8' />
              Teacher Salary Management
            </h1>
            <p className='text-blue-100 text-lg'>Manage and process teacher salary payments</p>
          </div>
        </div>

        {/* Stats */}
        <div className='mt-6 grid grid-cols-2 md:grid-cols-4 gap-4'>
          {[
            { label: 'Total Paid', value: `₹${stats.completedAmount.toLocaleString()}`, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'Pending', value: `₹${stats.pendingAmount.toLocaleString()}`, icon: Clock, color: 'bg-yellow-500' },
            { label: 'Completed', value: stats.completedPayments, icon: TrendingUp, color: 'bg-blue-500' },
            { label: 'Total Payments', value: stats.totalPayments, icon: CreditCard, color: 'bg-purple-500' },
          ].map((stat, i) => (
            <div key={i} className='bg-white/20 backdrop-blur-sm rounded-lg p-4'>
              <div className='flex items-center gap-3'>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className='w-6 h-6 text-white' />
                </div>
                <div>
                  <div className='text-sm text-blue-100'>{stat.label}</div>
                  <div className='text-2xl font-bold'>{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className='mb-6 flex flex-col md:flex-row gap-4'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
          <Input
            placeholder='Search teachers by name or email...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='inactive'>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teachers Table */}
      <Card className='shadow-xl'>
        <CardHeader>
          <CardTitle>Teachers List</CardTitle>
          <CardDescription>Manage salary payments for all teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div>
                      <div className='font-semibold'>{teacher.name}</div>
                      <div className='text-sm text-gray-500'>{teacher.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {teacher.bankAccount ? (
                      <div className='flex items-center gap-2'>
                        <Badge variant={teacher.bankAccount.isVerified ? 'default' : 'secondary'}>
                          {teacher.bankAccount.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setBankForm({
                              accountNumber: teacher.bankAccount?.accountNumber || '',
                              ifscCode: '',
                              accountHolderName: teacher.bankAccount?.accountHolderName || '',
                              bankName: teacher.bankAccount?.bankName || '',
                              branchName: '',
                            });
                            setShowBankDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setBankForm({
                            accountNumber: '',
                            ifscCode: '',
                            accountHolderName: teacher.name,
                            bankName: '',
                            branchName: '',
                          });
                          setShowBankDialog(true);
                        }}
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        Add Bank
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-semibold'>₹{teacher.salaryStats.totalPaid.toLocaleString()}</div>
                      <div className='text-sm text-gray-500'>{teacher.salaryStats.totalPayments} payments</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {teacher.salaryStats.lastPaymentDate ? (
                      <div>
                        <div>₹{teacher.salaryStats.lastPaymentAmount.toLocaleString()}</div>
                        <div className='text-sm text-gray-500'>
                          {new Date(teacher.salaryStats.lastPaymentDate).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className='text-gray-400'>No payments yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowPaymentDialog(true);
                        }}
                        disabled={!teacher.bankAccount}
                        className='bg-green-600 hover:bg-green-700'
                      >
                        <Send className='w-4 h-4 mr-2' />
                        Pay
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          fetchPaymentHistory(teacher.id);
                          setShowHistoryDialog(true);
                        }}
                      >
                        <Eye className='w-4 h-4 mr-2' />
                        History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTeachers.length === 0 && (
            <div className='text-center py-12 text-gray-500'>
              No teachers found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Initiate Salary Payment</DialogTitle>
            <DialogDescription>
              Pay salary to {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='month'>Month</Label>
                <Select
                  value={paymentForm.month.toString()}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, month: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='year'>Year</Label>
                <Select
                  value={paymentForm.year.toString()}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, year: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='amount'>Amount (₹)</Label>
              <Input
                id='amount'
                type='number'
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder='Enter amount'
              />
            </div>

            <div>
              <Label htmlFor='description'>Description (Optional)</Label>
              <Textarea
                id='description'
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder='Add any notes or description'
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor='paymentMode'>Payment Mode</Label>
              <Select
                value={paymentForm.paymentMode}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='bank_transfer'>Bank Transfer</SelectItem>
                  <SelectItem value='manual'>Manual Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInitiatePayment} disabled={processing} className='bg-green-600 hover:bg-green-700'>
              {processing ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <Send className='w-4 h-4 mr-2' />
                  Initiate Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Payment History - {selectedTeacher?.name}</DialogTitle>
            <DialogDescription>
              View all salary payments for this teacher
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {paymentHistory.map((payment) => {
              const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
              return (
                <Card key={payment.id}>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h4 className='font-semibold text-lg'>₹{payment.amount.toLocaleString()}</h4>
                          <Badge
                            variant={
                              payment.status === 'completed'
                                ? 'default'
                                : payment.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </div>
                        <div className='text-sm text-gray-600 space-y-1'>
                          <div>Period: {metadata.month}/{metadata.year}</div>
                          <div>Initiated: {new Date(payment.createdAt).toLocaleString()}</div>
                          {payment.paidAt && <div>Completed: {new Date(payment.paidAt).toLocaleString()}</div>}
                          {payment.transactionId && <div>Transaction ID: {payment.transactionId}</div>}
                          {metadata.description && <div>Note: {metadata.description}</div>}
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        {payment.status === 'pending' && (
                          <>
                            <Button
                              size='sm'
                              onClick={() => handleMarkCompleted(payment.id)}
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <CheckCircle className='w-4 h-4 mr-2' />
                              Mark Completed
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleCancelPayment(payment.id)}
                            >
                              <Ban className='w-4 h-4 mr-2' />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {paymentHistory.length === 0 && (
              <div className='text-center py-12 text-gray-500'>
                No payment history available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Account Dialog */}
      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Bank Account Details</DialogTitle>
            <DialogDescription>
              {selectedTeacher?.bankAccount ? 'Update' : 'Add'} bank account for {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='accountHolderName'>Account Holder Name</Label>
              <Input
                id='accountHolderName'
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                placeholder='Enter account holder name'
              />
            </div>

            <div>
              <Label htmlFor='accountNumber'>Account Number</Label>
              <Input
                id='accountNumber'
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                placeholder='Enter account number'
              />
            </div>

            <div>
              <Label htmlFor='ifscCode'>IFSC Code</Label>
              <Input
                id='ifscCode'
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                placeholder='Enter IFSC code'
              />
            </div>

            <div>
              <Label htmlFor='bankName'>Bank Name</Label>
              <Input
                id='bankName'
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                placeholder='Enter bank name'
              />
            </div>

            <div>
              <Label htmlFor='branchName'>Branch Name (Optional)</Label>
              <Input
                id='branchName'
                value={bankForm.branchName}
                onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                placeholder='Enter branch name'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowBankDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBankAccount} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Bank Details'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherSalaryManagement;
