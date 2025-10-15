# Email Service Alternatives & CMS Email Management Research

**Research Date**: 2025-10-15
**Project**: New Era Hockey
**Goal**: Identify free email service alternatives and design CMS-based email management system

---

## 📋 Executive Summary

### Questions Answered

1. **Free SendGrid Alternatives**: Resend (best), AWS SES (most scalable), Mailgun, Brevo
2. **AWS Integration**: AWS SES works seamlessly with Netlify Functions
3. **CMS Email Management**: Use Git-based JSON storage + Netlify CMS collections
4. **Email Threading**: Implement using Message-ID, In-Reply-To, and References headers

### Recommended Solution

**Email Sending**: AWS SES (62,000 free emails/month)
**Email Storage**: JSON files in `src/data/emails/` folder
**CMS Integration**: Netlify CMS custom collection
**Threading**: Standard email headers for conversation tracking

**Total Cost**: $0/month

---

## 🎯 Part 1: Free Email Service Alternatives

### Comparison Matrix

| Service | Free Tier | Best For | Pros | Cons |
|---------|-----------|----------|------|------|
| **Resend** | 3,000/month | Modern devs | React templates, great DX | Newer service |
| **AWS SES** | 62,000/month* | Scalability | Massive free tier, AWS ecosystem | Complex setup |
| **Mailgun** | 5,000/month† | Testing | Established, good API | Trial only |
| **Brevo** | 300/day (9,000/month) | Marketing + transactional | CRM features | Limited API features |
| **SMTP2Go** | 1,000/month | Simple setup | Easy integration | Lower limits |
| **Postmark** | 100/month | Deliverability | Best-in-class delivery | Very limited free tier |

*When sending FROM AWS infrastructure (Netlify Functions count)
†First month trial, then paid

### Detailed Analysis

#### 1. Resend (⭐ Recommended for Modern Stacks)

**Website**: https://resend.com
**Free Tier**: 3,000 emails/month, 100 emails/day

**Pros**:
- Modern developer experience
- React Email template support
- Built-in email testing
- Great documentation
- No credit card for free tier

**Cons**:
- Relatively new (less track record)
- Smaller free tier than AWS

**Integration**:
```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@newerahockeytraining.com',
  to: email,
  subject: 'Thanks for Contacting New Era Hockey!',
  html: '<p>Email content...</p>'
});
```

#### 2. AWS SES (⭐ Recommended for Scale)

**Website**: https://aws.amazon.com/ses
**Free Tier**:
- 62,000 emails/month when sending FROM AWS
- 3,000 emails/month when sending TO AWS
- First 12 months

**Pros**:
- Massive free tier (62k emails)
- AWS infrastructure reliability
- Integrates with other AWS services
- Production-grade at scale

**Cons**:
- Requires AWS account setup
- More complex configuration
- Sandbox mode restrictions initially
- IAM credentials management

**Setup Requirements**:
1. Create AWS account
2. Verify domain in SES
3. Request production access (remove sandbox)
4. Create IAM user with SES permissions
5. Get access key + secret

**Integration**:
```javascript
const AWS = require('aws-sdk');

const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

await ses.sendEmail({
  Source: 'noreply@newerahockeytraining.com',
  Destination: { ToAddresses: [email] },
  Message: {
    Subject: { Data: 'Thanks for Contacting New Era Hockey!' },
    Body: { Html: { Data: '<p>Email content...</p>' } }
  }
}).promise();
```

**Cost After Free Tier**:
- $0.10 per 1,000 emails sent
- $0 per 1,000 emails received

#### 3. Mailgun

**Website**: https://www.mailgun.com
**Free Tier**: 5,000 emails/month (first month trial)

**Pros**:
- Established service
- Good email validation API
- Flexible routing rules

**Cons**:
- Free tier is trial only
- Requires credit card after trial
- $35/month after trial

#### 4. Brevo (formerly Sendinblue)

**Website**: https://www.brevo.com
**Free Tier**: 300 emails/day (9,000/month)

**Pros**:
- CRM and marketing features
- SMS capabilities
- Forever free tier

**Cons**:
- Daily limit (not monthly)
- Less developer-focused
- Limited API features on free tier

