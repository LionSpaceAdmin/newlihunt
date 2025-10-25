#!/usr/bin/env node

/**
 * Script to check if all required environment variables are configured
 */

const requiredVars = {
  production: [
    'GEMINI_API_KEY',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'BLOB_READ_WRITE_TOKEN',
  ],
  development: [
    'GEMINI_API_KEY',
  ],
  optional: [
    'KV_REST_API_READ_ONLY_TOKEN',
    'NEXT_PUBLIC_SITE_URL',
  ],
};

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

console.log('🔍 Checking environment variables...\n');
console.log(`Environment: ${env}\n`);

const varsToCheck = isProduction ? requiredVars.production : requiredVars.development;
const missing = [];
const present = [];

// Check required variables
varsToCheck.forEach(varName => {
  if (process.env[varName]) {
    present.push(varName);
    console.log(`✅ ${varName}: configured`);
  } else {
    missing.push(varName);
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n📋 Optional variables:');
requiredVars.optional.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: configured`);
  } else {
    console.log(`⚠️  ${varName}: not set (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (missing.length === 0) {
  console.log('✅ All required environment variables are configured!');
  console.log('\n🚀 Ready to deploy!');
  process.exit(0);
} else {
  console.log(`❌ Missing ${missing.length} required variable(s):`);
  missing.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📖 Setup instructions:');
  console.log('   1. Check SETUP_GUIDE.md for detailed instructions');
  console.log('   2. Configure missing variables in Vercel Dashboard');
  console.log('   3. Run: vercel env pull .env.local (for local dev)');
  
  if (isProduction) {
    console.log('\n⚠️  Production deployment may fail without these variables!');
    process.exit(1);
  } else {
    console.log('\n⚠️  Some features may not work without these variables.');
    console.log('   The app will run in "fail-open" mode (without rate limiting/caching).');
    process.exit(0);
  }
}
