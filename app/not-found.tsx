import Link from 'next/link';
import { Package, Home, ArrowLeft, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 rounded-full mb-6">
          <Package className="h-10 w-10 text-neutral-400" />
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl lg:text-7xl font-bold text-neutral-900 mb-2">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
          Page Not Found
        </h2>
        <p className="text-neutral-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/" size="lg">
            <Home className="h-5 w-5" />
            Back to Home
          </Button>
          <Button href="/products" variant="outline" size="lg">
            <Search className="h-5 w-5" />
            Browse Products
          </Button>
        </div>

        {/* Go Back Link */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 mt-6 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}