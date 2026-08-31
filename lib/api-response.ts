import { NextResponse } from 'next/server';
import { ApiResponse, PaginationInfo } from '@/types/api';

export function successResponse<T = any>(
  data: T,
  message: string = 'Success',
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  return NextResponse.json(response, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  error?: string
): NextResponse {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };

  return NextResponse.json(response, { status });
}

export function paginatedResponse<T = any>(
  data: T[],
  pagination: PaginationInfo,
  message: string = 'Success'
): NextResponse {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination,
  };

  return NextResponse.json(response, { status: 200 });
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): { page: number; limit: number; skip: number } {
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(limitParam || String(defaultLimit), 10) || defaultLimit)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginationInfo(
  page: number,
  limit: number,
  total: number,
  lastEvaluatedKey?: Record<string, any>
): PaginationInfo {
  const totalPages = Math.ceil(total / limit) || 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: !!lastEvaluatedKey,
    hasPrevPage: page > 1,
    ...(lastEvaluatedKey && { lastEvaluatedKey }),
  };
}

// Helper to convert DynamoDB LastEvaluatedKey to a safe format for frontend
export function encodeLastEvaluatedKey(
  lastEvaluatedKey?: Record<string, any>
): string | undefined {
  if (!lastEvaluatedKey) return undefined;
  
  try {
    return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
  } catch (error) {
    console.error('Error encoding LastEvaluatedKey:', error);
    return undefined;
  }
}

// Helper to decode LastEvaluatedKey from frontend
export function decodeLastEvaluatedKey(
  encodedKey?: string
): Record<string, any> | undefined {
  if (!encodedKey) return undefined;
  
  try {
    return JSON.parse(Buffer.from(encodedKey, 'base64').toString());
  } catch (error) {
    console.error('Error decoding LastEvaluatedKey:', error);
    return undefined;
  }
}

// Helper to create pagination from DynamoDB result
export function createDynamoPagination(
  page: number,
  limit: number,
  result: {
    Count?: number;
    ScannedCount?: number;
    LastEvaluatedKey?: Record<string, any>;
  }
): PaginationInfo {
  const count = result.Count || 0;
  const totalPages = Math.ceil(count / limit) || 1;
  
  return {
    page,
    limit,
    total: count,
    totalPages,
    hasNextPage: !!result.LastEvaluatedKey,
    hasPrevPage: page > 1,
    ...(result.LastEvaluatedKey && {
      lastEvaluatedKey: encodeLastEvaluatedKey(result.LastEvaluatedKey),
    }),
  };
}