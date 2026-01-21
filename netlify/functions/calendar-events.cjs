const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const { getEventRegistrations, DEFAULT_CAPACITY } = require('./lib/registrationStore.cjs');

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

/**
 * Categorize calendar event based on extended properties, color, or keywords
 * @param {Object} event - Google Calendar event object
 * @returns {string} - 'camp', 'lesson', 'at_home_training', 'mt_vernon_skating', or 'other'
 */
function categorizeEvent(event) {
  if (!event) return 'other';

  // Method 1: Extended Properties (most reliable - requires manual setup)
  const eventType = event.extendedProperties?.shared?.eventType;
  if (eventType) {
    const normalized = eventType.toLowerCase();
    if (normalized === 'camp' || normalized === 'lesson' || normalized === 'at_home_training' || normalized === 'mt_vernon_skating') {
      return normalized;
    }
  }

  // Method 2: Title-based detection (check before color for Mt Vernon Skating)
  // This is needed because registered Mt Vernon Skating events use yellow (same as AT_HOME_BOOKED)
  const title = (event.summary || '').toLowerCase();
  if (title.includes('mount vernon skating') || title.includes('mt vernon skating')) {
    return 'mt_vernon_skating';
  }

  // Method 3: Color-based categorization (easiest for Coach Will)
  // Red (#11) = Camps, Blue (#9) = Lessons, Orange (#6) = At Home Training (available),
  // Yellow (#5) = At Home Training (booked), Green (#10) = Mt Vernon Skating (available)
  const colorMap = {
    '11': 'camp', // Red
    '9': 'lesson', // Blue
    '6': 'at_home_training', // Orange (Tangerine) - available slots
    '5': 'at_home_training', // Yellow (Banana) - booked slots
    '10': 'mt_vernon_skating', // Green (Basil) - available for registration
  };

  if (event.colorId && colorMap[event.colorId]) {
    return colorMap[event.colorId];
  }

  // Method 4: Keyword detection in title (automatic fallback)
  if (title.includes('camp')) return 'camp';
  if (title.includes('lesson')) return 'lesson';
  if (title.includes('at home') || title.includes('training')) return 'at_home_training';

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
 * Parse custom capacity/spots from event description
 * Looks for patterns like "Spots: 25", "Slot: 2", "Capacity: 15"
 * @param {string} description - Event description
 * @returns {number|null} - Number of spots, or null if not found
 */
function parseSpotsFromDescription(description) {
  if (!description) return null;

  // Pattern: "Spots: 25", "Slot: 2", or "Capacity: 15" (case insensitive)
  const spotsPattern = /(?:spots?|capacity|slots?):\s*(\d+)/i;
  const match = description.match(spotsPattern);

  if (match) {
    const spots = parseInt(match[1], 10);
    // Validate reasonable capacity (1-100)
    if (spots >= 1 && spots <= 100) {
      return spots;
    }
  }

  return null;
}

/**
 * Enrich event with registration metadata
 *
 * AUTO-DETECTION LOGIC:
 * - If event has price in description → registration enabled automatically
 * - Custom capacity from "Spots: X" or "Capacity: X" in description
 * - Falls back to default capacity based on event type (camp: 20, lesson: 10)
 * - Fetches current registration count from Netlify Blob Storage
 *
 * NO MANUAL EXTENDED PROPERTIES NEEDED!
 *
 * @param {Object} event - Google Calendar event object
 * @returns {Promise<Object>} - Enriched event object
 */
async function enrichEventWithRegistrationData(event) {
  // Get event type for default capacity
  const eventType = categorizeEvent(event);

  // Parse price from description (auto-detection)
  const priceFromDescription = parsePriceFromDescription(event.description);
  const price = priceFromDescription || null;

  // Parse custom capacity from description (optional)
  const customSpotsFromDescription = parseSpotsFromDescription(event.description);

  // AUTO-ENABLE registration if price exists
  const registrationEnabled = price !== null;

  // Fetch registration data from Netlify Blob Storage
  let registrationData = null;
  let maxCapacity = null;
  let currentRegistrations = 0;

  try {
    registrationData = await getEventRegistrations(event.id);

    // Capacity priority: custom from description > stored > default by type
    // Calendar description is source of truth - allows updating capacity dynamically
    maxCapacity = customSpotsFromDescription ||
                  registrationData.maxCapacity ||
                  DEFAULT_CAPACITY[eventType] ||
                  DEFAULT_CAPACITY.other;

    currentRegistrations = registrationData.currentRegistrations || 0;
  } catch (error) {
    console.warn(`Could not fetch registration data for ${event.id}:`, error.message);
    // Fallback: custom from description or default
    maxCapacity = customSpotsFromDescription ||
                  DEFAULT_CAPACITY[eventType] ||
                  DEFAULT_CAPACITY.other;
    currentRegistrations = 0;
  }

  // Calculate sold out status
  const isSoldOut = currentRegistrations >= maxCapacity;

  // Add registration metadata to event object
  return {
    ...event,
    registrationData: {
      price,
      maxCapacity,
      currentRegistrations,
      isSoldOut,
      registrationEnabled,
      hasCapacityInfo: true, // Always true now with defaults
    },
  };
}
