import { NextRequest } from 'next/server';
import { paymentRepository } from '@/lib/dynamodb/repositories/paymentRepository';
import { orderRepository } from '@/lib/dynamodb/repositories/orderRepository';
import { requireAuth } from '@/lib/auth-utils';
import { submitPaymentSchema } from '@/validators/order';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const body = await req.json();
    
    // Validate input
    const validatedData = submitPaymentSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { orderId, method, transactionId, phoneNumber } = validatedData.data;

    // Check if order exists and belongs to user
    const order = await orderRepository.getOrderById(orderId, sessionUser.id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check if payment already exists for this order
    if (order.paymentId) {
      return errorResponse('Payment already submitted for this order', 409);
    }

    // Check if transaction ID is already used
    const existingTransaction = await paymentRepository.getPaymentByTransactionId(transactionId);

    if (existingTransaction) {
      return errorResponse('Transaction ID already used', 409);
    }

    // Submit payment
    const payment = await paymentRepository.submitPayment({
      orderId,
      userId: sessionUser.id,
      method,
      transactionId,
      phoneNumber,
      amount: order.total,
    });

    const response = {
      id: payment.paymentId,
      orderId: payment.orderId,
      userId: payment.userId,
      method: payment.method,
      transactionId: payment.transactionId,
      phoneNumber: payment.phoneNumber,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };

    return successResponse(response, 'Payment submitted successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}