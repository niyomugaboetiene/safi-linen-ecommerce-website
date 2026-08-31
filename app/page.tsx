import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Truck, Headphones, BadgeCheck, Star } from 'lucide-react';
import { productAPI, categoryAPI, reviewAPI } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch data in parallel
  const [featuredProductsRes, categoriesRes, reviewsRes] = await Promise.all([
    productAPI.getProducts({ featured: 'true', limit: 8 }),
    categoryAPI.getCategories(true),
    reviewAPI.getReviews({ limit: 5 }),
  ]);

  const featuredProducts = featuredProductsRes.data || [];
  const categories = categoriesRes.data || [];
  const reviews = reviewsRes.data || [];

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-neutral-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container-custom relative py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                <BadgeCheck className="h-4 w-4" />
                Premium Quality Products
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-neutral-900">
                Discover Luxury
                <span className="block text-primary-600">For Your Lifestyle</span>
              </h1>
              <p className="text-lg lg:text-xl text-neutral-600 max-w-lg">
                Shop premium products curated for quality and style. Fast delivery across Rwanda with secure payment options.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button href="/products" size="lg">
                  Shop Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button href="/categories" variant="outline" size="lg">
                  Explore Categories
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-2xl font-bold text-neutral-900">1000+</p>
                  <p className="text-sm text-neutral-600">Products</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">5000+</p>
                  <p className="text-sm text-neutral-600">Happy Customers</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">4.8</p>
                  <p className="text-sm text-neutral-600">Average Rating</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-400 rounded-3xl transform rotate-3" />
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                    alt="Featured Product"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Fast Delivery</p>
                      <p className="text-xs text-neutral-600">Across Rwanda</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Secure Payment</p>
                      <p className="text-xs text-neutral-600">MTN & Airtel</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900">
                Shop by Category
              </h2>
              <p className="text-neutral-600 mt-2">Browse our curated collections</p>
            </div>
            <Link
              href="/categories"
              className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category: any) => (
              <Link
                key={category._id}
                href={`/products?category=${category._id}`}
                className="group relative aspect-square bg-neutral-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm lg:text-base">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-xs">
                    {category.productCount || 'Shop Now'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900">
                Featured Products
              </h2>
              <p className="text-neutral-600 mt-2">Hand-picked just for you</p>
            </div>
            <Link
              href="/products?featured=true"
              className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Promotional Banner */}
      <section className="container-custom">
        <div className="relative bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-transparent" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 lg:p-16">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Summer Sale is Live!
              </h2>
              <p className="text-neutral-300 text-lg">
                Get up to 50% off on selected items. Limited time offer.
              </p>
              <Button href="/products" variant="primary" size="lg">
                Shop the Sale
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                alt="Summer Sale"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-neutral-50 py-16 lg:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900">
              Why Choose Us
            </h2>
            <p className="text-neutral-600 mt-2">
              We provide the best shopping experience
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Secure Payment',
                description: 'Your transactions are protected with MTN and Airtel Money',
              },
              {
                icon: Truck,
                title: 'Fast Delivery',
                description: 'Quick delivery across Kigali and all of Rwanda',
              },
              {
                icon: BadgeCheck,
                title: 'Quality Products',
                description: 'Curated premium products from trusted brands',
              },
              {
                icon: Headphones,
                title: '24/7 Support',
                description: 'Our team is always ready to help you',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      {reviews.length > 0 && (
        <section className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900">
              What Our Customers Say
            </h2>
            <p className="text-neutral-600 mt-2">
              Real reviews from real customers
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review: any) => (
              <div
                key={review._id}
                className="bg-white rounded-xl border border-neutral-200 p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-neutral-700 mb-4 line-clamp-3">
                  "{review.comment}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">
                      {review.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {review.user?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {review.product?.name || 'Verified Purchase'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="container-custom pb-8">
        <div className="bg-primary-600 rounded-2xl px-8 lg:px-16 py-12 lg:py-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and discover premium products at unbeatable prices.
          </p>
          <Button
            href="/products"
            variant="secondary"
            size="lg"
            className="bg-white text-primary-600 hover:bg-neutral-100"
          >
            Start Shopping
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}