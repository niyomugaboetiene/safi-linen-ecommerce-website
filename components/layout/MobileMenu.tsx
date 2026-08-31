'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import {
  X,
  Home,
  ShoppingBag,
  Heart,
  User,
  LayoutDashboard,
  LogOut,
  Package,
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const menuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/categories', label: 'Categories', icon: Package },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-80 max-w-[85%] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              Luxury<span className="text-primary-600">Store</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-50'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {isAuthenticated && (
            <>
              <Link
                href="/profile"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/profile'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-50'
                )}
              >
                <User className="h-5 w-5" />
                My Account
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  )}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Admin Dashboard
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Info / Auth */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-primary-600">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Handle logout
                  onClose();
                }}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full text-center px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="block w-full text-center px-4 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}