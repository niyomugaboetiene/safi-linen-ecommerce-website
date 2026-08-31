'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
import { productAPI, cartAPI, wishlistAPI, reviewAPI } from '@/lib/api';
import ProductGallery from '@/components/products/ProductGallery';
import VariantSelector from '@/components/products/VariantSelector';
import RatingStars from '@/components/ui/RatingStars';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice, getStockStatus } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getProduct(id as string);
      setProduct(response.data);
      setSelectedVariant(response.data?.variants?.[0]);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getReviews({ productId: id as string });
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    setIsAddingToCart(true);
    try {
      await cartAPI.addToCart({
        productId: product._id,
        variantId: selectedVariant._id,
        quantity,
      });
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-neutral-100 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 bg-neutral-100 rounded animate-pulse w-1/2" />
            <div className="h-8 bg-neutral-100 rounded animate-pulse w-1/3" />
            <div className="h-32 bg-neutral-100 rounded animate-pulse" />
            <div className="h-12 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Product not found</h1>
        <p className="text-neutral-600 mb-6">The product you're looking for doesn't exist.</p>
        <Button href="/products" variant="primary">
          Browse Products
        </Button>
      </div>
    );
  }

  const stockStatus = selectedVariant ? getStockStatus(selectedVariant.stock) : null;

  return (
    <div className="container-custom py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <ProductGallery
          images={selectedVariant?.images || []}
          productName={product.name}
        />

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category & Name */}
          <div>
            {product.category && (
              <p className="text-sm text-primary-600 font-medium mb-2">
                {product.category.name}
              </p>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <RatingStars rating={4.5} showValue />
              <span className="text-sm text-neutral-500">
                {reviews.length} reviews
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl lg:text-4xl font-bold text-neutral-900">
              {formatPrice(selectedVariant?.price || 0)}
            </span>
            {product.originalPrice && product.originalPrice > (selectedVariant?.price || 0) && (
              <span className="text-xl text-neutral-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {stockStatus && (
              <Badge variant={stockStatus.label === 'In Stock' ? 'success' : stockStatus.label === 'Low Stock' ? 'warning' : 'danger'}>
                {stockStatus.label}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-neutral-600 leading-relaxed">
            {product.description}
          </p>

          {/* Variant Selector */}
          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelect={setSelectedVariant}
          />

          {/* SKU & Stock */}
          {selectedVariant && (
            <div className="flex items-center gap-6 text-sm text-neutral-600">
              <div>
                <span className="font-medium">SKU:</span> {selectedVariant.sku}
              </div>
              <div>
                <span className="font-medium">Stock:</span>{' '}
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} available` : 'Out of stock'}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center border border-neutral-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-neutral-50 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-16 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))}
                className="p-3 hover:bg-neutral-50 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              loading={isAddingToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>

            <button
              onClick={handleWishlist}
              className="p-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart
                className={`h-5 w-5 ${
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-600'
                }`}
              />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Fast Delivery</p>
                <p className="text-xs text-neutral-600">Across Rwanda</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Secure Payment</p>
                <p className="text-xs text-neutral-600">MTN & Airtel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Easy Returns</p>
                <p className="text-xs text-neutral-600">7-day policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Customer Reviews
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review._id} className="border border-neutral-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600">
                        {review.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {review.user?.name || 'Customer'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="text-neutral-700">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}