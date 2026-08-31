import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/auth-utils';
import { createReviewSchema } from '@/validators/review';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { parsePaginationParams, createPaginationInfo } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    
    const productId = searchParams.get('productId');

    await connectDB();

    const query: any = {};
    
    if (productId) {
      if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return errorResponse('Invalid product ID', 400);
      }
      query.product = productId;
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email profileImage')
        .populate('product', 'name slug')
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    const pagination = createPaginationInfo(page, limit, total);

    return paginatedResponse(reviews, pagination, 'Reviews fetched successfully');
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

    await connectDB();

    // Check if product exists
    const product = await Product.findById(productId);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check if user has purchased the product
    const hasPurchased = await Order.exists({
      user: sessionUser.id,
      'items.product': productId,
      status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
    });

    if (!hasPurchased && sessionUser.role !== 'admin') {
      return errorResponse('You can only review products you have purchased', 403);
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: sessionUser.id,
      product: productId,
    });

    if (existingReview) {
      return errorResponse('You have already reviewed this product', 409);
    }

    const review = await Review.create({
      user: sessionUser.id,
      product: productId,
      rating,
      comment,
    });

    return successResponse(review, 'Review created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}