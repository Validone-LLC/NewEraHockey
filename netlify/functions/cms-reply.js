const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

// Initialize AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEH_AWS_REGION || 'us-east-1',
});

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse request data
    const { emailId, replyMessage, replyFrom } = JSON.parse(event.body);

    // Validate required fields
    if (!emailId || !replyMessage) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email ID and reply message are required' }),
      };
    }

    // Find the original email JSON file
    const emailsDir = path.join(process.cwd(), 'src', 'data', 'emails');
    const files = await fs.readdir(emailsDir);
    const emailFile = files.find((file) => file.includes(emailId) || file.endsWith(`${emailId}.json`));

    if (!emailFile) {
      // Try to find by searching file contents
      let foundFile = null;
      for (const file of files) {
        if (file === '.gitkeep') continue;
        try {
          const content = await fs.readFile(path.join(emailsDir, file), 'utf8');
          const data = JSON.parse(content);
          if (data.id === emailId) {
            foundFile = file;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!foundFile) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Original email not found' }),
        };
      }
    }

    // Read the original email data
    const emailPath = path.join(emailsDir, emailFile || files.find((f) => JSON.parse(fs.readFileSync(path.join(emailsDir, f), 'utf8')).id === emailId));
    const emailData = JSON.parse(await fs.readFile(emailPath, 'utf8'));

    // Generate reply metadata
    const replyTimestamp = Date.now();
    const replyId = `reply_${replyTimestamp}`;
    const replyMessageId = `<${replyTimestamp}.${Math.random().toString(36).substr(2, 9)}@newerahockeytraining.com>`;

    // Prepare reply email parameters with proper threading headers
    const replyEmailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com',
      Destination: {
        ToAddresses: [emailData.from.email],
      },
      Message: {
        Subject: {
          Data: `Re: ${emailData.subject}`,
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #14b8a6;">Response from New Era Hockey</h2>

                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="white-space: pre-wrap;">${replyMessage}</p>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #14b8a6; margin: 20px 0;">
                  <p style="font-size: 14px; color: #666; margin: 0;"><strong>Your original message:</strong></p>
                  <p style="white-space: pre-wrap; color: #666; margin-top: 10px;">${emailData.message}</p>
                </div>

                <br>
                <p style="font-size: 16px;">
                  Best regards,<br>
                  <strong>${replyFrom || 'Coach Will & The New Era Hockey Team'}</strong>
                </p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #666;">
                  This email is in response to your inquiry from ${new Date(emailData.timestamp).toLocaleDateString()}.
                  If you have additional questions, please reply to this email.
                </p>
              </div>
            `,
          },
        },
      },
      // Email threading headers for proper conversation grouping
      Headers: [
        {
          Name: 'Message-ID',
          Value: replyMessageId,
        },
        {
          Name: 'In-Reply-To',
          Value: emailData.messageId,
        },
        {
          Name: 'References',
          Value: emailData.messageId,
        },
        {
          Name: 'Thread-Topic',
          Value: emailData.subject,
        },
        {
          Name: 'Thread-Index',
          Value: emailData.threadId,
        },
      ],
    };

    // Send the reply email
    await ses.sendEmail(replyEmailParams).promise();

    // Update the email JSON file with reply information
    emailData.status = 'RESPONDED';
    emailData.replies.push({
      id: replyId,
      messageId: replyMessageId,
      from: replyFrom || 'Coach Will & The New Era Hockey Team',
      message: replyMessage,
      timestamp: new Date().toISOString(),
      sentBy: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'CMS',
    });

    // Save updated email data
    await fs.writeFile(emailPath, JSON.stringify(emailData, null, 2), 'utf8');

    console.log(`Reply sent: ${replyId} for email ${emailId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Reply sent successfully',
        replyId: replyId,
      }),
    };
  } catch (error) {
    console.error('Reply error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to send reply. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
    };
  }
};
