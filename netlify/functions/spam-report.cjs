const AWS = require('aws-sdk');

// Initialize AWS services
const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEH_AWS_REGION || 'us-east-1',
});

const dynamodb = new AWS.DynamoDB.DocumentClient({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEH_AWS_REGION || 'us-east-1',
});

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE_NAME;

// Helper: Get week date range
function getWeekDateRange() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    start: sevenDaysAgo.getTime(),
    end: now.getTime(),
    startFormatted: sevenDaysAgo.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    endFormatted: now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

// Helper: Fetch spam logs from DynamoDB
async function fetchSpamLogs(startTime, endTime) {
  try {
    const result = await dynamodb
      .scan({
        TableName: DYNAMODB_TABLE,
        FilterExpression: '#ts BETWEEN :start AND :end',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':start': startTime,
          ':end': endTime,
        },
      })
      .promise();

    return result.Items || [];
  } catch (error) {
    console.error('Failed to fetch spam logs:', error);
    return [];
  }
}

// Helper: Delete processed logs
async function deleteProcessedLogs(logs) {
  if (logs.length === 0) return;

  try {
    const deletePromises = logs.map(log =>
      dynamodb
        .delete({
          TableName: DYNAMODB_TABLE,
          Key: {
            id: log.id,
            timestamp: log.timestamp,
          },
        })
        .promise()
    );

    await Promise.all(deletePromises);
    console.log(`Deleted ${logs.length} processed spam logs`);
  } catch (error) {
    console.error('Failed to delete processed logs:', error);
  }
}

// Helper: Generate analytics report
function generateAnalytics(logs) {
  if (logs.length === 0) {
    return {
      total: 0,
      byType: {},
      topIPs: [],
      samples: [],
    };
  }

  // Count by type
  const byType = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {});

  // Count by IP
  const ipCounts = logs.reduce((acc, log) => {
    acc[log.ip] = (acc[log.ip] || 0) + 1;
    return acc;
  }, {});

  // Get top 5 offender IPs
  const topIPs = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  // Get sample spam patterns (max 5)
  const samples = logs
    .filter(log => log.data && (log.data.name || log.data.message))
    .slice(0, 5)
    .map(log => ({
      type: log.type,
      name: log.data.name || 'N/A',
      email: log.data.email || 'N/A',
      message: log.data.message?.substring(0, 50) || 'N/A',
    }));

  return {
    total: logs.length,
    byType,
    topIPs,
    samples,
  };
}

// Helper: Generate HTML email
function generateEmailHTML(analytics, dateRange) {
  const { total, byType, topIPs, samples } = analytics;

  if (total === 0) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #14b8a6;">📊 Weekly Spam Report</h2>
        <p style="font-size: 16px; color: #666;">
          <strong>Period:</strong> ${dateRange.startFormatted} - ${dateRange.endFormatted}
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 18px; color: #10b981;">
          ✅ <strong>Great news!</strong> No spam attempts detected this week.
        </p>
        <p style="font-size: 14px; color: #666;">
          Your contact form protection is working perfectly!
        </p>
      </div>
    `;
  }

  // Calculate percentages
  const typeStats = Object.entries(byType)
    .map(([type, count]) => ({
      type,
      count,
      percentage: ((count / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);

  // Type icons
  const typeIcons = {
    honeypot: '🍯',
    rate_limit: '⏱️',
    turnstile: '✅',
    random_text: '🔤',
  };

  const typeRows = typeStats
    .map(
      ({ type, count, percentage }) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
        ${typeIcons[type] || '🛡️'} ${type.replace('_', ' ').toUpperCase()}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <strong>${count}</strong>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${percentage}%
      </td>
    </tr>
  `
    )
    .join('');

  const ipRows = topIPs
    .map(
      ({ ip, count }, index) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
        ${index + 1}. <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${ip}</code>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <strong>${count}</strong> attempts
      </td>
    </tr>
  `
    )
    .join('');

  const sampleRows = samples
    .map(
      ({ type, name, email, message }) => `
    <div style="background: #f9fafb; padding: 12px; margin: 10px 0; border-left: 3px solid #ef4444; border-radius: 4px;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        <strong>Type:</strong> ${typeIcons[type] || '🛡️'} ${type.replace('_', ' ')}
      </p>
      <p style="margin: 5px 0; font-size: 14px;">
        <strong>Name:</strong> ${name}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Message:</strong> "${message}..."
      </p>
    </div>
  `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #14b8a6;">📊 SPAM PROTECTION SUMMARY</h2>
      <p style="font-size: 16px; color: #666;">
        <strong>Period:</strong> ${dateRange.startFormatted} - ${dateRange.endFormatted}
      </p>

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; font-size: 48px; font-weight: bold;">${total}</h3>
        <p style="margin: 5px 0 0 0; font-size: 18px; opacity: 0.9;">Total Blocked Attempts</p>
      </div>

      <h3 style="color: #333; margin-top: 30px;">Protection Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Type</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Count</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${typeRows}
        </tbody>
      </table>

      <h3 style="color: #333; margin-top: 30px;">Top Offender IPs</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tbody>
          ${ipRows}
        </tbody>
      </table>

      <h3 style="color: #333; margin-top: 30px;">Sample Spam Patterns</h3>
      ${sampleRows}

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

      <p style="font-size: 12px; color: #666;">
        This is an automated weekly report from your contact form spam protection system.<br>
        Logs have been automatically deleted after generating this report.
      </p>
    </div>
  `;
}

exports.handler = async (event, context) => {
  console.log('Starting weekly spam report generation...');

  try {
    // Get date range
    const dateRange = getWeekDateRange();
    console.log(`Generating report for ${dateRange.startFormatted} - ${dateRange.endFormatted}`);

    // Fetch spam logs
    const logs = await fetchSpamLogs(dateRange.start, dateRange.end);
    console.log(`Found ${logs.length} spam attempts`);

    // Generate analytics
    const analytics = generateAnalytics(logs);

    // Generate email HTML
    const emailHTML = generateEmailHTML(analytics, dateRange);

    // Get admin email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL environment variable not configured');
    }

    // Send email report
    const emailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@newerahockeytraining.com',
      Destination: {
        ToAddresses: [adminEmail],
      },
      Message: {
        Subject: {
          Data: `Weekly Spam Report - New Era Hockey Contact Form (${analytics.total} blocked)`,
        },
        Body: {
          Html: {
            Data: emailHTML,
          },
        },
      },
    };

    const result = await ses.sendEmail(emailParams).promise();
    console.log(`Report email sent successfully. MessageId: ${result.MessageId}`);

    // Delete processed logs (cleanup after report sent)
    await deleteProcessedLogs(logs);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Weekly report generated and sent. ${analytics.total} spam attempts blocked.`,
        analytics,
      }),
    };
  } catch (error) {
    console.error('Failed to generate spam report:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
