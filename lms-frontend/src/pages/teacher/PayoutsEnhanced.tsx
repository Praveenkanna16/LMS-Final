import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Search,
  Wallet,
  ArrowRight,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Zap,
  Award,
  RefreshCw,
} from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';
import { useToast } from '@/hooks/use-toast';

interface PayoutTransaction {
  id: string;
  amount: number;
  requestDate: string;
  approvalDate?: string;
  completionDate?: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  bankAccount?: string;
  transactionId?: string;
  failureReason?: string;
  batchCount: number;
}

interface BankAccount {
  id: string;
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  isDefault: boolean;
}

interface PayoutStats {
  totalPayouts: number;
  availableBalance: number;
  totalPendingPayouts: number;
  lastPayoutDate?: string;
  nextPayoutDate?: string;
  monthlyAverageEarnings: number;
  payoutFrequency: string;
}

const PayoutsPage: React.FC = () => {
  const { toast } = useToast();
  const user = sessionManager.getUser();

  const [transactions, setTransactions] = useState<PayoutTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    totalPayouts: 0,
    availableBalance: 0,
    totalPendingPayouts: 0,
    monthlyAverageEarnings: 0,
    payoutFrequency: 'monthly',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPayoutDetails, setShowPayoutDetails] = useState<PayoutTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [selectedBankId, setSelectedBankId] = useState('');

  // Bank form state
  const [bankForm, setBankForm] = useState({
    accountHolder: '',
    accountNumber: '',
    confirmAccountNumber: '',
    bankName: '',
    ifscCode: '',
    isDefault: false,
  });

  // Fetch payout data
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('genzed_token') || '';

        // Fetch transactions
        const transRes = await fetch('/api/teacher/payouts', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (transRes.ok) {
          const data = await transRes.json();
          setTransactions(data.data || []);
        }

        // Fetch bank accounts
        const bankRes = await fetch('/api/teacher/bank-accounts', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (bankRes.ok) {
          const data = await bankRes.json();
          setBankAccounts(data.data || []);
          if (data.data && data.data.length > 0) {
            setSelectedBankId(data.data[0].id);
          }
        }

        // Fetch stats
        const statsRes = await fetch('/api/teacher/payout-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch payout data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payout information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  const handleAddBankAccount = async () => {
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      toast({
        title: 'Error',
        description: 'Account numbers do not match',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('genzed_token') || '';
      const res = await fetch('/api/teacher/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankForm),
      });

      if (res.ok) {
        const data = await res.json();
        setBankAccounts([...bankAccounts, data.data]);
        setShowBankModal(false);
        setBankForm({
          accountHolder: '',
          accountNumber: '',
          confirmAccountNumber: '',
          bankName: '',
          ifscCode: '',
          isDefault: false,
        });

        toast({
          title: 'Success',
          description: 'Bank account added successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add bank account',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBankAccount = async (bankId: string) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        const token = localStorage.getItem('genzed_token') || '';
        const res = await fetch(`/api/teacher/bank-accounts/${bankId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setBankAccounts(bankAccounts.filter((b) => b.id !== bankId));
          toast({
            title: 'Success',
            description: 'Bank account deleted',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete bank account',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'approved':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='w-5 h-5' />;
      case 'processing':
        return <Clock className='w-5 h-5 animate-spin' />;
      case 'failed':
        return <AlertCircle className='w-5 h-5' />;
      default:
        return <TrendingUp className='w-5 h-5' />;
    }
  };

  const filteredTransactions = transactions.filter((trans) => {
    const matchesSearch =
      trans.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trans.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || trans.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleExportReport = () => {
    const csvContent = [
      ['Transaction ID', 'Amount', 'Status', 'Request Date', 'Completion Date'],
      ...transactions.map((t) => [
        t.id,
        `₹${t.amount.toFixed(2)}`,
        t.status,
        new Date(t.requestDate).toLocaleDateString(),
        t.completionDate ? new Date(t.completionDate).toLocaleDateString() : 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-report-${new Date().toISOString().split('T')[0]}.csv`;
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
            <div className='absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-3xl rotate-12 animate-bounce opacity-20' />
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
              <div className='bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce'>
                      <CreditCard className='w-7 h-7 text-white' />
                    </div>
                    <div>
                      <h1 className='text-4xl font-bold text-white mb-2'>Payout Management 💳</h1>
                      <p className='text-indigo-100'>Track and manage your earnings withdrawals</p>
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
                      className='bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg'
                      onClick={() => setShowBankModal(true)}
                    >
                      <Plus className='w-5 h-5 mr-2' />
                      Add Bank Account
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-blue-600 font-semibold'>Available Balance</p>
                  <div className='w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                    <Wallet className='w-5 h-5 text-blue-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>
                    ₹{stats.availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className='text-sm text-gray-600'>Ready to withdraw</p>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-green-600 font-semibold'>Total Payouts</p>
                  <div className='w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>{stats.totalPayouts}</p>
                  <p className='text-sm text-gray-600'>Completed payouts</p>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-orange-600 font-semibold'>Pending</p>
                  <div className='w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center'>
                    <Clock className='w-5 h-5 text-orange-600 animate-pulse' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>
                    ₹{stats.totalPendingPayouts.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className='text-sm text-gray-600'>Under processing</p>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-purple-600 font-semibold'>Monthly Avg</p>
                  <div className='w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center'>
                    <TrendingUp className='w-5 h-5 text-purple-600' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-3xl font-bold text-gray-900'>
                    ₹{stats.monthlyAverageEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className='text-sm text-gray-600'>Average earnings</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Accounts */}
          {bankAccounts.length > 0 && (
            <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
              <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <CreditCard className='w-5 h-5 text-white' />
                  </div>
                  <CardTitle className='text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'>
                    Bank Accounts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {bankAccounts.map((bank) => (
                    <div
                      key={bank.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedBankId === bank.id
                          ? 'border-indigo-500 bg-indigo-50/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedBankId(bank.id)}
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <p className='font-semibold text-gray-900'>{bank.accountHolder}</p>
                          <p className='text-sm text-gray-600'>{bank.bankName}</p>
                        </div>
                        {bank.isDefault && (
                          <Badge className='bg-indigo-100 text-indigo-700 border-0'>Default</Badge>
                        )}
                      </div>
                      <p className='text-sm text-gray-700 font-mono mb-3'>
                        ***{bank.accountNumber.slice(-4)}
                      </p>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1'
                          onClick={() => handleDeleteBankAccount(bank.id)}
                        >
                          <Trash2 className='w-4 h-4 mr-1' />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout Transactions */}
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center animate-pulse'>
                    <BarChart3 className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-xl bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent'>
                      Transaction History
                    </CardTitle>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className='flex gap-2 flex-col sm:flex-row'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search transactions...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as 'all' | 'pending' | 'completed' | 'failed')
                  }
                  className='px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value='all'>All Status</option>
                  <option value='pending'>Pending</option>
                  <option value='completed'>Completed</option>
                  <option value='failed'>Failed</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className='p-6'>
              {filteredTransactions.length > 0 ? (
                <div className='space-y-3'>
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className='group p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4 flex-1'>
                          <div className={`p-3 rounded-lg ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <p className='font-semibold text-gray-900'>
                                ₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </p>
                              <Badge className={`${getStatusColor(transaction.status)} border`}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </div>
                            <div className='flex items-center gap-2 text-sm text-gray-600'>
                              <Calendar className='w-4 h-4' />
                              <span>
                                Requested: {new Date(transaction.requestDate).toLocaleDateString()}
                              </span>
                              {transaction.batchCount > 0 && (
                                <>
                                  <span className='text-gray-400'>•</span>
                                  <span>{transaction.batchCount} batch(es)</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setShowPayoutDetails(transaction)}
                        >
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <AlertCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-600 font-semibold'>No payouts yet</p>
                  <p className='text-sm text-gray-500'>Your payout requests will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bank Account Modal */}
        {showBankModal && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <Card className='w-full max-w-md shadow-2xl rounded-3xl'>
              <CardHeader className='bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-3xl'>
                <CardTitle className='text-2xl'>Add Bank Account</CardTitle>
                <CardDescription className='text-indigo-100'>
                  Add your bank details for payouts
                </CardDescription>
              </CardHeader>
              <CardContent className='p-6 space-y-4'>
                <input
                  type='text'
                  placeholder='Account Holder Name'
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />

                <input
                  type='text'
                  placeholder='Bank Name'
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />

                <input
                  type='text'
                  placeholder='Account Number'
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />

                <input
                  type='text'
                  placeholder='Confirm Account Number'
                  value={bankForm.confirmAccountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />

                <input
                  type='text'
                  placeholder='IFSC Code'
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />

                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={bankForm.isDefault}
                    onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                    className='w-4 h-4'
                  />
                  <span className='text-sm text-gray-700'>Set as default account</span>
                </label>

                <div className='flex gap-2 pt-4'>
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={() => setShowBankModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className='flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 text-white'
                    onClick={handleAddBankAccount}
                  >
                    Add Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payout Details Modal */}
        {showPayoutDetails && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <Card className='w-full max-w-md shadow-2xl rounded-3xl'>
              <CardHeader className='bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-3xl'>
                <CardTitle className='text-2xl'>Payout Details</CardTitle>
              </CardHeader>
              <CardContent className='p-6 space-y-4'>
                <div className='space-y-3'>
                  <div>
                    <p className='text-sm text-gray-600'>Amount</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      ₹{showPayoutDetails.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <p className='text-sm text-gray-600'>Status</p>
                    <Badge className={`${getStatusColor(showPayoutDetails.status)} border mt-1`}>
                      {showPayoutDetails.status.charAt(0).toUpperCase() + showPayoutDetails.status.slice(1)}
                    </Badge>
                  </div>

                  <div className='grid grid-cols-2 gap-4 pt-4'>
                    <div>
                      <p className='text-sm text-gray-600'>Request Date</p>
                      <p className='font-semibold text-gray-900'>
                        {new Date(showPayoutDetails.requestDate).toLocaleDateString()}
                      </p>
                    </div>

                    {showPayoutDetails.completionDate && (
                      <div>
                        <p className='text-sm text-gray-600'>Completion Date</p>
                        <p className='font-semibold text-gray-900'>
                          {new Date(showPayoutDetails.completionDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {showPayoutDetails.transactionId && (
                    <div>
                      <p className='text-sm text-gray-600'>Transaction ID</p>
                      <p className='font-mono text-sm text-gray-900 break-all'>
                        {showPayoutDetails.transactionId}
                      </p>
                    </div>
                  )}

                  {showPayoutDetails.failureReason && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                      <p className='text-sm text-red-800'>{showPayoutDetails.failureReason}</p>
                    </div>
                  )}
                </div>

                <Button
                  className='w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white'
                  onClick={() => setShowPayoutDetails(null)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
};

export default PayoutsPage;
