import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, generateId, getTimestamp, GSIs } from '@/lib/dynamodb';
import { 
  ReviewEntity, 
  ReviewListItem,
  ReviewQueryParams,
  PaginationResult,
} from '@/types/dynamodb';
import { userRepository } from './userRepository';
import { productRepository } from './productRepository';

export class ReviewRepository {
  /**
   * Create a new review
   */
  async createReview(data: {
    userId: string;
    productId: string;
    rating: number;
    comment: string;
  }): Promise<ReviewEntity> {
    const reviewId = generateId('REV');
    const timestamp = getTimestamp();

    // Check if user has already reviewed this product
    const existingReview = await this.getReviewByUserAndProduct(data.userId, data.productId);
    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }

    const review: ReviewEntity = {
      PK: `REVIEW#${reviewId}`,
      SK: 'REVIEW',
      type: 'REVIEW',
      reviewId,
      userId: data.userId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment,
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing all reviews
      GSI1PK: 'REVIEW',
      GSI1SK: timestamp,
      // GSI2: Product index for reviews by product
      GSI2PK: `PRODUCT#${data.productId}`,
      GSI2SK: timestamp,
    };

    // Create user review index for user-specific queries
    const userReviewIndex = {
      PK: `USER#${data.userId}`,
      SK: `REVIEW#${reviewId}`,
      type: 'REVIEW_INDEX',
      reviewId,
      userId: data.userId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment,
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `USER_REVIEW#${data.userId}`,
      GSI1SK: timestamp,
    };

    // Create product review index for product-specific queries
    const productReviewIndex = {
      PK: `PRODUCT#${data.productId}`,
      SK: `REVIEW#${reviewId}`,
      type: 'PRODUCT_REVIEW_INDEX',
      reviewId,
      userId: data.userId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment,
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `PRODUCT_REVIEW#${data.productId}`,
      GSI1SK: timestamp,
    };

    // Write review and indexes
    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: review,
    }));

    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: userReviewIndex,
    }));

    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: productReviewIndex,
    }));

    return review;
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<ReviewEntity | null> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `REVIEW#${reviewId}`,
        SK: 'REVIEW',
      },
    }));

    return (result.Item as ReviewEntity) || null;
  }

  /**
   * Get review by user and product
   */
  async getReviewByUserAndProduct(userId: string, productId: string): Promise<ReviewEntity | null> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: '#productId = :productId',
      ExpressionAttributeNames: {
        '#productId': 'productId',
      },
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'REVIEW#',
        ':productId': productId,
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      const reviewIndex = result.Items[0] as any;
      return this.getReviewById(reviewIndex.reviewId);
    }

    return null;
  }

  /**
   * Get reviews by product
   */
  async getProductReviews(
    productId: string,
    params: ReviewQueryParams = {}
  ): Promise<PaginationResult<ReviewListItem>> {
    const { page = 1, limit = 20, ExclusiveStartKey } = params;

    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`,
        ':sk': 'REVIEW#',
      },
      Limit: limit,
      ExclusiveStartKey,
      ScanIndexForward: false, // Newest first
    }));

    const reviewIndexes = (result.Items as any[]) || [];
    
    // Fetch full review details with user info
    const reviews: ReviewListItem[] = [];
    for (const index of reviewIndexes) {
      const review = await this.getReviewById(index.reviewId);
      if (review) {
        const user = await userRepository.getUserProfile(review.userId);
        const product = await productRepository.getProductById(review.productId);
        
        reviews.push({
          id: review.reviewId,
          userId: review.userId,
          productId: review.productId,
          rating: review.rating,
          comment: review.comment,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
          } : undefined,
          product: product ? {
            id: product.productId,
            name: product.name,
            slug: product.slug,
          } : undefined,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        });
      }
    }

    const total = reviews.length;

    return {
      data: reviews,
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
   * Get user's reviews
   */
  async getUserReviews(
    userId: string,
    params: ReviewQueryParams = {}
  ): Promise<PaginationResult<ReviewListItem>> {
    const { page = 1, limit = 20, ExclusiveStartKey } = params;

    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'REVIEW#',
      },
      Limit: limit,
      ExclusiveStartKey,
      ScanIndexForward: false,
    }));

    const reviewIndexes = (result.Items as any[]) || [];
    
    const reviews: ReviewListItem[] = [];
    for (const index of reviewIndexes) {
      const review = await this.getReviewById(index.reviewId);
      if (review) {
        const product = await productRepository.getProductById(review.productId);
        
        reviews.push({
          id: review.reviewId,
          userId: review.userId,
          productId: review.productId,
          rating: review.rating,
          comment: review.comment,
          product: product ? {
            id: product.productId,
            name: product.name,
            slug: product.slug,
          } : undefined,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        });
      }
    }

    const total = reviews.length;

    return {
      data: reviews,
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
   * List all reviews (admin)
   */
  async listAllReviews(
    params: ReviewQueryParams = {}
  ): Promise<PaginationResult<ReviewListItem>> {
    const { page = 1, limit = 20, search, ExclusiveStartKey } = params;

    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'REVIEW',
      },
      Limit: limit,
      ExclusiveStartKey,
      ScanIndexForward: false,
    }));

    let reviews = (result.Items as ReviewEntity[]) || [];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      reviews = reviews.filter(review => 
        review.comment.toLowerCase().includes(searchLower)
      );
    }

    // Fetch full review details
    const reviewItems: ReviewListItem[] = [];
    for (const review of reviews) {
      const user = await userRepository.getUserProfile(review.userId);
      const product = await productRepository.getProductById(review.productId);
      
      reviewItems.push({
        id: review.reviewId,
        userId: review.userId,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
        } : undefined,
        product: product ? {
          id: product.productId,
          name: product.name,
          slug: product.slug,
        } : undefined,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      });
    }

    const total = reviewItems.length;

    return {
      data: reviewItems,
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
   * Update review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updates: Partial<{
      rating: number;
      comment: string;
    }>
  ): Promise<ReviewEntity | null> {
    const timestamp = getTimestamp();

    // Check if review belongs to user
    const review = await this.getReviewById(reviewId);
    if (!review || review.userId !== userId) {
      throw new Error('You can only update your own reviews');
    }

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
      return review;
    }

    updateParts.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = timestamp;
    expressionNames['#updatedAt'] = 'updatedAt';

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `REVIEW#${reviewId}`,
        SK: 'REVIEW',
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW',
    }));

    return (result.Attributes as ReviewEntity) || null;
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string, userId?: string, isAdmin: boolean = false): Promise<void> {
    const review = await this.getReviewById(reviewId);
    
    if (!review) {
      return;
    }

    // Check if user is authorized to delete
    if (!isAdmin && review.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    // Delete review and indexes
    await dynamoDB.send(new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `REVIEW#${reviewId}`,
        SK: 'REVIEW',
      },
    }));

    // Delete user review index
    await dynamoDB.send(new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${review.userId}`,
        SK: `REVIEW#${reviewId}`,
      },
    }));

    // Delete product review index
    await dynamoDB.send(new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `PRODUCT#${review.productId}`,
        SK: `REVIEW#${reviewId}`,
      },
    }));
  }

  /**
   * Count total reviews
   */
  async countReviews(): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'REVIEW',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }
}

// Export singleton instance
export const reviewRepository = new ReviewRepository();