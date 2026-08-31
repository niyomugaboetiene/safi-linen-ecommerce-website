'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Truck,
  Star,
  ArrowRight,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      href: '/admin/users',
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-emerald-100 text-emerald-600',
      href: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-purple-100 text-purple-600',
      href: '/admin/orders',
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments || 0,
      icon: CreditCard,
      color: 'bg-amber-100 text-amber-600',
      href: '/admin/payments',
    },
    {
      title: 'Total Reviews',
      value: stats?.totalReviews || 0,
      icon: Star,
      color: 'bg-pink-100 text-pink-600',
      href: '/admin/reviews',
    },
    {
      title: 'Revenue',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      href: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Dashboard
        </h1>
        <p className="text-neutral-600 mt-1">
          Welcome back, here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stat.value}
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                {stat.title}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats?.recentOrders?.length > 0 ? (
              stats.recentOrders.map((order: any) => (
                <Link
                  key={order._id}
                  href={`/admin/orders`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {order.user?.name || 'Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatPrice(order.total)}
                    </p>
                    <StatusBadge status={order.status} type="order" size="sm" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="p-6 text-sm text-neutral-500 text-center">
                No orders yet
              </p>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Low Stock Products
            </h2>
            <Link
              href="/admin/products"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats?.lowStockProducts?.length > 0 ? (
              stats.lowStockProducts.map((product: any) => (
                <Link
                  key={product._id}
                  href={`/admin/products`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {product.variants?.length || 0} variants
                    </p>
                  </div>
                  <div className="text-right">
                    {product.variants?.map((variant: any) => (
                      <p
                        key={variant._id}
                        className={`text-sm font-semibold ${
                          variant.stock === 0
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {variant.stock} in stock
                      </p>
                    ))}
                  </div>
                </Link>
              ))
            ) : (
              <p className="p-6 text-sm text-neutral-500 text-center">
                All products are well stocked
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}