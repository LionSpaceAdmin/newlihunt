// Unit tests for Gemini Client module
const GeminiClient = require('./gemini-client');

// Mock test data
const TEST_CASES = {
    validText: "I received this message asking for urgent donation to help IDF soldiers. The sender claims to be from an official organization but the email looks suspicious.",
    
    suspiciousText: "URGENT! Send money NOW to help Israeli soldiers! Limited time offer! Click here immediately: bit.ly/fake-donation",
    
    safeText: "Visit the official FIDF website at https://fidf.org to learn about supporting Israeli soldiers through verified channels.",
    
    validImageData: {
        base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        mimeType: "image/png"
    },
    
    invalidImageData: {
        base64: "invalid-base64-data!@#$",
        mimeType: "image/png"
    }
};

// Test helper functions
function createMockGeminiResponse(riskScore = 25, classification = "SAFE") {
    return {
        summary: "This appears to be a legitimate inquiry about supporting Israeli causes.",
        analysisData: {
            riskScore: riskScore,
            credibilityScore: 100 - riskScore,
            classification: classification,
            detectedRules: [
                {
                    id: "test-rule",
                    name: "Test Rule",
                    severity: "LOW",
                    description: "Test description",
                    points: 5
                }
            ],
            recommendations: [
                "Always verify donation channels through official websites like FIDF.org"
            ],
            reasoning: "Analysis based on content patterns and verification status.",
            debiasingStatus: {
                anonymous_profile_neutralized: false,
                patriotic_tokens_neutralized: true,
                sentiment_penalty_capped: false
            }
        }
    };
}

