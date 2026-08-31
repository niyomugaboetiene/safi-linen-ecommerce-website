import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === 'admin';
    const path = req.nextUrl.pathname;

    // Protect admin routes
    if (path.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Protect user routes
    const protectedRoutes = ['/profile', '/settings', '/orders', '/wishlist', '/checkout'];
    if (protectedRoutes.some(route => path.startsWith(route)) && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public routes
        const publicRoutes = [
          '/',
          '/products',
          '/categories',
          '/login',
          '/register',
        ];

        // Allow public routes
        if (publicRoutes.some(route => path === route || path.startsWith(route + '/'))) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
  ],
};