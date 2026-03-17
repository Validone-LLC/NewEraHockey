const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const crypto = require('crypto');

// Allowed origins for CORS — internal endpoint called by stripe-webhook
const ALLOWED_ORIGINS = [
  'https://newerahockeytraining.com',
  'https://www.newerahockeytraining.com',
  'https://newerahockey.netlify.app',
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.match(/^https:\/\/[a-z0-9-]+--newerahockey\.netlify\.app$/)) return true;
  if (origin.match(/^http:\/\/localhost:\d+$/)) return true;
  if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) return true;
  return false;
}

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
 * Find paired (unbooked) At Home Training slot on the same day.
 *
 * Logic: any other Orange (#6) At Home Training event on the same calendar
 * day that is NOT the one just booked is considered the paired slot.
 * This is time-agnostic — works for any slot times, not just 3:30/5:00.
 */
async function findPairedSlot(calendar, calendarId, bookedEventId, slotDate) {
  try {
    console.log('Finding paired slot for:', { bookedEventId, slotDate });

    // Use Eastern Time offset to build day boundaries so we match the
    // business calendar regardless of the server's timezone (UTC in Lambda).
    // EST = UTC-5, EDT = UTC-4. Using -5 is safe: worst case we include
    // an extra hour on each side, which doesn't cause false positives
    // because we still filter by date string and color.
    const startOfDay = new Date(`${slotDate}T00:00:00-05:00`);
    const endOfDay = new Date(`${slotDate}T23:59:59-05:00`);

    console.log('Searching events between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
    });

    const events = response.data.items || [];
    console.log('Found', events.length, 'events on this day');

    for (const event of events) {
      if (event.id === bookedEventId) continue;

      const eventSummary = (event.summary || '').toLowerCase();
      const isOrange = event.colorId === '6';
      const isAtHomeTraining = eventSummary.includes('at home') || eventSummary.includes('training');

      console.log('Checking event:', {
        id: event.id,
        summary: event.summary,
        colorId: event.colorId,
        isOrange,
        isAtHomeTraining,
      });

      if (isOrange && isAtHomeTraining) {
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
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

  // CORS headers — restricted to known origins (internal endpoint)
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Verify internal secret — this endpoint is only for internal calls from stripe-webhook
  const expectedSecret = process.env.CALENDAR_UPDATE_SECRET;
  if (!expectedSecret) {
    console.error('CALENDAR_UPDATE_SECRET not configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  const providedSecret = event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'] || '';
  const secretsMatch =
    providedSecret.length === expectedSecret.length &&
    crypto.timingSafeEqual(Buffer.from(providedSecret), Buffer.from(expectedSecret));

  if (!secretsMatch) {
    console.warn('Unauthorized request to calendar-update-event');
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  try {
    const { eventId, formData, eventType, slotDate, slotTime } = parsedBody;

    if (!eventId || !formData || !eventType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: eventId, formData, eventType' }),
      };
    }

    // Ensure players is an array (required for formatBookingDetails)
    if (!Array.isArray(formData.players) || formData.players.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'formData.players must be a non-empty array' }),
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
    if (isAtHomeTraining && slotDate) {
      const pairedEventId = await findPairedSlot(calendar, calendarId, eventId, slotDate);

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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
    };
  }
};
