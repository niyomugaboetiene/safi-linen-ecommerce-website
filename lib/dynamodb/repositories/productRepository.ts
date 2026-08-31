import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, generateId, getTimestamp, GSIs } from '@/lib/dynamodb';
import { 
  ProductEntity, 
  ProductVariantEntity, 
  ProductListItem, 
  ProductImage,
  ProductQueryParams,
  PaginationResult,
} from '@/types/dynamodb';
import slugify from 'slugify';

export class ProductRepository {
  /**
   * Create a new product with variants
   */
  async createProduct(data: {
    name: string;
    description: string;
    categoryId: string;
    categoryName?: string;
    brand?: string;
    featured?: boolean;
    active?: boolean;
    variants: Array<{
      sku: string;
      color?: string;
      size?: string;
      price: number;
      stock: number;
      images?: ProductImage[];
      attributes?: Record<string, string>;
      active?: boolean;
    }>;
  }): Promise<ProductEntity> {
    const productId = generateId('PROD');
    const timestamp = getTimestamp();
    const slug = slugify(data.name, { lower: true, strict: true });

    const variants: ProductVariantEntity[] = data.variants.map((variant) => ({
      PK: `PRODUCT#${productId}`,
      SK: `VARIANT#${generateId('VAR')}`,
      type: 'VARIANT',
      productId,
      variantId: generateId('VAR'),
      sku: variant.sku.toUpperCase(),
      color: variant.color,
      size: variant.size,
      price: variant.price,
      stock: variant.stock,
      images: variant.images || [],
      attributes: variant.attributes,
      active: variant.active !== false,
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: 'VARIANT',
      GSI1SK: variant.sku.toUpperCase(),
    }));

    const product: ProductEntity = {
      PK: `PRODUCT#${productId}`,
      SK: 'PRODUCT',
      type: 'PRODUCT',
      productId,
      name: data.name,
      slug,
      description: data.description,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      brand: data.brand,
      featured: data.featured || false,
      active: data.active !== false,
      variants,
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing all products
      GSI1PK: 'PRODUCT',
      GSI1SK: timestamp,
      // GSI2: Category index for products by category
      GSI2PK: data.categoryId,
      GSI2SK: timestamp,
    };

    // Use transaction to write product and all variants atomically
    const transactItems = [
      {
        Put: {
          TableName: DYNAMODB_TABLE_NAME,
          Item: product,
        },
      },
      ...variants.map((variant) => ({
        Put: {
          TableName: DYNAMODB_TABLE_NAME,
          Item: variant,
        },
      })),
    ];

    await dynamoDB.send(new TransactWriteCommand({
      TransactItems: transactItems,
    }));

    return product;
  }

