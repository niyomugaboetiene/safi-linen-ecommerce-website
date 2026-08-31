import { NextRequest } from 'next/server';
import connectDB from '@/lib/dynamodb';
import Product from '@/models/Product';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { updateProductSchema } from '@/validators/product';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .select('-__v');

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse(product, 'Product fetched successfully');
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
    const validatedData = updateProductSchema.safeParse(body);
    
    if (!validatedData.success) {
      return errorResponse(
        validatedData.error.errors[0].message,
        400,
        'Validation error'
      );
    }

    await connectDB();

    const product = await Product.findById(id);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check for duplicate SKUs (excluding current product)
    if (validatedData.data.variants) {
      const skus = validatedData.data.variants.map(v => v.sku);
      const existingProducts = await Product.find({
        _id: { $ne: id },
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
    }

    // Update fields
    Object.assign(product, validatedData.data);
    await product.save();

    return successResponse(product, 'Product updated successfully');
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

    const product = await Product.findById(id);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    await product.deleteOne();

    return successResponse(null, 'Product deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}