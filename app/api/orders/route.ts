import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { orderQuerySchema } from '@/validators/order';
import { paginatedResponse, errorResponse } from '@/lib/api-response';
import { parsePaginationParams, createPaginationInfo } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    
    const queryParams = {
      page,
      limit,
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

    await connectDB();

    // Build query
    const query: any = {};
    
    // Customers can only see their own orders
    if (sessionUser.role !== 'admin') {
      query.user = sessionUser.id;
    }
    
    if (validatedQuery.data.status) {
      query.status = validatedQuery.data.status;
    }

    // Build sort
    const sortOption = validatedQuery.data.sort === 'oldest' 
      ? { createdAt: 1 } 
      : { createdAt: -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('-__v')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    const pagination = createPaginationInfo(page, limit, total);

    return paginatedResponse(orders, pagination, 'Orders fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}