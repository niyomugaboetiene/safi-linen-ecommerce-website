import Link from 'next/link';
import { Package, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto">
      {/* Main Footer */}
      <div className="container-custom py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Luxury<span className="text-primary-400">Store</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">
              Premium products for your lifestyle. Quality you can trust, prices you'll love.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-sm hover:text-primary-400 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm hover:text-primary-400 transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm hover:text-primary-400 transition-colors">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm hover:text-primary-400 transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm hover:text-primary-400 transition-colors">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Customer Service</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/profile" className="text-sm hover:text-primary-400 transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm hover:text-primary-400 transition-colors">
                  Settings
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm hover:text-primary-400 transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm hover:text-primary-400 transition-colors">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-primary-400" />
                <span className="text-sm">+250 780 000 000</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-primary-400" />
                <span className="text-sm">info@luxurystore.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-primary-400" />
                <span className="text-sm">Kigali, Rwanda</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container-custom py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-400">
              © {new Date().getFullYear()} LuxuryStore. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs hover:text-primary-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs hover:text-primary-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}