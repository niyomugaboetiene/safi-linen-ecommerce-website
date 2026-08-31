'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Package,
  MapPin,
  Phone,
  User,
  Mail,
  CreditCard,
  CheckCircle2,
  Clock,
  Truck,
  Home,
  XCircle,
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { formatPrice, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrder(id as string);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
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

  if (!order) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Order not found</h1>
        <p className="text-neutral-600 mb-6">The order you're looking for doesn't exist.</p>
        <Button href="/orders" variant="primary">
          View All Orders
        </Button>
      </div>
    );
  }

  const orderSteps = [
    { key: 'pending_payment', label: 'Order Placed', icon: Clock },
    { key: 'payment_verification', label: 'Payment Verification', icon: CreditCard },
    { key: 'paid', label: 'Paid', icon: CheckCircle2 },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Home },
  ];

  const currentStepIndex = orderSteps.findIndex(step => step.key === order.status);

  return (
    <div className="container-custom py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
            Order Details
          </h1>
          <p className="text-neutral-600">
            Order #{order.orderNumber}
          </p>
        </div>
        <StatusBadge status={order.status} type="order" size="lg" />
      </div>

      {/* Order Progress */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          {orderSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isRejected = order.status === 'payment_rejected' && index === 1;
            const isCancelled = order.status === 'cancelled';

            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isRejected
                        ? 'bg-red-100 text-red-600'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-600'
                        : isCurrent
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {index < orderSteps.length - 1 && (
                    <div
                      className={`absolute top-1/2 left-full w-full h-0.5 -translate-y-1/2 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                </div>
                <p className="text-xs text-center mt-2 max-w-[80px]">
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {(order.status === 'payment_rejected' || order.status === 'cancelled') && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              {order.status === 'payment_rejected'
                ? 'Payment was rejected. Please contact support for assistance.'
                : 'This order was cancelled.'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Order Items
          </h2>
          {order.items.map((item: any) => (
            <div
              key={item._id}
              className="flex gap-4 bg-white border border-neutral-200 rounded-xl p-4"
            >
              <div className="relative w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                <Package className="absolute inset-0 m-auto h-8 w-8 text-neutral-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">
                  {item.productName}
                </p>
                <p className="text-sm text-neutral-500">
                  SKU: {item.variantDetails?.sku}
                </p>
                {item.variantDetails?.color && (
                  <p className="text-sm text-neutral-500">
                    Color: {item.variantDetails.color}
                  </p>
                )}
                {item.variantDetails?.size && (
                  <p className="text-sm text-neutral-500">
                    Size: {item.variantDetails.size}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-neutral-600">
                    Qty: {item.quantity}
                  </p>
                  <p className="font-semibold text-neutral-900">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Customer Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">
                  {order.shippingAddress?.fullName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">
                  {order.shippingAddress?.phone}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">
                  {order.shippingAddress?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Delivery Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-600">
                    {order.shippingAddress?.address}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {order.shippingAddress?.city}, {order.shippingAddress?.district}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600 capitalize">
                  {order.deliveryZone === 'kigali' ? 'Kigali' : 'Outside Kigali'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Payment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium text-neutral-900">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Delivery Fee</span>
                <span className="font-medium text-neutral-900">
                  {formatPrice(order.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-neutral-200">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="font-bold text-lg text-neutral-900">
                  {formatPrice(order.total)}
                </span>
              </div>
              {order.payment && (
                <div className="pt-3 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Payment Status</span>
                    <StatusBadge status={order.payment.status} type="payment" />
                  </div>
                  {order.payment.method && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-neutral-600">Method</span>
                      <span className="text-sm font-medium text-neutral-900 uppercase">
                        {order.payment.method}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}