/**
 * Netlify Function: Testimonial Submission Handler
 *
 * Receives testimonial form submissions and emails them to admin for review.
 *
 * Environment Variables Required:
 * - NEH_AWS_ACCESS_KEY_ID: AWS access key for SES
 * - NEH_AWS_SECRET_ACCESS_KEY: AWS secret key for SES
 * - NEH_AWS_REGION: AWS region (default: us-east-1)
 * - ADMIN_EMAIL: Email address to send testimonials to
 * - SES_FROM_EMAIL: Email address to send from (default: noreply@newerahockeytraining.com)
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

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

  try {
    // Parse request body
    const testimonialData = JSON.parse(event.body);

    // Validate required fields
    const { displayName, role, testimonial, rating } = testimonialData;
    const teamName = testimonialData.teamName || '';

    if (!displayName || !role || !testimonial || !rating) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'Display name, role, testimonial, and rating are required',
        }),
      };
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid rating',
          message: 'Rating must be between 1 and 5',
        }),
      };
    }

    // Send email to admin
    await sendTestimonialEmail({
      displayName,
      role,
      teamName,
      testimonial,
      rating,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Testimonial submitted successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing testimonial submission:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Submission failed',
        message: error.message || 'Something went wrong. Please try again.',
      }),
    };
  }
};

/**
 * Send testimonial notification email to admin
 */
async function sendTestimonialEmail(data) {
  const { displayName, role, teamName, testimonial, rating } = data;

  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com';

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL environment variable not configured');
  }

  // Generate star rating display
  const starRating = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  // Format display name with role and team (if provided)
  const authorDisplay = teamName ? `${role} • ${teamName}` : role;

  const emailParams = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [adminEmail],
    },
    Message: {
      Subject: {
        Data: `New Testimonial Submission: ${displayName}`,
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #14b8a6;">New Testimonial Submission</h2>

              <p style="font-size: 16px; line-height: 1.6;">
                A new testimonial has been submitted for review on the New Era Hockey website.
              </p>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Testimonial Details</h3>
                <p><strong>Display Name:</strong> ${displayName}</p>
                <p><strong>Role:</strong> ${role}</p>
                ${teamName ? `<p><strong>Team Name:</strong> ${teamName}</p>` : ''}
                <p><strong>Display As:</strong> ${authorDisplay}</p>
                <p><strong>Rating:</strong> ${starRating} (${rating} out of 5)</p>
              </div>

              <div style="background-color: #fff; padding: 20px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Testimonial</h3>
                <p style="font-style: italic; line-height: 1.6; white-space: pre-wrap;">"${testimonial}"</p>
              </div>

              <div style="background-color: #e0f2f1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #00695c;">
                  <strong>Next Steps:</strong> Review this testimonial and add it to the CMS if approved.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="font-size: 12px; color: #666;">
                This is an automated notification from the New Era Hockey testimonial submission form.
              </p>
            </div>
          `,
        },
      },
    },
  };

  console.log('Sending testimonial notification email...');
  const result = await sesClient.send(new SendEmailCommand(emailParams));
  console.log(`Testimonial notification sent to ${adminEmail}. MessageId: ${result.MessageId}`);
}