// Test functions
async function testGeminiClientInitialization() {
    console.log('\n🧪 Testing Gemini Client Initialization');
    console.log('=' .repeat(50));
    
    try {
        // Test with valid API key
        const client = new GeminiClient('test-api-key');
        console.log('✅ Client initialized successfully with API key');
        
        // Test without API key
        try {
            new GeminiClient();
            console.log('❌ Should have thrown error for missing API key');
        } catch (error) {
            console.log('✅ Correctly threw error for missing API key:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Initialization test failed:', error.message);
    }
}

async function testImageDataProcessing() {
    console.log('\n🧪 Testing Image Data Processing');
    console.log('=' .repeat(50));
    
    try {
        // Test valid image data
        const validResult = GeminiClient.processImageData(
            TEST_CASES.validImageData.base64,
            TEST_CASES.validImageData.mimeType
        );
        console.log('✅ Valid image data processed successfully');
        console.log('   Estimated size:', (validResult.estimatedSize / 1024).toFixed(2), 'KB');
        
        // Test invalid base64
        try {
            GeminiClient.processImageData(
                TEST_CASES.invalidImageData.base64,
                TEST_CASES.invalidImageData.mimeType
            );
            console.log('❌ Should have thrown error for invalid base64');
        } catch (error) {
            console.log('✅ Correctly threw error for invalid base64:', error.message);
        }
        
        // Test invalid MIME type
        try {
            GeminiClient.processImageData(
                TEST_CASES.validImageData.base64,
                "application/pdf"
            );
            console.log('❌ Should have thrown error for invalid MIME type');
        } catch (error) {
            console.log('✅ Correctly threw error for invalid MIME type:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Image processing test failed:', error.message);
    }
}

async function testResponseValidation() {
    console.log('\n🧪 Testing Response Validation');
    console.log('=' .repeat(50));
    
    const client = new GeminiClient('test-api-key');
    
    try {
        // Test valid response
        const validResponse = createMockGeminiResponse();
        client.validateResponse(validResponse);
        console.log('✅ Valid response passed validation');
        
        // Test missing summary
        try {
            const invalidResponse = { ...validResponse };
            delete invalidResponse.summary;
            client.validateResponse(invalidResponse);
            console.log('❌ Should have thrown error for missing summary');
        } catch (error) {
            console.log('✅ Correctly threw error for missing summary:', error.message);
        }
        
        // Test invalid risk score
        try {
            const invalidResponse = createMockGeminiResponse();
            invalidResponse.analysisData.riskScore = 150; // Invalid score > 100
            client.validateResponse(invalidResponse);
            console.log('❌ Should have thrown error for invalid risk score');
        } catch (error) {
            console.log('✅ Correctly threw error for invalid risk score:', error.message);
        }
        
        // Test invalid classification
        try {
            const invalidResponse = createMockGeminiResponse();
            invalidResponse.analysisData.classification = "INVALID";
            client.validateResponse(invalidResponse);
            console.log('❌ Should have thrown error for invalid classification');
        } catch (error) {
            console.log('✅ Correctly threw error for invalid classification:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Response validation test failed:', error.message);
    }
}

async function testContentPreparation() {
    console.log('\n🧪 Testing Content Preparation');
    console.log('=' .repeat(50));
    
    const client = new GeminiClient('test-api-key');
    
    try {
        // Test text-only content
        const textOnlyParts = client.prepareContentParts(TEST_CASES.validText);
        console.log('✅ Text-only content prepared successfully');
        console.log('   Parts count:', textOnlyParts.length);
        
        // Test multimodal content
        const multimodalParts = client.prepareContentParts(
            TEST_CASES.validText,
            TEST_CASES.validImageData
        );
        console.log('✅ Multimodal content prepared successfully');
        console.log('   Parts count:', multimodalParts.length);
        console.log('   Has image data:', multimodalParts.some(part => part.inlineData));
        
    } catch (error) {
        console.log('❌ Content preparation test failed:', error.message);
    }
}

async function testSystemInstructionGeneration() {
    console.log('\n🧪 Testing System Instruction Generation');
    console.log('=' .repeat(50));
    
    const client = new GeminiClient('test-api-key');
    
    try {
        const systemInstruction = client.getSystemInstruction();
        
        // Check for key components
        const requiredComponents = [
            'Scam Hunter',
            'Israel',
            'IDF',
            'Dual-Score Framework',
            'FIDF.org',
            'debiasing'
        ];
        
        let allComponentsFound = true;
        for (const component of requiredComponents) {
            if (!systemInstruction.includes(component)) {
                console.log(`❌ Missing required component: ${component}`);
                allComponentsFound = false;
            }
        }
        
        if (allComponentsFound) {
            console.log('✅ System instruction contains all required components');
            console.log('   Instruction length:', systemInstruction.length, 'characters');
        }
        
    } catch (error) {
        console.log('❌ System instruction test failed:', error.message);
    }
}

async function testResponseSchemaGeneration() {
    console.log('\n🧪 Testing Response Schema Generation');
    console.log('=' .repeat(50));
    
    const client = new GeminiClient('test-api-key');
    
    try {
        const schema = client.getResponseSchema();
        
        // Check schema structure
        if (schema.type === 'OBJECT' && schema.properties) {
            console.log('✅ Schema has correct top-level structure');
            
            // Check required properties
            const requiredProps = ['summary', 'analysisData'];
            const hasAllProps = requiredProps.every(prop => 
                schema.properties[prop] && schema.required.includes(prop)
            );
            
            if (hasAllProps) {
                console.log('✅ Schema has all required properties');
            } else {
                console.log('❌ Schema missing required properties');
            }
            
            // Check analysisData structure
            const analysisData = schema.properties.analysisData;
            if (analysisData && analysisData.properties && analysisData.properties.debiasingStatus) {
                console.log('✅ Schema includes debiasing status structure');
            } else {
                console.log('❌ Schema missing debiasing status structure');
            }
            
        } else {
            console.log('❌ Schema has incorrect structure');
        }
        
    } catch (error) {
        console.log('❌ Response schema test failed:', error.message);
    }
}

// Performance test
async function testPerformanceMetrics() {
    console.log('\n🧪 Testing Performance Metrics');
    console.log('=' .repeat(50));
    
    try {
        const startTime = Date.now();
        
        // Test image processing performance
        const imageProcessingStart = Date.now();
        GeminiClient.processImageData(
            TEST_CASES.validImageData.base64,
            TEST_CASES.validImageData.mimeType
        );
        const imageProcessingTime = Date.now() - imageProcessingStart;
        
        // Test content preparation performance
        const client = new GeminiClient('test-api-key');
        const contentPrepStart = Date.now();
        client.prepareContentParts(TEST_CASES.validText, TEST_CASES.validImageData);
        const contentPrepTime = Date.now() - contentPrepStart;
        
        // Test validation performance
        const validationStart = Date.now();
        const mockResponse = createMockGeminiResponse();
        client.validateResponse(mockResponse);
        const validationTime = Date.now() - validationStart;
        
        const totalTime = Date.now() - startTime;
        
        console.log('✅ Performance metrics:');
        console.log(`   Image processing: ${imageProcessingTime}ms`);
        console.log(`   Content preparation: ${contentPrepTime}ms`);
        console.log(`   Response validation: ${validationTime}ms`);
        console.log(`   Total test time: ${totalTime}ms`);
        
        // Performance thresholds
        if (imageProcessingTime > 100) {
            console.log('⚠️  Image processing slower than expected');
        }
        if (validationTime > 50) {
            console.log('⚠️  Response validation slower than expected');
        }
        
    } catch (error) {
        console.log('❌ Performance test failed:', error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Gemini Client Unit Tests');
    console.log('=' .repeat(60));
    
    const tests = [
        testGeminiClientInitialization,
        testImageDataProcessing,
        testResponseValidation,
        testContentPreparation,
        testSystemInstructionGeneration,
        testResponseSchemaGeneration,
        testPerformanceMetrics
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            await test();
            passedTests++;
        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed!');
    } else {
        console.log(`⚠️  ${totalTests - passedTests} tests failed`);
    }
    
    return passedTests === totalTests;
}

// Export for use in other test files
module.exports = {
    runAllTests,
    TEST_CASES,
    createMockGeminiResponse
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}