#!/usr/bin/env node

// Comprehensive test runner for all AI module components
const { runAllTests: runGeminiTests } = require('./test-gemini-client');
const { runAllTests: runRiskSignalTests } = require('./test-risk-signals');
const { runAllTests: runLambdaTests } = require('./test');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

// Test suite configuration
const TEST_SUITES = [
    {
        name: 'Risk Signals Module',
        runner: runRiskSignalTests,
        description: 'Tests for risk detection rules, scoring, and classification logic'
    },
    {
        name: 'Gemini Client Module',
        runner: runGeminiTests,
        description: 'Tests for AI client, image processing, and response validation'
    },
    {
        name: 'Lambda Function Integration',
        runner: runLambdaTests,
        description: 'Tests for Lambda handler, input validation, and error handling'
    }
];

// Performance monitoring
class TestMetrics {
    constructor() {
        this.startTime = Date.now();
        this.suiteResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    addSuiteResult(suiteName, passed, duration, testCount = 1) {
        this.suiteResults.push({
            name: suiteName,
            passed,
            duration,
            testCount
        });
        this.totalTests += testCount;
        if (passed) this.passedTests += testCount;
    }

    getTotalDuration() {
        return Date.now() - this.startTime;
    }

    getSuccessRate() {
        return this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(1) : 0;
    }

    printSummary() {
        const totalDuration = this.getTotalDuration();
        const successRate = this.getSuccessRate();

        console.log('\n' + colorize('=' .repeat(80), 'cyan'));
        console.log(colorize('📊 COMPREHENSIVE TEST SUMMARY', 'bright'));
        console.log(colorize('=' .repeat(80), 'cyan'));

        // Overall results
        console.log(`\n${colorize('Overall Results:', 'bright')}`);
        console.log(`  Total Test Suites: ${this.suiteResults.length}`);
        console.log(`  Success Rate: ${colorize(successRate + '%', successRate === '100.0' ? 'green' : 'yellow')}`);
        console.log(`  Total Duration: ${colorize(totalDuration + 'ms', 'blue')}`);

        // Suite breakdown
        console.log(`\n${colorize('Suite Breakdown:', 'bright')}`);
        for (const result of this.suiteResults) {
            const status = result.passed ? 
                colorize('✅ PASSED', 'green') : 
                colorize('❌ FAILED', 'red');
            
            console.log(`  ${result.name}: ${status} (${result.duration}ms)`);
        }

        // Performance analysis
        const avgDuration = this.suiteResults.length > 0 ? 
            (this.suiteResults.reduce((sum, r) => sum + r.duration, 0) / this.suiteResults.length).toFixed(0) : 0;
        
        console.log(`\n${colorize('Performance Analysis:', 'bright')}`);
        console.log(`  Average Suite Duration: ${avgDuration}ms`);
        
        const slowSuites = this.suiteResults.filter(r => r.duration > 1000);
        if (slowSuites.length > 0) {
            console.log(`  ${colorize('⚠️  Slow Suites:', 'yellow')} ${slowSuites.map(s => s.name).join(', ')}`);
        }

        // Recommendations
        console.log(`\n${colorize('Recommendations:', 'bright')}`);
        if (successRate === '100.0') {
            console.log(`  ${colorize('🎉 All tests passed! Code is ready for deployment.', 'green')}`);
        } else {
            console.log(`  ${colorize('🔧 Fix failing tests before deployment.', 'yellow')}`);
        }

        if (totalDuration > 10000) {
            console.log(`  ${colorize('⏱️  Consider optimizing test performance.', 'yellow')}`);
        }

        console.log(colorize('=' .repeat(80), 'cyan'));
    }
}

// Environment validation
function validateEnvironment() {
    console.log(colorize('🔍 Validating Test Environment', 'blue'));
    console.log('-' .repeat(40));

    const checks = [
        {
            name: 'Node.js Version',
            check: () => {
                const version = process.version;
                const major = parseInt(version.slice(1).split('.')[0]);
                return { passed: major >= 18, details: version };
            }
        },
        {
            name: 'Required Modules',
            check: () => {
                try {
                    require('./gemini-client');
                    require('./risk-signals');
                    return { passed: true, details: 'All modules found' };
                } catch (error) {
                    return { passed: false, details: error.message };
                }
            }
        },
        {
            name: 'Environment Variables',
            check: () => {
                const hasApiKey = !!process.env.GEMINI_API_KEY;
                return { 
                    passed: true, // Don't fail tests for missing API key
                    details: hasApiKey ? 'API key configured' : 'API key not set (some tests may fail)'
                };
            }
        }
    ];

    let allPassed = true;
    for (const check of checks) {
        const result = check.check();
        const status = result.passed ? 
            colorize('✅', 'green') : 
            colorize('❌', 'red');
        
        console.log(`  ${status} ${check.name}: ${result.details}`);
        if (!result.passed) allPassed = false;
    }

    console.log('');
    return allPassed;
}

// Main test execution
async function runAllTestSuites() {
    console.log(colorize('🚀 SCAM HUNT PLATFORM - AI MODULE TEST SUITE', 'bright'));
    console.log(colorize('=' .repeat(60), 'cyan'));
    console.log('Testing all AI analysis components for reliability and performance\n');

    // Validate environment
    const envValid = validateEnvironment();
    if (!envValid) {
        console.log(colorize('⚠️  Environment validation failed. Some tests may not work correctly.\n', 'yellow'));
    }

    const metrics = new TestMetrics();
    let overallSuccess = true;

    // Run each test suite
    for (const suite of TEST_SUITES) {
        console.log(colorize(`\n🧪 Running ${suite.name}`, 'bright'));
        console.log(colorize(`📝 ${suite.description}`, 'blue'));
        console.log('-' .repeat(60));

        const suiteStartTime = Date.now();
        
        try {
            const success = await suite.runner();
            const duration = Date.now() - suiteStartTime;
            
            metrics.addSuiteResult(suite.name, success, duration);
            
            if (!success) {
                overallSuccess = false;
            }

            const status = success ? 
                colorize('✅ SUITE PASSED', 'green') : 
                colorize('❌ SUITE FAILED', 'red');
            
            console.log(`\n${status} (${duration}ms)`);

        } catch (error) {
            const duration = Date.now() - suiteStartTime;
            metrics.addSuiteResult(suite.name, false, duration);
            overallSuccess = false;

            console.log(colorize(`\n❌ SUITE CRASHED: ${error.message}`, 'red'));
            console.log(colorize(`Stack trace: ${error.stack}`, 'red'));
        }
    }

    // Print comprehensive summary
    metrics.printSummary();

    // Exit with appropriate code
    return overallSuccess;
}

// CLI argument handling
function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        verbose: args.includes('--verbose') || args.includes('-v'),
        suite: null,
        help: args.includes('--help') || args.includes('-h')
    };

    // Extract specific suite name
    const suiteIndex = args.findIndex(arg => arg === '--suite');
    if (suiteIndex !== -1 && args[suiteIndex + 1]) {
        options.suite = args[suiteIndex + 1];
    }

    return options;
}

