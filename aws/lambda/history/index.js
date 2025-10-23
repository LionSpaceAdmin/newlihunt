const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'scam-hunt-history';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const method = event.httpMethod;
        
        if (method === 'GET') {
            // Get user history
            const userId = event.queryStringParameters?.userId || 'anonymous';
            
            const params = {
                TableName: TABLE_NAME,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                },
                ScanIndexForward: false, // Sort by timestamp descending
                Limit: 50
            };

            const result = await dynamodb.query(params).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    history: result.Items || []
                })
            };
        }
        
        if (method === 'POST') {
            // Save new analysis
            const { userId, analysis, conversation } = JSON.parse(event.body);
            
            const item = {
                userId: userId || 'anonymous',
                timestamp: new Date().toISOString(),
                id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                analysis,
                conversation,
                metadata: {
                    userAgent: event.headers['User-Agent'] || '',
                    ipHash: hashIP(event.requestContext?.identity?.sourceIp || '')
                }
            };

            const params = {
                TableName: TABLE_NAME,
                Item: item
            };

            await dynamodb.put(params).promise();
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    id: item.id
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('History operation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'History operation failed',
                message: error.message
            })
        };
    }
};

function hashIP(ip) {
    // Simple hash for privacy
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default-salt').digest('hex').substr(0, 16);
}