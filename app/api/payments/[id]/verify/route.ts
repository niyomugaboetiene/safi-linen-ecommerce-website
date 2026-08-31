import { NextRequest } from 'next/server';
import { paymentRepository } from '@/lib/dynamodb/repositories/paymentRepository';
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

    const payment = await paymentRepository.getPaymentById(id);

    if (!payment) {
      return errorResponse('Payment not found', 404);
    }

    if (payment.status !== 'pending') {
      return errorResponse('Payment has already been processed', 400);
    }

    const updatedPayment = await paymentRepository.verifyPayment(
      id,
      status,
      sessionUser.id,
      rejectionReason
    );

    if (!updatedPayment) {
      return errorResponse('Failed to process payment', 500);
    }

    const response = {
      id: updatedPayment.paymentId,
      orderId: updatedPayment.orderId,
      userId: updatedPayment.userId,
      method: updatedPayment.method,
      transactionId: updatedPayment.transactionId,
      phoneNumber: updatedPayment.phoneNumber,
      amount: updatedPayment.amount,
      status: updatedPayment.status,
      verifiedBy: updatedPayment.verifiedBy,
      verifiedAt: updatedPayment.verifiedAt,
      rejectionReason: updatedPayment.rejectionReason,
      updatedAt: updatedPayment.updatedAt,
    };

    const message = status === 'verified' 
      ? 'Payment verified successfully' 
      : 'Payment rejected successfully';

    return successResponse(response, message);
  } catch (error) {
    return handleApiError(error);
  }
}