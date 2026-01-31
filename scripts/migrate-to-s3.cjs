/**
 * One-time Migration Script: Netlify Blobs → S3
 *
 * This script copies all existing registration data from Netlify Blob Storage
 * to AWS S3 for the admin panel migration.
 *
 * Usage:
 *   node scripts/migrate-to-s3.cjs
 *
 * Required environment variables (in .env or exported):
 *   - NETLIFY_SITE_ID: Your Netlify site ID
 *   - NETLIFY_AUTH_TOKEN: Netlify personal access token
 *   - NEH_AWS_ACCESS_KEY_ID: AWS access key
 *   - NEH_AWS_SECRET_ACCESS_KEY: AWS secret key
 *   - S3_REGISTRATIONS_BUCKET: S3 bucket name
 *   - NEH_AWS_REGION: AWS region (default: us-east-1)
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const config = {
  netlify: {
    siteId: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
  },
  s3: {
    bucket: process.env.S3_REGISTRATIONS_BUCKET,
    region: process.env.NEH_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  },
};

// Validate configuration
function validateConfig() {
  const missing = [];

  if (!config.netlify.siteId) missing.push('NETLIFY_SITE_ID');
  if (!config.netlify.token) missing.push('NETLIFY_AUTH_TOKEN');
  if (!config.s3.bucket) missing.push('S3_REGISTRATIONS_BUCKET');
  if (!config.s3.accessKeyId) missing.push('NEH_AWS_ACCESS_KEY_ID');
  if (!config.s3.secretAccessKey) missing.push('NEH_AWS_SECRET_ACCESS_KEY');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }
}

// Initialize clients
function getNetlifyStore() {
  return getStore({
    name: 'registrations',
    siteID: config.netlify.siteId,
    token: config.netlify.token,
  });
}

function getS3Client() {
  return new S3Client({
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  });
}

// Check if S3 object exists
async function s3ObjectExists(s3Client, key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting Netlify Blobs → S3 Migration\n');

  validateConfig();

  const netlifyStore = getNetlifyStore();
  const s3Client = getS3Client();

  console.log(`📦 Source: Netlify Blobs (site: ${config.netlify.siteId})`);
  console.log(`📦 Target: S3 (bucket: ${config.s3.bucket})\n`);

  // List all blobs
  console.log('📋 Fetching registration list from Netlify...');
  let list;
  try {
    list = await netlifyStore.list();
  } catch (error) {
    console.error('❌ Failed to list Netlify blobs:', error.message);
    process.exit(1);
  }

  const blobs = list.blobs || [];
  console.log(`   Found ${blobs.length} registration records\n`);

  if (blobs.length === 0) {
    console.log('✅ No registrations to migrate. Done!');
    return;
  }

  // Migrate each blob
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const blob of blobs) {
    const eventId = blob.key;
    const s3Key = `registrations/${eventId}.json`;

    process.stdout.write(`   ${eventId}... `);

    try {
      // Check if already exists in S3
      const exists = await s3ObjectExists(s3Client, s3Key);
      if (exists) {
        console.log('⏭️  already exists, skipping');
        skipped++;
        continue;
      }

      // Fetch from Netlify
      const data = await netlifyStore.get(eventId, { type: 'json' });

      if (!data) {
        console.log('⚠️  empty data, skipping');
        skipped++;
        continue;
      }

      // Write to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: s3Key,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
        Metadata: {
          eventtype: data.eventType || 'other',
          capacity: (data.maxCapacity || 0).toString(),
          registrations: (data.currentRegistrations || 0).toString(),
          migratedfrom: 'netlify-blobs',
          migratedat: new Date().toISOString(),
        },
      }));

      const regCount = data.registrations?.length || 0;
      console.log(`✅ migrated (${regCount} registrations)`);
      migrated++;

    } catch (error) {
      console.log(`❌ failed: ${error.message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary');
  console.log('='.repeat(50));
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Failed:   ${failed}`);
  console.log(`   📦 Total:    ${blobs.length}`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n⚠️  Some migrations failed. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ Migration complete!');
  }
}

// Run
migrate().catch(error => {
  console.error('\n❌ Migration failed with error:', error);
  process.exit(1);
});