function showHelp() {
    console.log(colorize('Scam Hunt Platform - AI Module Test Runner', 'bright'));
    console.log('\nUsage: node run-all-tests.js [options]');
    console.log('\nOptions:');
    console.log('  --help, -h          Show this help message');
    console.log('  --verbose, -v       Enable verbose output');
    console.log('  --suite <name>      Run specific test suite only');
    console.log('\nAvailable test suites:');
    for (const suite of TEST_SUITES) {
        console.log(`  - "${suite.name}"`);
    }
    console.log('\nExamples:');
    console.log('  node run-all-tests.js');
    console.log('  node run-all-tests.js --verbose');
    console.log('  node run-all-tests.js --suite "Gemini Client Module"');
}

// Run specific test suite
async function runSpecificSuite(suiteName) {
    const suite = TEST_SUITES.find(s => s.name === suiteName);
    
    if (!suite) {
        console.log(colorize(`❌ Test suite "${suiteName}" not found`, 'red'));
        console.log('\nAvailable suites:');
        for (const s of TEST_SUITES) {
            console.log(`  - ${s.name}`);
        }
        return false;
    }

    console.log(colorize(`🧪 Running ${suite.name} Only`, 'bright'));
    console.log(colorize(`📝 ${suite.description}`, 'blue'));
    console.log('-' .repeat(60));

    try {
        const success = await suite.runner();
        const status = success ? 
            colorize('✅ SUITE PASSED', 'green') : 
            colorize('❌ SUITE FAILED', 'red');
        
        console.log(`\n${status}`);
        return success;

    } catch (error) {
        console.log(colorize(`\n❌ SUITE CRASHED: ${error.message}`, 'red'));
        return false;
    }
}

// Main execution
async function main() {
    const options = parseArguments();

    if (options.help) {
        showHelp();
        return;
    }

    try {
        let success;
        
        if (options.suite) {
            success = await runSpecificSuite(options.suite);
        } else {
            success = await runAllTestSuites();
        }

        process.exit(success ? 0 : 1);

    } catch (error) {
        console.error(colorize(`\n💥 Test runner failed: ${error.message}`, 'red'));
        console.error(colorize(`Stack trace: ${error.stack}`, 'red'));
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(colorize(`\n💥 Uncaught exception: ${error.message}`, 'red'));
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(colorize(`\n💥 Unhandled rejection at: ${promise}, reason: ${reason}`, 'red'));
    process.exit(1);
});

// Export for programmatic use
module.exports = {
    runAllTestSuites,
    runSpecificSuite,
    TEST_SUITES
};

// Run if called directly
if (require.main === module) {
    main();
}