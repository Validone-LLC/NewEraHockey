#!/usr/bin/env node
/**
 * Delete a registration from Netlify Blob Storage
 *
 * Usage: node scripts/delete-registration.cjs <eventId>
 *
 * Requires environment variables:
 * - NETLIFY_SITE_ID
 * - NETLIFY_AUTH_TOKEN
 */

require('dotenv').config();
const { getStore } = require('@netlify/blobs');

async function deleteRegistration(eventId) {
  if (!eventId) {
    console.error('❌ Usage: node scripts/delete-registration.cjs <eventId>');
    process.exit(1);
  }

  if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
    console.error('❌ Missing NETLIFY_SITE_ID or NETLIFY_AUTH_TOKEN');
    process.exit(1);
  }

  const store = getStore({
    name: 'registrations',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
  });

  try {
    // First, show what we're about to delete
    const data = await store.get(eventId, { type: 'json' });

    if (!data) {
      console.log(`❌ No registration found for event ID: ${eventId}`);
      process.exit(1);
    }

    console.log('📋 Found registration:');
    console.log(`   Event ID: ${eventId}`);
    console.log(`   Registrations: ${data.currentRegistrations}`);
    if (data.registrations && data.registrations.length > 0) {
      data.registrations.forEach((reg, idx) => {
        console.log(`     ${idx + 1}. ${reg.playerFirstName} ${reg.playerLastName}`);
      });
    }

    // Delete
    await store.delete(eventId);
    console.log(`\n✅ Successfully deleted registration for event: ${eventId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const eventId = process.argv[2];
deleteRegistration(eventId);
