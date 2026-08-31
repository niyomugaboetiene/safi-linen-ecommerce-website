'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  User,
  Mail,
  CreditCard,
  Smartphone,
  Shield,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { cartAPI, orderAPI, settingsAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    deliveryZone: 'kigali',
    paymentMethod: 'mtn',
    transactionId: '',
    paymentPhone: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cartRes, settingsRes] = await Promise.all([
        cartAPI.getCart(),
        settingsAPI.getSettings(),
      ]);
      setCartItems(cartRes.data?.items || []);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.variants?.find(
      (v: any) => v._id === item.variant
    )?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const deliveryFee = formData.deliveryZone === 'kigali'
    ? settings?.delivery?.kigaliFee || 0
    : settings?.delivery?.outsideKigaliFee || 0;

  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.district) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.paymentPhone || !formData.transactionId) {
      toast.error('Please provide payment details');
      return;
    }

    setSubmitting(true);
    try {
      // Create order
      const orderData = {
        deliveryZone: formData.deliveryZone,
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          district: formData.district,
        },
      };

      const orderResponse = await orderAPI.checkout(orderData);
      const order = orderResponse.data;

      // Submit payment
      const paymentData = {
        orderId: order._id,
        method: formData.paymentMethod,
        transactionId: formData.transactionId,
        phoneNumber: formData.paymentPhone,
      };

      await orderAPI.submitPayment(paymentData);

      toast.success('Order placed successfully!');
      router.push(`/orders/${order._id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h1>
        <p className="text-neutral-600 mb-6">Add some products before checking out.</p>
        <Button href="/products" variant="primary">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 lg:py-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-8">
        Checkout
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  icon={<Phone className="h-4 w-4" />}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={<Mail className="h-4 w-4" />}
                  className="sm:col-span-2"
                  required
                />
              </div>
            </section>

            {/* Delivery Information */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Delivery Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Delivery Zone
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryZone: 'kigali' })}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.deliveryZone === 'kigali'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <MapPin className={`h-5 w-5 mb-2 ${
                        formData.deliveryZone === 'kigali' ? 'text-primary-600' : 'text-neutral-400'
                      }`} />
                      <p className="font-medium text-neutral-900">Kigali</p>
                      <p className="text-sm text-neutral-600">
                        {formatPrice(settings?.delivery?.kigaliFee || 0)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryZone: 'outside_kigali' })}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.deliveryZone === 'outside_kigali'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <MapPin className={`h-5 w-5 mb-2 ${
                        formData.deliveryZone === 'outside_kigali' ? 'text-primary-600' : 'text-neutral-400'
                      }`} />
                      <p className="font-medium text-neutral-900">Outside Kigali</p>
                      <p className="text-sm text-neutral-600">
                        {formatPrice(settings?.delivery?.outsideKigaliFee || 0)}
                      </p>
                    </button>
                  </div>
                </div>
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, house number, etc."
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                  <Input
                    label="District"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Payment Method
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'mtn' })}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.paymentMethod === 'mtn'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <Smartphone className={`h-5 w-5 mb-2 ${
                        formData.paymentMethod === 'mtn' ? 'text-yellow-600' : 'text-neutral-400'
                      }`} />
                      <p className="font-medium text-neutral-900">MTN Mobile Money</p>
                      <p className="text-sm text-neutral-600">
                        Pay with MTN
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'airtel' })}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.paymentMethod === 'airtel'
                          ? 'border-red-500 bg-red-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <Smartphone className={`h-5 w-5 mb-2 ${
                        formData.paymentMethod === 'airtel' ? 'text-red-600' : 'text-neutral-400'
                      }`} />
                      <p className="font-medium text-neutral-900">Airtel Money</p>
                      <p className="text-sm text-neutral-600">
                        Pay with Airtel
                      </p>
                    </button>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <h3 className="font-medium text-neutral-900 mb-2">Payment Instructions</h3>
                  <ol className="space-y-2 text-sm text-neutral-600">
                    <li>1. Send <span className="font-semibold text-neutral-900">{formatPrice(total)}</span> to:</li>
                    <li className="font-medium text-primary-600">
                      {formData.paymentMethod === 'mtn'
                        ? settings?.payment?.mtnNumber || '+250780000000'
                        : settings?.payment?.airtelNumber || '+250730000000'}
                    </li>
                    <li>2. Complete the Mobile Money payment on your phone</li>
                    <li>3. Enter the transaction/reference ID below</li>
                    <li>4. Submit your order for verification</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number Used for Payment"
                    value={formData.paymentPhone}
                    onChange={(e) => setFormData({ ...formData, paymentPhone: e.target.value })}
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="+2507XXXXXXXX"
                    required
                  />
                  <Input
                    label="Transaction/Reference ID"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value.toUpperCase() })}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    placeholder="e.g., MP123456789"
                    required
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-6">
                {cartItems.map((item: any) => {
                  const variant = item.product?.variants?.find(
                    (v: any) => v._id === item.variant
                  );
                  const price = variant?.price || 0;
                  return (
                    <div key={item._id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                        {variant?.images?.[0] && (
                          <Image
                            src={variant.images[0].url}
                            alt={item.product?.name || 'Product'}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 truncate">
                          {item.product?.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-neutral-900">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-neutral-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium text-neutral-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Delivery Fee</span>
                  <span className="font-medium text-neutral-900">
                    {formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-neutral-200">
                  <span className="font-semibold text-neutral-900">Total</span>
                  <span className="font-bold text-xl text-neutral-900">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                loading={submitting}
                fullWidth
                size="lg"
                className="mt-6"
              >
                <Shield className="h-5 w-5" />
                Place Order
              </Button>

              <p className="text-xs text-neutral-500 text-center mt-4">
                By placing your order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}