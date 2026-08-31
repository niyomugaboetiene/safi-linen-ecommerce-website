'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const orderStatuses = [
  'pending_payment',
  'payment_verification',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'payment_rejected',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchOrders(1);
  }, [search, statusFilter]);

  const fetchOrders = async (page: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await orderAPI.getOrders(params);
      setOrders(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      fetchOrders(pagination.page);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Orders
        </h1>
        <p className="text-neutral-600 mt-1">
          Manage and track customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
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
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-neutral-900">
                        {order.orderNumber}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-900">
                        {order.user?.name || 'Customer'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {order.shippingAddress?.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {order.items?.length || 0} item(s)
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-neutral-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} type="order" />
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className="px-2 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                        <Link
                          href={`/orders/${order._id}`}
                          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                          aria-label="View order"
                        >
                          <Eye className="h-4 w-4 text-neutral-400" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No orders found</p>
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
    </div>
  );
}