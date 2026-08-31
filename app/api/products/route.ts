import { NextRequest } from 'next/server';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { categoryRepository } from '@/lib/dynamodb/repositories/categoryRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { createProductSchema, productQuerySchema } from '@/validators/product';
import { paginatedResponse, errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') || undefined,
      active: searchParams.get('active') || undefined,
      sort: (searchParams.get('sort') || 'newest') as any,
    };

    const validatedQuery = productQuerySchema.safeParse(queryParams);
    
    if (!validatedQuery.success) {
      return errorResponse(
        validatedQuery.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const result = await productRepository.listProducts(validatedQuery.data);

    return paginatedResponse(
      result.data,
      result.pagination,
      'Products fetched successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    // Validate input
    const validatedData = createProductSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    const { name, description, category, brand, variants, featured, active } = validatedData.data;

    // Check if category exists
    const categoryExists = await categoryRepository.getCategoryById(category);
    
    if (!categoryExists) {
      return errorResponse('Category not found', 404);
    }

    // Check for duplicate SKUs
    for (const variant of variants) {
      const skuExists = await productRepository.checkSkuExists(variant.sku);
      if (skuExists) {
        return errorResponse(
          `SKU already exists: ${variant.sku}`,
          409,
          'Duplicate SKU'
        );
      }
    }

    const product = await productRepository.createProduct({
      name,
      description,
      categoryId: category,
      categoryName: categoryExists.name,
      brand: brand || undefined,
      featured,
      active,
      variants: variants.map((v: any) => ({
        sku: v.sku,
        color: v.color || undefined,
        size: v.size || undefined,
        price: v.price,
        stock: v.stock,
        images: v.images || [],
        attributes: v.attributes,
        active: v.active,
      })),
    });

    return successResponse(product, 'Product created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}