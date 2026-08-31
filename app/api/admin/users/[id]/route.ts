import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import User from '@/models/User';
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

    await connectDB();

    const user = await User.findById(id)
      .select('-password -googleId -__v');

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
    await requireAdmin();

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

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check for duplicate email
    if (validatedData.data.email && validatedData.data.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: validatedData.data.email,
        _id: { $ne: id },
      });
      
      if (existingUser) {
        return errorResponse('Email already exists', 409);
      }
    }

    // Update fields
    Object.assign(user, validatedData.data);
    await user.save();

    return successResponse(user, 'User updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Prevent deleting own admin account
    if (user._id.toString() === id && user.role === 'admin') {
      return errorResponse('Cannot delete your own admin account', 400);
    }

    // Soft delete
    user.accountStatus = 'deleted';
    await user.save();

    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}