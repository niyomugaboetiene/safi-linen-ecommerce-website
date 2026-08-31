import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth-utils';
import { adminUpdateUserSchema } from '@/validators/user';
import { paginatedResponse, errorResponse, successResponse } from '@/lib/api-response';
import { parsePaginationParams, createPaginationInfo } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    await connectDB();

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (role && ['customer', 'admin'].includes(role)) {
      query.role = role;
    }
    
    if (status && ['active', 'suspended', 'deleted'].includes(status)) {
      query.accountStatus = status;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -googleId -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const pagination = createPaginationInfo(page, limit, total);

    return paginatedResponse(users, pagination, 'Users fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}