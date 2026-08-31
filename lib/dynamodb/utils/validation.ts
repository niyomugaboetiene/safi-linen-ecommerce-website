import { z } from 'zod';

/**
 * Validate DynamoDB ID format
 * IDs are generated as: PREFIX_timestamp_random
 * Example: USER_lx2j8k3n_ab12cd34
 */
export function isValidDynamoId(id: string, prefix?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Basic format check
  if (prefix) {
    return id.startsWith(`${prefix}_`);
  }
  
  // Generic ID format check
  return /^[A-Z]+_[a-z0-9]+_[a-z0-9]+$/.test(id);
}

/**
 * Validate product ID format
 */
export function isValidProductId(productId: string): boolean {
  return isValidDynamoId(productId, 'PROD');
}

/**
 * Validate variant ID format
 */
export function isValidVariantId(variantId: string): boolean {
  return isValidDynamoId(variantId, 'VAR');
}

/**
 * Validate category ID format
 */
export function isValidCategoryId(categoryId: string): boolean {
  return isValidDynamoId(categoryId, 'CAT');
}

/**
 * Validate order ID format
 */
export function isValidOrderId(orderId: string): boolean {
  return isValidDynamoId(orderId, 'ORD');
}

/**
 * Validate payment ID format
 */
export function isValidPaymentId(paymentId: string): boolean {
  return isValidDynamoId(paymentId, 'PAY');
}

/**
 * Validate review ID format
 */
export function isValidReviewId(reviewId: string): boolean {
  return isValidDynamoId(reviewId, 'REV');
}

/**
 * Validate user ID format
 */
export function isValidUserId(userId: string): boolean {
  return isValidDynamoId(userId, 'USER');
}

/**
 * Validate cart item ID format
 * Format: PRODUCT#<productId>#VARIANT#<variantId>
 */
export function isValidCartItemId(itemId: string): boolean {
  if (!itemId || typeof itemId !== 'string') return false;
  
  const parts = itemId.split('#');
  if (parts.length !== 4) return false;
  
  return (
    parts[0] === 'PRODUCT' &&
    isValidProductId(parts[1]) &&
    parts[2] === 'VARIANT' &&
    isValidVariantId(parts[3])
  );
}

/**
 * Parse cart item ID into productId and variantId
 */
export function parseCartItemId(itemId: string): {
  productId: string;
  variantId: string;
} | null {
  if (!isValidCartItemId(itemId)) return null;
  
  const parts = itemId.split('#');
  return {
    productId: parts[1],
    variantId: parts[3],
  };
}

/**
 * Validate DynamoDB attribute name
 * Attribute names must not contain spaces or special characters
 */
export function isValidAttributeName(attrName: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(attrName);
}

/**
 * Validate DynamoDB expression attribute value
 */
export function isValidExpressionValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  
  // Check for unsupported types
  if (typeof value === 'function') return false;
  if (typeof value === 'symbol') return false;
  if (value instanceof Date && isNaN(value.getTime())) return false;
  
  // Check for empty strings (DynamoDB doesn't allow empty strings for keys)
  if (value === '') return false;
  
  return true;
}

/**
 * Zod schema for DynamoDB ID validation
 */
export const dynamoIdSchema = z.string().regex(
  /^[A-Z]+_[a-z0-9]+_[a-z0-9]+$/,
  'Invalid ID format'
);

/**
 * Zod schema for product ID
 */
export const productIdSchema = z.string().regex(
  /^PROD_[a-z0-9]+_[a-z0-9]+$/,
  'Invalid product ID format'
);

/**
 * Zod schema for category ID
 */
export const categoryIdSchema = z.string().regex(
  /^CAT_[a-z0-9]+_[a-z0-9]+$/,
  'Invalid category ID format'
);

/**
 * Zod schema for pagination params
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  lastEvaluatedKey: z.string().optional(),
});

/**
 * Validate DynamoDB key object
 */
