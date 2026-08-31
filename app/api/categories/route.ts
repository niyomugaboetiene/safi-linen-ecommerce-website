import { NextRequest } from 'next/server';
import { categoryRepository } from '@/lib/dynamodb/repositories/categoryRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { createCategorySchema } from '@/validators/product';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const categories = await categoryRepository.listCategories(activeOnly);

    // Add product count for each category
    const categoriesWithCount = [];
    
    for (const category of categories) {
      const products = await productRepository.listProducts({
        category: category.id,
        limit: 1,
      });
      
      categoriesWithCount.push({
        ...category,
        productCount: products.pagination.total || 0,
      });
    }

    return successResponse(categoriesWithCount, 'Categories fetched successfully');
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

    const { name, description, active } = validatedData.data;

    // Check if category already exists
    const nameExists = await categoryRepository.checkNameExists(name);
    
    if (nameExists) {
      return errorResponse('Category already exists', 409, 'Duplicate category');
    }

    const category = await categoryRepository.createCategory({
      name,
      description: description || undefined,
      active,
    });

    const response = {
      id: category.categoryId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return successResponse(response, 'Category created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}