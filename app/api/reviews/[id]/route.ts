import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Review from '@/models/Review';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { updateReviewSchema } from '@/validators/review';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = params;

    const body = await req.json();
    
    // Validate input
    const validatedData = updateReviewSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    await connectDB();

    const review = await Review.findById(id);

    if (!review) {
      return errorResponse('Review not found', 404);
    }

    // Only review owner or admin can update
    if (review.user.toString() !== sessionUser.id && sessionUser.role !== 'admin') {
      return errorResponse('You can only update your own reviews', 403);
    }

    // Update fields
    Object.assign(review, validatedData.data);
    await review.save();

    return successResponse(review, 'Review updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = params;

    await connectDB();

    const review = await Review.findById(id);

    if (!review) {
      return errorResponse('Review not found', 404);
    }

    // Only review owner or admin can delete
    if (review.user.toString() !== sessionUser.id && sessionUser.role !== 'admin') {
      return errorResponse('You can only delete your own reviews', 403);
    }

    await review.deleteOne();

    return successResponse(null, 'Review deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}