/**
 * Netlify Function: Stripe Webhook Handler
 *
 * Listens for checkout.session.completed events from Stripe
 * and updates registration tracking in S3.
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe Dashboard
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { addRegistration } = require('./lib/registrationStore.cjs');
const { escapeHtml, formatDate, formatEventDateTime, buildGoogleCalendarUrl, calculateAge } = require('./lib/htmlUtils.cjs');

// Initialize AWS SES v3 client for email notifications
const sesClient = new SESClient({
  credentials: {
    accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  },
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

        // Skip test mode sessions in production (allow in local dev)
        if (!session.livemode && !process.env.NETLIFY_DEV) {
          console.log('Skipping test mode session:', session.id);
          return {
            statusCode: 200,
            body: JSON.stringify({ received: true, skipped: 'test_mode' }),
          };
        }

        console.log('Processing checkout.session.completed:', session.id);

        // Extract registration data from session metadata
        const {
          eventId,
          eventType,
          eventSummary,
          playerCount,
          totalPrice,
          // Event date/time
          eventStartDateTime,
          eventEndDateTime,
          // At Home Training specific
          slotDate,
          slotTime,
          playersData, // JSON string for multi-player
          addressStreet,
          addressUnit,
          addressCity,
          addressState,
          addressZip,
          addressCountry,
          // Single player (backwards compatible)
          playerFirstName,
          playerLastName,
          playerDateOfBirth,
          playerAge,
          playerLevelOfPlay,
          playerLeague,
          // Guardian & emergency
          guardianFirstName,
          guardianLastName,
          guardianEmail,
          guardianPhone,
          guardianRelationship,
          emergencyName,
          emergencyPhone,
          emergencyRelationship,
          medicalNotes,
        } = session.metadata || {};

        // Validate required metadata
        if (!eventId || !eventType) {
          console.warn('⚠️  Skipping registration: missing eventId or eventType in metadata');
          console.log('Session metadata:', session.metadata);
          break;
        }

        // Parse players data for multi-player event types (At Home Training, Small Group)
        const isAtHomeTraining = eventType === 'at_home_training';
        const isSmallGroup = eventType === 'small_group' || eventType === 'rockville_small_group';
        const isMultiPlayerEvent = isAtHomeTraining || isSmallGroup;
        const players = isMultiPlayerEvent && playersData ? JSON.parse(playersData) : null;

        // Calculate actual player count for multi-player events
        const actualPlayerCount = isMultiPlayerEvent && players ? players.length : 1;

        // Add registration to blob storage
        const regPayload = {
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent, // For refunds
          amount: session.amount_total / 100, // Convert from cents
          playerFirstName,
          playerLastName,
          playerDateOfBirth,
          playerAge,
          playerLevelOfPlay,
          playerLeague,
          players, // Include players array for multi-player events
          guardianFirstName,
          guardianLastName,
          guardianEmail,
          guardianPhone,
          guardianRelationship,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
          emergencyContactRelationship: emergencyRelationship,
          medicalNotes,
          status: 'confirmed',
        };

        const registrationData = await addRegistration(eventId, eventType, regPayload, actualPlayerCount);

        console.log(`Registration complete for event ${eventId}:`, {
          eventSummary,
          currentRegistrations: registrationData.currentRegistrations,
          maxCapacity: registrationData.maxCapacity,
          isSoldOut: registrationData.currentRegistrations >= registrationData.maxCapacity,
        });

        // For At Home Training: Update calendar (color change, add booking details, delete paired slot)
        if (isAtHomeTraining) {
          try {
            const calendarUpdateUrl =
              process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';
            const calendarFunctionUrl = `${calendarUpdateUrl}/.netlify/functions/calendar-update-event`;

            // Reconstruct formData for calendar update
            const formDataForCalendar = {
              players,
              guardianFirstName,
              guardianLastName,
              guardianEmail,
              guardianPhone,
              guardianRelationship,
              addressStreet,
              addressUnit,
              addressCity,
              addressState,
              addressZip,
              addressCountry,
              emergencyName,
              emergencyPhone,
              emergencyRelationship,
              medicalNotes,
            };

            const calendarResponse = await fetch(calendarFunctionUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId,
                formData: formDataForCalendar,
                eventType,
                slotDate,
                slotTime,
              }),
            });

            if (!calendarResponse.ok) {
              const errorText = await calendarResponse.text();
              console.error('Calendar update failed:', calendarResponse.status, errorText);
            } else {
              const calendarResult = await calendarResponse.json();
              console.log('Calendar updated successfully:', calendarResult);
            }
          } catch (calendarError) {
            console.error('Failed to update calendar (non-blocking):', calendarError.message);
          }
        }

        // For Small Group: Update calendar with registration details
        if (isSmallGroup) {
          try {
            const calendarUpdateUrl =
              process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';
            const calendarFunctionUrl = `${calendarUpdateUrl}/.netlify/functions/calendar-update-event`;

            // Construct formData for Small Group
            const formDataForCalendar = {
              players,
              guardianFirstName,
              guardianLastName,
              guardianEmail,
              guardianPhone,
              guardianRelationship,
              emergencyName,
              emergencyPhone,
              emergencyRelationship,
              medicalNotes,
            };

            const calendarResponse = await fetch(calendarFunctionUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId,
                formData: formDataForCalendar,
                eventType,
              }),
            });

            if (!calendarResponse.ok) {
              const errorText = await calendarResponse.text();
              console.error('Calendar update failed for Small Group:', calendarResponse.status, errorText);
            } else {
              const calendarResult = await calendarResponse.json();
              console.log('Small Group calendar updated successfully:', calendarResult);
            }
          } catch (calendarError) {
            console.error('Failed to update Small Group calendar (non-blocking):', calendarError.message);
          }
        }

        // For Mt Vernon Skating: Update calendar color (Basil green #10 → Banana yellow #5)
        const isMtVernonSkating = eventType === 'mt_vernon_skating';
        if (isMtVernonSkating) {
          try {
            const calendarUpdateUrl =
              process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';
            const calendarFunctionUrl = `${calendarUpdateUrl}/.netlify/functions/calendar-update-event`;

            // Construct formData for Mt Vernon Skating (similar to At Home Training but simpler)
            const formDataForCalendar = {
              players: [
                {
                  firstName: playerFirstName,
                  lastName: playerLastName,
                  dateOfBirth: playerDateOfBirth,
                  levelOfPlay: playerLevelOfPlay,
                },
              ],
              guardianFirstName,
              guardianLastName,
              guardianEmail,
              guardianPhone,
              guardianRelationship,
              emergencyName,
              emergencyPhone,
              emergencyRelationship,
              medicalNotes,
            };

            const calendarResponse = await fetch(calendarFunctionUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId,
                formData: formDataForCalendar,
                eventType,
              }),
            });

            if (!calendarResponse.ok) {
              const errorText = await calendarResponse.text();
              console.error('Calendar update failed for Mt Vernon Skating:', calendarResponse.status, errorText);
            } else {
              const calendarResult = await calendarResponse.json();
              console.log('Mt Vernon Skating calendar updated successfully:', calendarResult);
            }
          } catch (calendarError) {
            console.error('Failed to update Mt Vernon Skating calendar (non-blocking):', calendarError.message);
          }
        }

        // Retrieve Stripe receipt URL from the payment charge
        let receiptUrl = null;
        try {
          if (session.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
            if (paymentIntent.latest_charge) {
              const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
              receiptUrl = charge.receipt_url || null;
            }
          }
        } catch (receiptError) {
          console.warn('Could not retrieve receipt URL (non-blocking):', receiptError.message);
        }

        // Send confirmation emails
        try {
          await sendRegistrationEmails({
            eventSummary,
            eventId,
            eventType,
            eventStartDateTime,
            eventEndDateTime,
            guardianEmail,
            guardianFirstName,
            guardianLastName,
            guardianPhone,
            guardianRelationship,
            // Single player (camps/lessons)
            playerFirstName,
            playerLastName,
            playerAge,
            playerDateOfBirth,
            playerLevelOfPlay,
            playerLeague,
            // Multi-player (at home training)
            players,
            playerCount: playerCount ? parseInt(playerCount) : 1,
            // At Home Training address
            addressStreet,
            addressUnit,
            addressCity,
            addressState,
            addressZip,
            addressCountry,
            slotDate,
            slotTime,
            // Emergency & medical
            emergencyContactName: emergencyName,
            emergencyContactPhone: emergencyPhone,
            emergencyContactRelationship: emergencyRelationship,
            medicalNotes,
            amountPaid: session.amount_total / 100, // Convert from cents
            receiptUrl,
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
 * All user-provided data is escaped to prevent XSS attacks
 */
