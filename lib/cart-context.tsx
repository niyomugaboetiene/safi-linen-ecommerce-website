'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { cartAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface CartContextType {
  items: any[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  loading: false,
  itemCount: 0,
  subtotal: 0,
  refreshCart: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await cartAPI.getCart();
      setItems(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, variantId: string, quantity: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      throw new Error('Authentication required');
    }

    try {
      await cartAPI.addToCart({ productId, variantId, quantity });
      await refreshCart();
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await cartAPI.updateCartItem(itemId, quantity);
      await refreshCart();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update cart');
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await cartAPI.removeCartItem(itemId);
      await refreshCart();
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item');
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      await refreshCart();
      toast.success('Cart cleared');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear cart');
      throw error;
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.variants?.find(
      (v: any) => v._id === item.variant
    )?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        subtotal,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}