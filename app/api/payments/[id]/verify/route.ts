import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Payment from '@/models/Payment';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth-utils';
import { verifyPaymentSchema } from '@/validators/order';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await requireAdmin();

    const { id } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = verifyPaymentSchema.safeParse({
      paymentId: id,
      ...body,
    });
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { status, rejectionReason } = validatedData.data;

    await connectDB();

    const payment = await Payment.findById(id);

    if (!payment) {
      return errorResponse('Payment not found', 404);
    }

    if (payment.status !== 'pending') {
      return errorResponse('Payment has already been processed', 400);
    }

    // Update payment status
    payment.status = status;
    payment.verifiedBy = sessionUser.id;
    payment.verifiedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      payment.rejectionReason = rejectionReason;
    }

    await payment.save();

    // Update order status
    const order = await Order.findById(payment.order);

    if (order) {
      if (status === 'verified') {
        order.status = 'paid';
      } else if (status === 'rejected') {
        order.status = 'payment_rejected';
      }
      await order.save();
    }

    return successResponse(payment, `Payment ${status} successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}