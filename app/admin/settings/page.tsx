'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Truck,
  CreditCard,
  Globe,
  Save,
} from 'lucide-react';
import { settingsAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessData, setBusinessData] = useState({
    businessName: '',
    phone: '',
    email: '',
  });

  const [deliveryData, setDeliveryData] = useState({
    kigaliFee: 0,
    outsideKigaliFee: 0,
  });

  const [paymentData, setPaymentData] = useState({
    mtnNumber: '',
    airtelNumber: '',
    paymentInstructions: '',
  });

  const [siteData, setSiteData] = useState({
    logoUrl: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getSettings();
      const data = response.data;
      setSettings(data);
      setBusinessData(data.business);
      setDeliveryData(data.delivery);
      setPaymentData(data.payment);
      setSiteData(data.site);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateSettings({
        business: businessData,
        delivery: deliveryData,
        payment: paymentData,
        site: siteData,
      });
      toast.success('Settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
            Settings
          </h1>
          <p className="text-neutral-600 mt-1">
            Configure your store settings
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Business Settings */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary-600" />
          Business Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Business Name"
            value={businessData.businessName}
            onChange={(e) =>
              setBusinessData({ ...businessData, businessName: e.target.value })
            }
            required
          />
          <Input
            label="Phone Number"
            value={businessData.phone}
            onChange={(e) =>
              setBusinessData({ ...businessData, phone: e.target.value })
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={businessData.email}
            onChange={(e) =>
              setBusinessData({ ...businessData, email: e.target.value })
            }
            className="sm:col-span-2"
            required
          />
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary-600" />
          Delivery Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Kigali Delivery Fee (RWF)"
            type="number"
            value={deliveryData.kigaliFee}
            onChange={(e) =>
              setDeliveryData({
                ...deliveryData,
                kigaliFee: Number(e.target.value),
              })
            }
            min={0}
            required
          />
          <Input
            label="Outside Kigali Delivery Fee (RWF)"
            type="number"
            value={deliveryData.outsideKigaliFee}
            onChange={(e) =>
              setDeliveryData({
                ...deliveryData,
                outsideKigaliFee: Number(e.target.value),
              })
            }
            min={0}
            required
          />
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary-600" />
          Payment Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="MTN Mobile Money Number"
            value={paymentData.mtnNumber}
            onChange={(e) =>
              setPaymentData({ ...paymentData, mtnNumber: e.target.value })
            }
            placeholder="+25078XXXXXXXX"
            required
          />
          <Input
            label="Airtel Money Number"
            value={paymentData.airtelNumber}
            onChange={(e) =>
              setPaymentData({ ...paymentData, airtelNumber: e.target.value })
            }
            placeholder="+25073XXXXXXXX"
            required
          />
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
              Payment Instructions
            </label>
            <textarea
              value={paymentData.paymentInstructions}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  paymentInstructions: e.target.value,
                })
              }
              rows={4}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="Instructions for customers on how to pay"
            />
          </div>
        </div>
      </div>

      {/* Site Settings */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary-600" />
          Site Settings
        </h2>
        <div className="space-y-4">
          <Input
            label="Logo URL"
            value={siteData.logoUrl}
            onChange={(e) =>
              setSiteData({ ...siteData, logoUrl: e.target.value })
            }
            placeholder="https://example.com/logo.png"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Facebook URL"
              value={siteData.socialLinks?.facebook}
              onChange={(e) =>
                setSiteData({
                  ...siteData,
                  socialLinks: {
                    ...siteData.socialLinks,
                    facebook: e.target.value,
                  },
                })
              }
              placeholder="https://facebook.com/..."
            />
            <Input
              label="Instagram URL"
              value={siteData.socialLinks?.instagram}
              onChange={(e) =>
                setSiteData({
                  ...siteData,
                  socialLinks: {
                    ...siteData.socialLinks,
                    instagram: e.target.value,
                  },
                })
              }
              placeholder="https://instagram.com/..."
            />
            <Input
              label="Twitter URL"
              value={siteData.socialLinks?.twitter}
              onChange={(e) =>
                setSiteData({
                  ...siteData,
                  socialLinks: {
                    ...siteData.socialLinks,
                    twitter: e.target.value,
                  },
                })
              }
              placeholder="https://twitter.com/..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}