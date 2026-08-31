'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, X } from 'lucide-react';
import { cartAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartAPI.getCart();
      setCartItems(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 100) return;

    setUpdatingItem(itemId);
    try {
      await cartAPI.updateCartItem(itemId, newQuantity);
      await fetchCart();
      toast.success('Cart updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update cart');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItem(itemId);
    try {
      await cartAPI.removeCartItem(itemId);
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleClearCart = async () => {
    try {
      await cartAPI.clearCart();
      await fetchCart();
      toast.success('Cart cleared');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear cart');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.variants?.find(
      (v: any) => v._id === item.variant
    )?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="container-custom py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container-custom py-16">
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8 text-neutral-400" />}
          title="Your cart is empty"
          description="Looks like you haven't added any products to your cart yet."
          actionLabel="Start Shopping"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-custom py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Shopping Cart
        </h1>
        <button
          onClick={handleClearCart}
          className="text-sm text-neutral-500 hover:text-red-600 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item: any) => {
            const product = item.product;
            const variant = product?.variants?.find(
              (v: any) => v._id === item.variant
            );
            const image = variant?.images?.[0];
            const price = variant?.price || 0;
            const itemSubtotal = price * item.quantity;

            return (
              <div
                key={item._id}
                className="flex gap-4 bg-white border border-neutral-200 rounded-xl p-4"
              >
                {/* Image */}
                <Link
                  href={`/products/${product?._id}`}
                  className="relative w-24 h-24 lg:w-32 lg:h-32 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0"
                >
                  {image ? (
                    <Image
                      src={image.url}
                      alt={product?.name || 'Product'}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-neutral-300" />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/products/${product?._id}`}
                        className="text-sm lg:text-base font-medium text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2"
                      >
                        {product?.name}
                      </Link>
                      {variant && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {variant.color && `Color: ${variant.color}`}
                          {variant.color && variant.size && ' | '}
                          {variant.size && `Size: ${variant.size}`}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-neutral-900 mt-2">
                        {formatPrice(price)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      disabled={updatingItem === item._id}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                      aria-label="Remove item"
                    >
                      {updatingItem === item._id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600 transition-colors" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center border border-neutral-300 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                        disabled={updatingItem === item._id || item.quantity <= 1}
                        className="p-2 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-medium">
                        {updatingItem === item._id ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        disabled={updatingItem === item._id || item.quantity >= (variant?.stock || 100)}
                        className="p-2 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-neutral-900">
                      {formatPrice(itemSubtotal)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium text-neutral-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Delivery</span>
                <span className="font-medium text-neutral-900">
                  Calculated at checkout
                </span>
              </div>
              <div className="border-t border-neutral-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-neutral-900">Total</span>
                  <span className="font-bold text-lg text-neutral-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              href="/checkout"
              fullWidth
              size="lg"
              className="mt-6"
            >
              Proceed to Checkout
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Link
              href="/products"
              className="block text-center text-sm text-neutral-600 hover:text-neutral-900 mt-4 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}