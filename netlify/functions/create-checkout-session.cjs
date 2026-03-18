const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const { getEventRegistrations, DEFAULT_CAPACITY } = require('./lib/registrationStore.cjs');

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - DOB in YYYY-MM-DD format
 * @returns {number|null} - Age in years or null if invalid
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Parse price from event description (server-side authoritative source)
 * Looks for patterns like "Price: $350", "$350.00", "Price: 350"
 * @param {string} description - Event description
 * @returns {number|null} - Price in dollars, or null if not found
 */
function parsePriceFromDescription(description) {
  if (!description) return null;
  const pricePattern1 = /price:\s*\$?(\d+(?:\.\d{2})?)/i;
  const match1 = description.match(pricePattern1);
  if (match1) return parseFloat(match1[1]);
  const pricePattern2 = /\$(\d+(?:\.\d{2})?)/;
  const match2 = description.match(pricePattern2);
  if (match2) return parseFloat(match2[1]);
  return null;
}

/**
 * Parse custom capacity from event description.
 * Same logic as calendarUtils.cjs parseSpotsFromDescription.
 */
function parseSpotsFromDescription(description) {
  if (!description) return null;
  const spotsPattern = /(?:spots?|capacity|slots?):\s*(\d+)/i;
  const match = description.match(spotsPattern);
  if (match) {
    const spots = parseInt(match[1], 10);
    if (spots >= 1 && spots <= 100) return spots;
  }
  return null;
}

/**
 * Fetch the authoritative price and summary for an event directly from Google Calendar.
 * This prevents clients from submitting a manipulated price.
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<{price: number, summary: string, start: object, end: object}>}
 */
async function fetchCalendarEventData(eventId) {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const calendarId = process.env.CALENDAR_ID || 'coachwill@newerahockeytraining.com';

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    clientOptions: { subject: calendarId },
  });

  const client = await auth.getClient();
  const calendar = google.calendar({ version: 'v3', auth: client });

  const response = await calendar.events.get({ calendarId, eventId });
  const calEvent = response.data;

  const price = parsePriceFromDescription(calEvent.description);
  const customSpots = parseSpotsFromDescription(calEvent.description);
  return {
    price,
    customSpots,
    summary: calEvent.summary || '',
    start: calEvent.start,
    end: calEvent.end,
  };
}

