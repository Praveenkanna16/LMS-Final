import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const verifyPaymentAndEnroll = async () => {
      try {
        const orderIdParam = searchParams.get('order_id');
        
        if (!orderIdParam) {
          setStatus('error');
          setMessage('Order ID not found. Please contact support.');
          return;
        }

        setOrderId(orderIdParam);

        // Get payment status from backend
        const response = await apiService.getPaymentStatus(orderIdParam);

        if (response.success) {
          setStatus('success');
          setMessage('Payment successful! You have been enrolled in the batch.');
          
          toast({
            title: 'Success',
            description: 'Payment verified and enrollment complete!',
          });

          // Redirect to My Batches after 2 seconds
          setTimeout(() => {
            navigate('/my-batches');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response.message || 'Payment verification failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(
          error.message || 'Failed to verify payment. Please check your payment status.'
        );
        
        toast({
          title: 'Error',
          description: 'Payment verification failed',
          variant: 'destructive',
        });
      }
    };

    verifyPaymentAndEnroll();
  }, [searchParams, navigate, toast]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center'>
        {status === 'loading' && (
          <>
            <Loader2 className='w-16 h-16 animate-spin mx-auto mb-4 text-blue-500' />
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Verifying Payment</h1>
            <p className='text-gray-600'>
              Please wait while we verify your payment and complete your enrollment...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className='w-16 h-16 mx-auto mb-4 text-green-500' />
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Payment Successful!</h1>
            <p className='text-gray-600 mb-4'>{message}</p>
            <p className='text-sm text-gray-500'>
              Redirecting to My Batches...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className='w-16 h-16 mx-auto mb-4 text-red-500' />
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Payment Verification Failed</h1>
            <p className='text-gray-600 mb-4'>{message}</p>
            
            {orderId && (
              <p className='text-sm text-gray-500 mb-4'>
                Order ID: <code className='bg-gray-100 px-2 py-1 rounded'>{orderId}</code>
              </p>
            )}

            <div className='flex gap-3'>
              <button
                onClick={() => navigate('/my-batches')}
                className='flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition'
              >
                Go to My Batches
              </button>
              <button
                onClick={() => navigate('/support')}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
              >
                Contact Support
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
