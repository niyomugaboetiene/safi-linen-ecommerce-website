import { getSession } from 'next-auth/react';

const API_BASE_URL = '/api';

async function fetchAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  const session = await getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.user) {
    headers.Authorization = `Bearer ${session.user.id}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth API
export const authAPI = {
  register: (data: any) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  login: (data: any) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  logout: () =>
    fetchAPI('/auth/logout', {
      method: 'POST',
    }),
};

// User API
export const userAPI = {
  getProfile: () =>
    fetchAPI('/users/profile'),
  
  updateProfile: (data: any) =>
    fetchAPI('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteAccount: () =>
    fetchAPI('/users/profile', {
      method: 'DELETE',
    }),
};

// Product API
export const productAPI = {
  getProducts: (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/products?${queryString}`);
  },
  
  getProduct: (id: string) =>
    fetchAPI(`/products/${id}`),
  
  createProduct: (data: any) =>
    fetchAPI('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateProduct: (id: string, data: any) =>
    fetchAPI(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteProduct: (id: string) =>
    fetchAPI(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// Category API
export const categoryAPI = {
  getCategories: (activeOnly?: boolean) => {
    const params = activeOnly ? '?active=true' : '';
    return fetchAPI(`/categories${params}`);
  },
  
  createCategory: (data: any) =>
    fetchAPI('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateCategory: (id: string, data: any) =>
    fetchAPI(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteCategory: (id: string) =>
    fetchAPI(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Cart API
export const cartAPI = {
  getCart: () =>
    fetchAPI('/cart'),
  
  addToCart: (data: any) =>
    fetchAPI('/cart', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateCartItem: (itemId: string, quantity: number) =>
    fetchAPI(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  
  removeCartItem: (itemId: string) =>
    fetchAPI(`/cart/${itemId}`, {
      method: 'DELETE',
    }),
  
  clearCart: () =>
    fetchAPI('/cart', {
      method: 'DELETE',
    }),
};

// Order API
export const orderAPI = {
  checkout: (data: any) =>
    fetchAPI('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getOrders: (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/orders?${queryString}`);
  },
  
  getOrder: (id: string) =>
    fetchAPI(`/orders/${id}`),
  
  updateOrderStatus: (id: string, status: string) =>
    fetchAPI(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Payment API
export const paymentAPI = {
  submitPayment: (data: any) =>
    fetchAPI('/payments/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  verifyPayment: (id: string, data: any) =>
    fetchAPI(`/payments/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Review API
export const reviewAPI = {
  getReviews: (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/reviews?${queryString}`);
  },
  
  createReview: (data: any) =>
    fetchAPI('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateReview: (id: string, data: any) =>
    fetchAPI(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteReview: (id: string) =>
    fetchAPI(`/reviews/${id}`, {
      method: 'DELETE',
    }),
};

// Wishlist API
export const wishlistAPI = {
  getWishlist: () =>
    fetchAPI('/wishlist'),
  
  addToWishlist: (productId: string) =>
    fetchAPI('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  
  removeFromWishlist: (productId: string) =>
    fetchAPI('/wishlist', {
      method: 'DELETE',
      body: JSON.stringify({ productId }),
    }),
};

// Settings API
export const settingsAPI = {
  getSettings: () =>
    fetchAPI('/settings'),
  
  updateSettings: (data: any) =>
    fetchAPI('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Admin API
export const adminAPI = {
  getStats: () =>
    fetchAPI('/admin/stats'),
  
  getUsers: (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/users?${queryString}`);
  },
  
  updateUser: (id: string, data: any) =>
    fetchAPI(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteUser: (id: string) =>
    fetchAPI(`/admin/users/${id}`, {
      method: 'DELETE',
    }),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchAPI('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
        'Content-Type': undefined,
      },
    });
  },
};