/**
 * Netlify Function: Create Stripe Checkout Session
 *
 * Creates a Stripe Checkout session for event registration payment.
 * Price is fetched server-side from Google Calendar — the client-provided
 * price is ignored to prevent price manipulation.
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key (sandbox or production)
 * - GOOGLE_SERVICE_ACCOUNT_KEY: Service account JSON for Calendar price lookup
 * - CALENDAR_ID: Calendar ID (default: coachwill@newerahockeytraining.com)
 *
 * Request Body:
 * {
 *   event: { id, eventType, summary, start, end, slotDate, slotTime },
 *   formData: { player info, guardian info, emergency contact }
 * }
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://newerahockeytraining.com',
  'https://www.newerahockeytraining.com',
  'https://newerahockey.netlify.app',
];

// Check if origin is allowed (includes deploy preview URLs)
function isAllowedOrigin(origin) {
  if (!origin) return false;
  // Allow exact matches
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow Netlify deploy previews and branch deploys
  if (origin.match(/^https:\/\/[a-z0-9-]+--newerahockey\.netlify\.app$/)) return true;
  // Allow localhost for development
  if (origin.match(/^http:\/\/localhost:\d+$/)) return true;
  if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) return true;
  return false;
}

exports.handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

  // CORS headers - restrict to specific origins
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
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
    // Parse request body
    const { event: calendarEvent, formData, idempotencyKey } = parsedBody;

    // Validate required fields — price is NOT accepted from client; fetched server-side below
    if (!calendarEvent || !calendarEvent.id || !calendarEvent.eventType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required event data',
          message: 'Event ID and event type are required',
        }),
      };
    }

    if (!formData || !formData.guardianEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required form data',
          message: 'Guardian email is required',
        }),
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid form data',
          message: 'Guardian email address is invalid',
        }),
      };
    }

    // For multi-player event types: validate player count and calculate total
    const isAtHomeTraining = calendarEvent.eventType === 'at_home_training';
    const isSmallGroup = calendarEvent.eventType === 'small_group' || calendarEvent.eventType === 'rockville_small_group';
    const isMultiPlayerEvent = isAtHomeTraining || isSmallGroup;
    const playerCount = isMultiPlayerEvent && formData.players ? formData.players.length : 1;

    // Guard against empty players array which would produce a $0 checkout session
    if (isMultiPlayerEvent && playerCount === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid player count',
          message: 'At least one player is required to register for this event',
        }),
      };
    }

    // Fetch authoritative price + capacity from Google Calendar — client-provided price is ignored
    let verifiedPrice, verifiedSummary, verifiedStart, verifiedEnd, descriptionSpots;
    try {
      const serverEvent = await fetchCalendarEventData(calendarEvent.id);
      verifiedPrice = serverEvent.price;
      descriptionSpots = serverEvent.customSpots;
      verifiedSummary = serverEvent.summary || calendarEvent.summary || 'Event Registration';
      verifiedStart = serverEvent.start;
      verifiedEnd = serverEvent.end;
    } catch (calError) {
      console.error('Failed to fetch event from Google Calendar:', calError.message);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: 'Could not verify event pricing',
          message: 'Unable to retrieve event details. Please try again.',
        }),
      };
    }

    if (verifiedPrice === null || verifiedPrice <= 0) {
      console.error(`Invalid price (${verifiedPrice}) in Google Calendar event ${calendarEvent.id}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Event pricing unavailable',
          message: 'This event does not have a valid price configured. Please contact us.',
        }),
      };
    }

    // Pre-checkout capacity check: prevent payment when event is already full.
    // Uses same priority as frontend: description spots > S3 stored > default.
    if (calendarEvent.eventType !== 'camp') {
      try {
        const regData = await getEventRegistrations(calendarEvent.id);
        const maxCapacity =
          descriptionSpots ||
          regData.maxCapacity ||
          DEFAULT_CAPACITY[calendarEvent.eventType] ||
          DEFAULT_CAPACITY.other;
        const currentRegistrations = regData.currentRegistrations || 0;

        // Note: S3 maxCapacity sync is handled by addRegistration (via customMaxCapacity
        // in Stripe metadata) which uses ETag-based concurrency control. We intentionally
        // do NOT call updateEventCapacity here to avoid a non-ETag write that could
        // overwrite concurrent registration writes.

        if (currentRegistrations + playerCount > maxCapacity) {
          console.warn(`Pre-checkout capacity block: event ${calendarEvent.id} has ${currentRegistrations}/${maxCapacity} registrations, requested ${playerCount} more`);
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({
              error: 'Event is full',
              message: currentRegistrations >= maxCapacity
                ? 'Sorry, this event is now sold out. Please check back for future events.'
                : `Sorry, only ${maxCapacity - currentRegistrations} spot(s) remaining but ${playerCount} requested.`,
            }),
          };
        }
      } catch (capError) {
        // Non-blocking: if we can't check capacity, allow checkout to proceed.
        // The webhook's addRegistration will catch true oversells.
        console.warn('Pre-checkout capacity check failed (non-blocking):', capError.message);
      }
    }

    const totalPrice = isMultiPlayerEvent ? verifiedPrice * playerCount : verifiedPrice;

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Payment processing not configured',
        }),
      };
    }

    // Determine base URL for redirects
    // DEPLOY_URL: Specific deployment URL (works for deploy previews, branch deploys)
    // URL: Primary site URL (often custom domain)
    // Fallback: localhost for local development
    const baseUrl = process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';

    console.log('Checkout session baseUrl:', baseUrl, '(context:', process.env.CONTEXT, ')');

    // Convert price to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(totalPrice * 100);

    // Logo URL - using the deployed site's logo
    const logoUrl = `${baseUrl}/assets/images/logo/neh-logo.png`;

    // Build human-readable event date for Stripe dashboard visibility
    const eventStartRaw = verifiedStart?.dateTime || verifiedStart?.date || calendarEvent.start?.dateTime || calendarEvent.start?.date || '';
    const eventEndRaw = verifiedEnd?.dateTime || verifiedEnd?.date || calendarEvent.end?.dateTime || calendarEvent.end?.date || '';
    let formattedEventDate = '';
    if (eventStartRaw) {
      try {
        const startDate = new Date(eventStartRaw);
        formattedEventDate = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        // Add time if it's a dateTime (not all-day event)
        if (eventStartRaw.includes('T')) {
          formattedEventDate += ' at ' + startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {
        formattedEventDate = eventStartRaw;
      }
    }

    // Build product name with player count for multi-player events
    const productName = isMultiPlayerEvent
      ? `${verifiedSummary} (${playerCount} player${playerCount > 1 ? 's' : ''})`
      : verifiedSummary;

    // Description visible on Stripe dashboard payment list (most prominent field for admins)
    const paymentDescription = formattedEventDate
      ? `${verifiedSummary} — ${formattedEventDate}`
      : verifiedSummary;

    // Create Stripe Checkout session (idempotency key prevents duplicate sessions from rapid submits)
    const stripeOptions = idempotencyKey ? { idempotencyKey } : {};
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      automatic_tax: { enabled: true },
      payment_intent_data: {
        description: paymentDescription,
        metadata: {
          eventName: verifiedSummary,
          eventDate: formattedEventDate,
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              images: [logoUrl],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: formData.guardianEmail,
      custom_text: {
        submit: {
          message: 'Secure payment processed by Stripe. You will receive a confirmation email after payment.',
        },
      },
      metadata: {
        // Event information
        eventId: calendarEvent.id,
        eventType: calendarEvent.eventType, // 'camp', 'lesson', or 'at_home_training'
        eventSummary: verifiedSummary,
        eventDate: formattedEventDate,
        eventPrice: verifiedPrice.toString(),
        playerCount: playerCount.toString(),
        totalPrice: totalPrice.toString(),
        // Custom capacity from Google Calendar description (authoritative source)
        ...(descriptionSpots && { customMaxCapacity: descriptionSpots.toString() }),
        // Event date/time — use server-fetched values, fall back to client-provided
        eventStartDateTime: eventStartRaw,
        eventEndDateTime: eventEndRaw,

        // At Home Training specific
        ...(isAtHomeTraining && {
          slotDate: calendarEvent.slotDate || '',
          slotTime: calendarEvent.slotTime || '',
          addressStreet: formData.addressStreet || '',
          addressUnit: formData.addressUnit || '',
          addressCity: formData.addressCity || '',
          addressState: formData.addressState || '',
          addressZip: formData.addressZip || '',
          addressCountry: formData.addressCountry || 'USA',
        }),

        // Player information (backwards compatible)
        // For single player (camps/lessons): use formData fields directly
        // For multi-player (at home, small group): serialize players array to JSON
        ...(isMultiPlayerEvent
          ? {
              playersData: JSON.stringify(formData.players),
            }
          : {
              playerFirstName: formData.playerFirstName,
              playerLastName: formData.playerLastName,
              playerDateOfBirth: formData.playerDateOfBirth,
              playerAge: calculateAge(formData.playerDateOfBirth)?.toString() || '',
              playerLevelOfPlay: formData.playerLevelOfPlay || '',
              playerLeague: formData.playerLeague || '',
            }),

        // Guardian information
        guardianFirstName: formData.guardianFirstName,
        guardianLastName: formData.guardianLastName,
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
        guardianRelationship: formData.guardianRelationship,

        // Emergency contact
        emergencyName: formData.emergencyName || '',
        emergencyPhone: formData.emergencyPhone || '',
        emergencyRelationship: formData.emergencyRelationship || '',

        // Additional notes
        medicalNotes: formData.medicalNotes || '',
        waiverAccepted: String(formData.waiverAccepted ?? false),
      },
      success_url: `${baseUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/register/cancel?event_id=${calendarEvent.id}`,
    }, stripeOptions);

    // Return session URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
    };
  } catch (error) {
    console.error('Stripe Checkout session creation error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Payment error',
          message: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred. Please try again.',
      }),
    };
  }
};
