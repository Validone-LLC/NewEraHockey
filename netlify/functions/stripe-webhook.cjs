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
const { escapeHtml, formatDate, formatEventDateTime, calculateAge } = require('./lib/htmlUtils.cjs');

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

        // Parse players data for At Home Training
        const isAtHomeTraining = eventType === 'at_home_training';
        const players = isAtHomeTraining && playersData ? JSON.parse(playersData) : null;

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
            emergencyContactName: emergencyName,
            emergencyContactPhone: emergencyPhone,
            emergencyContactRelationship: emergencyRelationship,
            medicalNotes,
          }
        );

        console.log(`Registration added for event ${eventId}:`, {
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
                    </div>
                  `
                        )
                        .join('')
                    : `
                    <p><strong>Name:</strong> ${safe.playerFirstName} ${safe.playerLastName}</p>
                    <p><strong>Date of Birth:</strong> ${formattedDOB}</p>
                    <p><strong>Age:</strong> ${displayAge}</p>
                    <p><strong>Level of Play:</strong> ${safe.playerLevelOfPlay || 'N/A'}</p>
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

  // Guardian confirmation email
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #14b8a6;">Registration Confirmed!</h2>

              <p style="font-size: 16px; line-height: 1.6;">
                Hi ${safe.guardianFirstName},
              </p>

              <p style="font-size: 16px; line-height: 1.6;">
                Thank you for registering ${
                  hasMultiplePlayers
                    ? `${playerCount} player${playerCount > 1 ? 's' : ''}`
                    : `${safe.playerFirstName} ${safe.playerLastName}`
                } for <strong>${safe.eventSummary}</strong>!
                We're excited to have them join us ${isAtHomeTraining ? 'for at-home training' : 'on the ice'}.
              </p>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Registration Summary</h3>
                ${
                  hasMultiplePlayers
                    ? `<p><strong>Players:</strong></p>
                       <ul style="margin: 10px 0; padding-left: 20px;">
                         ${safePlayers.map(p => `<li>${p.firstName} ${p.lastName} (Age ${calculateAge(p.dateOfBirth) || 'N/A'})</li>`).join('')}
                       </ul>`
                    : `<p><strong>Player:</strong> ${safe.playerFirstName} ${safe.playerLastName}</p>
                       <p><strong>Age:</strong> ${displayAge}</p>`
                }
                <p><strong>Event:</strong> ${safe.eventSummary}</p>
                ${eventStartDateTime ? `<p><strong>Date &amp; Time:</strong> ${formattedEventStart}${eventEndDateTime && eventEndDateTime !== eventStartDateTime ? ` &ndash; ${formattedEventEnd}` : ''}</p>` : ''}
                ${isAtHomeTraining && safe.addressStreet ? `<p><strong>Location:</strong> ${safe.addressStreet}, ${safe.addressCity}, ${safe.addressState}</p>` : ''}
                <p><strong>Amount Paid:</strong> $${amountPaid.toFixed(2)}</p>
              </div>

              <div style="background-color: #e0f2f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #00695c; margin-top: 0;">What's Next?</h3>
                <ul style="color: #00695c; line-height: 1.8;">
                  ${
                    isAtHomeTraining
                      ? `
                    <li>Coach Will will arrive at your address on ${slotDate ? formattedSlotDate : 'the scheduled date'} at ${safe.slotTime || 'the scheduled time'}</li>
                    <li>Have all players ready with their hockey equipment</li>
                    <li>Ensure training area is clear and ready for the session</li>
                  `
                      : `
                    <li>Please arrive 15 minutes early before ice-time</li>
                    <li>Bring all necessary hockey equipment</li>
                  `
                  }
                </ul>
              </div>

              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                <p style="margin: 0;"><strong>Questions?</strong> Contact Coach Will at <a href="mailto:coachwill@newerahockeytraining.com">coachwill@newerahockeytraining.com</a></p>
              </div>

              <br>
              <p style="font-size: 16px;">
                Best regards,<br>
                <strong>Coach Will &amp; The New Era Hockey Team</strong>
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
