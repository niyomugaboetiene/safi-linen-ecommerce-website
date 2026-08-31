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
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}