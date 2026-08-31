import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

if (!process.env.AWS_REGION) {
  throw new Error('Please define the AWS_REGION environment variable');
}

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('Please define the AWS_ACCESS_KEY_ID environment variable');
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Please define the AWS_SECRET_ACCESS_KEY environment variable');
}

if (!process.env.DYNAMODB_TABLE_NAME) {
  throw new Error('Please define the DYNAMODB_TABLE_NAME environment variable');
}

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

// Create DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});

// Create DocumentClient for easier interaction with DynamoDB
export const dynamoDB = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Helper function to generate unique IDs
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

// Helper function to get current timestamp in ISO format
export function getTimestamp(): string {
  return new Date().toISOString();
}

// Global Secondary Index names
export const GSIs = {
  InvertedIndex: 'GSI1',
  CategoryIndex: 'GSI2',
  EmailIndex: 'GSI3',
  StatusIndex: 'GSI4',
} as const;

// Index key names
export const IndexKeys = {
  GSI1PK: 'GSI1PK',
  GSI1SK: 'GSI1SK',
  GSI2PK: 'GSI2PK',
  GSI2SK: 'GSI2SK',
  GSI3PK: 'GSI3PK',
  GSI3SK: 'GSI3SK',
  GSI4PK: 'GSI4PK',
  GSI4SK: 'GSI4SK',
} as const;