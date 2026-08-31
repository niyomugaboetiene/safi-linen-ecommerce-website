import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
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

    await connectDB();

    const cart = await Cart.findOne({ user: sessionUser.id });

    if (!cart) {
      return errorResponse('Cart not found', 404);
    }

    const item = cart.items.find(
      item => item._id.toString() === itemId
    );

    if (!item) {
      return errorResponse('Item not found in cart', 404);
    }

    // Check stock availability
    const product = await Product.findById(item.product);

    if (!product || !product.active) {
      return errorResponse('Product not found or inactive', 404);
    }

    const variant = product.variants.find(
      v => v._id.toString() === item.variant.toString() && v.active
    );

    if (!variant) {
      return errorResponse('Variant not found or inactive', 404);
    }

    if (quantity > variant.stock) {
      return errorResponse(
        `Insufficient stock. Available: ${variant.stock}`,
        400
      );
    }

    item.quantity = quantity;
    await cart.save();

    return successResponse(cart, 'Cart item updated successfully');
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

    await connectDB();

    const cart = await Cart.findOne({ user: sessionUser.id });

    if (!cart) {
      return errorResponse('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return errorResponse('Item not found in cart', 404);
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return successResponse(cart, 'Item removed from cart successfully');
  } catch (error) {
    return handleApiError(error);
  }
}