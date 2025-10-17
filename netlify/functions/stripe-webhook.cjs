/**
 * Netlify Function: Stripe Webhook Handler
 *
 * Listens for checkout.session.completed events from Stripe
 * and updates registration tracking in Netlify Blob Storage.
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe Dashboard
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { addRegistration } = require('./lib/registrationStore.cjs');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Verify webhook signature
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;

        console.log('Processing checkout.session.completed:', session.id);

        // Extract registration data from session metadata
        const {
          eventId,
          eventType,
          eventSummary,
          playerFirstName,
          playerLastName,
          playerDateOfBirth,
          playerAge,
          guardianFirstName,
          guardianLastName,
          guardianEmail,
          guardianPhone,
          guardianRelationship,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship,
          medicalNotes,
        } = session.metadata;

        // Add registration to blob storage
        const registrationData = await addRegistration(
          eventId,
          eventType,
          {
            stripeSessionId: session.id,
            playerFirstName,
            playerLastName,
            playerDateOfBirth,
            playerAge,
            guardianFirstName,
            guardianLastName,
            guardianEmail,
            guardianPhone,
            guardianRelationship,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            medicalNotes,
          }
        );

        console.log(`Registration added for event ${eventId}:`, {
          eventSummary,
          currentRegistrations: registrationData.currentRegistrations,
          maxCapacity: registrationData.maxCapacity,
          isSoldOut: registrationData.currentRegistrations >= registrationData.maxCapacity,
        });

        // TODO: Send confirmation emails (Phase 4)
        // - Email to guardian
        // - Email to Coach Will

        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Return 500 so Stripe retries
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Webhook processing failed',
        message: error.message,
      }),
    };
  }
};
