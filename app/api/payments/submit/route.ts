import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
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

    await connectDB();

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: sessionUser.id,
    });

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ order: orderId });

    if (existingPayment) {
      return errorResponse('Payment already submitted for this order', 409);
    }

    // Check if transaction ID is already used
    const existingTransaction = await Payment.findOne({ transactionId });

    if (existingTransaction) {
      return errorResponse('Transaction ID already used', 409);
    }

    // Create payment
    const payment = await Payment.create({
      order: orderId,
      user: sessionUser.id,
      method,
      transactionId,
      phoneNumber,
      amount: order.total,
      status: 'pending',
    });

    // Update order status
    order.payment = payment._id;
    order.status = 'payment_verification';
    await order.save();

    return successResponse(payment, 'Payment submitted successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}