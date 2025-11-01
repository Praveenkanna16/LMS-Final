import { useState } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Cashfree: any;
  }
}

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createPaymentOrder = async (
    batchId: string,
    source: 'platform' | 'teacher' = 'platform'
  ) => {
    setIsLoading(true);
    try {
      const response = await apiService.createOrder(batchId, source);
      return response;
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to create payment order',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (order_id: string, payment_id: string, signature: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyPayment(order_id, payment_id, signature);

      toast({
        title: 'Payment Successful!',
        description: 'You have been enrolled in the batch successfully.',
      });

      return response;
    } catch (error: any) {
      toast({
        title: 'Payment Verification Failed',
        description: error.message || 'Failed to verify payment',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const initiateCashfreePayment = async (
    batchId: string,
    source: 'platform' | 'teacher' = 'platform'
  ) => {
    try {
      // Create order first
      const { orderId, amount, currency, orderData } = await createPaymentOrder(batchId, source);

      // Initialize Cashfree payment
      const paymentConfig = {
        mode: 'popup', // or "redirect"
        orderId,
        amount,
        currency,
        customerDetails: orderData.customer_details,
        returnUrl: orderData.order_meta.return_url,
        notifyUrl: orderData.order_meta.notify_url,
      };

      // Initialize Cashfree Checkout
      if (window.Cashfree) {
        window.Cashfree.init({
          mode: 'sandbox', // Change to "production" for live
          sessionId: import.meta.env.VITE_CASHFREE_APP_ID,
        });

        window.Cashfree.pay(paymentConfig, {
          onSuccess: async (response: any) => {
            try {
              await verifyPayment(response.orderId, response.paymentId, response.signature);
            } catch (error) {
              console.error('Payment verification failed:', error);
            }
          },
          onFailure: (error: any) => {
            toast({
              title: 'Payment Failed',
              description: error.message || 'Payment was cancelled or failed',
              variant: 'destructive',
            });
          },
          onDismiss: () => {
            toast({
              title: 'Payment Cancelled',
              description: 'Payment was cancelled by user',
              variant: 'destructive',
            });
          },
        });
      } else {
        // Fallback: Open Cashfree payment link in new window
        const paymentUrl = `https://test.cashfree.com/billpay/checkout/post/submit?appId=${import.meta.env.VITE_CASHFREE_APP_ID}&orderId=${orderId}&orderAmount=${amount}&orderCurrency=${currency}&customerEmail=${orderData.customer_details.customer_email}&customerName=${orderData.customer_details.customer_name}&customerPhone=${orderData.customer_details.customer_phone}&returnUrl=${encodeURIComponent(orderData.order_meta.return_url)}`;

        window.open(paymentUrl, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    }
  };

  return {
    initiateCashfreePayment,
    createPaymentOrder,
    verifyPayment,
    isLoading,
  };
};
