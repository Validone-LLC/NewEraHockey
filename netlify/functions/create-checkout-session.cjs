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

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    // DEPLOY_URL: Specific deployment URL (works for deploy previews, branch deploys, production)
    // URL: Primary site URL (often custom domain)
    // Fallback: localhost for local development
    const baseUrl = process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';

    console.log('Checkout session baseUrl:', baseUrl, '(context:', process.env.CONTEXT, ')');

    // Convert price to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(calendarEvent.price * 100);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: calendarEvent.summary || 'Event Registration',
              description: `Registration for ${calendarEvent.summary || 'event'}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: formData.guardianEmail,
      metadata: {
        // Event information
        eventId: calendarEvent.id,
        eventType: calendarEvent.eventType, // 'camp' or 'lesson' for capacity defaults
        eventSummary: calendarEvent.summary || '',
        eventPrice: calendarEvent.price.toString(),

        // Player information
        playerFirstName: formData.playerFirstName,
        playerLastName: formData.playerLastName,
        playerDateOfBirth: formData.playerDateOfBirth,
        playerAge: formData.playerAge || '',

        // Guardian information
        guardianFirstName: formData.guardianFirstName,
        guardianLastName: formData.guardianLastName,
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
        guardianRelationship: formData.guardianRelationship,

        // Emergency contact
        emergencyName: formData.emergencyName,
        emergencyPhone: formData.emergencyPhone,
        emergencyRelationship: formData.emergencyRelationship,

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
