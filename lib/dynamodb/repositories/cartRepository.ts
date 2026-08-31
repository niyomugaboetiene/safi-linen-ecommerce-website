import { 
  PutCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, getTimestamp } from '@/lib/dynamodb';
import { 
  CartItemEntity, 
  CartItem, 
  Cart,
} from '@/types/dynamodb';

export class CartRepository {
  /**
   * Add item to cart
   */
  async addToCart(
    userId: string,
    data: {
      productId: string;
      variantId: string;
      quantity: number;
    }
  ): Promise<CartItemEntity> {
    const timestamp = getTimestamp();
    const cartItemId = `CART#${data.productId}#${data.variantId}`;

    // Check if item already exists in cart
    const existingItem = await this.getCartItem(userId, data.productId, data.variantId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + data.quantity;
      
      const result = await dynamoDB.send(new UpdateCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: cartItemId,
        },
        UpdateExpression: 'SET #quantity = :quantity, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#quantity': 'quantity',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':quantity': newQuantity,
          ':updatedAt': timestamp,
        },
        ReturnValues: 'ALL_NEW',
      }));

      return result.Attributes as CartItemEntity;
    }

    // Create new cart item
    const cartItem: CartItemEntity = {
      PK: `USER#${userId}`,
      SK: cartItemId,
      type: 'CART',
      userId,
      productId: data.productId,
      variantId: data.variantId,
      quantity: data.quantity,
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing cart items
      GSI1PK: `CART#${userId}`,
      GSI1SK: timestamp,
    };

    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: cartItem,
    }));

    return cartItem;
  }

  /**
   * Get user's cart with all items
   */
  async getCart(userId: string): Promise<Cart> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CART#',
      },
    }));

    const items = (result.Items as CartItemEntity[]) || [];
    
    return {
      userId,
      items: items.map(item => this.toCartItem(item)),
    };
  }

  /**
   * Get specific cart item
   */
  async getCartItem(
    userId: string,
    productId: string,
    variantId: string
  ): Promise<CartItemEntity | null> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': `CART#${productId}#${variantId}`,
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as CartItemEntity;
    }

    return null;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(
    userId: string,
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<CartItemEntity | null> {
    const timestamp = getTimestamp();
    const cartItemId = `CART#${productId}#${variantId}`;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await this.removeFromCart(userId, productId, variantId);
      return null;
    }

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: cartItemId,
      },
      UpdateExpression: 'SET #quantity = :quantity, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#quantity': 'quantity',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':quantity': quantity,
        ':updatedAt': timestamp,
      },
      ReturnValues: 'ALL_NEW',
    }));

    return (result.Attributes as CartItemEntity) || null;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    userId: string,
    productId: string,
    variantId: string
  ): Promise<void> {
    const cartItemId = `CART#${productId}#${variantId}`;

    await dynamoDB.send(new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: cartItemId,
      },
    }));
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    
    if (cart.items.length === 0) {
      return;
    }

    // Delete all cart items in batches of 25 (DynamoDB limit)
    const deleteRequests = cart.items.map(item => ({
      DeleteRequest: {
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${item.productId}#${item.variantId}`,
        },
      },
    }));

    // Process in batches of 25
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
   * Get cart item count
   */
  async getCartItemCount(userId: string): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CART#',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }

  /**
   * Check if item exists in cart
   */
  async isItemInCart(
    userId: string,
    productId: string,
    variantId: string
  ): Promise<boolean> {
    const item = await this.getCartItem(userId, productId, variantId);
    return !!item;
  }

  /**
   * Convert CartItemEntity to CartItem
   */
  private toCartItem(item: CartItemEntity): CartItem {
    return {
      id: item.SK.replace('CART#', ''),
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    };
  }
}

// Export singleton instance
export const cartRepository = new CartRepository();