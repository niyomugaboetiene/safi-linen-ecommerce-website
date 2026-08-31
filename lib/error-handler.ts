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
  // Log full error server-side for debugging
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Handle custom AppError
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.name);
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const firstError = error.errors?.[0];
    const message = firstError?.message || 'Validation error';
    return errorResponse(message, 400, 'Validation error');
  }

  // Handle DynamoDB specific errors
  if (error.name === 'ConditionalCheckFailedException') {
    return errorResponse(
      'Operation failed due to a condition check. Please try again.',
      409,
      'ConditionalCheckFailedException'
    );
  }

  if (error.name === 'ResourceNotFoundException') {
    return errorResponse(
      'Requested resource not found in database.',
      404,
      'ResourceNotFoundException'
    );
  }

  if (error.name === 'ValidationException') {
    return errorResponse(
      'Invalid data provided to database operation.',
      400,
      'DynamoDB ValidationException'
    );
  }

  if (error.name === 'ProvisionedThroughputExceededException') {
    return errorResponse(
      'Service is temporarily busy. Please try again later.',
      429,
      'ProvisionedThroughputExceededException'
    );
  }

  if (error.name === 'ThrottlingException') {
    return errorResponse(
      'Too many requests. Please try again later.',
      429,
      'ThrottlingException'
    );
  }

  if (error.name === 'TransactionCanceledException') {
    return errorResponse(
      'Transaction was cancelled. Please try again.',
      409,
      'TransactionCanceledException'
    );
  }

  if (error.name === 'TransactionConflictException') {
    return errorResponse(
      'Transaction conflict detected. Please try again.',
      409,
      'TransactionConflictException'
    );
  }

  if (error.name === 'ItemCollectionSizeLimitExceededException') {
    return errorResponse(
      'Item collection size limit exceeded.',
      400,
      'ItemCollectionSizeLimitExceededException'
    );
  }

  // Handle duplicate key errors (custom)
  if (error.code === 11000 || error.name === 'DuplicateKeyError') {
    const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'field';
    return errorResponse(`${field} already exists`, 409, 'Duplicate key');
  }

  // Handle invalid ID format
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return errorResponse('Invalid ID format', 400, 'Invalid ObjectId');
  }

  // Handle Mongoose validation errors (legacy support)
  if (error.name === 'ValidationError' && error.errors) {
    const firstError = Object.values(error.errors)[0] as any;
    const message = firstError?.message || 'Validation error';
    return errorResponse(message, 400, 'Validation error');
  }

  // Handle AWS SDK errors
  if (error.$metadata?.httpStatusCode) {
    const statusCode = error.$metadata.httpStatusCode;
    
    if (statusCode === 400) {
      return errorResponse('Invalid request', 400, error.name);
    }
    
    if (statusCode === 401) {
      return errorResponse('Authentication failed', 401, error.name);
    }
    
    if (statusCode === 403) {
      return errorResponse('Access denied', 403, error.name);
    }
    
    if (statusCode === 404) {
      return errorResponse('Resource not found', 404, error.name);
    }
    
    if (statusCode === 409) {
      return errorResponse('Resource conflict', 409, error.name);
    }
    
    if (statusCode === 429) {
      return errorResponse('Too many requests', 429, error.name);
    }
    
    if (statusCode >= 500) {
      return errorResponse('Service unavailable', 503, error.name);
    }
  }

  // Default error
  return errorResponse(
    'Internal server error',
    500,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}