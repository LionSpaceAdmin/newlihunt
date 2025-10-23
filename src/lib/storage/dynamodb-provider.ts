/* eslint-disable @typescript-eslint/no-explicit-any */
import * as AWS from 'aws-sdk';
import { StorageConfig, StorageProvider, StoredAnalysis, UserSession } from './types';

// DynamoDB provider for AWS integration
export class DynamoDBStorageProvider implements StorageProvider {
  private dynamodb: AWS.DynamoDB.DocumentClient | null = null;
  private tableName: string;
  private sessionTableName: string;

  constructor(config: StorageConfig['dynamodb']) {
    if (!config) {
      throw new Error('DynamoDB configuration is required');
    }

    // Import AWS SDK dynamically to avoid issues in browser environment
    this.tableName = config.tableName;
    this.sessionTableName = config.sessionTableName;

    // This will be initialized when actually used in Lambda environment
    this.initializeDynamoDB(config);
  }

  private async initializeDynamoDB(config: StorageConfig['dynamodb']) {
    try {
      // Dynamic import for server-side only
      const AWS = await import('aws-sdk');
      this.dynamodb = new AWS.DynamoDB.DocumentClient({
        region: config?.region || 'us-east-1',
      });
    } catch (error) {
      console.warn('Failed to initialize DynamoDB:', error);
      throw new Error('DynamoDB initialization failed');
    }
  }

  async saveAnalysis(analysis: StoredAnalysis): Promise<string> {
    if (!this.dynamodb) {
      throw new Error('DynamoDB not initialized');
    }

    const item = {
      ...analysis,
      timestamp: analysis.timestamp.toISOString(),
      // Convert nested Date objects to ISO strings
      conversation: analysis.conversation.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
    };

    const params = {
      TableName: this.tableName,
      Item: item,
    };

    await this.dynamodb.put(params).promise();
    return analysis.id;
  }

  async getAnalysis(id: string): Promise<StoredAnalysis | null> {
    if (!this.dynamodb) {
      throw new Error('DynamoDB not initialized');
    }

    const params = {
      TableName: this.tableName,
      Key: { id },
    };

    const result = await this.dynamodb.get(params).promise();

    if (!result.Item) {
      return null;
    }

    // Convert ISO strings back to Date objects
    return {
      ...result.Item,
      timestamp: new Date(result.Item.timestamp),
      conversation: result.Item.conversation.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    } as StoredAnalysis;
  }

  async getUserHistory(userId: string, limit: number = 50): Promise<StoredAnalysis[]> {
    if (!this.dynamodb) {
      throw new Error('DynamoDB not initialized');
    }

    const params = {
      TableName: this.tableName,
      IndexName: 'userId-timestamp-index', // Assumes GSI exists
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: limit,
    };

    const result = await this.dynamodb.query(params).promise();

    return (result.Items || []).map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      conversation: item.conversation.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    })) as StoredAnalysis[];
  }

  async updateAnalysisFeedback(id: string, feedback: 'positive' | 'negative'): Promise<void> {
    if (!this.dynamodb) {
      throw new Error('DynamoDB not initialized');
    }

    const params = {
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: 'SET feedback = :feedback',
      ExpressionAttributeValues: {
        ':feedback': feedback,
      },
    };

    await this.dynamodb.update(params).promise();
  }

  async createSession(userId: string): Promise<UserSession> {
    if (!this.dynamodb) {
      throw new Error('DynamoDB not initialized');
    }

    const session: UserSession = {
      id: userId,
      createdAt: new Date(),
      lastActive: new Date(),
      analysisCount: 0,
      feedbackGiven: 0,
    };

    const item = {
      ...session,
      createdAt: session.createdAt.toISOString(),
      lastActive: session.lastActive.toISOString(),
    };

    const params = {
      TableName: this.sessionTableName,
      Item: item,
    };

    await this.dynamodb.put(params).promise();
    return session;
  }

  async updateSession(userId: string, updates: Partial<UserSession>): Promise<void> {
    if (!this.dynamodb) {
      throw new Error('DynamoDB not initialized');
    }

    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value instanceof Date ? value.toISOString() : value;
      }
    });

    // Always update lastActive
    updateExpressions.push('lastActive = :lastActive');
    expressionAttributeValues[':lastActive'] = new Date().toISOString();

    const params = {
      TableName: this.sessionTableName,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    await this.dynamodb.update(params).promise();
  }

  async getSession(userId: string): Promise<UserSession | null> {
    if (!this.dynamodb) {
      throw new Error('DynamoDB not initialized');
    }

    const params = {
      TableName: this.sessionTableName,
      Key: { id: userId },
    };

    const result = await this.dynamodb.get(params).promise();

    if (!result.Item) {
      return null;
    }

    return {
      ...result.Item,
      createdAt: new Date(result.Item.createdAt),
      lastActive: new Date(result.Item.lastActive),
    } as UserSession;
  }
}
