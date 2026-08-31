import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth-utils';
import { updateProfileSchema } from '@/validators/user';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import { AuthenticationError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    await connectDB();

    const user = await User.findById(sessionUser.id).select('-password -googleId -__v');

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

    await connectDB();

    const user = await User.findById(sessionUser.id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Update only allowed fields
    const updateData = validatedData.data;
    
    if (updateData.name) user.name = updateData.name;
    if (updateData.phone !== undefined) user.phone = updateData.phone || undefined;
    if (updateData.profileImage !== undefined) user.profileImage = updateData.profileImage || undefined;
    if (updateData.address) user.address = { ...user.address, ...updateData.address };
    if (updateData.city !== undefined) user.city = updateData.city || undefined;
    if (updateData.district !== undefined) user.district = updateData.district || undefined;

    await user.save();

    return successResponse(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        address: user.address,
        city: user.city,
        district: user.district,
        role: user.role,
      },
      'Profile updated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    await connectDB();

    const user = await User.findById(sessionUser.id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Soft delete - mark account as deleted
    user.accountStatus = 'deleted';
    await user.save();

    return successResponse(null, 'Account deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
