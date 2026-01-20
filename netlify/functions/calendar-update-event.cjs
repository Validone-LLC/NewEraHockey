const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

/**
 * Calendar Update Event - Netlify Function
 *
 * Handles post-booking calendar operations:
 * 1. Update booked event color (Orange #6 → Yellow #5 for At Home Training, Basil #10 → Yellow #5 for Mt Vernon Skating)
 * 2. Append booking details to event description
 * 3. Find and delete paired time slot on same day (At Home Training only)
 */

/**
 * Format booking details for calendar description
 */
function formatBookingDetails(formData, eventType) {
  const lines = [];

  lines.push('=== BOOKING DETAILS ===\n');

  // Players
  lines.push('PLAYERS:');
  formData.players.forEach((player, idx) => {
    lines.push(`  ${idx + 1}. ${player.firstName} ${player.lastName}`);
    lines.push(`     DOB: ${player.dateOfBirth}`);
    lines.push(`     Level: ${player.levelOfPlay}`);
  });
  lines.push('');

  // Guardian
  lines.push('PARENT/GUARDIAN:');
  lines.push(`  ${formData.guardianFirstName} ${formData.guardianLastName}`);
  lines.push(`  Email: ${formData.guardianEmail}`);
  lines.push(`  Phone: ${formData.guardianPhone}`);
  lines.push(`  Relationship: ${formData.guardianRelationship}`);
  lines.push('');

  // Address (At Home Training only)
  if (eventType === 'at_home_training') {
    lines.push('ADDRESS:');
    lines.push(`  ${formData.addressStreet}${formData.addressUnit ? ' ' + formData.addressUnit : ''}`);
    lines.push(`  ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`);
    lines.push(`  ${formData.addressCountry}`);
    lines.push('');
  }

  // Emergency Contact (if provided)
  if (formData.emergencyName || formData.emergencyPhone) {
    lines.push('EMERGENCY CONTACT:');
    if (formData.emergencyName) lines.push(`  Name: ${formData.emergencyName}`);
    if (formData.emergencyPhone) lines.push(`  Phone: ${formData.emergencyPhone}`);
    if (formData.emergencyRelationship) lines.push(`  Relationship: ${formData.emergencyRelationship}`);
    lines.push('');
  }

  // Medical Notes (if provided)
  if (formData.medicalNotes) {
    lines.push('MEDICAL NOTES:');
    lines.push(`  ${formData.medicalNotes}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Find paired time slot on same day
 * If booked 3:30pm, find 5:00pm (and vice versa)
 */
async function findPairedSlot(calendar, calendarId, bookedEventId, slotDate, bookedTime) {
  try {
    console.log('Finding paired slot for:', { bookedEventId, slotDate, bookedTime });

    // Normalize the booked time (could be "3:30 PM" or "3:30pm" etc.)
    const normalizedBookedTime = bookedTime.toLowerCase().replace(/\s+/g, '');

    // Determine paired time based on booked time
    let pairedTimeHour;
    if (normalizedBookedTime.includes('3:30')) {
      pairedTimeHour = '5'; // Looking for 5:00pm slot
    } else if (normalizedBookedTime.includes('5:00') || normalizedBookedTime.includes('5pm')) {
      pairedTimeHour = '3'; // Looking for 3:30pm slot
    } else {
      console.log('Unknown time slot format:', bookedTime, '(normalized:', normalizedBookedTime, ')');
      return null;
    }

    console.log('Looking for paired slot with hour:', pairedTimeHour);

    // Search for events on same date
    const startOfDay = new Date(slotDate + 'T00:00:00');
    const endOfDay = new Date(slotDate + 'T23:59:59');

    console.log('Searching events between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
    });

    const events = response.data.items || [];
    console.log('Found', events.length, 'events on this day');

    // Find event with paired time and Orange color (#6)
    for (const event of events) {
      if (event.id === bookedEventId) {
        console.log('Skipping booked event:', event.id);
        continue;
      }

      const eventSummary = event.summary || '';
      const eventColorId = event.colorId;
      const isOrange = eventColorId === '6';
      const isAtHomeTraining = eventSummary.toLowerCase().includes('at home') ||
                                eventSummary.toLowerCase().includes('training');

      // Check if this event's start time matches the paired hour
      const eventStartTime = event.start?.dateTime;
      let eventHour = null;
      if (eventStartTime) {
        const eventDate = new Date(eventStartTime);
        eventHour = eventDate.getHours();
        // Convert 24h to check: 15 = 3pm, 17 = 5pm
        if (eventHour === 15) eventHour = '3';
        else if (eventHour === 17) eventHour = '5';
        else eventHour = String(eventHour);
      }

      console.log('Checking event:', {
        id: event.id,
        summary: eventSummary,
        colorId: eventColorId,
        isOrange,
        isAtHomeTraining,
        eventHour,
        pairedTimeHour
      });

      if (isOrange && isAtHomeTraining && eventHour === pairedTimeHour) {
        console.log('Found paired slot to delete:', event.id);
        return event.id;
      }
    }

    console.log('No paired slot found');
    return null;
  } catch (error) {
    console.error('Error finding paired slot:', error);
    return null;
  }
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { eventId, formData, eventType, slotDate, slotTime } = JSON.parse(event.body);

    if (!eventId || !formData || !eventType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: eventId, formData, eventType' }),
      };
    }

    // Calendar ID (used for both authentication subject and API calls)
    const calendarId = process.env.CALENDAR_ID || 'coachwill@newerahockeytraining.com';

    // Check for service account key
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable',
        }),
      };
    }

    // Parse service account key from environment variable
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (parseError) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Invalid GOOGLE_SERVICE_ACCOUNT_KEY format',
        }),
      };
    }

    // Create auth client with service account credentials
    // For domain-wide delegation, we need to specify which user to impersonate
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      clientOptions: {
        subject: calendarId, // Impersonate this user via domain-wide delegation
      },
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    // 1. Get current event details
    const currentEvent = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId,
    });

    // 2. Format booking details
    const bookingDetails = formatBookingDetails(formData, eventType);

    // 3. Update event: Change color to Yellow (#5) and append booking details
    const updatedDescription = currentEvent.data.description
      ? `${currentEvent.data.description}\n\n${bookingDetails}`
      : bookingDetails;

    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        colorId: '5', // Yellow (Banana)
        description: updatedDescription,
      },
    });

    console.log(`Updated event ${eventId} to Yellow with booking details`);

    // 4. Find and delete paired time slot (At Home Training only - not for Mt Vernon Skating)
    let pairedEventDeleted = false;
    const isAtHomeTraining = eventType === 'at_home_training';
    if (isAtHomeTraining && slotDate && slotTime) {
      const pairedEventId = await findPairedSlot(calendar, calendarId, eventId, slotDate, slotTime);

      if (pairedEventId) {
        await calendar.events.delete({
          calendarId: calendarId,
          eventId: pairedEventId,
        });

        console.log(`Deleted paired slot event ${pairedEventId}`);
        pairedEventDeleted = true;
      } else {
        console.log('No paired slot found to delete');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        eventUpdated: true,
        pairedEventDeleted,
        message: 'Calendar updated successfully',
      }),
    };
  } catch (error) {
    console.error('Calendar update error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update calendar',
        details: error.message,
      }),
    };
  }
};
