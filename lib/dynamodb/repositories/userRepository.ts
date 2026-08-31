import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, generateId, getTimestamp, GSIs, IndexKeys } from '@/lib/dynamodb';
import { UserEntity, UserProfile, UserRole, AccountStatus, PaginationParams, PaginationResult } from '@/types/dynamodb';
import bcrypt from 'bcryptjs';

export class UserRepository {
  /**
   * Create a new user
   */
  async createUser(data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    profileImage?: string;
    googleId?: string;
    role?: UserRole;
    address?: {
      street?: string;
      city?: string;
      district?: string;
      country?: string;
    };
    city?: string;
    district?: string;
  }): Promise<UserProfile> {
    const userId = generateId('USER');
    const timestamp = getTimestamp();
    
    let hashedPassword: string | undefined;
    if (data.password) {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }

    const user: UserEntity = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      type: 'USER',
      userId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: hashedPassword,
      profileImage: data.profileImage,
      googleId: data.googleId,
      role: data.role || 'customer',
      address: data.address,
      city: data.city,
      district: data.district,
      accountStatus: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
      // GSI1: Inverted index for listing all users
      GSI1PK: 'USER',
      GSI1SK: timestamp,
      // GSI3: Email index for finding user by email
      GSI3PK: data.email.toLowerCase(),
      GSI3SK: userId,
    };

    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: user,
    }));

    return this.toProfile(user);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserEntity | null> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    }));

    return (result.Item as UserEntity) || null;
  }

  /**
   * Get user by email using GSI3
   */
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.EmailIndex,
      KeyConditionExpression: 'GSI3PK = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as UserEntity;
    }

    return null;
  }

  /**
   * Get user by Google ID
   */
  async getUserByGoogleId(googleId: string): Promise<UserEntity | null> {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: DYNAMODB_TABLE_NAME,
      FilterExpression: 'googleId = :googleId AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':googleId': googleId,
        ':type': 'USER',
      },
      Limit: 1,
    }));

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as UserEntity;
    }

    return null;
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    updates: Partial<{
      name: string;
      phone: string;
      profileImage: string;
      address: {
        street?: string;
        city?: string;
        district?: string;
        country?: string;
      };
      city: string;
      district: string;
    }>
  ): Promise<UserProfile | null> {
    const timestamp = getTimestamp();
    
    // Build update expression
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
      return this.getUserProfile(userId);
    }

    updateParts.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = timestamp;
    expressionNames['#updatedAt'] = 'updatedAt';

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes ? this.toProfile(result.Attributes as UserEntity) : null;
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const timestamp = getTimestamp();
    
    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: 'SET #role = :role, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#role': 'role',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':role': role,
        ':updatedAt': timestamp,
      },
    }));
  }

  /**
   * Update user account status
   */
  async updateUserStatus(userId: string, accountStatus: AccountStatus): Promise<void> {
    const timestamp = getTimestamp();
    
    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: 'SET #accountStatus = :accountStatus, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#accountStatus': 'accountStatus',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':accountStatus': accountStatus,
        ':updatedAt': timestamp,
      },
    }));
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const timestamp = getTimestamp();
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: 'SET #password = :password, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#password': 'password',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': timestamp,
      },
    }));
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    await this.updateUserStatus(userId, 'deleted');
  }

  /**
   * List users with pagination (admin)
   */
  async listUsers(params: PaginationParams & { search?: string; role?: string; status?: string } = {}): Promise<PaginationResult<UserProfile>> {
    const { page = 1, limit = 20, search, role, status, ExclusiveStartKey } = params;

    // For search, we need to scan with filter
    if (search) {
      const filterParts: string[] = ['#type = :type'];
      const expressionValues: Record<string, any> = {
        ':type': 'USER',
      };
      const expressionNames: Record<string, string> = {
        '#type': 'type',
      };

      filterParts.push('(contains(#name, :search) OR contains(#email, :search))');
      expressionValues[':search'] = search.toLowerCase();
      expressionNames['#name'] = 'name';
      expressionNames['#email'] = 'email';

      if (role) {
        filterParts.push('#role = :role');
        expressionValues[':role'] = role;
        expressionNames['#role'] = 'role';
      }

      if (status) {
        filterParts.push('#accountStatus = :accountStatus');
        expressionValues[':accountStatus'] = status;
        expressionNames['#accountStatus'] = 'accountStatus';
      }

      const result = await dynamoDB.send(new ScanCommand({
        TableName: DYNAMODB_TABLE_NAME,
        FilterExpression: filterParts.join(' AND '),
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        Limit: limit,
        ExclusiveStartKey,
      }));

      const users = (result.Items as UserEntity[]) || [];
      const total = users.length;

      return {
        data: users.map(u => this.toProfile(u)),
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

    // Without search, use GSI1 to query all users
    const filterParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    if (role) {
      filterParts.push('#role = :role');
      expressionValues[':role'] = role;
      expressionNames['#role'] = 'role';
    }

    if (status) {
      filterParts.push('#accountStatus = :accountStatus');
      expressionValues[':accountStatus'] = status;
      expressionNames['#accountStatus'] = 'accountStatus';
    }

    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: filterParts.length > 0 ? filterParts.join(' AND ') : undefined,
      ExpressionAttributeValues: {
        ':pk': 'USER',
        ...expressionValues,
      },
      ExpressionAttributeNames: filterParts.length > 0 ? expressionNames : undefined,
      Limit: limit,
      ExclusiveStartKey,
      ScanIndexForward: false, // Sort by newest first
    }));

    const users = (result.Items as UserEntity[]) || [];
    const total = users.length;

    return {
      data: users.map(u => this.toProfile(u)),
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
   * Count total users
   */
  async countUsers(): Promise<number> {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: GSIs.InvertedIndex,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'USER',
      },
      Select: 'COUNT',
    }));

    return result.Count || 0;
  }

  /**
   * Get user profile (without sensitive data)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.getUserById(userId);
    return user ? this.toProfile(user) : null;
  }

  /**
   * Convert UserEntity to UserProfile (remove sensitive data)
   */
  private toProfile(user: UserEntity): UserProfile {
    return {
      id: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role,
      address: user.address,
      city: user.city,
      district: user.district,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();