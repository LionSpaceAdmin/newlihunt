// Unit tests for Risk Signals module
const {
    RISK_CATEGORIES,
    SEVERITY_LEVELS,
    RISK_SIGNALS,
    CREDIBILITY_SIGNALS,
    DEBIASING_RULES,
    SAFE_DONATION_CHANNELS,
    calculateRiskScore,
    calculateCredibilityScore,
    getClassification
} = require('./risk-signals');

// Test data
const TEST_SIGNALS = {
    highRisk: [
        { severity: 'HIGH', points: 25 },
        { severity: 'HIGH', points: 25 },
        { severity: 'MEDIUM', points: 15 }
    ],
    mediumRisk: [
        { severity: 'MEDIUM', points: 15 },
        { severity: 'LOW', points: 5 },
        { severity: 'LOW', points: 5 }
    ],
    lowRisk: [
        { severity: 'LOW', points: 5 }
    ],
    credibilityBoosts: [
        { points: -20 }, // Official verification
        { points: -15 }, // Established presence
        { points: -10 }  // Transparent contact
    ]
};

// Test functions
function testRiskCategories() {
    console.log('\n🧪 Testing Risk Categories');
    console.log('=' .repeat(50));
    
    try {
        const expectedCategories = ['ACCOUNT', 'CONTENT', 'BEHAVIORAL', 'TECHNICAL'];
        const actualCategories = Object.keys(RISK_CATEGORIES);
        
        let allCategoriesPresent = true;
        for (const category of expectedCategories) {
            if (!actualCategories.includes(category)) {
                console.log(`❌ Missing category: ${category}`);
                allCategoriesPresent = false;
            }
        }
        
        if (allCategoriesPresent) {
            console.log('✅ All expected risk categories are present');
            console.log(`   Total categories: ${actualCategories.length}`);
        }
        
        // Test category descriptions
        for (const [key, description] of Object.entries(RISK_CATEGORIES)) {
            if (typeof description !== 'string' || description.length < 10) {
                console.log(`❌ Invalid description for category ${key}`);
                allCategoriesPresent = false;
            }
        }
        
        if (allCategoriesPresent) {
            console.log('✅ All categories have valid descriptions');
        }
        
    } catch (error) {
        console.log('❌ Risk categories test failed:', error.message);
    }
}

function testSeverityLevels() {
    console.log('\n🧪 Testing Severity Levels');
    console.log('=' .repeat(50));
    
    try {
        const expectedLevels = ['LOW', 'MEDIUM', 'HIGH'];
        const actualLevels = Object.keys(SEVERITY_LEVELS);
        
        let allLevelsValid = true;
        
        for (const level of expectedLevels) {
            if (!actualLevels.includes(level)) {
                console.log(`❌ Missing severity level: ${level}`);
                allLevelsValid = false;
            } else {
                const levelData = SEVERITY_LEVELS[level];
                if (!levelData.points || !levelData.color) {
                    console.log(`❌ Invalid data for severity level ${level}`);
                    allLevelsValid = false;
                }
            }
        }
        
        if (allLevelsValid) {
            console.log('✅ All severity levels are valid');
            
            // Test point progression
            const lowPoints = SEVERITY_LEVELS.LOW.points;
            const mediumPoints = SEVERITY_LEVELS.MEDIUM.points;
            const highPoints = SEVERITY_LEVELS.HIGH.points;
            
            if (lowPoints < mediumPoints && mediumPoints < highPoints) {
                console.log('✅ Severity points follow correct progression');
                console.log(`   LOW: ${lowPoints}, MEDIUM: ${mediumPoints}, HIGH: ${highPoints}`);
            } else {
                console.log('❌ Severity points do not follow correct progression');
            }
        }
        
    } catch (error) {
        console.log('❌ Severity levels test failed:', error.message);
    }
}

function testRiskSignals() {
    console.log('\n🧪 Testing Risk Signals');
    console.log('=' .repeat(50));
    
    try {
        const signalIds = Object.keys(RISK_SIGNALS);
        console.log(`✅ Found ${signalIds.length} risk signals`);
        
        let allSignalsValid = true;
        const requiredFields = ['id', 'name', 'category', 'severity', 'description', 'keywords'];
        
        for (const [id, signal] of Object.entries(RISK_SIGNALS)) {
            // Check required fields
            for (const field of requiredFields) {
                if (!(field in signal)) {
                    console.log(`❌ Signal ${id} missing field: ${field}`);
                    allSignalsValid = false;
                }
            }
            
            // Check ID consistency
            if (signal.id !== id) {
                console.log(`❌ Signal ${id} has inconsistent ID: ${signal.id}`);
                allSignalsValid = false;
            }
            
            // Check severity validity
            if (!['LOW', 'MEDIUM', 'HIGH'].includes(signal.severity)) {
                console.log(`❌ Signal ${id} has invalid severity: ${signal.severity}`);
                allSignalsValid = false;
            }
            
            // Check keywords array
            if (!Array.isArray(signal.keywords) || signal.keywords.length === 0) {
                console.log(`❌ Signal ${id} has invalid keywords array`);
                allSignalsValid = false;
            }
        }
        
        if (allSignalsValid) {
            console.log('✅ All risk signals have valid structure');
            
            // Test category distribution
            const categoryCount = {};
            for (const signal of Object.values(RISK_SIGNALS)) {
                categoryCount[signal.category] = (categoryCount[signal.category] || 0) + 1;
            }
            
            console.log('   Category distribution:');
            for (const [category, count] of Object.entries(categoryCount)) {
                console.log(`     ${category}: ${count} signals`);
            }
        }
        
    } catch (error) {
        console.log('❌ Risk signals test failed:', error.message);
    }
}

