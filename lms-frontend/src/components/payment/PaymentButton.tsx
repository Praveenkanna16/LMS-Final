import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    paymentLink: string;
    paymentSessionId: string;
    amount: number;
    currency: string;
  };
}

interface PaymentButtonProps {
  batchId?: number;
  courseId?: number;
  amount: number;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  onSuccess?: () => void;
}

export default function PaymentButton({
  batchId,
  courseId,
  amount,
  buttonText = 'Pay Now',
  variant = 'default',
  className = '',
  onSuccess,
}: PaymentButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/student/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          batchId,
          courseId,
          amount,
        }),
      });

      if (!response.ok) {
        const error: { message?: string } = await response.json();
        throw new Error(error.message ?? 'Payment creation failed');
      }

      return response.json() as Promise<PaymentResponse>;
    },
    onSuccess: data => {
      if (data.success && data.data.paymentLink) {
        toast.success('Redirecting to payment page...');
        setIsRedirecting(true);

        // Redirect to Cashfree payment page
        window.location.href = data.data.paymentLink;

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to initialize payment');
      }
    },
    onError: (error: Error) => {
      console.error('Payment creation error:', error);
      toast.error(error.message ?? 'Failed to create payment. Please try again.');
    },
  });

  const handlePayment = () => {
    if (!batchId && !courseId) {
      toast.error('Invalid payment request. Missing batch or course information.');
      return;
    }

    if (!amount || amount < 1) {
      toast.error('Invalid payment amount');
      return;
    }

    createPaymentMutation.mutate();
  };

  const isLoading = createPaymentMutation.isPending || isRedirecting;

  return (
    <Button onClick={handlePayment} disabled={isLoading} variant={variant} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isRedirecting ? 'Redirecting...' : 'Processing...'}
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
