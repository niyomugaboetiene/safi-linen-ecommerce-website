import { NextRequest } from 'next/server';
import { cartRepository } from '@/lib/dynamodb/repositories/cartRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { requireAuth } from '@/lib/auth-utils';
import { addToCartSchema } from '@/validators/cart';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const cart = await cartRepository.getCart(sessionUser.id);

    // Populate cart items with product and variant details
    const populatedItems = [];
    
    for (const item of cart.items) {
      const product = await productRepository.getProductById(item.productId);
      
      if (product && product.active) {
        const variant = product.variants.find(v => v.variantId === item.variantId);
        
        if (variant && variant.active) {
          populatedItems.push({
            id: item.id,
            product: {
              id: product.productId,
              name: product.name,
              slug: product.slug,
              active: product.active,
            },
            variant: {
              id: variant.variantId,
              sku: variant.sku,
              color: variant.color,
              size: variant.size,
              price: variant.price,
              stock: variant.stock,
              images: variant.images,
              active: variant.active,
            },
            quantity: item.quantity,
          });
        }
      }
    }

    return successResponse({ items: populatedItems }, 'Cart fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const body = await req.json();
    
    // Validate input
    const validatedData = addToCartSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { productId, variantId, quantity } = validatedData.data;

    // Check if product exists and is active
    const product = await productRepository.getProductById(productId);

    if (!product || !product.active) {
      return errorResponse('Product not found or inactive', 404);
    }

    // Check if variant exists and is active
    const variant = product.variants.find(v => v.variantId === variantId && v.active);

    if (!variant) {
      return errorResponse('Variant not found or inactive', 404);
    }

    // Check stock availability
    if (variant.stock < quantity) {
      return errorResponse(
        `Insufficient stock. Available: ${variant.stock}`,
        400
      );
    }

    // Check current quantity in cart
    const existingItem = await cartRepository.getCartItem(
      sessionUser.id,
      productId,
      variantId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > 100) {
        return errorResponse('Maximum quantity per item is 100', 400);
      }
      
      if (newQuantity > variant.stock) {
        return errorResponse(
          `Insufficient stock. Available: ${variant.stock}`,
          400
        );
      }
    }

    await cartRepository.addToCart(sessionUser.id, {
      productId,
      variantId,
      quantity,
    });

    const updatedCart = await cartRepository.getCart(sessionUser.id);

    return successResponse(updatedCart, 'Item added to cart successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    await cartRepository.clearCart(sessionUser.id);

    return successResponse(null, 'Cart cleared successfully');
  } catch (error) {
    return handleApiError(error);
  }
}