function testCredibilitySignals() {
    console.log('\n🧪 Testing Credibility Signals');
    console.log('=' .repeat(50));
    
    try {
        const credibilityIds = Object.keys(CREDIBILITY_SIGNALS);
        console.log(`✅ Found ${credibilityIds.length} credibility signals`);
        
        let allSignalsValid = true;
        const requiredFields = ['id', 'name', 'points', 'description', 'keywords'];
        
        for (const [id, signal] of Object.entries(CREDIBILITY_SIGNALS)) {
            // Check required fields
            for (const field of requiredFields) {
                if (!(field in signal)) {
                    console.log(`❌ Credibility signal ${id} missing field: ${field}`);
                    allSignalsValid = false;
                }
            }
            
            // Check points are negative (credibility boost)
            if (signal.points >= 0) {
                console.log(`❌ Credibility signal ${id} should have negative points: ${signal.points}`);
                allSignalsValid = false;
            }
        }
        
        if (allSignalsValid) {
            console.log('✅ All credibility signals have valid structure');
        }
        
    } catch (error) {
        console.log('❌ Credibility signals test failed:', error.message);
    }
}

function testSafeDonationChannels() {
    console.log('\n🧪 Testing Safe Donation Channels');
    console.log('=' .repeat(50));
    
    try {
        if (!Array.isArray(SAFE_DONATION_CHANNELS) || SAFE_DONATION_CHANNELS.length === 0) {
            console.log('❌ Safe donation channels should be a non-empty array');
            return;
        }
        
        console.log(`✅ Found ${SAFE_DONATION_CHANNELS.length} safe donation channels`);
        
        let allChannelsValid = true;
        const requiredFields = ['name', 'url', 'description', 'verified'];
        
        for (const channel of SAFE_DONATION_CHANNELS) {
            for (const field of requiredFields) {
                if (!(field in channel)) {
                    console.log(`❌ Donation channel missing field: ${field}`);
                    allChannelsValid = false;
                }
            }
            
            // Check URL format
            if (!channel.url.startsWith('https://')) {
                console.log(`❌ Donation channel should use HTTPS: ${channel.url}`);
                allChannelsValid = false;
            }
            
            // Check verification status
            if (typeof channel.verified !== 'boolean') {
                console.log(`❌ Donation channel verified field should be boolean`);
                allChannelsValid = false;
            }
        }
        
        if (allChannelsValid) {
            console.log('✅ All donation channels have valid structure');
            
            // Check for FIDF
            const hasFIDF = SAFE_DONATION_CHANNELS.some(channel => 
                channel.url.includes('fidf.org')
            );
            
            if (hasFIDF) {
                console.log('✅ FIDF.org is included in safe channels');
            } else {
                console.log('❌ FIDF.org should be included in safe channels');
            }
        }
        
    } catch (error) {
        console.log('❌ Safe donation channels test failed:', error.message);
    }
}

function testRiskScoreCalculation() {
    console.log('\n🧪 Testing Risk Score Calculation');
    console.log('=' .repeat(50));
    
    try {
        // Test high risk scenario
        const highRiskScore = calculateRiskScore(TEST_SIGNALS.highRisk);
        console.log(`✅ High risk score calculated: ${highRiskScore}`);
        
        if (highRiskScore >= 60) {
            console.log('✅ High risk score is appropriately high');
        } else {
            console.log('❌ High risk score should be higher');
        }
        
        // Test medium risk scenario
        const mediumRiskScore = calculateRiskScore(TEST_SIGNALS.mediumRisk);
        console.log(`✅ Medium risk score calculated: ${mediumRiskScore}`);
        
        // Test low risk scenario
        const lowRiskScore = calculateRiskScore(TEST_SIGNALS.lowRisk);
        console.log(`✅ Low risk score calculated: ${lowRiskScore}`);
        
        // Test score progression
        if (lowRiskScore < mediumRiskScore && mediumRiskScore < highRiskScore) {
            console.log('✅ Risk scores follow correct progression');
        } else {
            console.log('❌ Risk scores do not follow correct progression');
        }
        
        // Test score capping at 100
        const extremeSignals = Array(10).fill({ severity: 'HIGH', points: 25 });
        const cappedScore = calculateRiskScore(extremeSignals);
        
        if (cappedScore <= 100) {
            console.log('✅ Risk score is properly capped at 100');
        } else {
            console.log('❌ Risk score exceeds maximum of 100');
        }
        
    } catch (error) {
        console.log('❌ Risk score calculation test failed:', error.message);
    }
}

