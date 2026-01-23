const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const {
  categorizeEvent,
  enrichEventWithRegistrationData,
} = require('./lib/eventUtils.cjs');

/**
 * Netlify Function: Fetch Google Calendar Events
 *
 * Authentication:
 * - Uses Service Account JSON key for both local dev and production
 * - Requires domain-wide delegation to access calendar
 *
 * Environment Variables Required:
 * - GOOGLE_SERVICE_ACCOUNT_KEY: Service account JSON key (required)
 * - CALENDAR_ID: Calendar to fetch events from (default: coachwill@newerahockeytraining.com)
 *
 * Local Development Setup:
 * 1. Ensure GOOGLE_SERVICE_ACCOUNT_KEY is in .env file
 * 2. Run: `netlify dev`
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
    const eventType = params.type; // 'camp', 'lesson', 'at_home_training', or null for all
    const syncToken = params.syncToken; // For incremental sync
    const month = params.month; // 'YYYY-MM' format for month filtering
    const year = params.year; // Year for month filtering

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
    // For domain-wide delegation, we need to specify which user to impersonate
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      clientOptions: {
        subject: calendarId, // Impersonate this user via domain-wide delegation
      },
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Prepare API request parameters
    const listParams = {
      calendarId: calendarId,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    };

    // Use sync token for incremental updates if provided
    if (syncToken) {
      listParams.syncToken = syncToken;
    } else if (month && year) {
      // Month-based filtering for At Home Training
      // Parse month (1-12) and year
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // Start of month (first day, 00:00:00)
      const timeMin = new Date(yearNum, monthNum - 1, 1, 0, 0, 0);

      // End of month (last day, 23:59:59)
      const timeMax = new Date(yearNum, monthNum, 0, 23, 59, 59);

      listParams.timeMin = timeMin.toISOString();
      listParams.timeMax = timeMax.toISOString();
    } else {
      // Initial fetch: get events from now onwards
      listParams.timeMin = new Date().toISOString();
    }

    // Fetch events from Google Calendar
    const response = await calendar.events.list(listParams);

    let events = response.data.items || [];

    // Filter by event type if specified
    if (eventType) {
      events = events.filter(event => {
        const category = categorizeEvent(event);
        return category === eventType.toLowerCase();
      });
    }

    // Enrich events with registration metadata (async)
    // Skip enrichment for At Home Training (uses calendar colors, not blob storage)
    // Include Mt Vernon Skating in enrichment (it uses price/spots from description like camps)
    const shouldEnrich = eventType !== 'at_home_training';
    if (shouldEnrich) {
      events = await Promise.all(events.map(event => enrichEventWithRegistrationData(event)));
    }

    // Return response with short cache TTL
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
      },
      body: JSON.stringify({
        events: events,
        total: events.length,
        nextSyncToken: response.data.nextSyncToken,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Calendar API Error:', error);

    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to fetch calendar events';

    if (error.code === 401 || error.code === 403) {
      statusCode = 401;
      errorMessage = 'Authentication failed - check service account permissions';
    } else if (error.code === 404) {
      statusCode = 404;
      errorMessage = 'Calendar not found';
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

