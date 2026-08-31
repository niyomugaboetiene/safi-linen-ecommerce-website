import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/auth-utils';
import { addToCartSchema, updateCartItemSchema, removeFromCartSchema } from '@/validators/cart';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    await connectDB();

    const cart = await Cart.findOne({ user: sessionUser.id })
      .populate({
        path: 'items.product',
        select: 'name slug active variants',
      });

    if (!cart) {
      return successResponse({ items: [] }, 'Cart is empty');
    }

    // Filter out items with inactive or deleted products
    const validItems = cart.items.filter(item => {
      const product = item.product as any;
      return product && product.active;
    });

    return successResponse({ items: validItems }, 'Cart fetched successfully');
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

    await connectDB();

    // Check if product exists and is active
    const product = await Product.findOne({
      _id: productId,
      active: true,
    });

    if (!product) {
      return errorResponse('Product not found or inactive', 404);
    }

    // Check if variant exists and is active
    const variant = product.variants.find(
      v => v._id.toString() === variantId && v.active
    );

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

    // Find or create cart
    let cart = await Cart.findOne({ user: sessionUser.id });

    if (!cart) {
      cart = new Cart({ user: sessionUser.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => 
        item.product.toString() === productId &&
        item.variant.toString() === variantId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > 100) {
        return errorResponse('Maximum quantity per item is 100', 400);
      }
      
      if (newQuantity > variant.stock) {
        return errorResponse(
          `Insufficient stock. Available: ${variant.stock}`,
          400
        );
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity,
      });
    }

    await cart.save();

    return successResponse(cart, 'Item added to cart successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    await connectDB();

    const cart = await Cart.findOne({ user: sessionUser.id });

    if (!cart) {
      return successResponse(null, 'Cart is already empty');
    }

    cart.items = [];
    await cart.save();

    return successResponse(null, 'Cart cleared successfully');
  } catch (error) {
    return handleApiError(error);
  }
}