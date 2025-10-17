const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

/**
 * Netlify Function: Batch Update Event Extended Properties
 *
 * Updates multiple Google Calendar events with registration metadata
 * (price, maxCapacity, eventType, registrationEnabled)
 *
 * SECURITY: This function should only be called by admins
 * Set ADMIN_UPDATE_SECRET in Netlify environment variables
 *
 * Usage:
 * POST /.netlify/functions/batch-update-events
 * Headers: { "x-admin-secret": "your_secret_here" }
 * Body: {
 *   "updates": [
 *     {
 *       "eventId": "abc123",
 *       "eventType": "camp",
 *       "price": "350",
 *       "maxCapacity": "20",
 *       "registrationEnabled": "true"
 *     },
 *     ...
 *   ]
 * }
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // SECURITY: Verify admin secret
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
    const expectedSecret = process.env.ADMIN_UPDATE_SECRET;

    if (!expectedSecret) {
      console.error('ADMIN_UPDATE_SECRET not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Admin secret not configured',
        }),
      };
    }

    if (adminSecret !== expectedSecret) {
      console.warn('Invalid admin secret provided');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid admin secret',
        }),
      };
    }

    // Parse request body
    const { updates } = JSON.parse(event.body);

    if (!Array.isArray(updates) || updates.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad request',
          message: 'Updates array is required and must not be empty',
        }),
      };
    }

    // Authenticate with Google Calendar API
    const calendarId = process.env.CALENDAR_ID || 'coachwill@newerahockeytraining.com';

    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Invalid GOOGLE_SERVICE_ACCOUNT_KEY format',
        }),
      };
    }

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      clientOptions: {
        subject: calendarId,
      },
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Process each update
    const results = [];

    for (const update of updates) {
      try {
        const { eventId, eventType, price, maxCapacity, registrationEnabled } = update;

        if (!eventId) {
          results.push({
            eventId: null,
            success: false,
            error: 'Event ID is required',
          });
          continue;
        }

        // Build extended properties
        const extendedProperties = {
          shared: {},
        };

        if (eventType) extendedProperties.shared.eventType = eventType;
        if (price !== undefined) extendedProperties.shared.price = String(price);
        if (maxCapacity !== undefined)
          extendedProperties.shared.maxCapacity = String(maxCapacity);
        if (registrationEnabled !== undefined)
          extendedProperties.shared.registrationEnabled = String(registrationEnabled);

        // Initialize currentRegistrations if not set (don't overwrite existing)
        if (!update.preserveRegistrations) {
          extendedProperties.shared.currentRegistrations = '0';
        }

        // Update event
        await calendar.events.patch({
          calendarId: calendarId,
          eventId: eventId,
          resource: {
            extendedProperties: extendedProperties,
          },
        });

        results.push({
          eventId: eventId,
          success: true,
          message: 'Event updated successfully',
        });
      } catch (error) {
        console.error(`Failed to update event ${update.eventId}:`, error);
        results.push({
          eventId: update.eventId,
          success: false,
          error: error.message,
        });
      }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Batch update complete: ${successCount} succeeded, ${failureCount} failed`,
        totalProcessed: results.length,
        successCount,
        failureCount,
        results: results,
      }),
    };
  } catch (error) {
    console.error('Batch update error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
