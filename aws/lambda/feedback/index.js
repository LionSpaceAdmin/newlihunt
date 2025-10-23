exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                error: 'Method not allowed',
                message: 'Only POST requests are supported'
            })
        };
    }

    try {
        const requestBody = JSON.parse(event.body);
        const { analysisId, feedbackType, comment } = requestBody;

        if (!analysisId || !feedbackType) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing parameters',
                    message: 'analysisId and feedbackType are required'
                })
            };
        }

        // In a real application, you would save this feedback to a database (e.g., DynamoDB)
        console.log('Received feedback:', { analysisId, feedbackType, comment });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Feedback received successfully',
                analysisId,
                feedbackType,
            })
        };
    } catch (error) {
        console.error('Feedback submission error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};