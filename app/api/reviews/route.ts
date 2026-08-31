import { NextRequest } from 'next/server';
import { reviewRepository } from '@/lib/dynamodb/repositories/reviewRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { orderRepository } from '@/lib/dynamodb/repositories/orderRepository';
import { requireAuth } from '@/lib/auth-utils';
import { createReviewSchema } from '@/validators/review';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const productId = searchParams.get('productId') || undefined;

    let result;

    if (productId) {
      // Validate product ID format
      if (!productId.startsWith('PROD_')) {
        return errorResponse('Invalid product ID format', 400);
      }

      // Get reviews for a specific product
      result = await reviewRepository.getProductReviews(productId, {
        page,
        limit,
      });
    } else if (sessionUser.role === 'admin') {
      // Admin can see all reviews
      result = await reviewRepository.listAllReviews({
        page,
        limit,
      });
    } else {
      // Regular user sees their own reviews
      result = await reviewRepository.getUserReviews(sessionUser.id, {
        page,
        limit,
      });
    }

    return paginatedResponse(
      result.data,
      result.pagination,
      'Reviews fetched successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const body = await req.json();
    
    // Validate input
    const validatedData = createReviewSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { productId, rating, comment } = validatedData.data;

    // Check if product exists
    const product = await productRepository.getProductById(productId);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check if user has purchased the product (admin can review without purchase)
    if (sessionUser.role !== 'admin') {
      const userOrders = await orderRepository.getUserOrders(sessionUser.id, {
        limit: 100,
      });

      const hasPurchased = userOrders.data.some(order => 
        order.items.some(item => item.productId === productId) &&
        ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
      );

      if (!hasPurchased) {
        return errorResponse('You can only review products you have purchased', 403);
      }
    }

    // Check if user has already reviewed this product
    const existingReview = await reviewRepository.getReviewByUserAndProduct(
      sessionUser.id,
      productId
    );

    if (existingReview) {
      return errorResponse('You have already reviewed this product', 409);
    }

    const review = await reviewRepository.createReview({
      userId: sessionUser.id,
      productId,
      rating,
      comment,
    });

    const response = {
      id: review.reviewId,
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    return successResponse(response, 'Review created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}