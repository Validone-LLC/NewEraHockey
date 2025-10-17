/**
 * Browser Console Diagnostic
 *
 * Run this in your browser console while on http://localhost:8888/schedule
 * to diagnose why Register buttons aren't showing.
 *
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 */

(async function diagnoseRegistration() {
  console.log('%c🔍 Registration Diagnostic Tool', 'font-size: 20px; font-weight: bold; color: #14b8a6');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #14b8a6');
  console.log('\n');

  try {
    // Fetch calendar events
    console.log('📅 Fetching calendar events...\n');

    const campsResponse = await fetch('/.netlify/functions/calendar-events?type=camp');
    const campsData = await campsResponse.json();

    const lessonsResponse = await fetch('/.netlify/functions/calendar-events?type=lesson');
    const lessonsData = await lessonsResponse.json();

    const allEvents = [...campsData.events, ...lessonsData.events];

    if (allEvents.length === 0) {
      console.log('%c⚠️ No events found!', 'color: orange; font-weight: bold');
      console.log('Check that your calendar has future events.');
      return;
    }

    console.log(`Found ${allEvents.length} total events (${campsData.events.length} camps, ${lessonsData.events.length} lessons)\n`);

    // Analyze each event
    allEvents.forEach((event, i) => {
      const isUpcoming = new Date(event.start?.dateTime || event.start?.date) > new Date();
      const regData = event.registrationData || {};

      console.group(`${i + 1}. ${event.summary || 'Untitled'}`);

      // Basic info
      console.log(`%cID: ${event.id}`, 'color: #999');
      console.log(`%cStart: ${event.start?.dateTime || event.start?.date}`, 'color: #999');
      console.log(`%cUpcoming: ${isUpcoming ? '✅ Yes' : '❌ No (past event)'}`, isUpcoming ? 'color: green' : 'color: gray');

      // Registration requirements
      console.log('\n%cRegistration Requirements:', 'font-weight: bold; color: #14b8a6');

      const checks = [
        {
          label: '1. Event is upcoming',
          value: isUpcoming,
          actual: isUpcoming ? 'Yes' : 'No',
          required: 'Yes'
        },
        {
          label: '2. registrationEnabled',
          value: regData.registrationEnabled === true,
          actual: String(regData.registrationEnabled),
          required: 'true'
        },
        {
          label: '3. price is set',
          value: regData.price !== null && regData.price !== undefined,
          actual: regData.price || 'NOT SET',
          required: 'any number'
        },
        {
          label: '4. not sold out',
          value: !regData.isSoldOut,
          actual: String(regData.isSoldOut || false),
          required: 'false'
        }
      ];

      checks.forEach(check => {
        const icon = check.value ? '✅' : '❌';
        const color = check.value ? 'green' : 'red';
        console.log(
          `%c${icon} ${check.label}: ${check.actual}`,
          `color: ${color}`
        );
        if (!check.value) {
          console.log(`   %cRequired: ${check.required}`, 'color: orange');
        }
      });

      // Overall result
      const canRegister = checks.every(c => c.value);
      console.log(`\n%c${canRegister ? '✅ REGISTER BUTTON WILL SHOW' : '❌ REGISTER BUTTON WILL NOT SHOW'}`,
        `font-weight: bold; color: ${canRegister ? 'green' : 'red'}`);

      // Extended properties
      console.log('\n%cExtended Properties:', 'font-weight: bold; color: #14b8a6');
      const extProps = event.extendedProperties?.shared || {};
      if (Object.keys(extProps).length === 0) {
        console.log('%c⚠️ No extended properties found', 'color: orange');
        console.log('%cYou need to add these to your Google Calendar event:', 'color: orange');
        console.log({
          registrationEnabled: 'true',
          price: '350',
          eventType: 'camp',
          maxCapacity: '20',
          currentRegistrations: '0'
        });
      } else {
        console.table(extProps);
      }

      // What the code sees
      console.log('\n%cFull Registration Data:', 'font-weight: bold; color: #14b8a6');
      console.table(regData);

      console.groupEnd();
      console.log('\n');
    });

    // Summary
    const withButtons = allEvents.filter(e => {
      const isUpcoming = new Date(e.start?.dateTime || e.start?.date) > new Date();
      const rd = e.registrationData || {};
      return isUpcoming && rd.registrationEnabled === true && rd.price && !rd.isSoldOut;
    });

    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #14b8a6');
    console.log('%c📊 SUMMARY', 'font-size: 16px; font-weight: bold; color: #14b8a6');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #14b8a6');
    console.log(`\nTotal events: ${allEvents.length}`);
    console.log(`%cEvents with Register button: ${withButtons.length}`, withButtons.length > 0 ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
    console.log(`Events missing setup: ${allEvents.length - withButtons.length}`);

    if (withButtons.length === 0) {
      console.log('\n%c⚠️ NO REGISTER BUTTONS WILL APPEAR', 'color: red; font-weight: bold; font-size: 14px');
      console.log('\n%c💡 How to fix:', 'color: #14b8a6; font-weight: bold');
      console.log('1. Open your Google Calendar');
      console.log('2. Edit each event you want registration for');
      console.log('3. Add Extended Properties (you may need Google Apps Script or API)');
      console.log('4. See claudedocs/calendar-setup-guide.md for detailed instructions\n');

      console.log('%cRequired Extended Properties (Shared):', 'font-weight: bold');
      console.table({
        registrationEnabled: 'true',
        price: '350',
        eventType: 'camp',
        maxCapacity: '20',
        currentRegistrations: '0'
      });
    } else {
      console.log('\n%c✅ Some events are properly configured!', 'color: green; font-weight: bold');
    }

  } catch (error) {
    console.error('%c❌ Error running diagnostic:', 'color: red; font-weight: bold', error);
    console.log('\n%c💡 Troubleshooting:', 'color: orange; font-weight: bold');
    console.log('- Make sure you are on http://localhost:8888/schedule');
    console.log('- Check that Netlify Dev is running');
    console.log('- Verify calendar API credentials are configured');
  }
})();
