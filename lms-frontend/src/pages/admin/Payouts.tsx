import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
  Calendar,
  CreditCard,
  User,
  Download,
  Send,
  FileText,
  Ban,
  CheckCheck,
  RefreshCcw,
} from 'lucide-react';

interface Payout {
  id: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  status: 'requested' | 'processing' | 'completed' | 'rejected';
  paymentMethod: string;
  paymentDetails: Record<string, unknown>;
  transactionId?: string;
  note?: string;
  rejectionReason?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const Payouts: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch payouts
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payouts', statusFilter],
    queryFn: () => apiService.getPayouts(statusFilter),
    refetchInterval: 30000,
  });

  const payouts = data?.data?.payouts ?? [];
  const stats = data?.data?.stats ?? {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
    totalProcessed: 0,
    totalPending: 0,
    avgPayout: 0,
  };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (data: { payoutId: string; note?: string }) =>
      apiService.approvePayout(data.payoutId, { note: data.note }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payout approved successfully' });
      void queryClient.invalidateQueries({ queryKey: ['payouts'] });
      setShowApproveDialog(false);
      setNote('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve payout',
        variant: 'destructive',
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data: { payoutId: string; transactionId: string; note?: string }) =>
      apiService.completePayout(data.payoutId, {
        transactionId: data.transactionId,
        note: data.note,
      }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payout completed successfully' });
      void queryClient.invalidateQueries({ queryKey: ['payouts'] });
      setShowCompleteDialog(false);
      setTransactionId('');
      setNote('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete payout',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { payoutId: string; reason: string }) =>
      apiService.rejectPayout(data.payoutId, { reason: data.reason }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payout rejected' });
      void queryClient.invalidateQueries({ queryKey: ['payouts'] });
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject payout',
        variant: 'destructive',
      });
    },
  });

  // Filter payouts
  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch =
      payout.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleApprove = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(true);
  };

  const handleComplete = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowCompleteDialog(true);
  };

  const handleReject = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowRejectDialog(true);
  };

  const handleViewDetails = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowDetailsDialog(true);
  };

  const confirmApprove = () => {
    if (selectedPayout) {
      approveMutation.mutate({
        payoutId: selectedPayout.id,
        note: note || undefined,
      });
    }
  };

  const confirmComplete = () => {
    if (selectedPayout && transactionId.trim()) {
      completeMutation.mutate({
        payoutId: selectedPayout.id,
        transactionId: transactionId.trim(),
        note: note || undefined,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Transaction ID is required',
        variant: 'destructive',
      });
    }
  };

  const confirmReject = () => {
    if (selectedPayout && rejectionReason.trim().length >= 10) {
      rejectMutation.mutate({
        payoutId: selectedPayout.id,
        reason: rejectionReason.trim(),
      });
    } else {
      toast({
        title: 'Error',
        description: 'Rejection reason must be at least 10 characters',
        variant: 'destructive',
      });
    }
  };

  const exportPayouts = () => {
    const dataStr = JSON.stringify(
      {
        payouts: filteredPayouts,
        stats,
        filters: { status: statusFilter, search: searchTerm },
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `payouts-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: 'Success', description: 'Payouts exported successfully' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className='bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'>
            <CheckCircle2 className='w-3 h-3 mr-1' />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'>
            <RefreshCcw className='w-3 h-3 mr-1 animate-spin' />
            Processing
          </Badge>
        );
      case 'requested':
        return (
          <Badge className='bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0'>
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className='bg-gradient-to-r from-red-500 to-pink-500 text-white border-0'>
            <XCircle className='w-3 h-3 mr-1' />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden flex items-center justify-center'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]' />
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-purple-600' />
          <p className='text-gray-600'>Loading payouts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <p className='text-gray-600 mb-4'>Error loading payouts</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden'>
      {/* Background effects */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]' />

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
                  <h1 className='text-4xl font-bold'>Payouts Management</h1>
                </div>
                <p className='text-purple-100 text-lg'>
                  Manage teacher payout requests and payment processing
                </p>
              </div>
              <div className='hidden md:flex gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => refetch()}
                  className='bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0 text-white'
                >
                  <RefreshCcw className='w-4 h-4 mr-2' />
                  Refresh
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={exportPayouts}
                  className='bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0 text-white'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* Total Payouts */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Total Requests</p>
                  <p className='text-3xl font-bold text-gray-900'>{stats.total}</p>
                </div>
                <div className='bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl'>
                  <FileText className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Pending</p>
                  <p className='text-3xl font-bold text-gray-900'>{stats.pending}</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    ₹{stats.totalPending.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className='bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-xl'>
                  <Clock className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Completed</p>
                  <p className='text-3xl font-bold text-gray-900'>{stats.completed}</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    ₹{stats.totalProcessed.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className='bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl'>
                  <CheckCircle2 className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Payout */}
          <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Avg Payout</p>
                  <p className='text-3xl font-bold text-gray-900'>
                    ₹{stats.avgPayout.toLocaleString('en-IN')}
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
              {/* Search */}
              <div className='md:col-span-2'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    type='text'
                    placeholder='Search by teacher, email, ID, or transaction...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 border-gray-200 focus:ring-2 focus:ring-purple-500'
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='border-gray-200'>
                    <Filter className='w-4 h-4 mr-2' />
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='requested'>Pending</SelectItem>
                    <SelectItem value='processing'>Processing</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='rejected'>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payouts Table */}
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='w-5 h-5 text-purple-600' />
              Payout Requests
            </CardTitle>
            <CardDescription>
              Showing {filteredPayouts.length} of {payouts.length} payout requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayouts.length === 0 ? (
              <div className='text-center py-12'>
                <DollarSign className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-500 mb-2'>No payout requests found</p>
                <p className='text-sm text-gray-400'>
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => (
                      <TableRow
                        key={payout.id}
                        className='hover:bg-purple-50/50 transition-colors'
                      >
                        <TableCell className='font-mono text-xs'>
                          {payout.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className='font-medium flex items-center gap-2'>
                              <User className='w-4 h-4 text-gray-400' />
                              {payout.teacher.name}
                            </div>
                            <div className='text-xs text-gray-500'>{payout.teacher.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='font-bold text-green-600'>
                            ₹{payout.amount.toLocaleString('en-IN')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='capitalize'>
                            <CreditCard className='w-3 h-3 mr-1' />
                            {payout.paymentMethod.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1 text-sm text-gray-600'>
                            <Calendar className='w-3 h-3' />
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='font-mono text-xs text-gray-600'>
                            {payout.transactionId ?? '-'}
                          </span>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex gap-2 justify-end'>
                            {payout.status === 'requested' && (
                              <>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => handleApprove(payout)}
                                  className='text-green-600 hover:bg-green-50'
                                >
                                  <CheckCheck className='w-4 h-4' />
                                </Button>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => handleComplete(payout)}
                                  className='text-blue-600 hover:bg-blue-50'
                                >
                                  <Send className='w-4 h-4' />
                                </Button>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => handleReject(payout)}
                                  className='text-red-600 hover:bg-red-50'
                                >
                                  <Ban className='w-4 h-4' />
                                </Button>
                              </>
                            )}
                            {payout.status === 'processing' && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleComplete(payout)}
                                className='text-blue-600 hover:bg-blue-50'
                              >
                                <Send className='w-4 h-4 mr-1' />
                                Complete
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleViewDetails(payout)}
                            >
                              <FileText className='w-4 h-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
            <DialogDescription>
              Approve the payout request for {selectedPayout?.teacher.name}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Amount</Label>
              <div className='text-2xl font-bold text-green-600'>
                ₹{selectedPayout?.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <Label htmlFor='approve-note'>Note (Optional)</Label>
              <Textarea
                id='approve-note'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Add any internal notes...'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
              className='bg-green-600 hover:bg-green-700'
            >
              {approveMutation.isPending && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Approve & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payout</DialogTitle>
            <DialogDescription>
              Mark the payout as completed for {selectedPayout?.teacher.name}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Amount</Label>
              <div className='text-2xl font-bold text-green-600'>
                ₹{selectedPayout?.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <Label htmlFor='transaction-id'>
                Transaction ID <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='transaction-id'
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder='Enter bank transaction ID...'
                required
              />
            </div>
            <div>
              <Label htmlFor='complete-note'>Note (Optional)</Label>
              <Textarea
                id='complete-note'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Add any completion notes...'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmComplete}
              disabled={completeMutation.isPending || !transactionId.trim()}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {completeMutation.isPending && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Complete Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedPayout?.teacher.name}'s payout request
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Amount</Label>
              <div className='text-2xl font-bold text-red-600'>
                ₹{selectedPayout?.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <Label htmlFor='rejection-reason'>
                Rejection Reason <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='rejection-reason'
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder='Provide a detailed reason (minimum 10 characters)...'
                rows={4}
                required
              />
              <p className='text-xs text-gray-500 mt-1'>
                {rejectionReason.length}/10 characters minimum
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={
                rejectMutation.isPending || rejectionReason.trim().length < 10
              }
              className='bg-red-600 hover:bg-red-700'
            >
              {rejectMutation.isPending && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Reject Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>Complete information for this payout request</DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-gray-600'>Teacher</Label>
                  <p className='font-medium'>{selectedPayout.teacher.name}</p>
                  <p className='text-sm text-gray-500'>{selectedPayout.teacher.email}</p>
                  <p className='text-sm text-gray-500'>{selectedPayout.teacher.phone}</p>
                </div>
                <div>
                  <Label className='text-gray-600'>Amount</Label>
                  <p className='text-2xl font-bold text-green-600'>
                    ₹{selectedPayout.amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-gray-600'>Payment Method</Label>
                  <p className='font-medium capitalize'>
                    {selectedPayout.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <Label className='text-gray-600'>Status</Label>
                  <div className='mt-1'>{getStatusBadge(selectedPayout.status)}</div>
                </div>
              </div>

              {selectedPayout.transactionId && (
                <div>
                  <Label className='text-gray-600'>Transaction ID</Label>
                  <p className='font-mono text-sm'>{selectedPayout.transactionId}</p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-gray-600'>Requested At</Label>
                  <p className='text-sm'>
                    {new Date(selectedPayout.requestedAt).toLocaleString()}
                  </p>
                </div>
                {selectedPayout.processedAt && (
                  <div>
                    <Label className='text-gray-600'>Processed At</Label>
                    <p className='text-sm'>
                      {new Date(selectedPayout.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedPayout.completedAt && (
                <div>
                  <Label className='text-gray-600'>Completed At</Label>
                  <p className='text-sm'>
                    {new Date(selectedPayout.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedPayout.rejectedAt && (
                <div>
                  <Label className='text-gray-600'>Rejected At</Label>
                  <p className='text-sm'>
                    {new Date(selectedPayout.rejectedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedPayout.note && (
                <div>
                  <Label className='text-gray-600'>Note</Label>
                  <p className='text-sm bg-gray-50 p-3 rounded-lg'>{selectedPayout.note}</p>
                </div>
              )}

              {selectedPayout.rejectionReason && (
                <div>
                  <Label className='text-gray-600'>Rejection Reason</Label>
                  <p className='text-sm bg-red-50 p-3 rounded-lg text-red-700'>
                    {selectedPayout.rejectionReason}
                  </p>
                </div>
              )}

              {selectedPayout.paymentDetails &&
                Object.keys(selectedPayout.paymentDetails).length > 0 && (
                  <div>
                    <Label className='text-gray-600'>Payment Details</Label>
                    <div className='text-sm bg-gray-50 p-3 rounded-lg'>
                      <pre className='whitespace-pre-wrap'>
                        {JSON.stringify(selectedPayout.paymentDetails, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payouts;