---

## 🏗️ Part 2: CMS Email Management Architecture

### System Requirements (from todo.md)

1. **Form Submission Flow**:
   - User fills contact form → submits
   - User receives confirmation email
   - Admin receives notification email

2. **CMS Email Management**:
   - Display emails with Name & Status
   - Status: NEW → VIEWED → RESPONDED
   - Admin can reply via CMS or email client
   - Track email threads/conversations

### Proposed Architecture

```
User Form Submission
        ↓
Netlify Function (/contact)
        ↓
    ┌───┴────┐
    ↓        ↓
  AWS SES  Create Email JSON
    ↓        ↓
User +    src/data/emails/
Admin      {timestamp}-{name}.json
Emails         ↓
          Git commit (webhook)
                ↓
          Netlify CMS Collection
                ↓
          Admin views in CMS
```

### Email Storage Schema

**File**: `src/data/emails/2025-10-15-john-doe.json`

```json
{
  "id": "email_1697389200000",
  "messageId": "<1697389200000.123@newerahockeytraining.com>",
  "threadId": "thread_1697389200000",
  "status": "NEW",
  "from": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234"
  },
  "subject": "Contact Form: General Inquiry",
  "message": "I'm interested in hockey training...",
  "timestamp": "2025-10-15T14:20:00Z",
  "replies": [],
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1",
    "formType": "contact"
  }
}
```

**Reply Entry** (added to `replies` array):

```json
{
  "id": "reply_1697389800000",
  "messageId": "<1697389800000.456@newerahockeytraining.com>",
  "inReplyTo": "<1697389200000.123@newerahockeytraining.com>",
  "from": "admin",
  "fromEmail": "admin@newerahockeytraining.com",
  "message": "Thanks for your inquiry! When would you like to schedule?",
  "timestamp": "2025-10-15T14:30:00Z",
  "sentVia": "CMS"
}
```

### Netlify CMS Configuration

**Add to `public/admin/config.yml`**:

```yaml
# Email Management
- name: 'emails'
  label: 'Email Management'
  label_singular: 'Email'
  folder: 'src/data/emails'
  create: false  # Emails created by function, not manually
  slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
  extension: 'json'
  format: 'json'
  identifier_field: 'from.name'
  summary: '{{from.name}} - {{status}} - {{timestamp}}'
  sortable_fields: ['timestamp', 'status', 'from.name']
  view_filters:
    - label: 'New'
      field: 'status'
      pattern: 'NEW'
    - label: 'Viewed'
      field: 'status'
      pattern: 'VIEWED'
    - label: 'Responded'
      field: 'status'
      pattern: 'RESPONDED'
  fields:
    - { label: 'ID', name: 'id', widget: 'string', required: true }
    - { label: 'Message ID', name: 'messageId', widget: 'string', required: true }
    - { label: 'Thread ID', name: 'threadId', widget: 'string', required: true }
    - label: 'Status'
      name: 'status'
      widget: 'select'
      options: ['NEW', 'VIEWED', 'RESPONDED']
      default: 'NEW'
    - label: 'From'
      name: 'from'
      widget: 'object'
      fields:
        - { label: 'Name', name: 'name', widget: 'string' }
        - { label: 'Email', name: 'email', widget: 'string' }
        - { label: 'Phone', name: 'phone', widget: 'string', required: false }
    - { label: 'Subject', name: 'subject', widget: 'string' }
    - { label: 'Message', name: 'message', widget: 'text' }
    - { label: 'Timestamp', name: 'timestamp', widget: 'datetime' }
    - label: 'Replies'
      name: 'replies'
      widget: 'list'
      required: false
      fields:
        - { label: 'Reply ID', name: 'id', widget: 'string' }
        - { label: 'Message ID', name: 'messageId', widget: 'string' }
        - { label: 'In Reply To', name: 'inReplyTo', widget: 'string' }
        - { label: 'From', name: 'from', widget: 'string', default: 'admin' }
        - { label: 'From Email', name: 'fromEmail', widget: 'string' }
        - { label: 'Message', name: 'message', widget: 'text' }
        - { label: 'Timestamp', name: 'timestamp', widget: 'datetime' }
        - label: 'Sent Via'
          name: 'sentVia'
          widget: 'select'
          options: ['CMS', 'Email']
          default: 'CMS'
    - label: 'Metadata'
      name: 'metadata'
      widget: 'object'
      required: false
      fields:
        - { label: 'User Agent', name: 'userAgent', widget: 'string', required: false }
        - { label: 'IP Address', name: 'ip', widget: 'string', required: false }
        - { label: 'Form Type', name: 'formType', widget: 'string' }
```

