/**
 * Email Diagnostic Script
 *
 * Checks all required conditions for email sending after registration
 * Run this before testing: node scripts/diagnose-email-issue.js
 */

console.log('🔍 Email Diagnostic Check\n');
console.log('=' .repeat(60));

// Check 1: Environment Variables
console.log('\n1️⃣ Checking Environment Variables...\n');

const requiredEnvVars = {
  'STRIPE_SECRET_KEY': 'Stripe API key for payment processing',
  'STRIPE_WEBHOOK_SECRET': 'Webhook signature verification (from stripe listen)',
  'NEH_AWS_ACCESS_KEY_ID': 'AWS SES access key for sending emails',
  'NEH_AWS_SECRET_ACCESS_KEY': 'AWS SES secret key',
  'ADMIN_EMAIL': 'Email address to receive admin notifications',
  'SES_FROM_EMAIL': 'Sender email address for notifications',
};

let missingVars = [];
let presentVars = [];

Object.entries(requiredEnvVars).forEach(([key, description]) => {
  if (process.env[key]) {
    presentVars.push(key);
    console.log(`   ✅ ${key}`);
    console.log(`      ${description}`);

    // Show partial value for verification (safe)
    if (key.includes('KEY') || key.includes('SECRET')) {
      const value = process.env[key];
      const preview = value.substring(0, 12) + '...';
      console.log(`      Value: ${preview}`);
    } else {
      console.log(`      Value: ${process.env[key]}`);
    }
    console.log();
  } else {
    missingVars.push(key);
    console.log(`   ❌ ${key} - MISSING!`);
    console.log(`      ${description}`);
    console.log();
  }
});

// Check 2: Stripe Key Type
console.log('2️⃣ Checking Stripe Configuration...\n');

if (process.env.STRIPE_SECRET_KEY) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (stripeKey.startsWith('sk_test_')) {
    console.log('   ✅ Using SANDBOX key (correct for testing)');
  } else if (stripeKey.startsWith('sk_live_')) {
    console.log('   ⚠️  Using PRODUCTION key (not recommended for local testing!)');
  } else {
    console.log('   ❌ Invalid Stripe key format');
  }
  console.log();
}

if (process.env.STRIPE_WEBHOOK_SECRET) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret.startsWith('whsec_')) {
    console.log('   ✅ Webhook secret format is correct');
  } else {
    console.log('   ❌ Invalid webhook secret format (should start with whsec_)');
  }
  console.log();
}

// Check 3: AWS SES Configuration
console.log('3️⃣ Checking AWS SES Configuration...\n');

if (process.env.NEH_AWS_ACCESS_KEY_ID) {
  const accessKey = process.env.NEH_AWS_ACCESS_KEY_ID;

  if (accessKey.startsWith('AKIA')) {
    console.log('   ✅ AWS Access Key format is correct');
  } else {
    console.log('   ⚠️  Unusual AWS Access Key format (should start with AKIA)');
  }
  console.log();
}

// Summary
console.log('=' .repeat(60));
console.log('\n📊 SUMMARY\n');

if (missingVars.length === 0) {
  console.log('✅ All environment variables are set!\n');
} else {
  console.log(`❌ Missing ${missingVars.length} required variable(s):\n`);
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log();
}

// Next Steps
console.log('=' .repeat(60));
console.log('\n🔧 NEXT STEPS\n');

if (missingVars.length > 0) {
  console.log('1. Add missing variables to your .env file');
  console.log('2. Restart netlify dev for changes to take effect\n');
} else {
  console.log('Environment variables look good! Next check:\n');
  console.log('1. Is Stripe CLI running?');
  console.log('   Run: stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook\n');
  console.log('2. Is netlify dev running?');
  console.log('   Run: netlify dev\n');
  console.log('3. Check terminal output after payment:');
  console.log('   - Stripe CLI should show: [200] POST /stripe-webhook');
  console.log('   - Netlify dev should show: "Processing checkout.session.completed"');
  console.log('   - Should see: "Registration confirmation emails sent successfully"\n');
}

console.log('=' .repeat(60));
console.log('\n📝 COMMON ISSUES\n');
console.log('❌ Payment succeeds but no webhook fired:');
console.log('   → Stripe CLI is NOT running');
console.log('   → Solution: Start stripe listen command\n');

console.log('❌ Webhook fires but signature verification fails:');
console.log('   → STRIPE_WEBHOOK_SECRET is wrong or missing');
console.log('   → Solution: Copy secret from stripe listen output to .env\n');

console.log('❌ Webhook succeeds but email fails:');
console.log('   → AWS SES credentials are wrong or missing');
console.log('   → AWS SES in sandbox mode (recipient not verified)');
console.log('   → Solution: Check AWS SES console\n');

console.log('=' .repeat(60));
