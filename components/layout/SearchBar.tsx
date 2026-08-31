'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, Loader2 } from 'lucide-react';
import { productAPI } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

interface SearchBarProps {
  onClose?: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const response = await productAPI.getProducts({
          search: query,
          limit: 5,
        });
        setResults(response.data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      onClose?.();
    }
  };

  const handleResultClick = (productId: string) => {
    router.push(`/products/${productId}`);
    setShowResults(false);
    setQuery('');
    onClose?.();
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50">
          <ul className="divide-y divide-neutral-100">
            {results.map((product: any) => (
              <li key={product._id}>
                <button
                  onClick={() => handleResultClick(product._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.variants?.[0]?.images?.[0]?.url && (
                      <Image
                        src={product.variants[0].images[0].url}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {product.category?.name || 'Product'}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {formatPrice(product.variants?.[0]?.price || 0)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results */}
      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg p-6 text-center z-50">
          <p className="text-sm text-neutral-500">No products found for "{query}"</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all products
          </button>
        </div>
      )}
    </div>
  );
}