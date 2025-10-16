const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

/**
 * Netlify Function: Fetch Google Calendar Events
 *
 * Authentication:
 * - LOCAL DEV: Uses Application Default Credentials (gcloud CLI auth)
 * - PRODUCTION: Uses Service Account JSON key
 *
 * Environment Variables Required:
 * - GOOGLE_SERVICE_ACCOUNT_KEY: Service account JSON key (production only)
 * - GOOGLE_PROJECT_ID: Your Google Cloud project ID
 * - CALENDAR_ID: Calendar to fetch events from (default: coachwill@newerahockeytraining.com)
 *
 * Local Development Setup:
 * 1. Authenticate gcloud CLI: `gcloud auth application-default login`
 * 2. Set default project: `gcloud config set project newerahockey-calendar`
 * 3. Run: `netlify dev`
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
    const eventType = params.type; // 'camp', 'lesson', or null for all
    const syncToken = params.syncToken; // For incremental sync

    // Detect environment: local dev vs production Netlify
    const isLocalDev = !context.clientContext || process.env.NETLIFY_DEV === 'true';

    let auth;
    let calendar;

    if (isLocalDev) {
      // LOCAL DEVELOPMENT: Use Application Default Credentials (gcloud CLI)
      console.log('🔧 Local dev mode: Using Application Default Credentials');

      auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });

      const client = await auth.getClient();
      calendar = google.calendar({ version: 'v3', auth: client });
    } else {
      // PRODUCTION: Use Service Account JSON Key
      console.log('🚀 Production mode: Using Service Account JSON Key');

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
      auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });

      const client = await auth.getClient();
      calendar = google.calendar({ version: 'v3', auth: client });
    }

    // Calendar ID
    const calendarId = process.env.CALENDAR_ID || 'coachwill@newerahockeytraining.com';

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

    // Return response
    return {
      statusCode: 200,
      headers,
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

/**
 * Categorize calendar event based on extended properties, color, or keywords
 * @param {Object} event - Google Calendar event object
 * @returns {string} - 'camp', 'lesson', or 'other'
 */
function categorizeEvent(event) {
  // Method 1: Extended Properties (most reliable)
  const eventType = event.extendedProperties?.shared?.eventType;
  if (eventType) {
    return eventType.toLowerCase();
  }

  // Method 2: Color-based categorization
  const colorMap = {
    '11': 'camp', // Red
    '9': 'lesson', // Blue
  };

  if (event.colorId && colorMap[event.colorId]) {
    return colorMap[event.colorId];
  }

  // Method 3: Keyword detection in title
  const title = (event.summary || '').toLowerCase();
  if (title.includes('camp')) return 'camp';
  if (title.includes('lesson') || title.includes('training')) return 'lesson';

  return 'other';
}
