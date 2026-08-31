import { z } from 'zod';

export const createOrderSchema = z.object({
  deliveryZone: z.enum(['kigali', 'outside_kigali'], {
    errorMap: () => ({ message: 'Delivery zone must be either kigali or outside_kigali' }),
  }),
  shippingAddress: z.object({
    fullName: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .trim(),
    phone: z.string()
      .regex(/^\+?[0-9\s-]{10,20}$/, 'Invalid phone number format'),
    email: z.string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    address: z.string()
      .min(5, 'Address must be at least 5 characters')
      .max(200, 'Address cannot exceed 200 characters')
      .trim(),
    city: z.string()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City cannot exceed 100 characters')
      .trim(),
    district: z.string()
      .min(2, 'District must be at least 2 characters')
      .max(100, 'District cannot exceed 100 characters')
      .trim(),
  }),
});

export const submitPaymentSchema = z.object({
  orderId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  method: z.enum(['mtn', 'airtel'], {
    errorMap: () => ({ message: 'Payment method must be either mtn or airtel' }),
  }),
  transactionId: z.string()
    .min(3, 'Transaction ID must be at least 3 characters')
    .max(100, 'Transaction ID cannot exceed 100 characters')
    .transform(val => val.toUpperCase().trim()),
  phoneNumber: z.string()
    .regex(/^\+?[0-9\s-]{10,20}$/, 'Invalid phone number format'),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID'),
  status: z.enum(['verified', 'rejected']),
  rejectionReason: z.string()
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  status: z.enum([
    'pending_payment',
    'payment_verification',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'payment_rejected',
  ]),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([
    'pending_payment',
    'payment_verification',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'payment_rejected',
  ]).optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});