import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RefundRequest {
  id: string;
  paymentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  amount: number;
  requestedAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
}

interface ProcessRefundData {
  amount: number;
  reason: string;
}

const RefundManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch refund requests
  const { data: refunds = [], isLoading, refetch } = useQuery<RefundRequest[]>({
    queryKey: ['refund-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/payments/refunds?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      return result.data || [];
    },
  });

  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: async (data: { refundId: string; action: 'approve' | 'reject'; refundData: ProcessRefundData }) => {
      const response = await fetch(`/api/payments/${data.refundId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: data.action,
          amount: data.refundData.amount,
          reason: data.refundData.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process refund');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Refund processed successfully',
      });
      setShowProcessDialog(false);
      setSelectedRefund(null);
      setRefundAmount('');
      setRefundReason('');
      void queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleOpenProcessDialog = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setRefundAmount(refund.requestedAmount.toString());
    setRefundReason('');
    setShowProcessDialog(true);
  };

  const handleProcessRefund = (action: 'approve' | 'reject') => {
    if (!selectedRefund) return;

    if (action === 'approve' && !refundAmount) {
      toast({
        title: 'Error',
        description: 'Please enter refund amount',
        variant: 'destructive',
      });
      return;
    }

    if (action === 'reject' && !refundReason) {
      toast({
        title: 'Error',
        description: 'Please provide rejection reason',
        variant: 'destructive',
      });
      return;
    }

    processRefundMutation.mutate({
      refundId: selectedRefund.paymentId,
      action,
      refundData: {
        amount: parseFloat(refundAmount),
        reason: refundReason,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: {
        color: 'bg-yellow-100 text-yellow-700',
        icon: <Clock className='w-3 h-3' />,
        label: 'Pending',
      },
      approved: {
        color: 'bg-green-100 text-green-700',
        icon: <CheckCircle className='w-3 h-3' />,
        label: 'Approved',
      },
      rejected: {
        color: 'bg-red-100 text-red-700',
        icon: <XCircle className='w-3 h-3' />,
        label: 'Rejected',
      },
      processed: {
        color: 'bg-blue-100 text-blue-700',
        icon: <DollarSign className='w-3 h-3' />,
        label: 'Processed',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge className={config.color}>
        <div className='flex items-center gap-1'>
          {config.icon}
          <span>{config.label}</span>
        </div>
      </Badge>
    );
  };

  const filteredRefunds = refunds.filter(refund =>
    statusFilter === 'all' ? true : refund.status === statusFilter
  );

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    totalAmount: refunds.reduce((sum, r) => sum + r.requestedAmount, 0),
  };

  return (
    <Layout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent'>
              Refund Management
            </h1>
            <p className='text-gray-600 mt-2'>Review and process payment refund requests</p>
          </div>

          <Button
            onClick={() => {
              void refetch();
            }}
            variant='outline'
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-0'>
            <CardContent className='p-6'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-blue-600'>{stats.total}</p>
                <p className='text-sm text-gray-600 mt-1'>Total Requests</p>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-yellow-50 to-orange-50 border-0'>
            <CardContent className='p-6'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-yellow-600'>{stats.pending}</p>
                <p className='text-sm text-gray-600 mt-1'>Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-0'>
            <CardContent className='p-6'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-green-600'>{stats.approved}</p>
                <p className='text-sm text-gray-600 mt-1'>Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-red-50 to-pink-50 border-0'>
            <CardContent className='p-6'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-red-600'>{stats.rejected}</p>
                <p className='text-sm text-gray-600 mt-1'>Rejected</p>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-0'>
            <CardContent className='p-6'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-purple-600'>₹{stats.totalAmount.toLocaleString()}</p>
                <p className='text-sm text-gray-600 mt-1'>Total Amount</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-4'>
              <label className='text-sm font-medium'>Filter by Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[200px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Requests</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='approved'>Approved</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                  <SelectItem value='processed'>Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Refund Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Requests ({filteredRefunds.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='py-12 text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' />
                <p className='text-gray-600'>Loading refund requests...</p>
              </div>
            ) : filteredRefunds.length > 0 ? (
              <div className='space-y-4'>
                {filteredRefunds.map(refund => (
                  <div
                    key={refund.id}
                    className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center gap-3'>
                          <h3 className='font-semibold text-lg'>{refund.studentName}</h3>
                          {getStatusBadge(refund.status)}
                        </div>

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                          <div>
                            <p className='text-gray-500'>Email</p>
                            <p className='font-medium'>{refund.studentEmail}</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Course</p>
                            <p className='font-medium'>{refund.courseName}</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Paid Amount</p>
                            <p className='font-medium'>₹{refund.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Requested Refund</p>
                            <p className='font-medium text-red-600'>
                              ₹{refund.requestedAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className='text-gray-500 text-sm'>Reason</p>
                          <p className='text-sm'>{refund.reason}</p>
                        </div>

                        <div className='flex items-center gap-4 text-xs text-gray-500'>
                          <span>Requested: {new Date(refund.requestedAt).toLocaleString()}</span>
                          {refund.processedAt && (
                            <span>
                              Processed: {new Date(refund.processedAt).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {refund.rejectionReason && (
                          <div className='bg-red-50 border border-red-200 rounded p-2 mt-2'>
                            <p className='text-sm text-red-700'>
                              <strong>Rejection Reason:</strong> {refund.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {refund.status === 'pending' && (
                        <div className='flex gap-2 ml-4'>
                          <Button
                            size='sm'
                            onClick={() => {
                              handleOpenProcessDialog(refund);
                            }}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <CheckCircle className='mr-1 h-4 w-4' />
                            Process
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='py-12 text-center text-gray-500'>
                <AlertCircle className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <p>No refund requests found</p>
                <p className='text-sm mt-2'>
                  {statusFilter !== 'all'
                    ? `Try changing the status filter`
                    : `Refund requests will appear here`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Refund Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Process Refund Request</DialogTitle>
              <DialogDescription>
                Review and process the refund request from {selectedRefund?.studentName}
              </DialogDescription>
            </DialogHeader>

            {selectedRefund && (
              <div className='space-y-4'>
                <div className='bg-gray-50 p-4 rounded-lg space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Student:</span>
                    <span className='font-medium'>{selectedRefund.studentName}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Course:</span>
                    <span className='font-medium'>{selectedRefund.courseName}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Paid Amount:</span>
                    <span className='font-medium'>₹{selectedRefund.amount.toLocaleString()}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Requested:</span>
                    <span className='font-medium text-red-600'>
                      ₹{selectedRefund.requestedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Refund Amount (₹)</label>
                  <Input
                    type='number'
                    placeholder='Enter amount to refund'
                    value={refundAmount}
                    onChange={e => {
                      setRefundAmount(e.target.value);
                    }}
                    max={selectedRefund.amount}
                  />
                  <p className='text-xs text-gray-500'>
                    Maximum refundable: ₹{selectedRefund.amount.toLocaleString()}
                  </p>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Reason / Notes</label>
                  <Textarea
                    placeholder='Enter reason for approval/rejection'
                    value={refundReason}
                    onChange={e => {
                      setRefundReason(e.target.value);
                    }}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setShowProcessDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={() => {
                  handleProcessRefund('reject');
                }}
                disabled={processRefundMutation.isPending}
              >
                <XCircle className='mr-2 h-4 w-4' />
                Reject
              </Button>
              <Button
                onClick={() => {
                  handleProcessRefund('approve');
                }}
                disabled={processRefundMutation.isPending}
                className='bg-green-600 hover:bg-green-700'
              >
                <CheckCircle className='mr-2 h-4 w-4' />
                {processRefundMutation.isPending ? 'Processing...' : 'Approve & Refund'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default RefundManagement;
