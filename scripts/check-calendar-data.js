#!/usr/bin/env node
/**
 * Calendar Data Diagnostic Script
 *
 * Fetches calendar events and displays registration metadata to help debug
 * why Register buttons aren't showing.
 *
 * Usage:
 *   node scripts/check-calendar-data.js
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:8888/.netlify/functions/calendar-events';

async function checkCalendarData() {
  console.log('🔍 Fetching calendar events...\n');

  try {
    // Fetch camps
    console.log('📅 CAMPS:\n');
    const campsResponse = await fetch(`${API_URL}?type=camp`);
    const campsData = await campsResponse.json();

    if (!campsResponse.ok) {
      console.error('❌ Error fetching camps:', campsData);
      return;
    }

    if (campsData.events.length === 0) {
      console.log('⚠️  No camp events found\n');
    } else {
      campsData.events.forEach((event, i) => {
        console.log(`${i + 1}. ${event.summary}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Start: ${event.start?.dateTime || event.start?.date}`);

        // Check registration data
        const regData = event.registrationData;
        console.log('\n   Registration Data:');
        console.log(`   ✓ registrationEnabled: ${regData?.registrationEnabled || 'NOT SET'}`);
        console.log(`   ✓ price: ${regData?.price || 'NOT SET'}`);
        console.log(`   ✓ maxCapacity: ${regData?.maxCapacity || 'NOT SET'}`);
        console.log(`   ✓ currentRegistrations: ${regData?.currentRegistrations || 0}`);
        console.log(`   ✓ isSoldOut: ${regData?.isSoldOut || false}`);

        // Check if register button will show
        const canRegister =
          regData?.registrationEnabled === true &&
          regData?.price !== null &&
          regData?.price !== undefined &&
          !regData?.isSoldOut;

        console.log(`\n   ${canRegister ? '✅' : '❌'} Register button will ${canRegister ? 'SHOW' : 'NOT SHOW'}`);

        if (!canRegister) {
          console.log('   Reasons:');
          if (!regData?.registrationEnabled) {
            console.log('   ⚠️  registrationEnabled is not true');
          }
          if (!regData?.price) {
            console.log('   ⚠️  price is not set');
          }
          if (regData?.isSoldOut) {
            console.log('   ⚠️  event is sold out');
          }
        }

        // Check extended properties
        console.log('\n   Extended Properties (Shared):');
        const extProps = event.extendedProperties?.shared || {};
        if (Object.keys(extProps).length === 0) {
          console.log('   ⚠️  No extended properties found');
        } else {
          Object.entries(extProps).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
          });
        }

        console.log('\n' + '─'.repeat(80) + '\n');
      });
    }

    // Fetch lessons
    console.log('\n📅 LESSONS:\n');
    const lessonsResponse = await fetch(`${API_URL}?type=lesson`);
    const lessonsData = await lessonsResponse.json();

    if (!lessonsResponse.ok) {
      console.error('❌ Error fetching lessons:', lessonsData);
      return;
    }

    if (lessonsData.events.length === 0) {
      console.log('⚠️  No lesson events found\n');
    } else {
      lessonsData.events.forEach((event, i) => {
        console.log(`${i + 1}. ${event.summary}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Start: ${event.start?.dateTime || event.start?.date}`);

        const regData = event.registrationData;
        console.log('\n   Registration Data:');
        console.log(`   ✓ registrationEnabled: ${regData?.registrationEnabled || 'NOT SET'}`);
        console.log(`   ✓ price: ${regData?.price || 'NOT SET'}`);
        console.log(`   ✓ maxCapacity: ${regData?.maxCapacity || 'NOT SET'}`);
        console.log(`   ✓ currentRegistrations: ${regData?.currentRegistrations || 0}`);
        console.log(`   ✓ isSoldOut: ${regData?.isSoldOut || false}`);

        const canRegister =
          regData?.registrationEnabled === true &&
          regData?.price !== null &&
          regData?.price !== undefined &&
          !regData?.isSoldOut;

        console.log(`\n   ${canRegister ? '✅' : '❌'} Register button will ${canRegister ? 'SHOW' : 'NOT SHOW'}`);

        if (!canRegister) {
          console.log('   Reasons:');
          if (!regData?.registrationEnabled) {
            console.log('   ⚠️  registrationEnabled is not true');
          }
          if (!regData?.price) {
            console.log('   ⚠️  price is not set');
          }
          if (regData?.isSoldOut) {
            console.log('   ⚠️  event is sold out');
          }
        }

        console.log('\n   Extended Properties (Shared):');
        const extProps = event.extendedProperties?.shared || {};
        if (Object.keys(extProps).length === 0) {
          console.log('   ⚠️  No extended properties found');
        } else {
          Object.entries(extProps).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
          });
        }

        console.log('\n' + '─'.repeat(80) + '\n');
      });
    }

    // Summary
    console.log('\n📊 SUMMARY:\n');
    const totalEvents = campsData.events.length + lessonsData.events.length;
    const eventsWithRegistration = [...campsData.events, ...lessonsData.events].filter(e =>
      e.registrationData?.registrationEnabled === true &&
      e.registrationData?.price !== null &&
      !e.registrationData?.isSoldOut
    ).length;

    console.log(`Total events: ${totalEvents}`);
    console.log(`Events with Register button: ${eventsWithRegistration}`);
    console.log(`Events missing registration setup: ${totalEvents - eventsWithRegistration}`);

    if (eventsWithRegistration === 0) {
      console.log('\n⚠️  NO EVENTS HAVE REGISTRATION ENABLED');
      console.log('\n💡 Next steps:');
      console.log('1. Add extended properties to your calendar events');
      console.log('2. See claudedocs/calendar-setup-guide.md for instructions');
      console.log('3. Required properties: registrationEnabled, price, eventType\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Netlify dev is running (npm run dev or netlify dev)');
    console.log('2. Calendar API is accessible at', API_URL);
    console.log('3. Service account credentials are configured\n');
  }
}

checkCalendarData();
