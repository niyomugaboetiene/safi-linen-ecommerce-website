import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import Review from '@/models/Review';
import { requireAdmin } from '@/lib/auth-utils';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    await connectDB();

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingPayments,
      totalReviews,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      User.countDocuments({ accountStatus: 'active' }),
      Product.countDocuments({ active: true }),
      Order.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ status: 'pending' }),
      Review.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber total status createdAt')
        .populate('user', 'name email'),
      Product.find({
        'variants.stock': { $lte: 10 },
        active: true,
      })
        .select('name variants.name variants.stock')
        .limit(10),
    ]);

    const stats = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingPayments,
      totalReviews,
      recentOrders,
      lowStockProducts,
    };

    return successResponse(stats, 'Admin stats fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}