'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Heart,
  Settings,
  Pencil,
} from 'lucide-react';
import { userAPI, orderAPI, wishlistAPI } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes, wishlistRes] = await Promise.all([
        userAPI.getProfile(),
        orderAPI.getOrders({ limit: 5 }),
        wishlistAPI.getWishlist(),
      ]);

      setProfile(profileRes.data);
      setRecentOrders(ordersRes.data || []);
      setWishlistCount(wishlistRes.data?.products?.length || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-16">
        <EmptyState
          icon={<User className="h-8 w-8 text-neutral-400" />}
          title="Please sign in"
          description="You need to be signed in to view your profile."
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

  return (
    <div className="container-custom py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-8">
        My Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              {profile?.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={profile?.name || 'Profile'}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-600">
                    {getInitials(profile?.name || 'User')}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {profile?.name}
            </h2>
            <p className="text-sm text-neutral-500">
              {profile?.role === 'admin' ? 'Administrator' : 'Customer'}
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Link
              href="/orders"
              className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:shadow-lg transition-shadow"
            >
              <Package className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-neutral-900">
                {recentOrders.length}
              </p>
              <p className="text-xs text-neutral-600">Orders</p>
            </Link>
            <Link
              href="/wishlist"
              className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:shadow-lg transition-shadow"
            >
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-neutral-900">
                {wishlistCount}
              </p>
              <p className="text-xs text-neutral-600">Wishlist</p>
            </Link>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {profile?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Phone</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {profile?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Address
            </h3>
            {profile?.address ? (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-900">
                    {profile.address.street}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {profile.address.city}, {profile.address.district}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {profile.address.country}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                No address provided.{' '}
                <Link href="/settings" className="text-primary-600 hover:text-primary-700">
                  Add address
                </Link>
              </p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">
                Recent Orders
              </h3>
              <Link
                href="/orders"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <Link
                    key={order._id}
                    href={`/orders/${order._id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        {order.total.toLocaleString()} RWF
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">
                        {order.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}