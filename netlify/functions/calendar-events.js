const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

/**
 * Netlify Function: Fetch Google Calendar Events
 *
 * Authentication:
 * - LOCAL DEV: Uses Application Default Credentials (gcloud CLI auth)
 * - PRODUCTION: Uses Workload Identity Federation (secure, no JSON keys)
 *
 * Environment Variables Required (Production only):
 * - GOOGLE_PROJECT_ID: Your Google Cloud project ID
 * - GOOGLE_PROJECT_NUMBER: Your Google Cloud project number
 * - WORKLOAD_IDENTITY_POOL_ID: Workload identity pool ID (e.g., "netlify-pool")
 * - WORKLOAD_IDENTITY_PROVIDER_ID: Provider ID (e.g., "netlify-provider")
 * - SERVICE_ACCOUNT_EMAIL: Service account email for impersonation
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
      // PRODUCTION: Use Workload Identity Federation
      console.log('🚀 Production mode: Using Workload Identity Federation');

      // Environment validation for production
      const requiredEnvVars = [
        'GOOGLE_PROJECT_ID',
        'GOOGLE_PROJECT_NUMBER',
        'WORKLOAD_IDENTITY_POOL_ID',
        'WORKLOAD_IDENTITY_PROVIDER_ID',
        'SERVICE_ACCOUNT_EMAIL',
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        console.error('Missing environment variables:', missingVars);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Server configuration error',
            message: 'Missing required environment variables',
            missing: missingVars,
          }),
        };
      }

      // Configure Workload Identity Federation authentication
      const audience = `//iam.googleapis.com/projects/${process.env.GOOGLE_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${process.env.WORKLOAD_IDENTITY_POOL_ID}/providers/${process.env.WORKLOAD_IDENTITY_PROVIDER_ID}`;

      auth = new GoogleAuth({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          type: 'external_account',
          audience: audience,
          subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
          token_url: 'https://sts.googleapis.com/v1/token',
          credential_source: {
            environment_id: 'netlify',
            format: {
              type: 'text',
            },
            text: context.clientContext?.identity?.token || '',
          },
          service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
        },
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