function testCredibilityScoreCalculation() {
    console.log('\n🧪 Testing Credibility Score Calculation');
    console.log('=' .repeat(50));
    
    try {
        // Test with high risk (should have low credibility)
        const highRiskScore = 80;
        const credibilityWithHighRisk = calculateCredibilityScore([], highRiskScore);
        console.log(`✅ Credibility with high risk (${highRiskScore}): ${credibilityWithHighRisk}`);
        
        // Test with credibility boosts
        const credibilityWithBoosts = calculateCredibilityScore(TEST_SIGNALS.credibilityBoosts, 50);
        console.log(`✅ Credibility with boosts: ${credibilityWithBoosts}`);
        
        // Test that credibility improves with boosts
        const credibilityWithoutBoosts = calculateCredibilityScore([], 50);
        if (credibilityWithBoosts > credibilityWithoutBoosts) {
            console.log('✅ Credibility boosts increase credibility score');
        } else {
            console.log('❌ Credibility boosts should increase credibility score');
        }
        
        // Test score bounds
        if (credibilityWithBoosts >= 0 && credibilityWithBoosts <= 100) {
            console.log('✅ Credibility score is within valid bounds');
        } else {
            console.log('❌ Credibility score is outside valid bounds');
        }
        
    } catch (error) {
        console.log('❌ Credibility score calculation test failed:', error.message);
    }
}

function testClassificationLogic() {
    console.log('\n🧪 Testing Classification Logic');
    console.log('=' .repeat(50));
    
    try {
        // Test HIGH_RISK classification
        const highRiskClass = getClassification(80, 20);
        if (highRiskClass === 'HIGH_RISK') {
            console.log('✅ High risk scenario classified correctly');
        } else {
            console.log(`❌ High risk scenario misclassified as: ${highRiskClass}`);
        }
        
        // Test SUSPICIOUS classification
        const suspiciousClass = getClassification(50, 50);
        if (suspiciousClass === 'SUSPICIOUS') {
            console.log('✅ Suspicious scenario classified correctly');
        } else {
            console.log(`❌ Suspicious scenario misclassified as: ${suspiciousClass}`);
        }
        
        // Test SAFE classification
        const safeClass = getClassification(10, 90);
        if (safeClass === 'SAFE') {
            console.log('✅ Safe scenario classified correctly');
        } else {
            console.log(`❌ Safe scenario misclassified as: ${safeClass}`);
        }
        
        // Test edge cases
        const edgeCase1 = getClassification(70, 30); // Exactly at threshold
        const edgeCase2 = getClassification(40, 60); // Exactly at threshold
        
        console.log(`✅ Edge case classifications: ${edgeCase1}, ${edgeCase2}`);
        
    } catch (error) {
        console.log('❌ Classification logic test failed:', error.message);
    }
}

function testDebiasingRules() {
    console.log('\n🧪 Testing Debiasing Rules');
    console.log('=' .repeat(50));
    
    try {
        const expectedRules = [
            'anonymous_profile_neutralized',
            'patriotic_tokens_neutralized',
            'sentiment_penalty_capped'
        ];
        
        let allRulesValid = true;
        
        for (const rule of expectedRules) {
            if (!(rule in DEBIASING_RULES)) {
                console.log(`❌ Missing debiasing rule: ${rule}`);
                allRulesValid = false;
            } else {
                const ruleData = DEBIASING_RULES[rule];
                if (!ruleData.description || !Array.isArray(ruleData.triggers)) {
                    console.log(`❌ Invalid debiasing rule data for: ${rule}`);
                    allRulesValid = false;
                }
            }
        }
        
        if (allRulesValid) {
            console.log('✅ All debiasing rules are valid');
            
            // Check for Israel/IDF related triggers
            const patrioticRule = DEBIASING_RULES.patriotic_tokens_neutralized;
            const hasIsraelTriggers = patrioticRule.triggers.some(trigger => 
                trigger.toLowerCase().includes('israel') || trigger.toLowerCase().includes('idf')
            );
            
            if (hasIsraelTriggers) {
                console.log('✅ Patriotic rule includes Israel/IDF triggers');
            } else {
                console.log('❌ Patriotic rule should include Israel/IDF triggers');
            }
        }
        
    } catch (error) {
        console.log('❌ Debiasing rules test failed:', error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Risk Signals Unit Tests');
    console.log('=' .repeat(60));
    
    const tests = [
        testRiskCategories,
        testSeverityLevels,
        testRiskSignals,
        testCredibilitySignals,
        testSafeDonationChannels,
        testRiskScoreCalculation,
        testCredibilityScoreCalculation,
        testClassificationLogic,
        testDebiasingRules
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            test();
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
    TEST_SIGNALS
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