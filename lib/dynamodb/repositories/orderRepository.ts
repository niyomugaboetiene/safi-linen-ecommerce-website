import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, generateId, getTimestamp, GSIs } from '@/lib/dynamodb';
import { 
  OrderEntity, 
  OrderListItem, 
  OrderStatus, 
  OrderItem,
  ShippingAddress,
  DeliveryZone,
  OrderQueryParams,
  PaginationResult,
} from '@/types/dynamodb';
import { productRepository } from './productRepository';

export class OrderRepository {
  /**
   * Create a new order with stock validation
   */
  async createOrder(data: {
    userId: string;
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
    }>;
    deliveryZone: DeliveryZone;
    shippingAddress: ShippingAddress;
    deliveryFee: number;
  }): Promise<OrderEntity> {
    const orderId = generateId('ORD');
    const timestamp = getTimestamp();
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Validate stock and calculate totals
    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    const transactItems: any[] = [];

    for (const item of data.items) {
      const product = await productRepository.getProductById(item.productId);
      
      if (!product || !product.active) {
        throw new Error(`Product ${item.productId} not found or inactive`);
      }

      const variant = product.variants.find(v => v.variantId === item.variantId);
      
      if (!variant || !variant.active) {
        throw new Error(`Variant not found or inactive for product ${product.name}`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${variant.stock}`);
      }

      const itemSubtotal = variant.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.productId,
        productName: product.name,
        variantId: variant.variantId,
        variantDetails: {
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
        },
        price: variant.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      // Add stock reduction to transaction
      transactItems.push({
        Update: {
          TableName: DYNAMODB_TABLE_NAME,
          Key: {
            PK: `PRODUCT#${product.productId}`,
            SK: `VARIANT#${variant.variantId}`,
          },
          UpdateExpression: 'SET #stock = #stock - :quantity, #updatedAt = :updatedAt',
          ConditionExpression: '#stock >= :quantity',
          ExpressionAttributeNames: {
            '#stock': 'stock',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':quantity': item.quantity,
            ':updatedAt': timestamp,
          },
        },
      });
    }

    const total = subtotal + data.deliveryFee;

    const order: OrderEntity = {
      PK: `ORDER#${orderId}`,
      SK: 'ORDER',
      type: 'ORDER',
      orderId,
      userId: data.userId,
      orderNumber,
      items: orderItems,
      subtotal,
      deliveryFee: data.deliveryFee,
      total,
      deliveryZone: data.deliveryZone,
      shippingAddress: data.shippingAddress,
      status: 'pending_payment',
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing all orders
      GSI1PK: 'ORDER',
      GSI1SK: timestamp,
      // GSI4: Status index for orders by status
      GSI4PK: `ORDER#${'pending_payment'}`,
      GSI4SK: timestamp,
    };

    // Add order to user's orders (for user-specific queries)
    const userOrderIndex = {
      PK: `USER#${data.userId}`,
      SK: `ORDER#${orderId}`,
      type: 'ORDER_INDEX',
      orderId,
      userId: data.userId,
      orderNumber,
      total,
      status: 'pending_payment',
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `USER_ORDER#${data.userId}`,
      GSI1SK: timestamp,
    };

    // Add order creation to transaction
    transactItems.push({
      Put: {
        TableName: DYNAMODB_TABLE_NAME,
        Item: order,
      },
    });

    // Add user order index to transaction
    transactItems.push({
      Put: {
        TableName: DYNAMODB_TABLE_NAME,
        Item: userOrderIndex,
      },
    });

    // Execute transaction: create order + reduce stock
    await dynamoDB.send(new TransactWriteCommand({
      TransactItems: transactItems,
    }));

    return order;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<OrderEntity | null> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `ORDER#${orderId}`,
        SK: 'ORDER',
      },
    }));

    const order = (result.Item as OrderEntity) || null;

    // If userId is provided, verify order belongs to user
    if (order && userId && order.userId !== userId) {
      return null;
    }

    return order;
  }

  /**
   * Get user's orders
   */
  async getUserOrders(
    userId: string,
    params: OrderQueryParams = {}
  ): Promise<PaginationResult<OrderListItem>> {
    const { page = 1, limit = 20, status, ExclusiveStartKey } = params;

    const filterExpression = status ? '#status = :status' : undefined;

    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ORDER#',
        ...(status ? { ':status': status } : {}),
      },
      ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
      Limit: limit,
      ExclusiveStartKey,
      ScanIndexForward: false, // Newest first
    }));

    const orderIndexes = (result.Items as any[]) || [];
    
    // Fetch full order details
    const orders: OrderListItem[] = [];
    for (const index of orderIndexes) {
      const order = await this.getOrderById(index.orderId, userId);
      if (order) {
        orders.push(this.toListItem(order));
      }
    }

    const total = orders.length;

    return {
      data: orders,
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
   * List all orders (admin)
   */
  async listAllOrders(
    params: OrderQueryParams = {}
  ): Promise<PaginationResult<OrderListItem>> {
    const { page = 1, limit = 20, status, ExclusiveStartKey } = params;

    let result;

    if (status) {
      // Use GSI4 to query by status
      result = await dynamoDB.send(new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        IndexName: GSIs.StatusIndex,
        KeyConditionExpression: 'GSI4PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `ORDER#${status}`,
        },
        Limit: limit,
        ExclusiveStartKey,
        ScanIndexForward: false,
      }));
    } else {
      // Use GSI1 to list all orders
      result = await dynamoDB.send(new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        IndexName: GSIs.InvertedIndex,
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'ORDER',
        },
        Limit: limit,
        ExclusiveStartKey,
        ScanIndexForward: false,
      }));
    }

    const orders = (result.Items as OrderEntity[]) || [];
    const total = orders.length;

    return {
      data: orders.map(order => this.toListItem(order)),
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
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderEntity | null> {
    const timestamp = getTimestamp();

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `ORDER#${orderId}`,
        SK: 'ORDER',
      },
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt, #GSI4PK = :gsi4pk',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
        '#GSI4PK': 'GSI4PK',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': timestamp,
        ':gsi4pk': `ORDER#${status}`,
      },
      ReturnValues: 'ALL_NEW',
    }));

    return (result.Attributes as OrderEntity) || null;
  }

  /**
   * Link payment to order
   */
  async linkPaymentToOrder(orderId: string, paymentId: string): Promise<void> {
    const timestamp = getTimestamp();

    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `ORDER#${orderId}`,
        SK: 'ORDER',
      },
      UpdateExpression: 'SET #paymentId = :paymentId, #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#paymentId': 'paymentId',
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':paymentId': paymentId,
        ':status': 'payment_verification',
        ':updatedAt': timestamp,
      },
    }));
  }

  /**
   * Count total orders
   */
  async countOrders(): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'ORDER',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }

  /**
   * Get total revenue (from verified payments)
   */
  async getTotalRevenue(): Promise<number> {
    // This would be calculated from verified payments
    // For now, return 0 (will be implemented in payment repository)
    return 0;
  }

  /**
   * Convert OrderEntity to OrderListItem
   */
  private toListItem(order: OrderEntity): OrderListItem {
    return {
      id: order.orderId,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryZone: order.deliveryZone,
      shippingAddress: order.shippingAddress,
      status: order.status,
      paymentId: order.paymentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

// Export singleton instance
export const orderRepository = new OrderRepository();