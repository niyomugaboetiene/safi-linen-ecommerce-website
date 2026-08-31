import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, generateId, getTimestamp, GSIs } from '@/lib/dynamodb';
import { 
  CategoryEntity, 
  CategoryListItem,
  PaginationParams,
  PaginationResult,
} from '@/types/dynamodb';
import slugify from 'slugify';

export class CategoryRepository {
  /**
   * Create a new category
   */
  async createCategory(data: {
    name: string;
    description?: string;
    active?: boolean;
  }): Promise<CategoryEntity> {
    const categoryId = generateId('CAT');
    const timestamp = getTimestamp();
    const slug = slugify(data.name, { lower: true, strict: true });

    const category: CategoryEntity = {
      PK: `CATEGORY#${categoryId}`,
      SK: 'CATEGORY',
      type: 'CATEGORY',
      categoryId,
      name: data.name,
      slug,
      description: data.description,
      active: data.active !== false,
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing all categories
      GSI1PK: 'CATEGORY',
      GSI1SK: timestamp,
    };

    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: category,
    }));

    return category;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<CategoryEntity | null> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: 'CATEGORY',
      },
    }));

    return (result.Item as CategoryEntity) || null;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<CategoryEntity | null> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: '#slug = :slug',
      ExpressionAttributeNames: {
        '#slug': 'slug',
      },
      ExpressionAttributeValues: {
        ':pk': 'CATEGORY',
        ':slug': slug,
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as CategoryEntity;
    }

    return null;
  }

  /**
   * Check if category name exists
   */
  async checkNameExists(name: string, excludeCategoryId?: string): Promise<boolean> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: '#name = :name',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':pk': 'CATEGORY',
        ':name': name,
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      const category = result.Items[0] as CategoryEntity;
      if (excludeCategoryId && category.categoryId === excludeCategoryId) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * List all categories
   */
  async listCategories(activeOnly: boolean = false): Promise<CategoryListItem[]> {
    const filterExpression = activeOnly ? '#active = :active' : undefined;
    
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: {
        ':pk': 'CATEGORY',
        ...(activeOnly ? { ':active': true } : {}),
      },
      ExpressionAttributeNames: activeOnly ? { '#active': 'active' } : undefined,
      ScanIndexForward: false, // Sort by newest first
    }));

    const categories = (result.Items as CategoryEntity[]) || [];
    
    return categories.map(category => this.toListItem(category));
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<{
      name: string;
      description: string;
      active: boolean;
    }>
  ): Promise<CategoryEntity | null> {
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

    // If name is updated, also update slug
    if (updates.name) {
      updateParts.push('#slug = :slug');
      expressionValues[':slug'] = slugify(updates.name, { lower: true, strict: true });
      expressionNames['#slug'] = 'slug';
    }

    updateParts.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = timestamp;
    expressionNames['#updatedAt'] = 'updatedAt';

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: 'CATEGORY',
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW',
    }));

    return (result.Attributes as CategoryEntity) || null;
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await dynamoDB.send(new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: 'CATEGORY',
      },
    }));
  }

  /**
   * Count total categories
   */
  async countCategories(): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'CATEGORY',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }

  /**
   * Convert CategoryEntity to CategoryListItem
   */
  private toListItem(category: CategoryEntity): CategoryListItem {
    return {
      id: category.categoryId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

// Export singleton instance
export const categoryRepository = new CategoryRepository();