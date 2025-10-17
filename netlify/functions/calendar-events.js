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

    // Calendar ID (used for both authentication subject and API calls)
    const calendarId = process.env.CALENDAR_ID || 'coachwill@newerahockeytraining.com';

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
      // For domain-wide delegation, we need to specify which user to impersonate
      auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        clientOptions: {
          subject: calendarId, // Impersonate this user via domain-wide delegation
        },
      });

      const client = await auth.getClient();
      calendar = google.calendar({ version: 'v3', auth: client });
    }

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

    // Enrich events with registration metadata
    events = events.map(event => enrichEventWithRegistrationData(event));

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

/**
 * Parse price from event description
 * Looks for patterns like "Price: $350", "$350.00", "Price: 350"
 * @param {string} description - Event description
 * @returns {number|null} - Price in dollars, or null if not found
 */
function parsePriceFromDescription(description) {
  if (!description) return null;

  // Pattern 1: "Price: $350" or "Price: $350.00"
  const pricePattern1 = /price:\s*\$?(\d+(?:\.\d{2})?)/i;
  const match1 = description.match(pricePattern1);
  if (match1) {
    return parseFloat(match1[1]);
  }

  // Pattern 2: Standalone "$350" or "$350.00"
  const pricePattern2 = /\$(\d+(?:\.\d{2})?)/;
  const match2 = description.match(pricePattern2);
  if (match2) {
    return parseFloat(match2[1]);
  }

  return null;
}

/**
 * Enrich event with registration metadata from extended properties
 * Adds: price, maxCapacity, currentRegistrations, isSoldOut, registrationEnabled
 * @param {Object} event - Google Calendar event object
 * @returns {Object} - Enriched event object
 */
function enrichEventWithRegistrationData(event) {
  const extProps = event.extendedProperties?.shared || {};

  // Parse extended properties
  const priceFromExtProps = extProps.price ? parseFloat(extProps.price) : null;
  const priceFromDescription = parsePriceFromDescription(event.description);
  const price = priceFromExtProps || priceFromDescription || null;

  const maxCapacity = extProps.maxCapacity ? parseInt(extProps.maxCapacity, 10) : null;
  const currentRegistrations = extProps.currentRegistrations
    ? parseInt(extProps.currentRegistrations, 10)
    : 0;
  const registrationEnabled = extProps.registrationEnabled === 'true';

  // Calculate sold out status
  const isSoldOut = maxCapacity !== null && currentRegistrations >= maxCapacity;

  // Add registration metadata to event object
  return {
    ...event,
    registrationData: {
      price,
      maxCapacity,
      currentRegistrations,
      isSoldOut,
      registrationEnabled,
      hasCapacityInfo: maxCapacity !== null,
    },
  };
}
