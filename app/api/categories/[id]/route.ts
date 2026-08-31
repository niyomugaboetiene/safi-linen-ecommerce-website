import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth-utils';
import { updateCategorySchema } from '@/validators/product';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError, NotFoundError } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    const category = await Category.findById(id).select('-__v');

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(category, 'Category fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = updateCategorySchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    await connectDB();

    const category = await Category.findById(id);

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    // Check for duplicate name
    if (validatedData.data.name) {
      const existingCategory = await Category.findOne({
        name: validatedData.data.name.toLowerCase(),
        _id: { $ne: id },
      });
      
      if (existingCategory) {
        return errorResponse('Category name already exists', 409);
      }
    }

    // Update fields
    Object.assign(category, validatedData.data);
    await category.save();

    return successResponse(category, 'Category updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;

    await connectDB();

    const category = await Category.findById(id);

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    
    if (productCount > 0) {
      return errorResponse(
        `Cannot delete category with ${productCount} products. Please reassign products first.`,
        400
      );
    }

    await category.deleteOne();

    return successResponse(null, 'Category deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}