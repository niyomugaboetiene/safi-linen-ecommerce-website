import { NextRequest } from 'next/server';
import { productRepository } from '@/lib/dynamodb/repositories/productRepository';
import { categoryRepository } from '@/lib/dynamodb/repositories/categoryRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { updateProductSchema } from '@/validators/product';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await productRepository.getProductById(id);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Format response to match frontend expectations
    const response = {
      id: product.productId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: {
        id: product.categoryId,
        name: product.categoryName || '',
      },
      brand: product.brand,
      featured: product.featured,
      active: product.active,
      variants: product.variants.map(variant => ({
        id: variant.variantId,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
        images: variant.images,
        attributes: variant.attributes,
        active: variant.active,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return successResponse(response, 'Product fetched successfully');
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

    const product = await productRepository.getProductById(id);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Update product details
    const updates: any = {};
    
    if (validatedData.data.name) updates.name = validatedData.data.name;
    if (validatedData.data.description) updates.description = validatedData.data.description;
    if (validatedData.data.brand !== undefined) updates.brand = validatedData.data.brand || undefined;
    if (validatedData.data.featured !== undefined) updates.featured = validatedData.data.featured;
    if (validatedData.data.active !== undefined) updates.active = validatedData.data.active;

    // Handle category change
    if (validatedData.data.category) {
      const categoryExists = await categoryRepository.getCategoryById(validatedData.data.category);
      
      if (!categoryExists) {
        return errorResponse('Category not found', 404);
      }
      
      updates.categoryId = validatedData.data.category;
      updates.categoryName = categoryExists.name;
    }

    // Update product if there are changes
    if (Object.keys(updates).length > 0) {
      await productRepository.updateProduct(id, updates);
    }

    // Handle variants update if provided
    if (validatedData.data.variants) {
      // Check for duplicate SKUs (excluding current product)
      for (const variant of validatedData.data.variants) {
        const skuExists = await productRepository.checkSkuExists(variant.sku, id);
        if (skuExists) {
          return errorResponse(
            `SKU already exists: ${variant.sku}`,
            409,
            'Duplicate SKU'
          );
        }
      }

      // Update variants
      // Note: This is a simplified approach - in production, you'd want to handle
      // individual variant creation, updates, and deletions
      for (const variant of validatedData.data.variants) {
        const existingVariant = product.variants.find(v => v.sku === variant.sku);
        
        if (existingVariant) {
          // Update existing variant
          await productRepository.updateVariant(id, existingVariant.variantId, {
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
            price: variant.price,
            stock: variant.stock,
            images: variant.images,
            attributes: variant.attributes,
            active: variant.active,
          });
        } else {
          // Note: Creating new variants would need a separate method
          // This is handled by the createProduct method
          console.log('New variant creation not implemented in this update');
        }
      }
    }

    const updatedProduct = await productRepository.getProductById(id);

    return successResponse(updatedProduct, 'Product updated successfully');
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

    const product = await productRepository.getProductById(id);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    await productRepository.deleteProduct(id);

    return successResponse(null, 'Product deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}