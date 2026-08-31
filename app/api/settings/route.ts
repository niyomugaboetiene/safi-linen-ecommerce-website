import { NextRequest } from 'next/server';
import { settingsRepository } from '@/lib/dynamodb/repositories/settingsRepository';
import { requireAdmin } from '@/lib/auth-utils';
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
    const settings = await settingsRepository.getSettings();

    const response = {
      business: settings.business,
      delivery: settings.delivery,
      payment: settings.payment,
      site: settings.site,
      updatedAt: settings.updatedAt,
    };

    return successResponse(response, 'Settings fetched successfully');
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

    // Update settings
    const settings = await settingsRepository.updateAllSettings(validatedData.data);

    const response = {
      business: settings.business,
      delivery: settings.delivery,
      payment: settings.payment,
      site: settings.site,
      updatedAt: settings.updatedAt,
    };

    return successResponse(response, 'Settings updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}