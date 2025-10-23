// Test file for the analyze Lambda function
const { handler } = require('./index');

// Mock event for testing
const createTestEvent = (body) => ({
    httpMethod: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    requestContext: {
        requestTimeEpoch: Date.now(),
        identity: {
            sourceIp: '127.0.0.1'
        }
    }
});

// Test cases
const testCases = [
    {
        name: 'Valid text analysis',
        event: createTestEvent({
            message: 'I received this message asking for urgent donation to help IDF soldiers. The sender claims to be from an official organization but the email looks suspicious.'
        })
    },
    {
        name: 'Missing input',
        event: createTestEvent({})
    },
    {
        name: 'Invalid JSON',
        event: {
            httpMethod: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json',
            requestContext: { requestTimeEpoch: Date.now() }
        }
    },
    {
        name: 'OPTIONS request',
        event: {
            httpMethod: 'OPTIONS',
            headers: {},
            requestContext: { requestTimeEpoch: Date.now() }
        }
    }
];

// Run tests
async function runTests() {
    console.log('🧪 Running Lambda function tests...\n');
    
    for (const testCase of testCases) {
        console.log(`Testing: ${testCase.name}`);
        console.log('=' .repeat(50));
        
        try {
            const result = await handler(testCase.event);
            console.log('Status Code:', result.statusCode);
            console.log('Headers:', JSON.stringify(result.headers, null, 2));
            
            if (result.body) {
                try {
                    const body = JSON.parse(result.body);
                    console.log('Response Body:', JSON.stringify(body, null, 2));
                } catch {
                    console.log('Response Body (raw):', result.body);
                }
            }
            
            console.log('✅ Test completed\n');
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            console.error('Stack:', error.stack);
            console.log('');
        }
    }
}

// Check if GEMINI_API_KEY is set
if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY environment variable not set.');
    console.log('Set it with: export GEMINI_API_KEY=your_api_key_here');
    console.log('Tests will fail without a valid API key.\n');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, testCases };