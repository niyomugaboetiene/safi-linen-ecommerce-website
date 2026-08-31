import { NextRequest } from 'next/server';
import { wishlistRepository } from '@/lib/dynamodb/repositories/wishlistRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { requireAuth } from '@/lib/auth-utils';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const wishlist = await wishlistRepository.getWishlist(sessionUser.id);

    return successResponse(
      { products: wishlist.products },
      'Wishlist fetched successfully'
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
    const validatedData = addToWishlistSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { productId } = validatedData.data;

    // Check if product exists
    const product = await productRepository.getProductById(productId);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check if already in wishlist
    const isInWishlist = await wishlistRepository.isInWishlist(
      sessionUser.id,
      productId
    );

    if (isInWishlist) {
      return errorResponse('Product already in wishlist', 409);
    }

    await wishlistRepository.addToWishlist(sessionUser.id, productId);

    const wishlist = await wishlistRepository.getWishlist(sessionUser.id);

    return successResponse(
      { products: wishlist.products },
      'Product added to wishlist successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const body = await req.json();
    
    // Validate input
    const validatedData = addToWishlistSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { productId } = validatedData.data;

    // Check if in wishlist
    const isInWishlist = await wishlistRepository.isInWishlist(
      sessionUser.id,
      productId
    );

    if (!isInWishlist) {
      return errorResponse('Product not in wishlist', 404);
    }

    await wishlistRepository.removeFromWishlist(sessionUser.id, productId);

    const wishlist = await wishlistRepository.getWishlist(sessionUser.id);

    return successResponse(
      { products: wishlist.products },
      'Product removed from wishlist successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}