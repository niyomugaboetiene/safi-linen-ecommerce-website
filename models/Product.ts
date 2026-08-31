import mongoose, { Schema, Model } from 'mongoose';
import slugify from 'slugify';
import { IProduct, IProductVariant, IProductImage } from '@/types/product';

const productImageSchema = new Schema<IProductImage>(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
    format: String,
  },
  { _id: false }
);

const productVariantSchema = new Schema<IProductVariant>(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator: function(images: IProductImage[]) {
          return images.length <= 10; // Maximum 10 images per variant
        },
        message: 'Maximum 10 images allowed per variant',
      },
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand cannot exceed 100 characters'],
    },
    variants: {
      type: [productVariantSchema],
      validate: {
        validator: function(variants: IProductVariant[]) {
          return variants.length > 0; // At least one variant required
        },
        message: 'Product must have at least one variant',
      },
    },
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
productSchema.pre('save', function (next) {
  if (!this.isModified('name')) {
    return next();
  }

  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  next();
});

// Indexes for efficient querying
productSchema.index({ slug: 1, active: 1 });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;