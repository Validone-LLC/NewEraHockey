const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Netlify Function: Create Stripe Checkout Session
 *
 * Creates a Stripe Checkout session for event registration payment
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key (sandbox or production)
 * - VITE_CONTACT_EMAIL: Email for receipt_email
 *
 * Request Body:
 * {
 *   event: { id, summary, price },
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

  try {
    // Parse request body
    const { event: calendarEvent, formData } = JSON.parse(event.body);

    // Validate required fields
    if (!calendarEvent || !calendarEvent.id || !calendarEvent.price || !calendarEvent.eventType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required event data',
          message: 'Event ID, price, and event type are required',
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

    // For At Home Training: validate player count and calculate total
    const isAtHomeTraining = calendarEvent.eventType === 'at_home_training';
    const playerCount = isAtHomeTraining && formData.players ? formData.players.length : 1;
    const totalPrice = isAtHomeTraining ? calendarEvent.price * playerCount : calendarEvent.price;

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

    // Build product name with player count for At Home Training
    const productName = isAtHomeTraining
      ? `${calendarEvent.summary || 'At Home Training'} (${playerCount} player${playerCount > 1 ? 's' : ''})`
      : calendarEvent.summary || 'Event Registration';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      automatic_tax: { enabled: true },
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
        eventSummary: calendarEvent.summary || '',
        eventPrice: calendarEvent.price.toString(),
        playerCount: playerCount.toString(),
        totalPrice: totalPrice.toString(),
        // Event date/time (from Google Calendar start/end)
        eventStartDateTime: calendarEvent.start?.dateTime || calendarEvent.start?.date || '',
        eventEndDateTime: calendarEvent.end?.dateTime || calendarEvent.end?.date || '',

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
        // For multi-player (at home): serialize players array to JSON
        ...(isAtHomeTraining
          ? {
              playersData: JSON.stringify(formData.players),
            }
          : {
              playerFirstName: formData.playerFirstName,
              playerLastName: formData.playerLastName,
              playerDateOfBirth: formData.playerDateOfBirth,
              playerAge: formData.playerAge || '',
              playerLevelOfPlay: formData.playerLevelOfPlay || '',
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
        waiverAccepted: formData.waiverAccepted.toString(),
      },
      success_url: `${baseUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/register/cancel?event_id=${calendarEvent.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    });

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
        message: error.message,
      }),
    };
  }
};
