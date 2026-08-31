import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z.string()
    .min(5, 'Comment must be at least 5 characters')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .trim(),
});

export const updateReviewSchema = z.object({
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),
  comment: z.string()
    .min(5, 'Comment must be at least 5 characters')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .trim()
    .optional(),
});