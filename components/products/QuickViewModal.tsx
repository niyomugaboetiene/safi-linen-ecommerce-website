'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import RatingStars from '@/components/ui/RatingStars';
import { formatPrice } from '@/lib/utils';
import { cartAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await cartAPI.addToCart({
        productId: product._id,
        variantId: selectedVariant._id,
        quantity,
      });
      toast.success('Added to cart');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
          {selectedVariant?.images?.[0] ? (
            <Image
              src={selectedVariant.images[0].url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-1">
              {product.name}
            </h3>
            {product.category && (
              <p className="text-sm text-neutral-500">{product.category.name}</p>
            )}
          </div>

          <RatingStars rating={product.averageRating || 4.5} showValue />

          <p className="text-2xl font-bold text-neutral-900">
            {formatPrice(selectedVariant?.price || 0)}
          </p>

          <p className="text-sm text-neutral-600 line-clamp-3">
            {product.description}
          </p>

          {/* Variants */}
          {product.variants && product.variants.length > 1 && (
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Color: <span className="text-neutral-900">{selectedVariant?.color}</span>
              </label>
              <div className="flex gap-2">
                {product.variants.map((variant: any) => (
                  <button
                    key={variant._id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariant?._id === variant._id
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : 'border-neutral-300 text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {variant.color || variant.size || 'Default'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))}
                className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            loading={isAddingToCart}
            disabled={!selectedVariant || selectedVariant.stock === 0}
            fullWidth
            size="lg"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Modal>
  );
}