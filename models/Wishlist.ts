import mongoose, { Schema, Model } from 'mongoose';
import { IWishlist } from '@/types/review';

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    products: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
      validate: {
        validator: function(products: mongoose.Types.ObjectId[]) {
          return products.length <= 100; // Maximum 100 items in wishlist
        },
        message: 'Maximum 100 items allowed in wishlist',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one wishlist per user
wishlistSchema.index({ user: 1 }, { unique: true });

const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', wishlistSchema);

export default Wishlist;