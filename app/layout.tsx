import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/AuthProvider';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Luxury Store - Premium Products',
    template: '%s | Luxury Store',
  },
  description: 'Discover premium products at unbeatable prices. Shop the latest trends with fast delivery across Rwanda.',
  keywords: ['e-commerce', 'shopping', 'premium products', 'Rwanda', 'online store'],
  authors: [{ name: 'Luxury Store' }],
  creator: 'Luxury Store',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'Luxury Store',
    title: 'Luxury Store - Premium Products',
    description: 'Discover premium products at unbeatable prices. Shop the latest trends with fast delivery across Rwanda.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Luxury Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luxury Store - Premium Products',
    description: 'Discover premium products at unbeatable prices.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#171717',
                    border: '1px solid #e5e5e5',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}