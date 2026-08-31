import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/dynamodb/repositories/userRepository';
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

    // Check if user already exists
    const existingUser = await userRepository.getUserByEmail(email);
    
    if (existingUser) {
      return errorResponse('Email already registered', 409, 'Duplicate email');
    }

    // Create new user with customer role (never admin)
    const user = await userRepository.createUser({
      name,
      email,
      phone: phone || undefined,
      password,
      role: 'customer',
    });

    return successResponse(
      {
        id: user.id,
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