import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/dynamodb/repositories/userRepository';
import { requireAuth } from '@/lib/auth-utils';
import { updateProfileSchema } from '@/validators/user';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const user = await userRepository.getUserProfile(sessionUser.id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user, 'Profile fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const body = await req.json();
    
    // Validate input
    const validatedData = updateProfileSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const user = await userRepository.getUserById(sessionUser.id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Update only allowed fields
    const updateData = validatedData.data;
    
    const updates: any = {};
    
    if (updateData.name) updates.name = updateData.name;
    if (updateData.phone !== undefined) updates.phone = updateData.phone || undefined;
    if (updateData.profileImage !== undefined) updates.profileImage = updateData.profileImage || undefined;
    if (updateData.address) updates.address = { ...user.address, ...updateData.address };
    if (updateData.city !== undefined) updates.city = updateData.city || undefined;
    if (updateData.district !== undefined) updates.district = updateData.district || undefined;

    const updatedUser = await userRepository.updateUser(sessionUser.id, updates);

    if (!updatedUser) {
      return errorResponse('Failed to update profile', 500);
    }

    return successResponse(updatedUser, 'Profile updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const user = await userRepository.getUserById(sessionUser.id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Soft delete - mark account as deleted
    await userRepository.deleteUser(sessionUser.id);

    return successResponse(null, 'Account deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}