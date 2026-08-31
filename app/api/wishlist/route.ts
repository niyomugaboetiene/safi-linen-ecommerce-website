import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Wishlist from '@/models/Wishlist';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/auth-utils';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    await connectDB();

    const wishlist = await Wishlist.findOne({ user: sessionUser.id })
      .populate({
        path: 'products',
        select: 'name slug featured active',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      });

    if (!wishlist) {
      return successResponse({ products: [] }, 'Wishlist is empty');
    }

    // Filter out inactive products
    const validProducts = wishlist.products.filter((product: any) => product.active);

    return successResponse({ products: validProducts }, 'Wishlist fetched successfully');
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

    await connectDB();

    // Check if product exists
    const product = await Product.findById(productId);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: sessionUser.id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: sessionUser.id, products: [] });
    }

    // Check if product already in wishlist
    if (wishlist.products.includes(productId)) {
      return errorResponse('Product already in wishlist', 409);
    }

    // Add product to wishlist
    wishlist.products.push(productId);
    await wishlist.save();

    return successResponse(wishlist, 'Product added to wishlist successfully', 201);
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

    await connectDB();

    const wishlist = await Wishlist.findOne({ user: sessionUser.id });

    if (!wishlist) {
      return errorResponse('Wishlist not found', 404);
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      (id: any) => id.toString() !== productId
    );
    await wishlist.save();

    return successResponse(wishlist, 'Product removed from wishlist successfully');
  } catch (error) {
    return handleApiError(error);
  }
}