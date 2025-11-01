import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface CartButtonProps {
  courseId?: string;
  batchId?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const CartButton: React.FC<CartButtonProps> = ({
  courseId,
  batchId,
  className = '',
  size = 'sm',
  variant = 'outline',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkCartStatus = useCallback(async () => {
    if (!user) return;

    try {
      interface CartItem {
        course?: string;
        batch?: string;
      }
      const cartRes = await apiService.getCart();
      const items: CartItem[] = cartRes.data?.items ?? [];
      const itemExists = items.some(
        item =>
          (Boolean(courseId) && item.course === courseId) ||
          (Boolean(batchId) && item.batch === batchId)
      );
      setIsInCart(itemExists);
    } catch {
      // Cart might not exist yet, that's okay
    }
  }, [user, courseId, batchId]);

  useEffect(() => {
    void checkCartStatus();
  }, [checkCartStatus]);

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to add items to your cart.',
        variant: 'destructive',
      });
      return;
    }

    if (isInCart) {
      toast({
        title: 'Already in Cart',
        description: 'This item is already in your cart.',
      });
      return;
    }

    setLoading(true);
    try {
      await apiService.addToCart(courseId, batchId, 1);
      setIsInCart(true);
      toast({
        title: 'Added to Cart',
        description: 'Item has been added to your cart successfully!',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add item to cart.');
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={e => {
        void handleCartClick(e);
      }}
      disabled={loading}
      className={`${className} ${isInCart ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
    >
      <ShoppingCart className='w-4 h-4' />
      {loading ? (
        <span className='ml-1'>...</span>
      ) : isInCart ? (
        <span className='ml-1'>In Cart</span>
      ) : (
        <span className='ml-1'>Add to Cart</span>
      )}
    </Button>
  );
};

interface WishlistButtonProps {
  courseId?: string;
  batchId?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  courseId,
  batchId,
  className = '',
  size = 'sm',
  variant = 'ghost',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkWishlistStatus = useCallback(async () => {
    if (!user) return;

    try {
      interface WishItem {
        _id?: string;
        course?: string;
        batch?: string;
      }
      const wishRes = await apiService.getWishlist();
      const items: WishItem[] = wishRes.data?.items ?? [];
      const itemExists = items.some(
        item =>
          (Boolean(courseId) && item.course === courseId) ||
          (Boolean(batchId) && item.batch === batchId)
      );
      setIsInWishlist(itemExists);
    } catch {
      // Wishlist might not exist yet, that's okay
    }
  }, [user, courseId, batchId]);

  useEffect(() => {
    void checkWishlistStatus();
  }, [checkWishlistStatus]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to add items to your wishlist.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        // Remove from wishlist
        interface WishItem {
          _id?: string;
          course?: string;
          batch?: string;
        }
        const wishRes = await apiService.getWishlist();
        const items: WishItem[] = wishRes.data?.items ?? [];
        const item = items.find(
          i =>
            (Boolean(courseId) && i.course === courseId) ||
            (Boolean(batchId) && i.batch === batchId)
        );

        if (item) {
          await apiService.removeFromWishlist(item._id!);
          setIsInWishlist(false);
          toast({
            title: 'Removed from Wishlist',
            description: 'Item has been removed from your wishlist.',
          });
        }
      } else {
        // Add to wishlist
        await apiService.addToWishlist(courseId, batchId, 'medium', []);
        setIsInWishlist(true);
        toast({
          title: 'Added to Wishlist',
          description: 'Item has been added to your wishlist!',
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update wishlist.');
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={e => {
        void handleWishlistClick(e);
      }}
      disabled={loading}
      className={`${className} ${isInWishlist ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
    >
      <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
      {loading ? (
        <span className='ml-1'>...</span>
      ) : isInWishlist ? (
        <span className='ml-1'>Saved</span>
      ) : (
        <span className='ml-1'>Save</span>
      )}
    </Button>
  );
};
