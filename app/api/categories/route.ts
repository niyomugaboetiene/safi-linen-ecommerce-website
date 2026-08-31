import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { createCategorySchema, updateCategorySchema } from '@/validators/product';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    await connectDB();

    const query: any = {};
    if (activeOnly) {
      query.active = true;
    }

    const categories = await Category.find(query)
      .sort({ name: 1 })
      .select('-__v');

    return successResponse(categories, 'Categories fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    // Validate input
    const validatedData = createCategorySchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    await connectDB();

    const { name, description, active } = validatedData.data;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.toLowerCase() });
    
    if (existingCategory) {
      return errorResponse('Category already exists', 409, 'Duplicate category');
    }

    const category = await Category.create({
      name,
      description: description || undefined,
      active,
    });

    return successResponse(category, 'Category created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}