'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
import { formatPrice, cn, getStockStatus } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { wishlistAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ProductCardProps {
  product: any;
  onQuickView?: (product: any) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { isAuthenticated } = useAuth();

  const firstVariant = product.variants?.[0];
  const firstImage = firstVariant?.images?.[0];
  const price = firstVariant?.price || 0;
  const stock = firstVariant?.stock || 0;
  const stockStatus = getStockStatus(stock);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistAPI.removeFromWishlist(product._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.addToWishlist(product._id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      return;
    }

    if (stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    setIsAddingToCart(true);
    try {
      // Import dynamically to avoid circular dependency
      const { cartAPI } = await import('@/lib/api');
      await cartAPI.addToCart({
        productId: product._id,
        variantId: firstVariant._id,
        quantity: 1,
      });
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all duration-300">
      {/* Image */}
      <Link href={`/products/${product._id}`} className="block relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {firstImage ? (
          <Image
            src={firstImage.url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Star className="h-12 w-12 text-neutral-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && (
            <Badge variant="info">Featured</Badge>
          )}
          {stock === 0 && (
            <Badge variant="danger">Out of Stock</Badge>
          )}
          {stock > 0 && stock <= 10 && (
            <Badge variant="warning">Low Stock</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleWishlist}
            className={cn(
              'p-2 bg-white rounded-lg shadow-sm hover:bg-neutral-50 transition-colors',
              isWishlisted ? 'text-red-500' : 'text-neutral-600'
            )}
            aria-label="Add to wishlist"
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="p-2 bg-white rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4 text-neutral-600" />
            </button>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-neutral-500 mb-1">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <Link
          href={`/products/${product._id}`}
          className="block text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2 mb-2"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs text-neutral-600">
            {product.averageRating || 'New'}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-neutral-900">
              {formatPrice(price)}
            </span>
            {product.originalPrice && product.originalPrice > price && (
              <span className="text-sm text-neutral-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            stockStatus.color
          )}>
            {stockStatus.label}
          </span>
        </div>

        {/* Add to Cart */}
        <Button
          onClick={handleAddToCart}
          loading={isAddingToCart}
          disabled={stock === 0}
          fullWidth
          size="sm"
        >
          <ShoppingCart className="h-4 w-4" />
          {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}