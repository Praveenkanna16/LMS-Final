import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

interface PaymentStatusData {
  success: boolean;
  data: {
    orderId: string;
    paymentId: string | null;
    amount: number;
    currency: string;
    status: 'created' | 'paid' | 'failed' | 'cancelled';
    paidAt: string | null;
    failureReason: string | null;
    batch: {
      id: number;
      name: string;
      startDate: string;
      endDate: string;
    } | null;
    course: {
      id: number;
      title: string;
      thumbnail: string | null;
    } | null;
    cashfreeStatus: string | null;
  };
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const orderId = searchParams.get('order_id');

  const { data, isLoading, error } = useQuery<PaymentStatusData>({
    queryKey: ['paymentStatus', orderId],
    queryFn: async () => {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/student/payments/status/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      return response.json();
    },
    enabled: !!orderId,
    refetchInterval: data => {
      // Keep refetching if status is 'created' (pending)
      return data?.data?.status === 'created' ? 3000 : false;
    },
  });

  useEffect(() => {
    if (data?.data?.status === 'paid') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/student/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [data?.data?.status, navigate]);

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Invalid Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">No order ID found in the URL.</p>
            <Button onClick={() => navigate('/student/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-lg font-medium">Verifying payment...</p>
            <p className="text-sm text-gray-500">Please wait while we confirm your payment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              {error instanceof Error ? error.message : 'Failed to fetch payment details'}
            </p>
            <Button onClick={() => navigate('/student/payments')} className="w-full">
              View All Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { status, amount, currency, paidAt, failureReason, batch, course } = data.data;

  const getStatusBadge = () => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-16 w-16 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Loader2 className="h-16 w-16 animate-spin text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        {/* Status Card */}
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-12">
            {getStatusIcon()}

            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold">
                {status === 'paid' && 'Payment Successful!'}
                {status === 'failed' && 'Payment Failed'}
                {status === 'cancelled' && 'Payment Cancelled'}
                {status === 'created' && 'Processing Payment...'}
              </h1>

              <p className="text-gray-600">
                {status === 'paid' &&
                  'Your payment has been processed successfully. You now have access to the course.'}
                {status === 'failed' && failureReason}
                {status === 'cancelled' && 'The payment was cancelled.'}
                {status === 'created' && 'Please wait while we confirm your payment with the payment gateway.'}
              </p>
            </div>

            {getStatusBadge()}

            {status === 'paid' && countdown > 0 && (
              <p className="text-sm text-gray-500">Redirecting to dashboard in {countdown} seconds...</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Order ID: {orderId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Amount</span>
              <span className="text-lg font-bold">
                {currency} {amount.toFixed(2)}
              </span>
            </div>

            {paidAt && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Payment Date</span>
                <span>{new Date(paidAt).toLocaleString()}</span>
              </div>
            )}

            {(batch || course) && (
              <div className="space-y-2 border-b pb-2">
                <span className="font-medium">Enrolled In</span>
                {batch && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="font-medium">{batch.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(batch.startDate).toLocaleDateString()} -{' '}
                      {new Date(batch.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {course && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="font-medium">{course.title}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate('/student/dashboard')} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>

          {status === 'paid' && (
            <Button variant="outline" className="flex-1" onClick={() => toast.info('Invoice download coming soon!')}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          )}

          {status === 'failed' && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/student/payments?retry=${orderId}`)}
            >
              Try Again
            </Button>
          )}

          <Button variant="outline" className="flex-1" onClick={() => navigate('/student/payments')}>
            View All Payments
          </Button>
        </div>
      </div>
    </div>
  );
}
