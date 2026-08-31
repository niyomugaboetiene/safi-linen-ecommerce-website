'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package,
  Settings,
} from 'lucide-react';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartItemCount = 3; // TODO: Get from cart context
  const wishlistCount = 2; // TODO: Get from wishlist context

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 bg-white transition-shadow duration-300',
          isScrolled && 'shadow-sm'
        )}
      >
        {/* Top Bar */}
        <div className="bg-neutral-900 text-white text-xs">
          <div className="container-custom flex items-center justify-between h-8">
            <p className="font-medium">Free delivery in Kigali on orders over 50,000 RWF</p>
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-neutral-300">Call us: +250 780 000 000</span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-neutral-900"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl lg:text-2xl font-bold tracking-tight">
                Luxury<span className="text-primary-600">Store</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href="/"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-600',
                  pathname === '/' ? 'text-primary-600' : 'text-neutral-700'
                )}
              >
                Home
              </Link>
              <Link
                href="/products"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-600',
                  pathname.startsWith('/products') ? 'text-primary-600' : 'text-neutral-700'
                )}
              >
                Products
              </Link>
              <Link
                href="/categories"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-600',
                  pathname.startsWith('/categories') ? 'text-primary-600' : 'text-neutral-700'
                )}
              >
                Categories
              </Link>
              <Link
                href="/wishlist"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-600',
                  pathname === '/wishlist' ? 'text-primary-600' : 'text-neutral-700'
                )}
              >
                Wishlist
              </Link>
              {isAuthenticated && isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary-600',
                    pathname.startsWith('/admin') ? 'text-primary-600' : 'text-neutral-700'
                  )}
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-neutral-600 hover:text-neutral-900"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 text-neutral-600 hover:text-neutral-900"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-neutral-600 hover:text-neutral-900"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {!loading && (
                <UserMenu />
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="border-t border-neutral-200 bg-white">
            <div className="container-custom py-3">
              <SearchBar onClose={() => setIsSearchOpen(false)} />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}