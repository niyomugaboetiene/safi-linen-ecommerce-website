import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Product from '@/models/Product';
import { requireAdmin, requireAuth } from '@/lib/auth-utils';
import { createProductSchema, productQuerySchema } from '@/validators/product';
import { paginatedResponse, errorResponse, successResponse } from '@/lib/api-response';
import { parsePaginationParams, createPaginationInfo } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    
    // Parse query parameters
    const queryParams = {
      page,
      limit,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') || undefined,
      active: searchParams.get('active') || undefined,
      sort: searchParams.get('sort') || 'newest',
    };

    const validatedQuery = productQuerySchema.safeParse(queryParams);
    
    if (!validatedQuery.success) {
      return errorResponse(
        validatedQuery.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    await connectDB();

    // Build query
    const query: any = {};
    
    if (validatedQuery.data.category) {
      query.category = validatedQuery.data.category;
    }
    
    if (validatedQuery.data.search) {
      query.$or = [
        { name: { $regex: validatedQuery.data.search, $options: 'i' } },
        { description: { $regex: validatedQuery.data.search, $options: 'i' } },
        { brand: { $regex: validatedQuery.data.search, $options: 'i' } },
      ];
    }
    
    if (validatedQuery.data.featured) {
      query.featured = validatedQuery.data.featured === 'true';
    }
    
    if (validatedQuery.data.active) {
      query.active = validatedQuery.data.active === 'true';
    }

    // Build sort
    let sortOption: any = { createdAt: -1 };
    switch (validatedQuery.data.sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'price_asc':
        sortOption = { 'variants.price': 1 };
        break;
      case 'price_desc':
        sortOption = { 'variants.price': -1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .select('-__v')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    const pagination = createPaginationInfo(page, limit, total);

    return paginatedResponse(products, pagination, 'Products fetched successfully');
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

    await connectDB();

    // Check for duplicate SKUs
    const skus = validatedData.data.variants.map(v => v.sku);
    const existingProducts = await Product.find({
      'variants.sku': { $in: skus },
    });

    if (existingProducts.length > 0) {
      const existingSkus = existingProducts.flatMap(p => 
        p.variants.map(v => v.sku)
      );
      return errorResponse(
        `SKUs already exist: ${existingSkus.join(', ')}`,
        409,
        'Duplicate SKU'
      );
    }

    const product = await Product.create(validatedData.data);

    return successResponse(product, 'Product created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}