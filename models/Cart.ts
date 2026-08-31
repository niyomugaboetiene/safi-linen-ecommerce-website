import mongoose, { Schema, Model } from 'mongoose';
import { ICart, ICartItem } from '@/types/order';

const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    variant: {
      type: Schema.Types.ObjectId,
      required: [true, 'Variant is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [100, 'Quantity cannot exceed 100'],
      default: 1,
    },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: function(items: ICartItem[]) {
          return items.length <= 50; // Maximum 50 items in cart
        },
        message: 'Maximum 50 items allowed in cart',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one cart per user
cartSchema.index({ user: 1 }, { unique: true });

const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);

export default Cart;