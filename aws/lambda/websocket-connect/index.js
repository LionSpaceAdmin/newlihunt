// WebSocket connection handler
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME || 'scam-hunt-connections';

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const timestamp = new Date().toISOString();
    
    console.log('WebSocket connection request:', { connectionId, timestamp });
    
    try {
        // Store connection in DynamoDB
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: {
                connectionId: connectionId,
                timestamp: timestamp,
                ttl: Math.floor(Date.now() / 1000) + 3600 // 1 hour TTL
            }
        }).promise();
        
        console.log('Connection stored successfully:', connectionId);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Connected successfully' })
        };
        
    } catch (error) {
        console.error('Connection error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to connect' })
        };
    }
};