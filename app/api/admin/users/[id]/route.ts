import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/dynamodb/repositories/userRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { adminUpdateUserSchema } from '@/validators/user';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;

    const user = await userRepository.getUserProfile(id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user, 'User fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await requireAdmin();

    const { id } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = adminUpdateUserSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const user = await userRepository.getUserById(id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check for duplicate email
    if (validatedData.data.email && validatedData.data.email !== user.email) {
      const existingUser = await userRepository.getUserByEmail(validatedData.data.email);
      
      if (existingUser && existingUser.userId !== id) {
        return errorResponse('Email already exists', 409);
      }
    }

    // Update user fields
    const updates: any = {};
    
    if (validatedData.data.name) updates.name = validatedData.data.name;
    if (validatedData.data.email) updates.email = validatedData.data.email;
    if (validatedData.data.phone !== undefined) updates.phone = validatedData.data.phone || undefined;
    if (validatedData.data.city !== undefined) updates.city = validatedData.data.city || undefined;
    if (validatedData.data.district !== undefined) updates.district = validatedData.data.district || undefined;

    // Handle role update separately
    if (validatedData.data.role && validatedData.data.role !== user.role) {
      // Prevent removing own admin role
      if (id === sessionUser.id && validatedData.data.role !== 'admin') {
        return errorResponse('Cannot remove your own admin role', 400);
      }
      await userRepository.updateUserRole(id, validatedData.data.role);
    }

    // Handle account status update separately
    if (validatedData.data.accountStatus && validatedData.data.accountStatus !== user.accountStatus) {
      // Prevent suspending own account
      if (id === sessionUser.id && validatedData.data.accountStatus !== 'active') {
        return errorResponse('Cannot change your own account status', 400);
      }
      await userRepository.updateUserStatus(id, validatedData.data.accountStatus);
    }

    // Update other fields
    if (Object.keys(updates).length > 0) {
      await userRepository.updateUser(id, updates);
    }

    const updatedUser = await userRepository.getUserProfile(id);

    return successResponse(updatedUser, 'User updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await requireAdmin();

    const { id } = params;

    const user = await userRepository.getUserById(id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Prevent deleting own admin account
    if (id === sessionUser.id && user.role === 'admin') {
      return errorResponse('Cannot delete your own admin account', 400);
    }

    // Soft delete
    await userRepository.deleteUser(id);

    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}