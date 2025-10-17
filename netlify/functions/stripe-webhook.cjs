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
const AWS = require('aws-sdk');
const { addRegistration } = require('./lib/registrationStore.cjs');

// Initialize AWS SES for email notifications
const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEH_AWS_REGION || 'us-east-1',
});

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

        // Send confirmation emails
        try {
          await sendRegistrationEmails({
            eventSummary,
            eventId,
            guardianEmail,
            guardianFirstName,
            guardianLastName,
            playerFirstName,
            playerLastName,
            playerAge,
            emergencyContactName,
            emergencyContactPhone,
            medicalNotes,
            amountPaid: session.amount_total / 100, // Convert from cents
          });
          console.log('Registration confirmation emails sent successfully');
        } catch (emailError) {
          // Log error but don't fail the webhook - registration already recorded
          console.error('Failed to send confirmation emails:', emailError.message);
        }

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

/**
 * Send registration confirmation emails to both admin and guardian
 */
async function sendRegistrationEmails(data) {
  const {
    eventSummary,
    eventId,
    guardianEmail,
    guardianFirstName,
    guardianLastName,
    playerFirstName,
    playerLastName,
    playerAge,
    emergencyContactName,
    emergencyContactPhone,
    medicalNotes,
    amountPaid,
  } = data;

  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com';

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL environment variable not configured');
  }

  // Admin notification email
  const adminEmailParams = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [adminEmail],
    },
    Message: {
      Subject: {
        Data: `New Registration: ${eventSummary}`,
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #14b8a6;">New Event Registration</h2>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Event Details</h3>
                <p><strong>Event:</strong> ${eventSummary}</p>
                <p><strong>Event ID:</strong> ${eventId}</p>
                <p><strong>Amount Paid:</strong> $${amountPaid.toFixed(2)}</p>
              </div>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Player Information</h3>
                <p><strong>Name:</strong> ${playerFirstName} ${playerLastName}</p>
                <p><strong>Age:</strong> ${playerAge}</p>
              </div>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Guardian Information</h3>
                <p><strong>Name:</strong> ${guardianFirstName} ${guardianLastName}</p>
                <p><strong>Email:</strong> <a href="mailto:${guardianEmail}">${guardianEmail}</a></p>
              </div>

              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Emergency Contact</h3>
                <p><strong>Name:</strong> ${emergencyContactName}</p>
                <p><strong>Phone:</strong> ${emergencyContactPhone}</p>
              </div>

              ${medicalNotes ? `
                <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                  <h3 style="color: #856404; margin-top: 0;">Medical Notes</h3>
                  <p style="color: #856404; white-space: pre-wrap;">${medicalNotes}</p>
                </div>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="font-size: 12px; color: #666;">
                This is an automated notification from the New Era Hockey registration system.
              </p>
            </div>
          `,
        },
      },
    },
  };

  // Guardian confirmation email
  const userEmailParams = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [guardianEmail],
    },
    Message: {
      Subject: {
        Data: `Registration Confirmed: ${eventSummary}`,
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #14b8a6;">Registration Confirmed!</h2>

              <p style="font-size: 16px; line-height: 1.6;">
                Hi ${guardianFirstName},
              </p>

              <p style="font-size: 16px; line-height: 1.6;">
                Thank you for registering ${playerFirstName} ${playerLastName} for <strong>${eventSummary}</strong>!
                We're excited to have them join us on the ice.
              </p>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Registration Summary</h3>
                <p><strong>Player:</strong> ${playerFirstName} ${playerLastName}</p>
                <p><strong>Age:</strong> ${playerAge}</p>
                <p><strong>Event:</strong> ${eventSummary}</p>
                <p><strong>Amount Paid:</strong> $${amountPaid.toFixed(2)}</p>
              </div>

              <div style="background-color: #e0f2f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #00695c; margin-top: 0;">What's Next?</h3>
                <ul style="color: #00695c; line-height: 1.8;">
                  <li>You'll receive event details and timing closer to the date</li>
                  <li>Please arrive 15 minutes early for check-in</li>
                  <li>Bring all necessary hockey equipment</li>
                  <li>A waiver must be signed before participation</li>
                </ul>
              </div>

              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                <p style="margin: 0;"><strong>Questions?</strong> Contact Coach Will at <a href="mailto:coachwill@newerahockeytraining.com">coachwill@newerahockeytraining.com</a></p>
              </div>

              <br>
              <p style="font-size: 16px;">
                Best regards,<br>
                <strong>Coach Will & The New Era Hockey Team</strong>
              </p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="font-size: 12px; color: #666;">
                This is an automated confirmation email. Your payment receipt will be sent separately by Stripe.
              </p>
            </div>
          `,
        },
      },
    },
  };

  // Send both emails in parallel
  console.log('Sending registration confirmation emails...');
  const [adminResult, userResult] = await Promise.all([
    ses.sendEmail(adminEmailParams).promise(),
    ses.sendEmail(userEmailParams).promise(),
  ]);

  console.log(`Admin notification sent. MessageId: ${adminResult.MessageId}`);
  console.log(`User confirmation sent to ${guardianEmail}. MessageId: ${userResult.MessageId}`);
}
