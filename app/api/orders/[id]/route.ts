import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Order from '@/models/Order';
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

    await connectDB();

    const query: any = { _id: id };
    
    // Customers can only view their own orders
    if (sessionUser.role !== 'admin') {
      query.user = sessionUser.id;
    }

    const order = await Order.findOne(query)
      .populate('payment', 'method transactionId phoneNumber status')
      .select('-__v');

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    return successResponse(order, 'Order fetched successfully');
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

    await connectDB();

    const order = await Order.findById(id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    order.status = validatedData.data.status;
    await order.save();

    return successResponse(order, 'Order status updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}