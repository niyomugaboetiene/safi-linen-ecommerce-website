import { z } from 'zod';

const imageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  publicId: z.string().min(1, 'Public ID is required'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
});

const variantSchema = z.object({
  sku: z.string()
    .min(1, 'SKU is required')
    .max(50, 'SKU cannot exceed 50 characters')
    .regex(/^[A-Za-z0-9-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores')
    .transform(val => val.toUpperCase()),
  color: z.string()
    .max(50, 'Color cannot exceed 50 characters')
    .optional()
    .or(z.literal('')),
  size: z.string()
    .max(50, 'Size cannot exceed 50 characters')
    .optional()
    .or(z.literal('')),
  price: z.number()
    .positive('Price must be positive')
    .max(10000000, 'Price cannot exceed 10,000,000'),
  stock: z.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .max(1000000, 'Stock cannot exceed 1,000,000'),
  images: z.array(imageSchema).max(10, 'Maximum 10 images allowed').default([]),
  attributes: z.record(z.string()).optional(),
  active: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name cannot exceed 200 characters')
    .trim(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters')
    .trim(),
  category: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  brand: z.string()
    .max(100, 'Brand cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  variants: z.array(variantSchema)
    .min(1, 'At least one variant is required')
    .max(100, 'Maximum 100 variants allowed'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().extend({
  category: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
    .optional(),
});

export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
    .optional(),
  search: z.string().max(200).optional(),
  featured: z.enum(['true', 'false']).optional(),
  active: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc']).default('newest'),
});