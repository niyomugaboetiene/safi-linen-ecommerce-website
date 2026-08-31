'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, X, Search } from 'lucide-react';
import { productAPI, categoryAPI } from '@/lib/api';
import ProductGrid from '@/components/products/ProductGrid';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: 'newest',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories(true);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.sort) params.sort = filters.sort;

      const response = await productAPI.getProducts(params);
      setProducts(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      sort: 'newest',
      page: 1,
      limit: 20,
    });
  };

  const hasActiveFilters = filters.search || filters.category;

  return (
    <div className="container-custom py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
          Products
        </h1>
        <p className="text-neutral-600">
          Browse our collection of premium products
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 mb-4"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          {/* Desktop Filters */}
          <div className={cn(
            'fixed inset-0 z-50 bg-black/50 lg:static lg:bg-transparent lg:z-auto',
            showFilters ? 'block' : 'hidden lg:block'
          )}>
            <div className="absolute lg:static inset-y-0 left-0 w-80 max-w-full bg-white lg:w-auto lg:bg-transparent p-6 lg:p-0 overflow-y-auto">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                      placeholder="Search products..."
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category: any) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Sort By
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                    <option value="name_desc">Name: Z to A</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    fullWidth
                    size="sm"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-600">
              {pagination.total} products found
            </p>
          </div>

          <ProductGrid products={products} loading={loading} />

          {!loading && products.length > 0 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}