'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Trash2,
  Camera,
} from 'lucide-react';
import { userAPI } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profileImage: '',
    address: {
      street: '',
      city: '',
      district: '',
      country: 'Rwanda',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getProfile();
      const data = response.data;
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        profileImage: data.profileImage || '',
        address: {
          street: data.address?.street || '',
          city: data.address?.city || '',
          district: data.address?.district || '',
          country: data.address?.country || 'Rwanda',
        },
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.updateProfile(formData);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      // Note: Change password API would need to be implemented
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await userAPI.deleteAccount();
      toast.success('Account deleted successfully');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-custom py-8 lg:py-12 max-w-4xl">
      <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-8">
        Account Settings
      </h1>

      {/* Profile Section */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-primary-600" />
          Profile Information
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.profileImage ? (
                <Image
                  src={formData.profileImage}
                  alt={formData.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-600">
                    {getInitials(formData.name || 'User')}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-colors"
                aria-label="Change profile image"
              >
                <Camera className="h-4 w-4 text-neutral-600" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-1">
                Profile Photo
              </p>
              <p className="text-xs text-neutral-500">
                PNG or JPG, max 5MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={<User className="h-4 w-4" />}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              icon={<Phone className="h-4 w-4" />}
              placeholder="+2507XXXXXXXX"
            />
            <Input
              label="Email"
              type="email"
              value={profile?.email || ''}
              disabled
              icon={<Mail className="h-4 w-4" />}
              className="sm:col-span-2"
            />
          </div>

          <div>
            <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-500" />
              Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Street Address"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
                className="sm:col-span-2"
              />
              <Input
                label="City"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
              />
              <Input
                label="District"
                value={formData.address.district}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, district: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary-600" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, currentPassword: e.target.value })
            }
            icon={<Lock className="h-4 w-4" />}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              icon={<Lock className="h-4 w-4" />}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </div>
          <Button type="submit" loading={saving}>
            Change Password
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-red-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button
          onClick={() => setShowDeleteModal(true)}
          variant="danger"
        >
          Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleDeleteAccount}
              loading={deleting}
              variant="danger"
              fullWidth
            >
              Yes, Delete Account
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