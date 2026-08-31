'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { wishlistAPI, cartAPI } from '@/lib/api';
import { formatPrice, getStockStatus } from '@/lib/utils';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await wishlistAPI.getWishlist();
      setWishlistItems(response.data?.products || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    setRemovingId(productId);
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: any) => {
    const firstVariant = product.variants?.[0];
    if (!firstVariant) return;

    setAddingToCartId(product._id);
    try {
      await cartAPI.addToCart({
        productId: product._id,
        variantId: firstVariant._id,
        quantity: 1,
      });
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-16">
        <EmptyState
          icon={<Heart className="h-8 w-8 text-neutral-400" />}
          title="Please sign in"
          description="You need to be signed in to view your wishlist."
          actionLabel="Sign In"
          actionHref="/login"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-custom py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container-custom py-16">
        <EmptyState
          icon={<Heart className="h-8 w-8 text-neutral-400" />}
          title="Your wishlist is empty"
          description="Save your favorite products here for later."
          actionLabel="Browse Products"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-custom py-8 lg:py-12">
      <div className="flex items-center gap-2 mb-8">
        <Heart className="h-6 w-6 text-red-500 fill-current" />
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          My Wishlist
        </h1>
        <span className="text-neutral-500">
          ({wishlistItems.length} items)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {wishlistItems.map((product: any) => {
          const firstVariant = product.variants?.[0];
          const image = firstVariant?.images?.[0];
          const price = firstVariant?.price || 0;
          const stock = firstVariant?.stock || 0;
          const stockStatus = getStockStatus(stock);

          return (
            <div
              key={product._id}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <Link
                href={`/products/${product._id}`}
                className="relative aspect-[4/3] bg-neutral-100 block"
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="h-12 w-12 text-neutral-300" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveFromWishlist(product._id);
                  }}
                  disabled={removingId === product._id}
                  className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  {removingId === product._id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600 transition-colors" />
                  )}
                </button>
              </Link>

              {/* Content */}
              <div className="p-4">
                {product.category && (
                  <p className="text-xs text-neutral-500 mb-1">
                    {product.category.name}
                  </p>
                )}
                <Link
                  href={`/products/${product._id}`}
                  className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2 mb-2 block"
                >
                  {product.name}
                </Link>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-neutral-900">
                    {formatPrice(price)}
                  </span>
                  <Badge
                    variant={
                      stockStatus.label === 'In Stock'
                        ? 'success'
                        : stockStatus.label === 'Low Stock'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {stockStatus.label}
                  </Badge>
                </div>

                <Button
                  onClick={() => handleAddToCart(product)}
                  loading={addingToCartId === product._id}
                  disabled={stock === 0}
                  fullWidth
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}