export function isValidDynamoKey(key: { PK: string; SK: string }): boolean {
  if (!key || !key.PK || !key.SK) return false;
  if (typeof key.PK !== 'string' || typeof key.SK !== 'string') return false;
  if (key.PK === '' || key.SK === '') return false;
  
  return true;
}

/**
 * Validate DynamoDB update expression
 * Basic check to ensure it starts with SET, REMOVE, ADD, or DELETE
 */
export function isValidUpdateExpression(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return false;
  
  const validPrefixes = ['SET', 'REMOVE', 'ADD', 'DELETE'];
  return validPrefixes.some(prefix => expression.trim().startsWith(prefix));
}

/**
 * Validate DynamoDB condition expression
 */
export function isValidConditionExpression(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return false;
  
  // Basic check for valid operators
  const validOperators = [
    '=',
    '<>',
    '<',
    '<=',
    '>',
    '>=',
    'BETWEEN',
    'IN',
    'attribute_exists',
    'attribute_not_exists',
    'attribute_type',
    'begins_with',
    'contains',
  ];
  
  return validOperators.some(op => expression.includes(op));
}

/**
 * Sanitize DynamoDB attribute name
 * Removes any characters that are not alphanumeric or underscore
 */
export function sanitizeAttributeName(attrName: string): string {
  return attrName.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Check if value is a valid DynamoDB number
 */
export function isValidDynamoNumber(value: any): boolean {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Check if value is a valid DynamoDB string
 */
export function isValidDynamoString(value: any): boolean {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if value is a valid DynamoDB boolean
 */
export function isValidDynamoBoolean(value: any): boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is a valid DynamoDB list
 */
export function isValidDynamoList(value: any): boolean {
  return Array.isArray(value);
}

/**
 * Check if value is a valid DynamoDB map
 */
export function isValidDynamoMap(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

/**
 * Validate DynamoDB item before write
 * Ensures required keys are present
 */
export function validateDynamoItem(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  
  // Check for required PK
  if (!item.PK || typeof item.PK !== 'string' || item.PK === '') return false;
  
  // Check for required SK
  if (!item.SK || typeof item.SK !== 'string' || item.SK === '') return false;
  
  return true;
}

/**
 * Validate batch write items
 * Ensures array length doesn't exceed DynamoDB limit of 25
 */
export function validateBatchItems(items: any[]): boolean {
  if (!Array.isArray(items)) return false;
  if (items.length === 0) return false;
  if (items.length > 25) return false;
  
  return items.every(item => validateDynamoItem(item));
}

/**
 * Validate transaction items
 * Ensures array length doesn't exceed DynamoDB limit of 100
 */
export function validateTransactionItems(items: any[]): boolean {
  if (!Array.isArray(items)) return false;
  if (items.length === 0) return false;
  if (items.length > 100) return false;
  
  return true;
}

/**
 * Check if string is a valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

/**
 * Validate DynamoDB GSI name
 */
export function isValidGSIName(gsiName: string): boolean {
  if (!gsiName || typeof gsiName !== 'string') return false;
  
  // Valid GSI names in our application
  const validGSIs = ['GSI1', 'GSI2', 'GSI3', 'GSI4'];
  return validGSIs.includes(gsiName);
}

/**
 * Validate DynamoDB expression attribute names
 * Ensures all names start with # and are valid
 */
export function validateExpressionAttributeNames(
  names: Record<string, string>
): boolean {
  if (!names || typeof names !== 'object') return false;
  
  return Object.entries(names).every(([key, value]) => {
    return (
      key.startsWith('#') &&
      key.length > 1 &&
      isValidAttributeName(value)
    );
  });
}

/**
 * Validate DynamoDB expression attribute values
 * Ensures all keys start with : and values are valid
 */
export function validateExpressionAttributeValues(
  values: Record<string, any>
): boolean {
  if (!values || typeof values !== 'object') return false;
  
  return Object.entries(values).every(([key, value]) => {
    return (
      key.startsWith(':') &&
      key.length > 1 &&
      isValidExpressionValue(value)
    );
  });
}