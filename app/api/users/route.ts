import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/dynamodb/repositories/userRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { paginatedResponse, errorResponse } from '@/lib/api-response';
import { parsePaginationParams, createPaginationInfo } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const { page, limit } = parsePaginationParams(searchParams);
    
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;

    // Build query params
    const queryParams: any = {
      page,
      limit,
    };

    if (search) queryParams.search = search;
    if (role && ['customer', 'admin'].includes(role)) queryParams.role = role;
    if (status && ['active', 'suspended', 'deleted'].includes(status)) queryParams.status = status;

    const result = await userRepository.listUsers(queryParams);

    return paginatedResponse(
      result.data,
      result.pagination,
      'Users fetched successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}