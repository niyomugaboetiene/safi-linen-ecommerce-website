'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface ProductGridProps {
  products: any[];
  loading?: boolean;
  onQuickView?: boolean;
}

export default function ProductGrid({
  products,
  loading = false,
  onQuickView = true,
}: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[4/3]" variant="rounded" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full" variant="rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your filters or search criteria"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onQuickView={onQuickView ? setSelectedProduct : undefined}
          />
        ))}
      </div>

      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}