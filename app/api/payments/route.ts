import { NextRequest } from 'next/server';
import { paymentRepository } from '@/lib/dynamodb/repositories/paymentRepository';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { paginatedResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    let result;

    // Customers can only see their own payments
    if (sessionUser.role === 'admin') {
      // Admin can see all payments with filters
      result = await paymentRepository.listAllPayments({
        page,
        limit,
        status: status as any,
        search,
      });
    } else {
      // Regular user sees only their payments
      result = await paymentRepository.getUserPayments(sessionUser.id, {
        page,
        limit,
        status: status as any,
      });
    }

    return paginatedResponse(
      result.data,
      result.pagination,
      'Payments fetched successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}