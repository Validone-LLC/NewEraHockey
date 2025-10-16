const AWS = require('aws-sdk');

// Initialize AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEH_AWS_REGION || 'us-east-1',
});

exports.handler = async (event) => {
  // Debug: Log environment variable status (NOT the actual values for security)
  console.log('AWS Environment Check:', {
    hasAccessKey: !!process.env.NEH_AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.NEH_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEH_AWS_REGION || 'default-us-east-1',
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasFromEmail: !!process.env.SES_FROM_EMAIL,
    // Show first 8 chars of access key to verify it's loading (safe to log)
    accessKeyPrefix: process.env.NEH_AWS_ACCESS_KEY_ID?.substring(0, 8) || 'NOT_SET'
  });

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse form data
    const { name, email, phone, message } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Name, email, and message are required' }),
      };
    }

    // Admin notification email
    const adminEmail = process.env.ADMIN_EMAIL;

    // Validate admin email is configured
    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable is not set');
      throw new Error('Server configuration error: Admin email not configured');
    }

    console.log(`Sending admin notification to: ${adminEmail}`);

    const adminEmailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com',
      Destination: {
        ToAddresses: [adminEmail],
      },
      ReplyToAddresses: [email],
      Message: {
        Subject: {
          Data: `New Contact Form Submission from ${name}`,
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #14b8a6;">New Contact Form Submission</h2>

                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                  <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                </div>

                <h3 style="color: #333;">Message:</h3>
                <div style="background-color: #fff; padding: 15px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                  <p style="white-space: pre-wrap;">${message}</p>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #666;">
                  <strong>Action Required:</strong> Please respond to this inquiry within 24-48 hours.<br>
                  You can reply directly to this email to reach ${name}.
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
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Thanks for Contacting New Era Hockey!',
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #14b8a6;">Hi ${name},</h2>

                <p style="font-size: 16px; line-height: 1.6;">
                  Thank you for reaching out to New Era Hockey! We've received your message and will get back to you within 24-48 hours.
                </p>

                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Your Message:</h3>
                  <p style="white-space: pre-wrap; color: #666;">${message}</p>
                </div>

                <p style="font-size: 16px; line-height: 1.6;">
                  If you have any urgent questions, feel free to call us directly at the number listed on our website.
                </p>

                <br>
                <p style="font-size: 16px;">
                  Best regards,<br>
                  <strong>Coach Will & The New Era Hockey Team</strong>
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

    // TODO: Implement CMS email storage later
    // For now, emails are sent successfully via AWS SES
    // Admin receives notification, user receives confirmation

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Message sent successfully! We\'ll get back to you soon.',
      }),
    };
  } catch (error) {
    console.error('Contact form error:', error);

    // Return generic error to user, log details
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
