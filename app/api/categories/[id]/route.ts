import { NextRequest } from 'next/server';
import { categoryRepository } from '@/lib/dynamodb/repositories/categoryRepository';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { updateCategorySchema } from '@/validators/product';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const category = await categoryRepository.getCategoryById(id);

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    const response = {
      id: category.categoryId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return successResponse(response, 'Category fetched successfully');
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

    const category = await categoryRepository.getCategoryById(id);

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    // Check for duplicate name
    if (validatedData.data.name) {
      const nameExists = await categoryRepository.checkNameExists(
        validatedData.data.name,
        id
      );
      
      if (nameExists) {
        return errorResponse('Category name already exists', 409);
      }
    }

    const updates: any = {};
    
    if (validatedData.data.name) updates.name = validatedData.data.name;
    if (validatedData.data.description !== undefined) updates.description = validatedData.data.description || undefined;
    if (validatedData.data.active !== undefined) updates.active = validatedData.data.active;

    const updatedCategory = await categoryRepository.updateCategory(id, updates);

    if (!updatedCategory) {
      return errorResponse('Failed to update category', 500);
    }

    const response = {
      id: updatedCategory.categoryId,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      description: updatedCategory.description,
      active: updatedCategory.active,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
    };

    return successResponse(response, 'Category updated successfully');
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

    const category = await categoryRepository.getCategoryById(id);

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    // Check if category has products
    const products = await productRepository.listProducts({
      category: id,
      limit: 1,
    });

    if (products.pagination.total > 0) {
      return errorResponse(
        `Cannot delete category with ${products.pagination.total} products. Please reassign products first.`,
        400
      );
    }

    await categoryRepository.deleteCategory(id);

    return successResponse(null, 'Category deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}