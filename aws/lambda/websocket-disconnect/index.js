// WebSocket disconnection handler
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME || 'scam-hunt-connections';

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    
    console.log('WebSocket disconnection request:', { connectionId });
    
    try {
        // Remove connection from DynamoDB
        await dynamodb.delete({
            TableName: TABLE_NAME,
            Key: {
                connectionId: connectionId
            }
        }).promise();
        
        console.log('Connection removed successfully:', connectionId);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Disconnected successfully' })
        };
        
    } catch (error) {
        console.error('Disconnection error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to disconnect' })
        };
    }
};