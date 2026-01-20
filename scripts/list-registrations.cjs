#!/usr/bin/env node
/**
 * List all registrations in Netlify Blob Storage
 *
 * Usage: node scripts/list-registrations.cjs
 *
 * Requires environment variables:
 * - NETLIFY_SITE_ID
 * - NETLIFY_AUTH_TOKEN
 */

require('dotenv').config();
const { getStore } = require('@netlify/blobs');

async function listRegistrations() {
  if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
    console.error('❌ Missing NETLIFY_SITE_ID or NETLIFY_AUTH_TOKEN');
    console.error('   Set these in your .env file');
    process.exit(1);
  }

  const store = getStore({
    name: 'registrations',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
  });

  try {
    console.log('📋 Fetching all registrations from Netlify Blobs...\n');

    const list = await store.list();

    if (!list.blobs || list.blobs.length === 0) {
      console.log('No registrations found.');
      return;
    }

    console.log(`Found ${list.blobs.length} registration(s):\n`);

    for (const item of list.blobs) {
      const data = await store.get(item.key, { type: 'json' });

      console.log('─'.repeat(60));
      console.log(`Event ID: ${item.key}`);

      if (data) {
        console.log(`  Max Capacity: ${data.maxCapacity}`);
        console.log(`  Current Registrations: ${data.currentRegistrations}`);
        console.log(`  Created: ${data.createdAt}`);
        console.log(`  Updated: ${data.updatedAt}`);

        if (data.registrations && data.registrations.length > 0) {
          console.log(`  Registrations:`);
          data.registrations.forEach((reg, idx) => {
            console.log(`    ${idx + 1}. ${reg.playerFirstName} ${reg.playerLastName} (${reg.timestamp})`);
            console.log(`       Guardian: ${reg.guardianEmail}`);
          });
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listRegistrations();