  /**
   * Get product by ID with all variants
   */
  async getProductById(productId: string): Promise<ProductEntity | null> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`,
      },
    }));

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    let product: ProductEntity | null = null;
    const variants: ProductVariantEntity[] = [];

    for (const item of result.Items) {
      if (item.SK === 'PRODUCT') {
        product = item as ProductEntity;
      } else if (item.SK.startsWith('VARIANT#')) {
        variants.push(item as ProductVariantEntity);
      }
    }

    if (!product) {
      return null;
    }

    product.variants = variants;
    return product;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<ProductEntity | null> {
    // Scan for product by slug (could be optimized with GSI)
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: '#slug = :slug AND #type = :type',
      ExpressionAttributeNames: {
        '#slug': 'slug',
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':pk': 'PRODUCT',
        ':slug': slug,
        ':type': 'PRODUCT',
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      const product = result.Items[0] as ProductEntity;
      return this.getProductById(product.productId);
    }

    return null;
  }

  /**
   * List products with pagination and filters
   */
  async listProducts(params: ProductQueryParams = {}): Promise<PaginationResult<ProductListItem>> {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search, 
      featured, 
      active, 
      sort = 'newest',
      ExclusiveStartKey,
    } = params;

    let result;

    // If category filter is provided, use GSI2
    if (category) {
      const filterParts: string[] = ['#type = :type'];
      const expressionValues: Record<string, any> = {
        ':type': 'PRODUCT',
      };
      const expressionNames: Record<string, string> = {
        '#type': 'type',
      };

      if (featured !== undefined) {
        filterParts.push('#featured = :featured');
        expressionValues[':featured'] = featured === 'true';
        expressionNames['#featured'] = 'featured';
      }

      if (active !== undefined) {
        filterParts.push('#active = :active');
        expressionValues[':active'] = active === 'true';
        expressionNames['#active'] = 'active';
      }

      result = await dynamoDB.send(new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        IndexName: GSIs.CategoryIndex,
        KeyConditionExpression: 'GSI2PK = :categoryId',
        FilterExpression: filterParts.length > 0 ? filterParts.join(' AND ') : undefined,
        ExpressionAttributeValues: {
          ':categoryId': category,
          ...expressionValues,
        },
        ExpressionAttributeNames: filterParts.length > 0 ? expressionNames : undefined,
        Limit: limit,
        ExclusiveStartKey,
        ScanIndexForward: sort === 'oldest',
      }));
    } else {
      // Otherwise use GSI1 to list all products
      const filterParts: string[] = ['#type = :type'];
      const expressionValues: Record<string, any> = {
        ':type': 'PRODUCT',
      };
      const expressionNames: Record<string, string> = {
        '#type': 'type',
      };

      if (featured !== undefined) {
        filterParts.push('#featured = :featured');
        expressionValues[':featured'] = featured === 'true';
        expressionNames['#featured'] = 'featured';
      }

      if (active !== undefined) {
        filterParts.push('#active = :active');
        expressionValues[':active'] = active === 'true';
        expressionNames['#active'] = 'active';
      }

      if (search) {
        filterParts.push('(contains(#name, :search) OR contains(#description, :search) OR contains(#brand, :search))');
        expressionValues[':search'] = search.toLowerCase();
        expressionNames['#name'] = 'name';
        expressionNames['#description'] = 'description';
        expressionNames['#brand'] = 'brand';
      }

      result = await dynamoDB.send(new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        IndexName: GSIs.InvertedIndex,
        KeyConditionExpression: 'GSI1PK = :pk',
        FilterExpression: filterParts.length > 0 ? filterParts.join(' AND ') : undefined,
        ExpressionAttributeValues: {
          ':pk': 'PRODUCT',
          ...expressionValues,
        },
        ExpressionAttributeNames: filterParts.length > 0 ? expressionNames : undefined,
        Limit: limit,
        ExclusiveStartKey,
        ScanIndexForward: sort === 'oldest',
      }));
    }

    const products = (result.Items as ProductEntity[]) || [];
    
    // Fetch variants for each product
    const productsWithVariants: ProductListItem[] = [];
    
    for (const product of products) {
      const fullProduct = await this.getProductById(product.productId);
      if (fullProduct) {
        productsWithVariants.push(this.toListItem(fullProduct));
      }
    }

    // Sort products if needed
    if (sort === 'price_asc') {
      productsWithVariants.sort((a, b) => {
        const aPrice = a.variants[0]?.price || 0;
        const bPrice = b.variants[0]?.price || 0;
        return aPrice - bPrice;
      });
    } else if (sort === 'price_desc') {
      productsWithVariants.sort((a, b) => {
        const aPrice = a.variants[0]?.price || 0;
        const bPrice = b.variants[0]?.price || 0;
        return bPrice - aPrice;
      });
    } else if (sort === 'name_asc') {
      productsWithVariants.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      productsWithVariants.sort((a, b) => b.name.localeCompare(a.name));
    }

    const total = productsWithVariants.length;

    return {
      data: productsWithVariants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: !!result.LastEvaluatedKey,
        hasPrevPage: page > 1,
        lastEvaluatedKey: result.LastEvaluatedKey,
      },
    };
  }

  /**
   * Update product details
   */
  async updateProduct(
    productId: string,
    updates: Partial<{
      name: string;
      description: string;
      categoryId: string;
      categoryName: string;
      brand: string;
      featured: boolean;
      active: boolean;
    }>
  ): Promise<ProductEntity | null> {
    const timestamp = getTimestamp();
    
    const updateParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateParts.push(`#${key} = :${key}`);
        expressionValues[`:${key}`] = value;
        expressionNames[`#${key}`] = key;
      }
    });

    if (updateParts.length === 0) {
      return this.getProductById(productId);
    }

    // If name is updated, also update slug
    if (updates.name) {
      updateParts.push('#slug = :slug');
      expressionValues[':slug'] = slugify(updates.name, { lower: true, strict: true });
      expressionNames['#slug'] = 'slug';
    }

    updateParts.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = timestamp;
    expressionNames['#updatedAt'] = 'updatedAt';

    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `PRODUCT#${productId}`,
        SK: 'PRODUCT',
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
    }));

    return this.getProductById(productId);
  }

  /**
   * Update product variant
   */
  async updateVariant(
    productId: string,
    variantId: string,
    updates: Partial<{
      sku: string;
      color: string;
      size: string;
      price: number;
      stock: number;
      images: ProductImage[];
      attributes: Record<string, string>;
      active: boolean;
    }>
  ): Promise<ProductVariantEntity | null> {
    const timestamp = getTimestamp();
    
    const updateParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateParts.push(`#${key} = :${key}`);
        expressionValues[`:${key}`] = value;
        expressionNames[`#${key}`] = key;
      }
    });

    updateParts.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = timestamp;
    expressionNames['#updatedAt'] = 'updatedAt';

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `PRODUCT#${productId}`,
        SK: `VARIANT#${variantId}`,
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW',
    }));

    return (result.Attributes as ProductVariantEntity) || null;
  }

  /**
   * Update variant stock (with conditional check)
   */
  async updateVariantStock(
    productId: string,
    variantId: string,
    quantityChange: number,
    conditionStock?: number
  ): Promise<boolean> {
    const timestamp = getTimestamp();
    
    try {
      const updateExpression = conditionStock !== undefined
        ? 'SET #stock = #stock + :quantity, #updatedAt = :updatedAt'
        : 'SET #stock = #stock + :quantity, #updatedAt = :updatedAt';
      
      const conditionExpression = conditionStock !== undefined
        ? '#stock >= :minStock'
        : undefined;

      const expressionValues: Record<string, any> = {
        ':quantity': quantityChange,
        ':updatedAt': timestamp,
      };

      if (conditionStock !== undefined) {
        expressionValues[':minStock'] = conditionStock;
      }

      await dynamoDB.send(new UpdateCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          PK: `PRODUCT#${productId}`,
          SK: `VARIANT#${variantId}`,
        },
        UpdateExpression: updateExpression,
        ConditionExpression: conditionExpression,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: {
          '#stock': 'stock',
          '#updatedAt': 'updatedAt',
        },
      }));

      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete product and all variants
   */
  async deleteProduct(productId: string): Promise<void> {
    const product = await this.getProductById(productId);
    
    if (!product) {
      return;
    }

    // Delete product and all variants
    const transactItems = [
      {
        Delete: {
          TableName: DYNAMODB_TABLE_NAME,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: 'PRODUCT',
          },
        },
      },
      ...product.variants.map((variant) => ({
        Delete: {
          TableName: DYNAMODB_TABLE_NAME,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: `VARIANT#${variant.variantId}`,
          },
        },
      })),
    ];

    await dynamoDB.send(new TransactWriteCommand({
      TransactItems: transactItems,
    }));
  }

  /**
   * Delete single variant
   */
  async deleteVariant(productId: string, variantId: string): Promise<void> {
    await dynamoDB.send(new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `PRODUCT#${productId}`,
        SK: `VARIANT#${variantId}`,
      },
    }));
  }

  /**
   * Check if SKU exists
   */
  async checkSkuExists(sku: string, excludeProductId?: string): Promise<boolean> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sku',
      ExpressionAttributeValues: {
        ':pk': 'VARIANT',
        ':sku': sku.toUpperCase(),
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      const variant = result.Items[0] as ProductVariantEntity;
      if (excludeProductId && variant.productId === excludeProductId) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Count total products
   */
  async countProducts(): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'PRODUCT',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10, limit: number = 10): Promise<ProductListItem[]> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'VARIANT',
      },
      Limit: 100,
    }));

    const variants = (result.Items as ProductVariantEntity[]) || [];
    const lowStockVariants = variants.filter(v => v.stock <= threshold);
    
    const products: ProductListItem[] = [];
    const seenProductIds = new Set<string>();

    for (const variant of lowStockVariants) {
      if (!seenProductIds.has(variant.productId) && products.length < limit) {
        const product = await this.getProductById(variant.productId);
        if (product) {
          products.push(this.toListItem(product));
          seenProductIds.add(variant.productId);
        }
      }
    }

    return products;
  }

  /**
   * Convert ProductEntity to ProductListItem
   */
  private toListItem(product: ProductEntity): ProductListItem {
    return {
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
      variants: product.variants,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();