import { 
  PutCommand, 
  QueryCommand, 
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, getTimestamp } from '@/lib/dynamodb';
import { 
  WishlistEntity,
  Wishlist,
} from '@/types/dynamodb';
import { productRepository } from './productRepository';

export class WishlistRepository {
  /**
   * Add product to wishlist
   */
  async addToWishlist(userId: string, productId: string): Promise<WishlistEntity> {
    const timestamp = getTimestamp();

    // Check if already in wishlist
    const existing = await this.isInWishlist(userId, productId);
    if (existing) {
      throw new Error('Product already in wishlist');
    }

    const wishlistItem: WishlistEntity = {
      PK: `USER#${userId}`,
      SK: `WISHLIST#${productId}`,
      type: 'WISHLIST',
      userId,
      productId,
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing wishlist items
      GSI1PK: `WISHLIST#${userId}`,
      GSI1SK: timestamp,
    };

    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: wishlistItem,
    }));

    return wishlistItem;
  }

  /**
   * Get user's wishlist with product details
   */
  async getWishlist(userId: string): Promise<Wishlist> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'WISHLIST#',
      },
    }));

    const wishlistItems = (result.Items as WishlistEntity[]) || [];
    
    // Fetch product details for each wishlist item
    const products: any[] = [];
    for (const item of wishlistItems) {
      const product = await productRepository.getProductById(item.productId);
      if (product && product.active) {
        products.push({
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
        });
      }
    }

    return {
      userId,
      products,
    };
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await dynamoDB.send(new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `WISHLIST#${productId}`,
      },
    }));
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId: string): Promise<void> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'WISHLIST#',
      },
    }));

    const wishlistItems = (result.Items as WishlistEntity[]) || [];

    if (wishlistItems.length === 0) {
      return;
    }

    // Delete all wishlist items in batches of 25
    const deleteRequests = wishlistItems.map(item => ({
      DeleteRequest: {
        Key: {
          PK: `USER#${userId}`,
          SK: `WISHLIST#${item.productId}`,
        },
      },
    }));

    for (let i = 0; i < deleteRequests.length; i += 25) {
      const batch = deleteRequests.slice(i, i + 25);
      await dynamoDB.send(new BatchWriteCommand({
        RequestItems: {
          [DYNAMODB_TABLE_NAME]: batch,
        },
      }));
    }
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': `WISHLIST#${productId}`,
      },
      Limit: 1,
    }));

    return !!(result.Items && result.Items.length > 0);
  }

  /**
   * Get wishlist item count
   */
  async getWishlistCount(userId: string): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'WISHLIST#',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }

  /**
   * Get wishlist product IDs
   */
  async getWishlistProductIds(userId: string): Promise<string[]> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'WISHLIST#',
      },
    }));

    const wishlistItems = (result.Items as WishlistEntity[]) || [];
    return wishlistItems.map(item => item.productId);
  }
}

// Export singleton instance
export const wishlistRepository = new WishlistRepository();