async function sendRegistrationEmails(data) {
  const {
    eventSummary,
    eventId,
    eventType,
    eventStartDateTime,
    eventEndDateTime,
    guardianEmail,
    guardianFirstName,
    guardianLastName,
    guardianPhone,
    guardianRelationship,
    // Single player
    playerFirstName,
    playerLastName,
    playerAge,
    playerDateOfBirth,
    playerLevelOfPlay,
    playerLeague,
    // Multi-player
    players,
    playerCount,
    // At Home Training
    addressStreet,
    addressUnit,
    addressCity,
    addressState,
    addressZip,
    addressCountry,
    slotDate,
    slotTime,
    // Emergency & medical
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship,
    medicalNotes,
    amountPaid,
    receiptUrl,
  } = data;

  // Escape all user-provided strings for safe HTML insertion
  const safe = {
    eventSummary: escapeHtml(eventSummary),
    eventId: escapeHtml(eventId),
    guardianEmail: escapeHtml(guardianEmail),
    guardianFirstName: escapeHtml(guardianFirstName),
    guardianLastName: escapeHtml(guardianLastName),
    guardianPhone: escapeHtml(guardianPhone),
    guardianRelationship: escapeHtml(guardianRelationship),
    playerFirstName: escapeHtml(playerFirstName),
    playerLastName: escapeHtml(playerLastName),
    playerAge: escapeHtml(playerAge),
    playerLevelOfPlay: escapeHtml(playerLevelOfPlay),
    playerLeague: escapeHtml(playerLeague),
    addressStreet: escapeHtml(addressStreet),
    addressUnit: escapeHtml(addressUnit),
    addressCity: escapeHtml(addressCity),
    addressState: escapeHtml(addressState),
    addressZip: escapeHtml(addressZip),
    addressCountry: escapeHtml(addressCountry),
    slotTime: escapeHtml(slotTime),
    emergencyContactName: escapeHtml(emergencyContactName),
    emergencyContactPhone: escapeHtml(emergencyContactPhone),
    emergencyContactRelationship: escapeHtml(emergencyContactRelationship),
    medicalNotes: escapeHtml(medicalNotes),
  };

  const isAtHomeTraining = eventType === 'at_home_training';
  const hasMultiplePlayers = players && players.length > 0;

  // Calculate age from DOB if available, otherwise use provided age
  const calculatedAge = calculateAge(playerDateOfBirth);
  const displayAge = calculatedAge !== null ? calculatedAge : (safe.playerAge || 'N/A');

  // Format date for display
  const formattedDOB = formatDate(playerDateOfBirth);
  const formattedSlotDate = formatDate(slotDate);
  const formattedEventStart = formatEventDateTime(eventStartDateTime);
  const formattedEventEnd = formatEventDateTime(eventEndDateTime);

  // Build Google Calendar "Add Event" URL for user email
  const googleCalendarUrl = buildGoogleCalendarUrl({
    title: eventSummary,
    startDateTime: eventStartDateTime,
    endDateTime: eventEndDateTime,
    description: `New Era Hockey Training - ${eventSummary}`,
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com';

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL environment variable not configured');
  }

  // Escape player data for multi-player scenarios
  const safePlayers = hasMultiplePlayers
    ? players.map(p => ({
        firstName: escapeHtml(p.firstName),
        lastName: escapeHtml(p.lastName),
        dateOfBirth: p.dateOfBirth,
        levelOfPlay: escapeHtml(p.levelOfPlay),
        league: escapeHtml(p.league),
      }))
    : [];

  // Admin notification email
  const adminEmailParams = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [adminEmail],
    },
    Message: {
      Subject: {
        Data: `New Registration: ${safe.eventSummary}`,
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #14b8a6;">New Event Registration</h2>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Event Details</h3>
                <p><strong>Event:</strong> ${safe.eventSummary}</p>
                <p><strong>Event ID:</strong> ${safe.eventId}</p>
                ${eventStartDateTime ? `<p><strong>Date &amp; Time:</strong> ${formattedEventStart}${eventEndDateTime && eventEndDateTime !== eventStartDateTime ? ` &ndash; ${formattedEventEnd}` : ''}</p>` : ''}
                <p><strong>Amount Paid:</strong> $${amountPaid.toFixed(2)}</p>
              </div>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Player Information</h3>
                ${
                  hasMultiplePlayers
                    ? safePlayers
                        .map(
                          (player, idx) => `
                    <div style="margin-bottom: ${idx < safePlayers.length - 1 ? '15px' : '0'}; ${idx > 0 ? 'padding-top: 15px; border-top: 1px solid #ddd;' : ''}">
                      <p><strong>Player ${idx + 1}:</strong> ${player.firstName} ${player.lastName}</p>
                      <p><strong>Date of Birth:</strong> ${formatDate(player.dateOfBirth)}</p>
                      <p><strong>Age:</strong> ${calculateAge(player.dateOfBirth) || 'N/A'}</p>
                      <p><strong>Level of Play:</strong> ${player.levelOfPlay || 'N/A'}</p>
                      <p><strong>League:</strong> ${player.league || 'N/A'}</p>
                    </div>
                  `
                        )
                        .join('')
                    : `
                    <p><strong>Name:</strong> ${safe.playerFirstName} ${safe.playerLastName}</p>
                    <p><strong>Date of Birth:</strong> ${formattedDOB}</p>
                    <p><strong>Age:</strong> ${displayAge}</p>
                    <p><strong>Level of Play:</strong> ${safe.playerLevelOfPlay || 'N/A'}</p>
                    <p><strong>League:</strong> ${safe.playerLeague || 'N/A'}</p>
                  `
                }
              </div>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Guardian Information</h3>
                <p><strong>Name:</strong> ${safe.guardianFirstName} ${safe.guardianLastName}</p>
                <p><strong>Email:</strong> <a href="mailto:${safe.guardianEmail}">${safe.guardianEmail}</a></p>
                <p><strong>Phone:</strong> ${safe.guardianPhone || 'N/A'}</p>
                <p><strong>Relationship to Player:</strong> ${safe.guardianRelationship || 'N/A'}</p>
              </div>

              ${
                isAtHomeTraining && safe.addressStreet
                  ? `
              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Training Address</h3>
                <p><strong>Street:</strong> ${safe.addressStreet}${safe.addressUnit ? ' ' + safe.addressUnit : ''}</p>
                <p><strong>City:</strong> ${safe.addressCity || 'N/A'}</p>
                <p><strong>State:</strong> ${safe.addressState || 'N/A'}</p>
                <p><strong>ZIP:</strong> ${safe.addressZip || 'N/A'}</p>
                <p><strong>Country:</strong> ${safe.addressCountry || 'USA'}</p>
                ${slotDate ? `<p><strong>Date:</strong> ${formattedSlotDate}</p>` : ''}
                ${safe.slotTime ? `<p><strong>Time:</strong> ${safe.slotTime}</p>` : ''}
              </div>
              `
                  : ''
              }

              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Emergency Contact</h3>
                <p><strong>Name:</strong> ${safe.emergencyContactName || 'N/A'}</p>
                <p><strong>Phone:</strong> ${safe.emergencyContactPhone || 'N/A'}</p>
                <p><strong>Relationship to Player:</strong> ${safe.emergencyContactRelationship || 'N/A'}</p>
              </div>

              ${safe.medicalNotes ? `
                <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                  <h3 style="color: #856404; margin-top: 0;">Medical Notes</h3>
                  <p style="color: #856404; white-space: pre-wrap;">${safe.medicalNotes}</p>
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

  // Guardian confirmation email - NEH branded dark theme with dark mode override
  const userEmailParams = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [guardianEmail], // Use original email for sending
    },
    Message: {
      Subject: {
        Data: `Registration Confirmed: ${safe.eventSummary}`,
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="color-scheme" content="light only">
              <meta name="supported-color-schemes" content="light only">
              <!--[if mso]>
              <xml>
                <o:OfficeDocumentSettings>
                  <o:AllowPNG/>
                  <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
              </xml>
              <![endif]-->
              <style>
                /* Force light mode / prevent dark mode transformations */
                :root { color-scheme: light only; supported-color-schemes: light only; }

                /* Reset dark mode for all major email clients */
                @media (prefers-color-scheme: dark) {
                  .email-body, .email-container, .content-section, .summary-section, .next-steps-section, .cta-section, .contact-section, .footer-section {
                    background-color: #131b24 !important;
                  }
                  .heading-text { color: #1ab8df !important; }
                  .body-text, .list-text { color: #ffffff !important; }
                  .link-text { color: #1ab8df !important; }
                  .label-text { color: #1ab8df !important; }
                }

                /* Outlook.com dark mode overrides */
                [data-ogsc] .email-body, [data-ogsc] .email-container, [data-ogsc] .content-section { background-color: #131b24 !important; }
                [data-ogsc] .heading-text { color: #1ab8df !important; }
                [data-ogsc] .body-text, [data-ogsc] .list-text { color: #ffffff !important; }
                [data-ogsc] .link-text { color: #1ab8df !important; }

                /* Gmail dark mode overrides */
                u + .body .email-body { background-color: #131b24 !important; }
                u + .body .heading-text { color: #1ab8df !important; }
                u + .body .body-text { color: #ffffff !important; }

                /* Yahoo dark mode */
                [style*="color-scheme: dark"] .email-body { background-color: #131b24 !important; }

                /* Base styles */
                body, .email-body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #131b24 !important;
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
                }

                .email-container {
                  max-width: 600px !important;
                  margin: 0 auto !important;
                  background-color: #131b24 !important;
                }

                /* Typography */
                .heading-text {
                  font-family: 'Montserrat', Helvetica, Arial, sans-serif !important;
                  color: #1ab8df !important;
                  margin: 0 !important;
                }

                .body-text, .list-text {
                  font-family: Verdana, Geneva, sans-serif !important;
                  color: #ffffff !important;
                  font-size: 16px !important;
                  line-height: 1.6 !important;
                }

                .label-text {
                  font-family: Verdana, Geneva, sans-serif !important;
                  color: #1ab8df !important;
                  font-weight: bold !important;
                }

                .link-text {
                  color: #1ab8df !important;
                  text-decoration: underline !important;
                }

                /* Sections */
                .content-section {
                  background-color: #1c2631 !important;
                  border-radius: 8px !important;
                  padding: 24px !important;
                  margin: 20px 0 !important;
                }

                .cta-button {
                  display: inline-block !important;
                  background-color: #1ab8df !important;
                  color: #131b24 !important;
                  text-decoration: none !important;
                  padding: 14px 28px !important;
                  border-radius: 6px !important;
                  font-family: 'Montserrat', Helvetica, Arial, sans-serif !important;
                  font-weight: bold !important;
                  font-size: 14px !important;
                }

                .cta-button:hover {
                  background-color: #15a3c7 !important;
                }

                .divider {
                  border: none !important;
                  border-top: 1px solid #2a3744 !important;
                  margin: 30px 0 !important;
                }
              </style>
            </head>
            <body class="body email-body" style="margin: 0; padding: 0; background-color: #131b24;">
              <!--[if mso]>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
              <tr><td>
              <![endif]-->
              <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #131b24;">

                <!-- Header -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
                  <tr>
                    <td align="center" style="padding: 20px 0 30px 0;">
                      <h1 class="heading-text" style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; color: #1ab8df; font-size: 28px; margin: 0;">Registration Confirmed!</h1>
                    </td>
                  </tr>
                </table>

                <!-- Greeting -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
                  <tr>
                    <td style="padding: 0 0 20px 0;">
                      <p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                        Hi ${safe.guardianFirstName},
                      </p>
                      <p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0;">
                        Thank you for registering ${
                          hasMultiplePlayers
                            ? `${playerCount} player${playerCount > 1 ? 's' : ''}`
                            : `<strong>${safe.playerFirstName} ${safe.playerLastName}</strong>`
                        } for <strong>${safe.eventSummary}</strong>!
                        We're excited to have them join us ${isAtHomeTraining ? 'for at-home training' : 'on the ice'}.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Registration Summary -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="content-section" style="background-color: #1c2631; border-radius: 8px; margin: 20px 0;">
                  <tr>
                    <td style="padding: 24px;">
                      <h2 class="heading-text" style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; color: #1ab8df; font-size: 20px; margin: 0 0 16px 0;">Registration Summary</h2>
                      ${
                        hasMultiplePlayers
                          ? `<p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 8px 0;"><span class="label-text" style="color: #1ab8df; font-weight: bold;">Players:</span></p>
                             <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px 16px;">
                               ${safePlayers.map(p => `<tr><td class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; padding: 4px 0;">• ${p.firstName} ${p.lastName} (Age ${calculateAge(p.dateOfBirth) || 'N/A'})</td></tr>`).join('')}
                             </table>`
                          : `<p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 8px 0;"><span class="label-text" style="color: #1ab8df; font-weight: bold;">Player:</span> ${safe.playerFirstName} ${safe.playerLastName}</p>
                             <p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 8px 0;"><span class="label-text" style="color: #1ab8df; font-weight: bold;">Age:</span> ${displayAge}</p>`
                      }
                      <p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 8px 0;"><span class="label-text" style="color: #1ab8df; font-weight: bold;">Event:</span> ${safe.eventSummary}</p>
                      ${eventStartDateTime ? `<p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 8px 0;"><span class="label-text" style="color: #1ab8df; font-weight: bold;">Date &amp; Time:</span> ${formattedEventStart}${eventEndDateTime && eventEndDateTime !== eventStartDateTime ? ` – ${formattedEventEnd}` : ''}</p>` : ''}
                      ${isAtHomeTraining && safe.addressStreet ? `<p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 8px 0;"><span class="label-text" style="color: #1ab8df; font-weight: bold;">Location:</span> ${safe.addressStreet}, ${safe.addressCity}, ${safe.addressState}</p>` : ''}
                      <p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 14px; margin: 0;"><span class="label-text" style="color: #1ab8df; font-weight: bold;">Amount Paid:</span> $${amountPaid.toFixed(2)}</p>
                    </td>
                  </tr>
                </table>

                <!-- What's Next -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="content-section" style="background-color: #1c2631; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1ab8df;">
                  <tr>
                    <td style="padding: 24px;">
                      <h2 class="heading-text" style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; color: #1ab8df; font-size: 20px; margin: 0 0 16px 0;">What's Next?</h2>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        ${
                          isAtHomeTraining
                            ? `
                          <tr><td class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; padding: 6px 0;">• Coach Will will arrive at your address on ${slotDate ? formattedSlotDate : 'the scheduled date'} at ${safe.slotTime || 'the scheduled time'}</td></tr>
                          <tr><td class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; padding: 6px 0;">• Have all players ready with their hockey equipment</td></tr>
                          <tr><td class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; padding: 6px 0;">• Ensure training area is clear and ready for the session</td></tr>
                        `
                            : `
                          <tr><td class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; padding: 6px 0;">• Please arrive 15 minutes early before ice-time</td></tr>
                          <tr><td class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; padding: 6px 0;">• Bring all necessary hockey equipment</td></tr>
                        `
                        }
                      </table>
                    </td>
                  </tr>
                </table>

                ${googleCalendarUrl ? `
                <!-- Google Calendar CTA -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
                  <tr>
                    <td align="center" style="padding: 24px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${googleCalendarUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="13%" fillcolor="#1ab8df" stroke="f">
                        <w:anchorlock/>
                        <center style="color:#131b24;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;">&#128197; Add to Google Calendar</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${googleCalendarUrl}" target="_blank" rel="noopener noreferrer" class="cta-button" style="display: inline-block; background-color: #1ab8df; color: #131b24; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 14px;">&#128197;&nbsp;&nbsp;Add to Google Calendar</a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
                ` : ''}

                ${receiptUrl ? `
                <!-- Payment Receipt CTA -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
                  <tr>
                    <td align="center" style="padding: 0 0 24px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${receiptUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="13%" fillcolor="#1c2631" strokecolor="#1ab8df" strokeweight="2px">
                        <w:anchorlock/>
                        <center style="color:#1ab8df;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;">&#129534; View Payment Receipt</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${receiptUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1c2631; color: #1ab8df; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 14px; border: 2px solid #1ab8df;">&#128451;&nbsp;&nbsp;View Payment Receipt</a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
                ` : ''}

                <!-- Contact Section -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="content-section" style="background-color: #1c2631; border-radius: 8px; margin: 20px 0;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; margin: 0;">
                        <strong>Questions?</strong> Contact Coach Will at
                        <a href="mailto:coachwill@newerahockeytraining.com" class="link-text" style="color: #1ab8df; text-decoration: underline;">coachwill@newerahockeytraining.com</a>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Signature -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
                  <tr>
                    <td style="padding: 20px 0;">
                      <p class="body-text" style="font-family: Verdana, Geneva, sans-serif; color: #ffffff; font-size: 16px; margin: 0;">
                        Best regards,<br>
                        <strong style="color: #1ab8df;">Coach Will &amp; The New Era Hockey Team</strong>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <hr class="divider" style="border: none; border-top: 1px solid #2a3744; margin: 30px 0;">

                <!-- Footer Links -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
                  <tr>
                    <td align="center" style="padding: 0 0 20px 0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 0 12px;">
                            <a href="https://newerahockeytraining.com/terms-and-conditions" target="_blank" rel="noopener noreferrer" style="font-family: Verdana, Geneva, sans-serif; font-size: 12px; color: #1ab8df; text-decoration: none;">Terms &amp; Conditions</a>
                          </td>
                          <td style="color: #2a3744;">|</td>
                          <td style="padding: 0 12px;">
                            <a href="https://newerahockeytraining.com/privacy-policy" target="_blank" rel="noopener noreferrer" style="font-family: Verdana, Geneva, sans-serif; font-size: 12px; color: #1ab8df; text-decoration: none;">Privacy Policy</a>
                          </td>
                          <td style="color: #2a3744;">|</td>
                          <td style="padding: 0 12px;">
                            <a href="https://newerahockeytraining.com/waiver" target="_blank" rel="noopener noreferrer" style="font-family: Verdana, Geneva, sans-serif; font-size: 12px; color: #1ab8df; text-decoration: none;">Waiver</a>
                          </td>
                          <td style="color: #2a3744;">|</td>
                          <td style="padding: 0 12px;">
                            <a href="https://newerahockeytraining.com/contact" target="_blank" rel="noopener noreferrer" style="font-family: Verdana, Geneva, sans-serif; font-size: 12px; color: #1ab8df; text-decoration: none;">Contact</a>
                          </td>
                          <td style="color: #2a3744;">|</td>
                          <td style="padding: 0 12px;">
                            <a href="https://newerahockeytraining.com/faq" target="_blank" rel="noopener noreferrer" style="font-family: Verdana, Geneva, sans-serif; font-size: 12px; color: #1ab8df; text-decoration: none;">FAQ</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Footer Text -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #131b24;">
                  <tr>
                    <td align="center" style="padding: 0 0 20px 0;">
                      <p style="font-family: Verdana, Geneva, sans-serif; color: #8899a6; font-size: 12px; margin: 0; line-height: 1.5;">
                        This is an automated confirmation from New Era Hockey Training.${receiptUrl ? '' : ' Your payment receipt will be available from Stripe shortly.'}
                      </p>
                    </td>
                  </tr>
                </table>

              </div>
              <!--[if mso]>
              </td></tr>
              </table>
              <![endif]-->
            </body>
            </html>
          `,
        },
      },
    },
  };

  // Send both emails in parallel
  console.log('Sending registration confirmation emails...');
  const [adminResult, userResult] = await Promise.all([
    sesClient.send(new SendEmailCommand(adminEmailParams)),
    sesClient.send(new SendEmailCommand(userEmailParams)),
  ]);

  console.log(`Admin notification sent. MessageId: ${adminResult.MessageId}`);
  console.log(`User confirmation sent to ${guardianEmail}. MessageId: ${userResult.MessageId}`);
}
