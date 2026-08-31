import { NextRequest } from 'next/server';
import { orderRepository } from '@/lib/dynamodb/repositories/orderRepository';
import { requireAuth } from '@/lib/auth-utils';
import { orderQuerySchema } from '@/validators/order';
import { paginatedResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const { searchParams } = new URL(req.url);
    
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      status: searchParams.get('status') || undefined,
      sort: searchParams.get('sort') || 'newest',
    };

    const validatedQuery = orderQuerySchema.safeParse(queryParams);
    
    if (!validatedQuery.success) {
      return errorResponse(
        validatedQuery.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    let result;

    // Customers can only see their own orders
    if (sessionUser.role === 'admin') {
      // Admin can see all orders
      result = await orderRepository.listAllOrders({
        page: validatedQuery.data.page,
        limit: validatedQuery.data.limit,
        status: validatedQuery.data.status,
      });
    } else {
      // Regular user sees only their orders
      result = await orderRepository.getUserOrders(sessionUser.id, {
        page: validatedQuery.data.page,
        limit: validatedQuery.data.limit,
        status: validatedQuery.data.status,
      });
    }

    return paginatedResponse(
      result.data,
      result.pagination,
      'Orders fetched successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}