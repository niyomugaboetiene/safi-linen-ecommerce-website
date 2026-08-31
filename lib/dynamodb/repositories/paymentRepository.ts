import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, generateId, getTimestamp, GSIs } from '@/lib/dynamodb';
import { 
  PaymentEntity, 
  PaymentListItem, 
  PaymentStatus, 
  PaymentMethod,
  PaymentQueryParams,
  PaginationResult,
} from '@/types/dynamodb';
import { orderRepository } from './orderRepository';

export class PaymentRepository {
  /**
   * Submit a new payment
   */
  async submitPayment(data: {
    orderId: string;
    userId: string;
    method: PaymentMethod;
    transactionId: string;
    phoneNumber: string;
    amount: number;
  }): Promise<PaymentEntity> {
    const paymentId = generateId('PAY');
    const timestamp = getTimestamp();

    // Check if transaction ID already exists
    const existingPayment = await this.getPaymentByTransactionId(data.transactionId);
    if (existingPayment) {
      throw new Error('Transaction ID already used');
    }

    const payment: PaymentEntity = {
      PK: `PAYMENT#${paymentId}`,
      SK: 'PAYMENT',
      type: 'PAYMENT',
      paymentId,
      orderId: data.orderId,
      userId: data.userId,
      method: data.method,
      transactionId: data.transactionId.toUpperCase(),
      phoneNumber: data.phoneNumber,
      amount: data.amount,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing all payments
      GSI1PK: 'PAYMENT',
      GSI1SK: timestamp,
      // GSI4: Status index for payments by status
      GSI4PK: 'PAYMENT#pending',
      GSI4SK: timestamp,
    };

    // Create user payment index for user-specific queries
    const userPaymentIndex = {
      PK: `USER#${data.userId}`,
      SK: `PAYMENT#${paymentId}`,
      type: 'PAYMENT_INDEX',
      paymentId,
      orderId: data.orderId,
      userId: data.userId,
      transactionId: data.transactionId.toUpperCase(),
      amount: data.amount,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `USER_PAYMENT#${data.userId}`,
      GSI1SK: timestamp,
    };

    // Create transaction ID index for duplicate checking
    const transactionIndex = {
      PK: `TRANSACTION#${data.transactionId.toUpperCase()}`,
      SK: 'PAYMENT',
      type: 'TRANSACTION_INDEX',
      paymentId,
      orderId: data.orderId,
      userId: data.userId,
      createdAt: timestamp,
    };

    // Use transaction to write payment, user index, and transaction index
    await dynamoDB.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: DYNAMODB_TABLE_NAME,
            Item: payment,
          },
        },
        {
          Put: {
            TableName: DYNAMODB_TABLE_NAME,
            Item: userPaymentIndex,
          },
        },
        {
          Put: {
            TableName: DYNAMODB_TABLE_NAME,
            Item: transactionIndex,
          },
        },
      ],
    }));

    // Link payment to order
    await orderRepository.linkPaymentToOrder(data.orderId, paymentId);

    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string, userId?: string): Promise<PaymentEntity | null> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `PAYMENT#${paymentId}`,
        SK: 'PAYMENT',
      },
    }));

    const payment = (result.Item as PaymentEntity) || null;

    // If userId is provided, verify payment belongs to user
    if (payment && userId && payment.userId !== userId) {
      return null;
    }

    return payment;
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string): Promise<PaymentEntity | null> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `TRANSACTION#${transactionId.toUpperCase()}`,
        ':sk': 'PAYMENT',
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      const transactionIndex = result.Items[0] as any;
      return this.getPaymentById(transactionIndex.paymentId);
    }

    return null;
  }

  /**
   * Get user's payments
   */
  async getUserPayments(
    userId: string,
    params: PaymentQueryParams = {}
  ): Promise<PaginationResult<PaymentListItem>> {
    const { page = 1, limit = 20, status, ExclusiveStartKey } = params;

    const filterExpression = status ? '#status = :status' : undefined;

    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'PAYMENT#',
        ...(status ? { ':status': status } : {}),
      },
      ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
      Limit: limit,
      ExclusiveStartKey,
      ScanIndexForward: false,
    }));

    const paymentIndexes = (result.Items as any[]) || [];
    
    // Fetch full payment details
    const payments: PaymentListItem[] = [];
    for (const index of paymentIndexes) {
      const payment = await this.getPaymentById(index.paymentId, userId);
      if (payment) {
        payments.push(this.toListItem(payment));
      }
    }

    const total = payments.length;

    return {
      data: payments,
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
   * List all payments (admin)
   */
  async listAllPayments(
    params: PaymentQueryParams = {}
  ): Promise<PaginationResult<PaymentListItem>> {
    const { page = 1, limit = 20, status, search, ExclusiveStartKey } = params;

    let result;

    if (status) {
      // Use GSI4 to query by status
      result = await dynamoDB.send(new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        IndexName: GSIs.StatusIndex,
        KeyConditionExpression: 'GSI4PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `PAYMENT#${status}`,
        },
        Limit: limit,
        ExclusiveStartKey,
        ScanIndexForward: false,
      }));
    } else {
      // Use GSI1 to list all payments
      result = await dynamoDB.send(new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        IndexName: GSIs.InvertedIndex,
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'PAYMENT',
        },
        Limit: limit,
        ExclusiveStartKey,
        ScanIndexForward: false,
      }));
    }

    let payments = (result.Items as PaymentEntity[]) || [];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter(payment => 
        payment.transactionId.toLowerCase().includes(searchLower) ||
        payment.phoneNumber.includes(search)
      );
    }

    const total = payments.length;

    return {
      data: payments.map(payment => this.toListItem(payment)),
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
   * Verify or reject payment (admin only)
   */
  async verifyPayment(
    paymentId: string,
    status: 'verified' | 'rejected',
    adminId: string,
    rejectionReason?: string
  ): Promise<PaymentEntity | null> {
    const timestamp = getTimestamp();

    const updateParts: string[] = [
      '#status = :status',
      '#verifiedBy = :verifiedBy',
      '#verifiedAt = :verifiedAt',
      '#updatedAt = :updatedAt',
      '#GSI4PK = :gsi4pk',
    ];

    const expressionValues: Record<string, any> = {
      ':status': status,
      ':verifiedBy': adminId,
      ':verifiedAt': timestamp,
      ':updatedAt': timestamp,
      ':gsi4pk': `PAYMENT#${status}`,
    };

    const expressionNames: Record<string, string> = {
      '#status': 'status',
      '#verifiedBy': 'verifiedBy',
      '#verifiedAt': 'verifiedAt',
      '#updatedAt': 'updatedAt',
      '#GSI4PK': 'GSI4PK',
    };

    if (status === 'rejected' && rejectionReason) {
      updateParts.push('#rejectionReason = :rejectionReason');
      expressionValues[':rejectionReason'] = rejectionReason;
      expressionNames['#rejectionReason'] = 'rejectionReason';
    }

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `PAYMENT#${paymentId}`,
        SK: 'PAYMENT',
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW',
    }));

    const payment = (result.Attributes as PaymentEntity) || null;

    // Update order status based on payment verification
    if (payment) {
      const order = await orderRepository.getOrderById(payment.orderId);
      if (order) {
        if (status === 'verified') {
          await orderRepository.updateOrderStatus(order.orderId, 'paid');
        } else if (status === 'rejected') {
          await orderRepository.updateOrderStatus(order.orderId, 'payment_rejected');
        }
      }
    }

    return payment;
  }

  /**
   * Count pending payments
   */
  async countPendingPayments(): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.StatusIndex,
      KeyConditionExpression: 'GSI4PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'PAYMENT#pending',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }

  /**
   * Get total verified revenue
   */
  async getTotalRevenue(): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.StatusIndex,
      KeyConditionExpression: 'GSI4PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'PAYMENT#verified',
      },
    }));

    const payments = (result.Items as PaymentEntity[]) || [];
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * Convert PaymentEntity to PaymentListItem
   */
  private toListItem(payment: PaymentEntity): PaymentListItem {
    return {
      id: payment.paymentId,
      orderId: payment.orderId,
      userId: payment.userId,
      method: payment.method,
      transactionId: payment.transactionId,
      phoneNumber: payment.phoneNumber,
      amount: payment.amount,
      status: payment.status,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt,
      rejectionReason: payment.rejectionReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();