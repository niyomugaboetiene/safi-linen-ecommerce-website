import { QueryCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb';

/**
 * Encode DynamoDB LastEvaluatedKey to base64 string for safe transmission
 */
export function encodeLastEvaluatedKey(
  lastEvaluatedKey?: Record<string, any>
): string | undefined {
  if (!lastEvaluatedKey) return undefined;

  try {
    const jsonString = JSON.stringify(lastEvaluatedKey);
    return Buffer.from(jsonString).toString('base64');
  } catch (error) {
    console.error('Error encoding LastEvaluatedKey:', error);
    return undefined;
  }
}

/**
 * Decode base64 string back to DynamoDB LastEvaluatedKey
 */
export function decodeLastEvaluatedKey(
  encodedKey?: string
): Record<string, any> | undefined {
  if (!encodedKey) return undefined;

  try {
    const jsonString = Buffer.from(encodedKey, 'base64').toString();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error decoding LastEvaluatedKey:', error);
    return undefined;
  }
}

/**
 * Build pagination params for DynamoDB Query or Scan
 */
export function buildPaginationParams(
  params: {
    page?: number;
    limit?: number;
    lastEvaluatedKey?: string;
  } = {}
): {
  Limit: number;
  ExclusiveStartKey?: Record<string, any>;
} {
  const { limit = 20, lastEvaluatedKey } = params;

  const paginationParams: any = {
    Limit: limit,
  };

  if (lastEvaluatedKey) {
    const decodedKey = decodeLastEvaluatedKey(lastEvaluatedKey);
    if (decodedKey) {
      paginationParams.ExclusiveStartKey = decodedKey;
    }
  }

  return paginationParams;
}

/**
 * Create pagination response from DynamoDB result
 */
export function createPaginationResponse(
  page: number,
  limit: number,
  result: {
    Items?: any[];
    Count?: number;
    LastEvaluatedKey?: Record<string, any>;
  }
) {
  const items = result.Items || [];
  const total = result.Count || items.length;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: !!result.LastEvaluatedKey,
      hasPrevPage: page > 1,
      lastEvaluatedKey: encodeLastEvaluatedKey(result.LastEvaluatedKey),
    },
  };
}

/**
 * Calculate total pages based on total items and limit
 */
export function calculateTotalPages(total: number, limit: number): number {
  if (total === 0) return 0;
  return Math.ceil(total / limit) || 1;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page?: number,
  limit?: number
): { page: number; limit: number } {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(100, Math.max(1, limit || 20));

  return {
    page: validPage,
    limit: validLimit,
  };
}

/**
 * Get skip value for offset-based pagination (used for UI display)
 */
export function getSkipValue(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Build DynamoDB Query input with pagination
 */
export function buildQueryWithPagination(
  params: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues?: Record<string, any>;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
    FilterExpression?: string;
    ScanIndexForward?: boolean;
  },
  paginationParams: {
    page?: number;
    limit?: number;
    lastEvaluatedKey?: string;
  } = {}
): QueryCommandInput {
  const { limit, lastEvaluatedKey } = paginationParams;
  const { ExclusiveStartKey } = buildPaginationParams({
    limit,
    lastEvaluatedKey,
  });

  return {
    TableName: params.TableName,
    KeyConditionExpression: params.KeyConditionExpression,
    ExpressionAttributeValues: params.ExpressionAttributeValues,
    ExpressionAttributeNames: params.ExpressionAttributeNames,
    IndexName: params.IndexName,
    FilterExpression: params.FilterExpression,
    ScanIndexForward: params.ScanIndexForward,
    Limit: ExclusiveStartKey.Limit,
    ExclusiveStartKey: ExclusiveStartKey.ExclusiveStartKey,
  };
}

/**
 * Build DynamoDB Scan input with pagination
 */
export function buildScanWithPagination(
  params: {
    TableName: string;
    FilterExpression?: string;
    ExpressionAttributeValues?: Record<string, any>;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
  },
  paginationParams: {
    page?: number;
    limit?: number;
    lastEvaluatedKey?: string;
  } = {}
): ScanCommandInput {
  const { limit, lastEvaluatedKey } = paginationParams;
  const { ExclusiveStartKey } = buildPaginationParams({
    limit,
    lastEvaluatedKey,
  });

  return {
    TableName: params.TableName,
    FilterExpression: params.FilterExpression,
    ExpressionAttributeValues: params.ExpressionAttributeValues,
    ExpressionAttributeNames: params.ExpressionAttributeNames,
    IndexName: params.IndexName,
    Limit: ExclusiveStartKey.Limit,
    ExclusiveStartKey: ExclusiveStartKey.ExclusiveStartKey,
  };
}