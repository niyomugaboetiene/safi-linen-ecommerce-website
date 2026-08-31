'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen, ArrowRight, Package } from 'lucide-react';
import { categoryAPI, productAPI } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryAPI.getCategories(true);
      const categoriesData = response.data || [];

      // Fetch product count for each category
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (category: any) => {
          try {
            const productsRes = await productAPI.getProducts({
              category: category._id,
              limit: 1,
            });
            return {
              ...category,
              productCount: productsRes.pagination?.total || 0,
            };
          } catch (error) {
            return {
              ...category,
              productCount: 0,
            };
          }
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="container-custom py-16">
        <EmptyState
          icon={<FolderOpen className="h-8 w-8 text-neutral-400" />}
          title="No categories found"
          description="Check back later for our product categories."
        />
      </div>
    );
  }

  return (
    <div className="container-custom py-8 lg:py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-2xl lg:text-4xl font-bold text-neutral-900 mb-2">
          Shop by Category
        </h1>
        <p className="text-neutral-600 text-lg">
          Browse our curated collections
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/products?category=${category._id}`}
            className="group relative bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all duration-300"
          >
            {/* Category Image/Icon */}
            <div className="relative aspect-[16/9] bg-gradient-to-br from-primary-50 to-neutral-100 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <FolderOpen className="h-10 w-10 text-primary-600" />
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary-100 rounded-full opacity-50" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary-50 rounded-full opacity-50" />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600">
                  <Package className="h-4 w-4" />
                  {category.productCount || 0} products
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 bg-neutral-900 rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
          Can't Find What You're Looking For?
        </h2>
        <p className="text-neutral-300 mb-6">
          Browse our full product catalog to discover more amazing products.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-lg font-medium hover:bg-neutral-100 transition-colors"
        >
          View All Products
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}