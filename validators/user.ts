import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  phone: z.string()
    .regex(/^\+?[0-9\s-]{10,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^\+?[0-9\s-]{10,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  profileImage: z.string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
  address: z.object({
    street: z.string().max(200, 'Street cannot exceed 200 characters').optional(),
    city: z.string().max(100, 'City cannot exceed 100 characters').optional(),
    district: z.string().max(100, 'District cannot exceed 100 characters').optional(),
    country: z.string().max(100, 'Country cannot exceed 100 characters').optional(),
  }).optional(),
  city: z.string().max(100, 'City cannot exceed 100 characters').optional(),
  district: z.string().max(100, 'District cannot exceed 100 characters').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const adminUpdateUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^\+?[0-9\s-]{10,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  role: z.enum(['customer', 'admin']).optional(),
  accountStatus: z.enum(['active', 'suspended', 'deleted']).optional(),
  city: z.string().max(100, 'City cannot exceed 100 characters').optional(),
  district: z.string().max(100, 'District cannot exceed 100 characters').optional(),
});