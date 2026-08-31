'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Search,
  Package,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { productAPI } from '@/lib/api';
import { formatPrice, getStockStatus } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts(1);
  }, [search]);

  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;

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
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setDeleting(true);
    try {
      await productAPI.deleteProduct(selectedProduct._id);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      fetchProducts(pagination.page);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const getTotalStock = (product: any) => {
    return product.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0;
  };

  const getPriceRange = (product: any) => {
    const prices = product.variants?.map((v: any) => v.price) || [];
    if (prices.length === 0) return 'N/A';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
            Products
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage your product catalog
          </p>
        </div>
        <Button href="/admin/products/new">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => {
                  const totalStock = getTotalStock(product);
                  const stockStatus = getStockStatus(totalStock);
                  const firstImage = product.variants?.[0]?.images?.[0];

                  return (
                    <tr key={product._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                            {firstImage ? (
                              <Image
                                src={firstImage.url}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <Package className="absolute inset-0 m-auto h-6 w-6 text-neutral-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {product.variants?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                        {getPriceRange(product)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            stockStatus.label === 'In Stock'
                              ? 'success'
                              : stockStatus.label === 'Low Stock'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {totalStock} units
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={product.active ? 'success' : 'danger'}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${product._id}`}
                            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                            aria-label="View product"
                          >
                            <Eye className="h-4 w-4 text-neutral-400" />
                          </Link>
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                            aria-label="Edit product"
                          >
                            <Edit className="h-4 w-4 text-neutral-400" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                            aria-label="Delete product"
                          >
                            <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600 transition-colors" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">No products found</p>
              <Button href="/admin/products/new">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-neutral-900">
              {selectedProduct?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleDeleteProduct}
              loading={deleting}
              variant="danger"
              fullWidth
            >
              Delete Product
            </Button>
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}