import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dynamodb';
import User from '@/models/User';
import { registerSchema } from '@/validators/user';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { name, email, phone, password } = validatedData.data;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return errorResponse('Email already registered', 409, 'Duplicate email');
    }

    // Create new user with customer role (never admin)
    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      password,
      role: 'customer',
      accountStatus: 'active',
    });

    return successResponse(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}