import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Gift,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Star,
  Calendar,
  Loader2,
  ArrowLeft,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

const Cart: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await apiService.getCart();
      setCart(cartData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load cart',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdateLoading(true);
      await apiService.removeFromCart(itemId);
      await loadCart();
      toast({
        title: 'Success',
        description: 'Item removed from cart',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item',
        variant: 'destructive',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdateLoading(true);
      await apiService.updateCartQuantity(itemId, newQuantity);
      await loadCart();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update quantity',
        variant: 'destructive',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      await apiService.applyPromoCode(promoCode);
      await loadCart();
      setAppliedPromo({ code: promoCode, discountType: 'percentage', discountValue: 10 });
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

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty',
        variant: 'destructive',
      });
      return;
    }

    // Navigate to payment page with cart items
    navigate('/payment', {
      state: {
        cartItems: cart.items,
        total: cart.summary.total,
      },
    });
  };

  const calculateSubtotal = () => {
    return cart?.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
  };

  const calculateSavings = () => {
    return (
      cart?.items.reduce((sum: number, item: any) => {
        if (item.originalPrice && item.originalPrice > item.price) {
          return sum + (item.originalPrice - item.price) * item.quantity;
        }
        return sum;
      }, 0) || 0
    );
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-gray-800 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-purple-500' />
          <p className='text-gray-300'>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-gray-800 py-8'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
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
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>Your Cart</h1>
              <p className='text-xl text-gray-600'>Review and purchase your selected courses</p>
            </div>
          </div>

          {/* Empty Cart */}
          <div className='text-center py-16'>
            <ShoppingCart className='w-16 h-16 text-gray-400 mx-auto mb-6' />
            <h2 className='text-2xl font-semibold text-white mb-4'>Your cart is empty</h2>
            <p className='text-gray-300 mb-8 max-w-md mx-auto'>
              Looks like you haven't added any courses to your cart yet. Start exploring our course
              catalog!
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                onClick={() => {
                  navigate('/courses');
                }}
                className='bg-gradient-to-r from-purple-600 to-indigo-600'
              >
                Browse Courses
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  navigate('/');
                }}
                className='border-gray-600 text-gray-300 hover:bg-gray-800'
              >
                Go to Homepage
              </Button>
            </div>
          </div>
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
            <h1 className='text-4xl font-bold text-gray-900 mb-2'>Your Cart</h1>
            <p className='text-xl text-gray-600'>
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Cart Items List */}
            <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShoppingCart className='w-5 h-5' />
                  Cart Items
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {cart.items.map((item: any) => (
                  <div key={item._id} className='flex items-start gap-4 p-4 bg-gray-50 rounded-lg'>
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className='w-20 h-16 object-cover rounded-lg'
                    />

                    <div className='flex-1'>
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <h3 className='font-semibold text-lg mb-1'>{item.title}</h3>
                          <p className='text-sm text-gray-600 mb-2'>by {item.teacherName}</p>

                          {item.type === 'batch' && item.batchDetails && (
                            <div className='bg-blue-50 rounded-lg p-3 mb-3'>
                              <div className='flex items-center gap-2 mb-2'>
                                <Calendar className='w-4 h-4 text-blue-600' />
                                <span className='font-medium text-blue-900'>Batch Details</span>
                              </div>
                              <div className='grid grid-cols-2 gap-2 text-sm'>
                                <div>
                                  <span className='text-gray-600'>Students:</span>
                                  <span className='ml-2 font-medium'>
                                    {item.batchDetails.enrolledCount} /{' '}
                                    {item.batchDetails.studentLimit}
                                  </span>
                                </div>
                                {item.batchDetails.startDate && (
                                  <div>
                                    <span className='text-gray-600'>Starts:</span>
                                    <span className='ml-2 font-medium'>
                                      {new Date(item.batchDetails.startDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className='flex items-center gap-2 mb-2'>
                            <Badge variant='outline'>{item.type}</Badge>
                            {item.category && <Badge variant='secondary'>{item.category}</Badge>}
                            {item.discount > 0 && (
                              <Badge className='bg-green-500 text-white'>
                                {item.discount}% OFF
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRemoveItem(item._id)}
                          disabled={updateLoading}
                          className='text-red-500 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          {/* Quantity Controls */}
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                              disabled={updateLoading || item.quantity <= 1}
                            >
                              <Minus className='w-4 h-4' />
                            </Button>
                            <span className='w-8 text-center font-medium'>{item.quantity}</span>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              disabled={updateLoading || item.quantity >= 10}
                            >
                              <Plus className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>

                        <div className='text-right'>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <div className='text-sm text-gray-500 line-through'>
                              ₹{item.originalPrice * item.quantity}
                            </div>
                          )}
                          <div className='text-lg font-bold'>₹{item.price * item.quantity}</div>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <div className='text-sm text-green-600 font-medium'>
                              Save ₹{(item.originalPrice - item.price) * item.quantity}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle>You might also like</CardTitle>
                <CardDescription>Courses related to your cart items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {/* This would be populated with API recommendations */}
                  <div className='p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500'>
                    <ShoppingBag className='w-8 h-8 mx-auto mb-2' />
                    <p>Recommendations will appear here</p>
                  </div>
                </div>
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
                {/* Promo Code */}
                <div>
                  <div className='flex gap-2 mb-3'>
                    <Input
                      placeholder='Enter promo code'
                      value={promoCode}
                      onChange={e => {
                        setPromoCode(e.target.value);
                      }}
                      className='flex-1'
                    />
                    <Button onClick={handleApplyPromoCode} variant='outline' size='sm'>
                      Apply
                    </Button>
                  </div>

                  {appliedPromo && (
                    <div className='p-3 bg-green-50 rounded-lg border border-green-200'>
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
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Subtotal ({cart.items.length} items)</span>
                    <span>₹{calculateSubtotal()}</span>
                  </div>

                  {calculateSavings() > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Total Savings</span>
                      <span>-₹{calculateSavings()}</span>
                    </div>
                  )}

                  {appliedPromo && cart.summary.discount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Promo Discount</span>
                      <span>-₹{cart.summary.discount}</span>
                    </div>
                  )}

                  <div className='flex justify-between text-gray-600'>
                    <span>Taxes</span>
                    <span>₹{cart.summary.taxes}</span>
                  </div>

                  <Separator />

                  <div className='flex justify-between text-lg font-semibold'>
                    <span>Total</span>
                    <span>₹{cart.summary.total}</span>
                  </div>
                </div>

                {/* What You Get */}
                <div className='bg-blue-50 rounded-lg p-4'>
                  <h4 className='font-medium text-blue-900 mb-3'>What you'll get:</h4>
                  <div className='space-y-2 text-sm text-blue-800'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span>Full access to all selected courses</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span>Course completion certificates</span>
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

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  className='w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3'
                >
                  <CreditCard className='w-4 h-4 mr-2' />
                  Proceed to Checkout
                </Button>

                {/* Security Badge */}
                <div className='text-center'>
                  <div className='inline-flex items-center gap-2 text-sm text-gray-500'>
                    <CheckCircle className='w-4 h-4 text-green-500' />
                    <span>Secure checkout powered by Cashfree</span>
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

export default Cart;
