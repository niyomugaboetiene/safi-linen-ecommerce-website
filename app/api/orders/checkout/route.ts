import { NextRequest } from 'next/server';
import { cartRepository } from '@/lib/dynamodb/repositories/cartRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { orderRepository } from '@/lib/dynamodb/repositories/orderRepository';
import { settingsRepository } from '@/lib/dynamodb/repositories/settingsRepository';
import { requireAuth } from '@/lib/auth-utils';
import { createOrderSchema } from '@/validators/order';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const body = await req.json();
    
    // Validate input
    const validatedData = createOrderSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { deliveryZone, shippingAddress } = validatedData.data;

    // Get user's cart
    const cart = await cartRepository.getCart(sessionUser.id);

    if (!cart.items || cart.items.length === 0) {
      return errorResponse('Cart is empty', 400);
    }

    // Get delivery fee from settings
    const deliveryFee = await settingsRepository.getDeliveryFee(deliveryZone);

    // Prepare order items and validate stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await productRepository.getProductById(item.productId);

      if (!product || !product.active) {
        return errorResponse(`Product ${item.productId} not found or inactive`, 400);
      }

      const variant = product.variants.find(v => v.variantId === item.variantId && v.active);

      if (!variant) {
        return errorResponse(`Variant not found or inactive for product ${product.name}`, 400);
      }

      if (variant.stock < item.quantity) {
        return errorResponse(
          `Insufficient stock for ${product.name}. Available: ${variant.stock}`,
          400
        );
      }

      const itemSubtotal = variant.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.productId,
        variantId: variant.variantId,
        quantity: item.quantity,
      });
    }

    // Create order (this will also reduce stock atomically)
    const order = await orderRepository.createOrder({
      userId: sessionUser.id,
      items: orderItems,
      deliveryZone,
      shippingAddress,
      deliveryFee,
    });

    // Clear cart after successful order
    await cartRepository.clearCart(sessionUser.id);

    return successResponse(order, 'Order created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}