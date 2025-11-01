import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

export const useCartWishlistCounts = () => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCounts = async () => {
    if (!user) {
      setCartCount(0);
      setWishlistCount(0);
      setLoading(false);
      return;
    }

    // Temporarily disabled - return static counts
    setCartCount(0);
    setWishlistCount(0);
    setLoading(false);

    /* Temporarily disabled to avoid API errors
    try {
      const [cartResponse, wishlistResponse] = await Promise.allSettled([
        apiService.getCart(),
        apiService.getWishlist()
      ]);

      if (cartResponse.status === 'fulfilled') {
        setCartCount(cartResponse.value.items?.length || 0);
      }

      if (wishlistResponse.status === 'fulfilled') {
        setWishlistCount(wishlistResponse.value.items?.length || 0);
      }
    } catch (error) {
      // If APIs fail, keep counts at 0
      setCartCount(0);
      setWishlistCount(0);
    } finally {
      setLoading(false);
    }
    */
  };

  useEffect(() => {
    fetchCounts();
  }, [user]);

  return {
    cartCount,
    wishlistCount,
    loading,
    refreshCounts: fetchCounts,
  };
};
