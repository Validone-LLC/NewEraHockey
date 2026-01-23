const AWS = require('aws-sdk');
const { escapeHtml } = require('./lib/htmlUtils.cjs');

// Initialize AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEH_AWS_REGION || 'us-east-1',
});

// Helper: Verify Turnstile token
async function verifyTurnstile(token, ip) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}

// Helper: Detect random/gibberish text
function isRandomText(text) {
  if (!text || text.length < 10) return false;

  // Check for excessive consonants in a row (likely random)
  const consonantPattern = /[bcdfghjklmnpqrstvwxyz]{7,}/i;
  if (consonantPattern.test(text)) return true;

  // Check for lack of spaces (random strings usually no spaces)
  const wordCount = text.trim().split(/\s+/).length;
  const charCount = text.length;
  if (charCount > 20 && wordCount === 1) return true;

  // Check for repeating patterns (e.g., "abcabcabc")
  const repeatingPattern = /(.{3,})\1{2,}/;
  if (repeatingPattern.test(text)) return true;

  // Check for very low vowel ratio
  const vowels = text.match(/[aeiou]/gi) || [];
  const vowelRatio = vowels.length / text.length;
  if (text.length > 20 && vowelRatio < 0.15) return true;

  return false;
}

exports.handler = async event => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const clientIp =
    event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown';

  try {
    // Parse form data
    const { name, email, phone, message, website, turnstileToken } = JSON.parse(event.body);

    // 🍯 PROTECTION 1: Honeypot Check
    if (website && website.trim() !== '') {
      console.log(`Honeypot triggered from IP: ${clientIp}`);
      // Silently reject - don't tell bot it was detected
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: "Message sent successfully! We'll get back to you soon.",
        }),
      };
    }

    // Validate required fields
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Name, email, and message are required' }),
      };
    }

    // ✅ PROTECTION 2: Turnstile Verification
    if (!turnstileToken) {
      console.log(`Missing Turnstile token from IP: ${clientIp}`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Verification required' }),
      };
    }

    const isTurnstileValid = await verifyTurnstile(turnstileToken, clientIp);
    if (!isTurnstileValid) {
      console.log(`Turnstile verification failed from IP: ${clientIp}`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Verification failed' }),
      };
    }

    // 🔤 PROTECTION 3: Random Text Detection
    if (isRandomText(name) || isRandomText(message)) {
      console.log(`Random text detected from IP: ${clientIp}`);
      // Silently reject
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: "Message sent successfully! We'll get back to you soon.",
        }),
      };
    }

    // ✅ All validations passed - process legitimate submission

    // Admin notification email
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable is not set');
      throw new Error('Server configuration error: Admin email not configured');
    }

    console.log(`Sending admin notification to: ${adminEmail}`);

    // Escape user-provided data for safe HTML insertion
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeMessage = escapeHtml(message);

    const adminEmailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com',
      Destination: {
        ToAddresses: [adminEmail],
      },
      ReplyToAddresses: [email], // Use original email for reply-to
      Message: {
        Subject: {
          Data: `New Contact Form Submission from ${safeName}`,
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #14b8a6;">New Contact Form Submission</h2>

                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Name:</strong> ${safeName}</p>
                  <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                  <p><strong>Phone:</strong> ${safePhone || 'Not provided'}</p>
                </div>

                <h3 style="color: #333;">Message:</h3>
                <div style="background-color: #fff; padding: 15px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                  <p style="white-space: pre-wrap;">${safeMessage}</p>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #666;">
                  <strong>Action Required:</strong> Please respond to this inquiry within 24-48 hours.<br>
                  You can reply directly to this email to reach ${safeName}.
                </p>
              </div>
            `,
          },
        },
      },
    };

    // User confirmation email
    const userEmailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com',
      Destination: {
        ToAddresses: [email], // Use original email for sending
      },
      Message: {
        Subject: {
          Data: 'Thanks for Contacting New Era Hockey!',
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #14b8a6;">Hi ${safeName},</h2>

                <p style="font-size: 16px; line-height: 1.6;">
                  Thank you for reaching out to New Era Hockey! We've received your message and will get back to you within 24-48 hours.
                </p>

                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Your Message:</h3>
                  <p style="white-space: pre-wrap; color: #666;">${safeMessage}</p>
                </div>

                <p style="font-size: 16px; line-height: 1.6;">
                  If you have any urgent questions, feel free to call us directly at the number listed on our website.
                </p>

                <br>
                <p style="font-size: 16px;">
                  Best regards,<br>
                  <strong>Coach Will &amp; The New Era Hockey Team</strong>
                </p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #666;">
                  This is an automated confirmation email. To respond, please reply to the follow-up email you'll receive from our team.
                </p>
              </div>
            `,
          },
        },
      },
    };

    // Send both emails
    console.log('Sending emails via AWS SES...');
    const [adminResult, userResult] = await Promise.all([
      ses.sendEmail(adminEmailParams).promise(),
      ses.sendEmail(userEmailParams).promise(),
    ]);

    console.log(`Admin email sent successfully. MessageId: ${adminResult.MessageId}`);
    console.log(`User confirmation sent successfully. MessageId: ${userResult.MessageId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: "Message sent successfully! We'll get back to you soon.",
      }),
    };
  } catch (error) {
    console.error('Contact form error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to send message. Please try again later or contact us directly.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
    };
  }
};
