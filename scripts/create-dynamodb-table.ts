import { DynamoDBClient, CreateTableCommand, CreateTableInput } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

async function createDynamoDBTable() {
  try {
    if (!process.env.AWS_REGION) {
      throw new Error('Missing AWS_REGION environment variable');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Missing AWS credentials');
    }

    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error('Missing DYNAMODB_TABLE_NAME environment variable');
    }

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const tableParams: CreateTableInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      AttributeDefinitions: [
        // Main table keys
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        // GSI1: Inverted Index
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
        // GSI2: Category Index
        { AttributeName: 'GSI2PK', AttributeType: 'S' },
        { AttributeName: 'GSI2SK', AttributeType: 'S' },
        // GSI3: Email Index
        { AttributeName: 'GSI3PK', AttributeType: 'S' },
        { AttributeName: 'GSI3SK', AttributeType: 'S' },
        // GSI4: Status Index
        { AttributeName: 'GSI4PK', AttributeType: 'S' },
        { AttributeName: 'GSI4SK', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'GSI3',
          KeySchema: [
            { AttributeName: 'GSI3PK', KeyType: 'HASH' },
            { AttributeName: 'GSI3SK', KeyType: 'RANGE' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'GSI4',
          KeySchema: [
            { AttributeName: 'GSI4PK', KeyType: 'HASH' },
            { AttributeName: 'GSI4SK', KeyType: 'RANGE' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      Tags: [
        {
          Key: 'Project',
          Value: 'ECommerce',
        },
        {
          Key: 'Environment',
          Value: process.env.NODE_ENV || 'development',
        },
      ],
    };

    console.log(`Creating DynamoDB table: ${process.env.DYNAMODB_TABLE_NAME}`);
    
    const command = new CreateTableCommand(tableParams);
    const response = await client.send(command);
    
    console.log('Table created successfully!');
    console.log('Table ARN:', response.TableDescription?.TableArn);
    console.log('Table Status:', response.TableDescription?.TableStatus);
    console.log('\nWaiting for table to become active...');
    
    // Note: In production, you should wait for table to be active
    // This can be done using waitForTableToBeActive from @aws-sdk/lib-dynamodb
    // or by polling DescribeTable
    
    console.log('\nNote: Table creation may take a few minutes to complete.');
    console.log('You can check status in AWS Console or using describe-table command.');
    
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table ${process.env.DYNAMODB_TABLE_NAME} already exists.`);
    } else {
      console.error('Error creating DynamoDB table:', error);
      process.exit(1);
    }
  }
}

// Run the script
createDynamoDBTable();