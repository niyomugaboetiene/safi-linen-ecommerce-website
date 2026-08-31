import mongoose, { Schema, Model } from 'mongoose';
import slugify from 'slugify';
import { ICategory } from '@/types/product';

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
      unique: true,
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
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
categorySchema.pre('save', function (next) {
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

// Index for querying
categorySchema.index({ active: 1, createdAt: -1 });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);

export default Category;