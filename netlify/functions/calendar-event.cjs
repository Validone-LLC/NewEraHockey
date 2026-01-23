const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const { enrichEventWithRegistrationData } = require('./lib/eventUtils.cjs');

/**
 * Netlify Function: Fetch Single Google Calendar Event by ID
 *
 * Optimized endpoint for fetching a single event instead of listing all events.
 * Uses calendar.events.get() for direct lookup by event ID.
 *
 * Environment Variables Required:
 * - GOOGLE_SERVICE_ACCOUNT_KEY: Service account JSON key (required)
 * - CALENDAR_ID: Calendar to fetch events from (default: coachwill@newerahockeytraining.com)
 *
 * Query Parameters:
 * - eventId: Google Calendar event ID (required)
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const eventId = params.eventId;

    // Validate eventId parameter
    if (!eventId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad request',
          message: 'eventId query parameter is required',
        }),
      };
    }

    // Calendar ID
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

    // Create auth client with service account credentials
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      clientOptions: {
        subject: calendarId, // Impersonate this user via domain-wide delegation
      },
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Fetch single event by ID
    const response = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId,
    });

    const calendarEvent = response.data;

    // Enrich event with registration metadata
    const enrichedEvent = await enrichEventWithRegistrationData(calendarEvent);

    // Return response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        event: enrichedEvent,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Calendar API Error:', error);

    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to fetch calendar event';

    if (error.code === 401 || error.code === 403) {
      statusCode = 401;
      errorMessage = 'Authentication failed - check service account permissions';
    } else if (error.code === 404) {
      statusCode = 404;
      errorMessage = 'Event not found';
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        message: error.message,
        code: error.code,
      }),
    };
  }
};

