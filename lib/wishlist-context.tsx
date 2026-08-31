'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { wishlistAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistContextType {
  items: any[];
  loading: boolean;
  itemCount: number;
  refreshWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  loading: false,
  itemCount: 0,
  refreshWishlist: async () => {},
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  isInWishlist: () => false,
});

export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await wishlistAPI.getWishlist();
      setItems(response.data?.products || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      throw new Error('Authentication required');
    }

    try {
      await wishlistAPI.addToWishlist(productId);
      await refreshWishlist();
      toast.success('Added to wishlist');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to wishlist');
      throw error;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      await refreshWishlist();
      toast.success('Removed from wishlist');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove from wishlist');
      throw error;
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item._id === productId);
  };

  const itemCount = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        itemCount,
        refreshWishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}