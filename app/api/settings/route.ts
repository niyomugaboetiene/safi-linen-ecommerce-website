import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Settings from '@/models/Settings';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const settingsSchema = z.object({
  business: z.object({
    businessName: z.string().min(2).max(200),
    phone: z.string().min(10).max(20),
    email: z.string().email(),
  }).optional(),
  delivery: z.object({
    kigaliFee: z.number().min(0).max(1000000),
    outsideKigaliFee: z.number().min(0).max(1000000),
  }).optional(),
  payment: z.object({
    mtnNumber: z.string().min(10).max(20),
    airtelNumber: z.string().min(10).max(20),
    paymentInstructions: z.string().min(10).max(2000),
  }).optional(),
  site: z.object({
    logoUrl: z.string().url().optional().or(z.literal('')),
    socialLinks: z.object({
      facebook: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
    }).optional(),
  }).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    let settings = await Settings.findOne().select('-__v');

    if (!settings) {
      // Create default settings if not exists
      settings = await Settings.create({});
    }

    return successResponse(settings, 'Settings fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    // Validate input
    const validatedData = settingsSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    await connectDB();

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(validatedData.data);
    } else {
      // Update only provided fields
      Object.assign(settings, validatedData.data);
      await settings.save();
    }

    return successResponse(settings, 'Settings updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}