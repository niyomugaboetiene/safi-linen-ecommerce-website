import { NextResponse } from 'next/server';
import { errorResponse } from './api-response';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode);
  }

  if (error.name === 'ZodError') {
    const firstError = error.errors?.[0];
    const message = firstError?.message || 'Validation error';
    return errorResponse(message, 400, 'Validation error');
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return errorResponse(`${field} already exists`, 409, 'Duplicate key');
  }

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return errorResponse('Invalid ID format', 400, 'Invalid ObjectId');
  }

  if (error.name === 'ValidationError') {
    const firstError = Object.values(error.errors || {})[0] as any;
    const message = firstError?.message || 'Validation error';
    return errorResponse(message, 400, 'Mongoose validation error');
  }

  // Default error
  return errorResponse(
    'Internal server error',
    500,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}