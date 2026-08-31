import { NextRequest } from 'next/server';
import { orderRepository } from '@/lib/dynamodb/repositories/orderRepository';
import { paymentRepository } from '@/lib/dynamodb/repositories/paymentRepository';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { updateOrderStatusSchema } from '@/validators/order';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = params;

    let order;

    // Customers can only view their own orders
    if (sessionUser.role === 'admin') {
      order = await orderRepository.getOrderById(id);
    } else {
      order = await orderRepository.getOrderById(id, sessionUser.id);
    }

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Get payment information if available
    let payment = null;
    if (order.paymentId) {
      payment = await paymentRepository.getPaymentById(order.paymentId);
    }

    const response = {
      id: order.orderId,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryZone: order.deliveryZone,
      shippingAddress: order.shippingAddress,
      status: order.status,
      payment: payment ? {
        id: payment.paymentId,
        method: payment.method,
        transactionId: payment.transactionId,
        phoneNumber: payment.phoneNumber,
        status: payment.status,
      } : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return successResponse(response, 'Order fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = updateOrderStatusSchema.safeParse({
      orderId: id,
      ...body,
    });
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const order = await orderRepository.getOrderById(id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    const updatedOrder = await orderRepository.updateOrderStatus(id, validatedData.data.status);

    if (!updatedOrder) {
      return errorResponse('Failed to update order status', 500);
    }

    const response = {
      id: updatedOrder.orderId,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
    };

    return successResponse(response, 'Order status updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}