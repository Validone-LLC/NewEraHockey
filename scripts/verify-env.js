#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Checks required environment variables for Netlify Functions
 */

const requiredVars = {
  'NEH_AWS_ACCESS_KEY_ID': 'AWS SES Access Key ID',
  'NEH_AWS_SECRET_ACCESS_KEY': 'AWS SES Secret Access Key',
  'NEH_AWS_REGION': 'AWS Region',
  'SES_FROM_EMAIL': 'Sender Email Address',
  'ADMIN_EMAIL': 'Admin Notification Email',
};

console.log('🔍 Environment Variable Verification\n');
console.log('=' . repeat(50));

let allPresent = true;
let hasIssues = false;

for (const [key, description] of Object.entries(requiredVars)) {
  const value = process.env[key];
  const isSet = !!value;

  if (isSet) {
    // Mask sensitive values
    let displayValue = value;
    if (key.includes('SECRET') || key.includes('KEY')) {
      displayValue = value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }

    console.log(`✅ ${key}`);
    console.log(`   ${description}: ${displayValue}`);

    // Additional validation
    if (key === 'ADMIN_EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        console.log(`   ⚠️  WARNING: Invalid email format!`);
        hasIssues = true;
      } else if (value.length < 10) {
        console.log(`   ⚠️  WARNING: Email seems too short, possible truncation!`);
        hasIssues = true;
      }
    }

    if (key === 'SES_FROM_EMAIL') {
      if (!value.includes('@newerahockeytraining.com')) {
        console.log(`   ⚠️  WARNING: Should use @newerahockeytraining.com domain!`);
        hasIssues = true;
      }
    }
  } else {
    console.log(`❌ ${key}`);
    console.log(`   ${description}: NOT SET`);
    allPresent = false;
  }
  console.log('');
}

console.log('=' . repeat(50));

if (allPresent && !hasIssues) {
  console.log('✅ All environment variables are properly configured!');
  process.exit(0);
} else if (!allPresent) {
  console.log('❌ Missing required environment variables!');
  console.log('\nPlease configure missing variables in:');
  console.log('  - Local: .env file');
  console.log('  - Production: Netlify Dashboard → Environment variables');
  process.exit(1);
} else {
  console.log('⚠️  Environment variables present but have validation issues!');
  console.log('Please review warnings above.');
  process.exit(1);
}
