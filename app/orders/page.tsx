'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/components/providers/AuthProvider';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(1);
    }
  }, [isAuthenticated]);

  const fetchOrders = async (page: number) => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrders({ page, limit: 10 });
      setOrders(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-16">
        <EmptyState
          icon={<Package className="h-8 w-8 text-neutral-400" />}
          title="Please sign in"
          description="You need to be signed in to view your orders."
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

  if (orders.length === 0) {
    return (
      <div className="container-custom py-16">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8 text-neutral-400" />}
          title="No orders yet"
          description="When you place an order, it will appear here."
          actionLabel="Start Shopping"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-custom py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-8">
        My Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order: any) => (
          <Link
            key={order._id}
            href={`/orders/${order._id}`}
            className="block bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">
                    {order.items?.length || 0} item(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold text-neutral-900">
                    {formatPrice(order.total)}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <StatusBadge status={order.status} type="order" />
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}