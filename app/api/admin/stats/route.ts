import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/dynamodb/repositories/userRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { orderRepository } from '@/lib/dynamodb/repositories/orderRepository';
import { paymentRepository } from '@/lib/dynamodb/repositories/paymentRepository';
import { reviewRepository } from '@/lib/dynamodb/repositories/reviewRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    // Fetch all stats in parallel
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
      userRepository.countUsers(),
      productRepository.countProducts(),
      orderRepository.countOrders(),
      paymentRepository.getTotalRevenue(),
      paymentRepository.countPendingPayments(),
      reviewRepository.countReviews(),
      orderRepository.listAllOrders({ limit: 10 }),
      productRepository.getLowStockProducts(10, 10),
    ]);

    // Format recent orders for frontend
    const formattedRecentOrders = recentOrders.data.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));

    // Format low stock products for frontend
    const formattedLowStockProducts = lowStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      variants: product.variants
        .filter(v => v.stock <= 10)
        .map(v => ({
          id: v.variantId,
          sku: v.sku,
          color: v.color,
          size: v.size,
          stock: v.stock,
        })),
    }));

    const stats = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingPayments,
      totalReviews,
      recentOrders: formattedRecentOrders,
      lowStockProducts: formattedLowStockProducts,
    };

    return successResponse(stats, 'Admin stats fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}