import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Shield,
  CheckCircle,
  Clock,
  Users,
  Star,
  Calendar,
  Loader2,
  ArrowLeft,
  ShoppingCart,
  Gift,
  AlertCircle,
} from 'lucide-react';

interface PaymentPageProps {
  batchId?: string;
  courseId?: string;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ batchId, courseId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [batch, setBatch] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Get IDs from URL params if not provided as props
  const finalBatchId = batchId || searchParams.get('batchId');
  const finalCourseId = courseId || searchParams.get('courseId');

  useEffect(() => {
    if (finalBatchId) {
      loadBatchDetails();
    } else if (finalCourseId) {
      loadCourseDetails();
    }
  }, [finalBatchId, finalCourseId]);

  const loadBatchDetails = async () => {
    try {
      console.log('🔄 Loading batch details for ID:', finalBatchId);
      const response = await apiService.getBatchById(finalBatchId!);
      console.log('📦 Batch response received:', response);
      
      // Handle response structure - backend returns {success, data: {batch, isEnrolled, userProgress}}
      let batchData = response?.data?.batch || response?.data || response;
      
      // If we got the nested structure, extract batch
      if (batchData?.batch && !batchData?.id) {
        batchData = batchData.batch;
      }
      
      console.log('📊 Extracted batch data:', batchData);
      
      if (!batchData?.id) {
        console.error('❌ Invalid batch data structure:', response);
        throw new Error('Invalid batch data received - missing id field');
      }
      
      // Extract batch information
      const batchInfo = {
        id: batchData.id,
        name: batchData.name || 'Batch Name',
        enrollmentFee: batchData.enrollmentFee || 0,
        subject: batchData.subject || 'Subject',
        grade: batchData.grade || 'Grade',
        teacherId: batchData.teacherId,
        teacher: batchData.teacher?.name || batchData.teacher || 'Instructor',
        description: batchData.description || `Learn ${batchData.subject || 'this course'}`,
        schedule: batchData.schedule,
        studentLimit: batchData.studentLimit,
        students: batchData.students,
        progress: batchData.progress,
      };
      
      console.log('✅ Batch info set:', batchInfo);
      setBatch(batchInfo);
      
      // Create course-like object from batch for display
      const courseInfo = {
        id: batchData.id,
        title: batchData.name || 'Batch Name',
        description: batchData.description || `Learn ${batchData.subject || 'this course'}`,
        price: batchData.enrollmentFee || 0,
        media: {
          thumbnail: 'https://picsum.photos/300/200?random=1'
        },
        teacher: batchData.teacher?.name || batchData.teacher || 'Instructor',
        rating: { average: 4.5, count: 0 },
        studentsEnrolled: Array.isArray(batchData.students) ? batchData.students.length : 0,
        duration: 0,
      };
      
      console.log('✅ Course info set:', courseInfo);
      setCourse(courseInfo);
    } catch (error) {
      console.error('❌ Error loading batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to load batch details: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetails = async () => {
    try {
      const courseData = await apiService.getCourseById(finalCourseId!);
      setCourse(courseData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!course) return { original: 0, final: 0, discount: 0 };

    const originalPrice = finalBatchId ? batch?.enrollmentFee || course.price : course.price;
    let finalPrice = originalPrice;
    let discount = 0;

    // Apply promo code discount
    if (appliedPromo) {
      if (appliedPromo.discountType === 'percentage') {
        discount = originalPrice * (appliedPromo.discountValue / 100);
      } else {
        discount = Math.min(appliedPromo.discountValue, originalPrice);
      }
      finalPrice = originalPrice - discount;
    }

    return {
      original: originalPrice,
      final: Math.max(0, finalPrice),
      discount,
    };
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      await apiService.applyPromoCode(promoCode);
      setAppliedPromo({ code: promoCode, discountType: 'percentage', discountValue: 10 }); // Simplified
      toast({
        title: 'Success',
        description: 'Promo code applied successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid promo code',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please login to continue',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!finalBatchId && !finalCourseId) {
      toast({
        title: 'Error',
        description: 'No course or batch selected',
        variant: 'destructive',
      });
      return;
    }

    setPaymentLoading(true);
    try {
      // Create payment order
      console.log('📤 Initiating payment with:', { finalBatchId, finalCourseId, amount: price.final });
      const response = await apiService.createStudentPayment({
        batchId: finalBatchId,
        courseId: finalCourseId,
        amount: price.final,
      });

      console.log('✅ Payment response received:', response);
      console.log('📊 Payment data:', response?.data);

      // For Cashfree, redirect to payment link
      if (response?.data?.paymentLink) {
        console.log('🔗 Redirecting to payment link:', response.data.paymentLink);
        window.location.href = response.data.paymentLink;
      } else if (response?.data?.payment_link) {
        console.log('🔗 Redirecting to payment_link:', response.data.payment_link);
        window.location.href = response.data.payment_link;
      } else if (response?.data?.paymentSessionId) {
        console.log('🔑 Using session ID:', response.data.paymentSessionId);
        // Alternative: Use session ID for embedded payment
        window.location.href = `${import.meta.env.VITE_API_URL}/student/payments/session/${response.data.paymentSessionId}`;
      } else {
        console.warn('⚠️ No payment link found in response:', response?.data);
        toast({
          title: 'Error',
          description: 'Payment gateway response invalid. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const price = calculatePrice();

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-blue-500' />
          <p className='text-gray-600'>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Course Not Found</h2>
          <p className='text-gray-600 mb-4'>The selected course or batch is not available.</p>
          <Button
            onClick={() => {
              navigate('/courses');
            }}
          >
            Browse Available Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => {
              navigate(-1);
            }}
            className='mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back
          </Button>

          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-900 mb-2'>Complete Your Purchase</h1>
            <p className='text-xl text-gray-600'>Secure payment powered by Cashfree</p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Course/Batch Details */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Course Info */}
            <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <div className='flex items-start gap-4'>
                  <img
                    src={course.media?.thumbnail || 'https://picsum.photos/300/200?random=1'}
                    alt={course.title}
                    className='w-24 h-16 object-cover rounded-lg'
                  />
                  <div className='flex-1'>
                    <CardTitle className='text-xl mb-2'>{course.title}</CardTitle>
                    <CardDescription className='text-base mb-3'>
                      {course.description}
                    </CardDescription>
                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                        <span>{course.rating?.average || course.rating || 0}</span>
                        <span>({course.rating?.count || 0} reviews)</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Users className='w-4 h-4' />
                        <span>{course.studentsEnrolled || 0} students</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-4 h-4' />
                        <span>{course.duration || 0} hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {batch && (
                <CardContent>
                  <div className='bg-blue-50 rounded-lg p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Calendar className='w-4 h-4 text-blue-600' />
                      <span className='font-medium text-blue-900'>Batch Details</span>
                    </div>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-gray-600'>Batch Name:</span>
                        <span className='ml-2 font-medium'>{batch.name}</span>
                      </div>
                      <div>
                        <span className='text-gray-600'>Students:</span>
                        <span className='ml-2 font-medium'>
                          {batch.students?.length || 0} / {batch.studentLimit}
                        </span>
                      </div>
                      {batch.progress?.startDate && (
                        <div>
                          <span className='text-gray-600'>Starts:</span>
                          <span className='ml-2 font-medium'>
                            {new Date(batch.progress.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {batch.progress?.endDate && (
                        <div>
                          <span className='text-gray-600'>Ends:</span>
                          <span className='ml-2 font-medium'>
                            {new Date(batch.progress.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Payment Method Selection */}
            <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CreditCard className='w-5 h-5' />
                  Payment Method
                </CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => {
                      setPaymentMethod('card');
                    }}
                    className='h-16 flex-col gap-2'
                  >
                    <CreditCard className='w-6 h-6' />
                    Credit/Debit Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                    onClick={() => {
                      setPaymentMethod('upi');
                    }}
                    className='h-16 flex-col gap-2'
                  >
                    <Smartphone className='w-6 h-6' />
                    UPI
                  </Button>
                  <Button
                    variant={paymentMethod === 'netbanking' ? 'default' : 'outline'}
                    onClick={() => {
                      setPaymentMethod('netbanking');
                    }}
                    className='h-16 flex-col gap-2'
                  >
                    <Building2 className='w-6 h-6' />
                    Net Banking
                  </Button>
                  <Button
                    variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                    onClick={() => {
                      setPaymentMethod('wallet');
                    }}
                    className='h-16 flex-col gap-2'
                  >
                    <Wallet className='w-6 h-6' />
                    Wallets
                  </Button>
                </div>

                <div className='mt-6 p-4 bg-green-50 rounded-lg border border-green-200'>
                  <div className='flex items-center gap-2 text-green-800'>
                    <Shield className='w-4 h-4' />
                    <span className='font-medium'>Secure Payment</span>
                  </div>
                  <p className='text-sm text-green-700 mt-1'>
                    Your payment is protected by 256-bit SSL encryption and PCI DSS compliance.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Gift className='w-5 h-5' />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex gap-2'>
                  <Input
                    placeholder='Enter promo code'
                    value={promoCode}
                    onChange={e => {
                      setPromoCode(e.target.value);
                    }}
                    className='flex-1'
                  />
                  <Button onClick={handleApplyPromoCode} variant='outline'>
                    Apply
                  </Button>
                </div>
                {appliedPromo && (
                  <div className='mt-3 p-3 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center justify-between'>
                      <span className='text-green-800 font-medium'>
                        {appliedPromo.discountType === 'percentage'
                          ? `${appliedPromo.discountValue}% off`
                          : `₹${appliedPromo.discountValue} off`}
                      </span>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setAppliedPromo(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm sticky top-8'>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Price Breakdown */}
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Subtotal</span>
                    <span>₹{price.original}</span>
                  </div>

                  {price.discount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Discount</span>
                      <span>-₹{price.discount}</span>
                    </div>
                  )}

                  <Separator />

                  <div className='flex justify-between text-lg font-semibold'>
                    <span>Total</span>
                    <span>₹{price.final}</span>
                  </div>
                </div>

                {/* What You Get */}
                <div className='bg-blue-50 rounded-lg p-4'>
                  <h4 className='font-medium text-blue-900 mb-3'>What you'll get:</h4>
                  <div className='space-y-2 text-sm text-blue-800'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span>Full access to {course.title}</span>
                    </div>
                    {batch && (
                      <div className='flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4 text-green-600' />
                        <span>Live sessions with {batch.teacher?.name}</span>
                      </div>
                    )}
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span>Course completion certificate</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span>Access to community forums</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className='w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3'
                >
                  {paymentLoading ? (
                    <div className='flex items-center gap-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      Processing Payment...
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <CreditCard className='w-4 h-4' />
                      Pay ₹{price.final}
                    </div>
                  )}
                </Button>

                {/* Security Badge */}
                <div className='text-center'>
                  <div className='inline-flex items-center gap-2 text-sm text-gray-500'>
                    <Shield className='w-4 h-4' />
                    <span>Secured by Cashfree</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
