import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  variantId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100')
    .default(1),
});

export const updateCartItemSchema = z.object({
  itemId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
});

export const removeFromCartSchema = z.object({
  itemId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID'),
});