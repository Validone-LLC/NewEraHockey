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
 * - CMS_BUCKET: S3 bucket for CMS content (optional, for pending queue)
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { escapeHtml } = require('./lib/htmlUtils.cjs');

const awsCredentials = {
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
};
const awsRegion = process.env.NEH_AWS_REGION || 'us-east-1';

// Initialize AWS SES v3 client for email notifications
const sesClient = new SESClient({
  credentials: awsCredentials,
  region: awsRegion,
});

// Initialize S3 client for CMS pending queue (optional)
const CMS_BUCKET = process.env.CMS_BUCKET;
const s3Client = CMS_BUCKET
  ? new S3Client({ credentials: awsCredentials, region: awsRegion })
  : null;

// Helper: Verify Turnstile token (shared pattern with contact.cjs)
async function verifyTurnstile(token, ip) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    return false;
  }
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const clientIp =
    event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown';

  let testimonialData;
  try {
    testimonialData = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  try {

    // 🍯 PROTECTION 1: Honeypot check
    if (testimonialData.website && testimonialData.website.trim() !== '') {
      console.log(`Honeypot triggered from IP: ${clientIp}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Testimonial submitted successfully' }),
      };
    }

    // Validate required fields
    const { displayName, role, testimonial, rating, turnstileToken } = testimonialData;
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

    // Validate field lengths
    if (displayName.length > 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Display name must be 100 characters or less' }) };
    }
    if (role.length > 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Role must be 100 characters or less' }) };
    }
    if (teamName && teamName.length > 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Team name must be 100 characters or less' }) };
    }
    if (testimonial.length > 2000) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Testimonial must be 2000 characters or less' }) };
    }

    // ✅ PROTECTION 2: Turnstile verification
    if (!turnstileToken) {
      console.log(`Missing Turnstile token from IP: ${clientIp}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Verification required' }),
      };
    }
    const isTurnstileValid = await verifyTurnstile(turnstileToken, clientIp);
    if (!isTurnstileValid) {
      console.log(`Turnstile verification failed from IP: ${clientIp}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Verification failed' }),
      };
    }

    // Validate rating is between 1-5 (must be an integer)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
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

    // Add to CMS pending queue (non-blocking — email is the primary notification)
    if (s3Client) {
      try {
        await addToPendingQueue({
          displayName,
          role,
          teamName,
          testimonial,
          rating,
        });
      } catch (s3Err) {
        console.error('Failed to add to CMS pending queue (non-fatal):', s3Err.message);
      }
    }

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

  // Escape user input for safe HTML insertion
  const safeDisplayName = escapeHtml(displayName);
  const safeRole = escapeHtml(role);
  const safeTeamName = escapeHtml(teamName);
  const safeTestimonial = escapeHtml(testimonial);

  // Format display name with role and team (if provided)
  const authorDisplay = safeTeamName ? `${safeRole} • ${safeTeamName}` : safeRole;

  const emailParams = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [adminEmail],
    },
    Message: {
      Subject: {
        Data: `New Testimonial Submission: ${safeDisplayName}`,
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
                <p><strong>Display Name:</strong> ${safeDisplayName}</p>
                <p><strong>Role:</strong> ${safeRole}</p>
                ${safeTeamName ? `<p><strong>Team Name:</strong> ${safeTeamName}</p>` : ''}
                <p><strong>Display As:</strong> ${authorDisplay}</p>
                <p><strong>Rating:</strong> ${starRating} (${rating} out of 5)</p>
              </div>

              <div style="background-color: #fff; padding: 20px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Testimonial</h3>
                <p style="font-style: italic; line-height: 1.6; white-space: pre-wrap;">"${safeTestimonial}"</p>
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

/**
 * Add testimonial to CMS pending queue in S3
 * Read-modify-write pattern on content/testimonials-pending.json
 */
async function addToPendingQueue(data) {
  const key = 'content/testimonials-pending.json';
  const { displayName, role, teamName, testimonial, rating } = data;

  // Read existing pending file
  let pending = [];
  try {
    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: CMS_BUCKET, Key: key })
    );
    const body = await res.Body.transformToString();
    const parsed = JSON.parse(body);
    pending = parsed.pending || [];
  } catch (err) {
    if (err.name !== 'NoSuchKey') {
      console.warn('Warning reading pending file:', err.message);
    }
  }

  // Append new testimonial
  const newEntry = {
    id: `pending-${Date.now()}`,
    name: displayName,
    displayName,
    role,
    playerInfo: teamName || '',
    text: testimonial,
    rating,
    submittedAt: new Date().toISOString(),
  };
  pending.push(newEntry);

  // Write back
  await s3Client.send(
    new PutObjectCommand({
      Bucket: CMS_BUCKET,
      Key: key,
      Body: JSON.stringify({ pending }, null, 2),
      ContentType: 'application/json',
    })
  );

  console.log(`Testimonial added to CMS pending queue. ID: ${newEntry.id}`);
}
