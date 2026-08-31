import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function calculateDiscount(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateOrderStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending_payment: 'bg-amber-100 text-amber-800',
    payment_verification: 'bg-blue-100 text-blue-800',
    paid: 'bg-emerald-100 text-emerald-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    payment_rejected: 'bg-red-100 text-red-800',
  };
  return statusColors[status] || 'bg-neutral-100 text-neutral-700';
}

export function generatePaymentStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    verified: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return statusColors[status] || 'bg-neutral-100 text-neutral-700';
}

export function getStockStatus(stock: number): {
  label: string;
  color: string;
} {
  if (stock === 0) {
    return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
  } else if (stock <= 10) {
    return { label: 'Low Stock', color: 'bg-amber-100 text-amber-800' };
  } else {
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-800' };
  }
}

export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'Something went wrong. Please try again.';
}