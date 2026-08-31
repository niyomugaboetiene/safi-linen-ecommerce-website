import { NextRequest } from 'next/server';
import { cartRepository } from '@/lib/dynamodb/repositories/cartRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { requireAuth } from '@/lib/auth-utils';
import { updateCartItemSchema } from '@/validators/cart';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function PUT(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const sessionUser = await requireAuth();
    const { itemId } = params;

    const body = await req.json();
    
    // Validate input
    const validatedData = updateCartItemSchema.safeParse({
      itemId,
      ...body,
    });
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { quantity } = validatedData.data;

    // Parse itemId to get productId and variantId
    // itemId format: "PRODUCT#<productId>#VARIANT#<variantId>"
    const itemParts = itemId.split('#');
    
    if (itemParts.length !== 4) {
      return errorResponse('Invalid item ID format', 400);
    }

    const productId = itemParts[1];
    const variantId = itemParts[3];

    // Check if item exists in cart
    const existingItem = await cartRepository.getCartItem(
      sessionUser.id,
      productId,
      variantId
    );

    if (!existingItem) {
      return errorResponse('Item not found in cart', 404);
    }

    // Check stock availability
    const product = await productRepository.getProductById(productId);

    if (!product || !product.active) {
      return errorResponse('Product not found or inactive', 404);
    }

    const variant = product.variants.find(v => v.variantId === variantId && v.active);

    if (!variant) {
      return errorResponse('Variant not found or inactive', 404);
    }

    if (quantity > variant.stock) {
      return errorResponse(
        `Insufficient stock. Available: ${variant.stock}`,
        400
      );
    }

    if (quantity > 100) {
      return errorResponse('Maximum quantity per item is 100', 400);
    }

    await cartRepository.updateCartItemQuantity(
      sessionUser.id,
      productId,
      variantId,
      quantity
    );

    const updatedCart = await cartRepository.getCart(sessionUser.id);

    return successResponse(updatedCart, 'Cart item updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const sessionUser = await requireAuth();
    const { itemId } = params;

    // Parse itemId to get productId and variantId
    // itemId format: "PRODUCT#<productId>#VARIANT#<variantId>"
    const itemParts = itemId.split('#');
    
    if (itemParts.length !== 4) {
      return errorResponse('Invalid item ID format', 400);
    }

    const productId = itemParts[1];
    const variantId = itemParts[3];

    // Check if item exists in cart
    const existingItem = await cartRepository.getCartItem(
      sessionUser.id,
      productId,
      variantId
    );

    if (!existingItem) {
      return errorResponse('Item not found in cart', 404);
    }

    await cartRepository.removeFromCart(
      sessionUser.id,
      productId,
      variantId
    );

    const updatedCart = await cartRepository.getCart(sessionUser.id);

    return successResponse(updatedCart, 'Item removed from cart successfully');
  } catch (error) {
    return handleApiError(error);
  }
}