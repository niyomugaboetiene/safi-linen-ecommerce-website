import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth-utils';
import { createOrderSchema } from '@/validators/order';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    await connectDB();

    // Get cart
    const cart = await Cart.findOne({ user: sessionUser.id });

    if (!cart || cart.items.length === 0) {
      return errorResponse('Cart is empty', 400);
    }

    // Get settings for delivery fee
    const settings = await Settings.findOne();
    
    if (!settings) {
      return errorResponse('Settings not configured', 500);
    }

    const deliveryFee = deliveryZone === 'kigali' 
      ? settings.delivery.kigaliFee 
      : settings.delivery.outsideKigaliFee;

    // Validate all cart items
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);

      if (!product || !product.active) {
        return errorResponse(`Product ${item.product} not found or inactive`, 400);
      }

      const variant = product.variants.find(
        v => v._id.toString() === item.variant.toString() && v.active
      );

      if (!variant) {
        return errorResponse(`Variant not found or inactive for product ${product.name}`, 400);
      }

      if (variant.stock < item.quantity) {
        return errorResponse(
          `Insufficient stock for ${product.name}. Available: ${variant.stock}`,
          400
        );
      }

      // Calculate item subtotal using current price
      const itemSubtotal = variant.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        variant: variant._id,
        variantDetails: {
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
        },
        price: variant.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      // Reduce stock atomically
      await Product.updateOne(
        { 
          _id: product._id,
          'variants._id': variant._id,
          'variants.stock': { $gte: item.quantity }
        },
        {
          $inc: { 'variants.$.stock': -item.quantity }
        }
      );
    }

    const total = subtotal + deliveryFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = await Order.create({
      user: sessionUser.id,
      orderNumber,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      deliveryZone,
      shippingAddress,
      status: 'pending_payment',
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    await session.commitTransaction();

    return successResponse(order, 'Order created successfully', 201);
  } catch (error) {
    await session.abortTransaction();
    return handleApiError(error);
  } finally {
    session.endSession();
  }
}