### Implementation Functions

#### 1. Contact Form Handler

**File**: `netlify/functions/contact.js`

```javascript
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { name, email, phone, message } = JSON.parse(event.body);

    // Generate unique IDs
    const timestamp = Date.now();
    const messageId = `<${timestamp}.${Math.random().toString(36).substr(2, 9)}@newerahockeytraining.com>`;
    const threadId = `thread_${timestamp}`;
    const emailId = `email_${timestamp}`;

    // Send emails via AWS SES
    // (Admin notification + User confirmation - code omitted for brevity)

    // Create email JSON file
    const emailData = {
      id: emailId,
      messageId: messageId,
      threadId: threadId,
      status: 'NEW',
      from: { name, email, phone },
      subject: `Contact Form: General Inquiry`,
      message: message,
      timestamp: new Date().toISOString(),
      replies: [],
      metadata: {
        userAgent: event.headers['user-agent'],
        ip: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        formType: 'contact'
      }
    };

    // Save to git repository (triggers CMS update)
    const fileName = `${new Date().toISOString().split('T')[0]}-${name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`;
    const filePath = path.join(process.cwd(), 'src', 'data', 'emails', fileName);

    await fs.writeFile(filePath, JSON.stringify(emailData, null, 2));

    // Optionally: Trigger git commit via webhook or GitHub API
    // await commitToGit(filePath, emailData);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Message sent successfully!' })
    };
  } catch (error) {
    console.error('Contact form error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send message', details: error.message })
    };
  }
};
```

#### 2. CMS Reply Handler

**File**: `netlify/functions/cms-reply.js`

```javascript
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { emailId, replyMessage } = JSON.parse(event.body);

    // Read original email file
    const emailFiles = await fs.readdir(path.join(process.cwd(), 'src', 'data', 'emails'));
    const emailFile = emailFiles.find(file => file.includes(emailId));

    if (!emailFile) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Email not found' }) };
    }

    const emailPath = path.join(process.cwd(), 'src', 'data', 'emails', emailFile);
    const emailData = JSON.parse(await fs.readFile(emailPath, 'utf8'));

    // Generate reply IDs
    const timestamp = Date.now();
    const replyMessageId = `<${timestamp}.${Math.random().toString(36).substr(2, 9)}@newerahockeytraining.com>`;

    // Send reply email via AWS SES with threading headers
    await ses.sendEmail({
      Source: 'admin@newerahockeytraining.com',
      Destination: { ToAddresses: [emailData.from.email] },
      Message: {
        Subject: { Data: `Re: ${emailData.subject}` },
        Body: {
          Html: {
            Data: `
              <p>Hi ${emailData.from.name},</p>
              <p>${replyMessage}</p>
              <br>
              <p>Best regards,<br><strong>New Era Hockey Team</strong></p>
              <hr>
              <p style="font-size: 12px; color: #666;">
                <strong>Original Message:</strong><br>
                ${emailData.message}
              </p>
            `
          }
        }
      },
      // Threading headers for conversation tracking
      ReplyToAddresses: ['admin@newerahockeytraining.com'],
      Headers: [
        { Name: 'In-Reply-To', Value: emailData.messageId },
        { Name: 'References', Value: emailData.messageId }
      ]
    }).promise();

    // Update email JSON with reply
    const reply = {
      id: `reply_${timestamp}`,
      messageId: replyMessageId,
      inReplyTo: emailData.messageId,
      from: 'admin',
      fromEmail: 'admin@newerahockeytraining.com',
      message: replyMessage,
      timestamp: new Date().toISOString(),
      sentVia: 'CMS'
    };

    emailData.replies.push(reply);
    emailData.status = 'RESPONDED';

    // Save updated email file
    await fs.writeFile(emailPath, JSON.stringify(emailData, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Reply sent successfully!' })
    };
  } catch (error) {
    console.error('Reply error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send reply', details: error.message })
    };
  }
};
```

---

## 📧 Part 3: Email Threading & Conversation Tracking

### How Email Threading Works

Email clients use three key headers to track conversations:

1. **Message-ID**: Unique identifier for each email
   ```
   <1697389200000.abc123@newerahockeytraining.com>
   ```

2. **In-Reply-To**: Message-ID of the email being replied to
   ```
   <1697389200000.abc123@newerahockeytraining.com>
   ```

3. **References**: All Message-IDs in the conversation thread
   ```
   <1697389200000.abc123@newerahockeytraining.com> <1697389800000.def456@newerahockeytraining.com>
   ```

### Implementation Strategy

**When User Replies via Email Client**:

1. Their email will include In-Reply-To and References headers
2. Parse these headers to identify the original thread
3. Use webhook or email forwarding to capture replies
4. Update email JSON file with reply data

**Tracking User Replies**:

Option 1: **AWS SES Receiving** (Recommended)
```javascript
// Configure SES to receive emails to replies+{emailId}@newerahockeytraining.com
// SES triggers Lambda/Netlify Function with email content
// Parse headers, match threadId, update JSON file
```

Option 2: **Email Forwarding Service** (Simpler)
```javascript
// Use service like SendGrid Inbound Parse or Mailgun Routes
// Forward replies to webhook endpoint
// Parse and update email files
```

### Sample Incoming Email Webhook

**File**: `netlify/functions/incoming-email.js`

```javascript
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  try {
    // Parse incoming email (format varies by provider)
    const email = JSON.parse(event.body);

    // Extract threading headers
    const inReplyTo = email.headers['In-Reply-To'];
    const references = email.headers['References'];

    // Find original email by Message-ID
    const emailFiles = await fs.readdir(path.join(process.cwd(), 'src', 'data', 'emails'));

    for (const file of emailFiles) {
      const emailPath = path.join(process.cwd(), 'src', 'data', 'emails', file);
      const emailData = JSON.parse(await fs.readFile(emailPath, 'utf8'));

      // Check if this email is part of the thread
      if (emailData.messageId === inReplyTo ||
          emailData.replies.some(r => r.messageId === inReplyTo)) {

        // Add user's reply to thread
        const userReply = {
          id: `reply_${Date.now()}`,
          messageId: email.headers['Message-ID'],
          inReplyTo: inReplyTo,
          from: 'user',
          fromEmail: emailData.from.email,
          message: email.text || email.html,
          timestamp: new Date(email.date).toISOString(),
          sentVia: 'Email'
        };

        emailData.replies.push(userReply);
        emailData.status = 'RESPONDED'; // Or 'AWAITING_RESPONSE'

        await fs.writeFile(emailPath, JSON.stringify(emailData, null, 2));

        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Thread not found' })
    };
  } catch (error) {
    console.error('Incoming email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

---

## 💰 Cost Comparison

### SendGrid Free Tier
- 100 emails/day (3,000/month)
- Single sender only
- Basic features
- **Cost after**: $19.95/month (15,000 emails)

### AWS SES Free Tier
- 62,000 emails/month (first 12 months)
- 3,000 emails/month (always free when receiving)
- Full features
- **Cost after**: $0.10 per 1,000 emails

### Resend Free Tier
- 3,000 emails/month
- 100 emails/day
- Modern features
- **Cost after**: $20/month (50,000 emails)

### Recommendation by Use Case

| Monthly Volume | Recommended Service | Cost |
|----------------|---------------------|------|
| < 100 emails | Any service | $0 |
| 100-3,000 emails | Resend or AWS SES | $0 |
| 3,000-10,000 emails | AWS SES | $0.70 |
| 10,000-50,000 emails | AWS SES | $4.70 |
| 50,000+ emails | AWS SES | $5.00+ |

---

## 🚀 Implementation Roadmap

### Phase 1: Email Service Migration (2-3 hours)
1. [ ] Create AWS account (or Resend account)
2. [ ] Verify domain for email sending
3. [ ] Set up IAM credentials (AWS) or API key (Resend)
4. [ ] Update Netlify environment variables
5. [ ] Modify contact function to use new service
6. [ ] Test email sending

### Phase 2: Email Storage Setup (1-2 hours)
1. [ ] Create `src/data/emails/` folder
2. [ ] Update contact function to save email JSONs
3. [ ] Test JSON file creation
4. [ ] Verify git commits work correctly

### Phase 3: CMS Integration (2-3 hours)
1. [ ] Add email collection to `config.yml`
2. [ ] Test CMS can read email files
3. [ ] Configure status filters
4. [ ] Add custom preview templates
5. [ ] Test status updates

### Phase 4: Reply Functionality (3-4 hours)
1. [ ] Create CMS reply handler function
2. [ ] Implement email threading headers
3. [ ] Test replies from CMS
4. [ ] Verify thread continuity

### Phase 5: Incoming Email Tracking (4-5 hours)
1. [ ] Set up incoming email webhook (SES or service)
2. [ ] Create incoming email parser
3. [ ] Test thread matching logic
4. [ ] Implement automatic status updates
5. [ ] Test full conversation flow

**Total Estimated Time**: 12-17 hours

---

## ⚠️ Important Considerations

### 1. Git Repository Size

**Issue**: Storing emails as JSON files will increase repo size over time

**Solutions**:
- Implement automatic archiving (move old emails to separate branch)
- Use external database for long-term storage
- Periodic cleanup of resolved conversations

### 2. Real-Time Updates

**Issue**: Netlify CMS may not show updates immediately after function creates files

**Solutions**:
- Use git webhooks to trigger CMS refresh
- Implement periodic polling in CMS
- Add manual refresh button

### 3. Email Deliverability

**Issue**: Emails may go to spam without proper setup

**Requirements**:
- SPF record in DNS
- DKIM signature configured
- DMARC policy set
- Sender reputation management

### 4. Security Considerations

**Risks**:
- Email JSON files contain user data
- Git history preserves all emails
- Sensitive information exposure

**Mitigations**:
- Encrypt sensitive fields
- Implement data retention policies
- Use private repository
- Add GDPR compliance measures

### 5. Status Tracking Limitations

**Challenge**: Tracking "VIEWED" status when admin opens email in CMS

**Solutions**:
- Use Netlify CMS preview hooks to track views
- Implement custom CMS widget with view tracking
- Manual status update buttons

---

## 📝 Next Steps

### Immediate Actions (This Week)

1. **Decide on Email Service**:
   - AWS SES for scalability (recommended)
   - Resend for simplicity (alternative)

2. **Test Email Storage**:
   - Create prototype with 5-10 test emails
   - Verify Netlify CMS can read/write

3. **Plan CMS Customization**:
   - Design custom preview template
   - Plan reply interface layout

### Future Enhancements

1. **Email Templates**: Professional HTML templates
2. **Automated Responses**: Auto-reply for common questions
3. **Analytics Dashboard**: Email volume, response time metrics
4. **Search Functionality**: Full-text search across emails
5. **Bulk Operations**: Archive, delete, tag multiple emails

---

## 🔗 Resources

**AWS SES**:
- [Getting Started Guide](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-getting-started.html)
- [Netlify + AWS Tutorial](https://dev.to/idiglove/contact-form-and-send-as-email-with-aws-ses-netlify-and-gatsby-ae5)
- [Email Headers Spec](https://www.rfc-editor.org/rfc/rfc5322)

**Resend**:
- [Documentation](https://resend.com/docs)
- [React Email Templates](https://react.email)

**Email Threading**:
- [Message-ID Spec](https://cr.yp.to/immhf/thread.html)
- [Email Threading Guide](https://developers.mailersend.com/guides/creating-email-threads)

**Netlify CMS**:
- [Custom Collections](https://www.netlifycms.org/docs/collection-types/)
- [Custom Widgets](https://www.netlifycms.org/docs/custom-widgets/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-15
**Author**: Claude Code Research Agent
**Status**: Complete
