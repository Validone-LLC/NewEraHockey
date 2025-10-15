# Netlify Email & API Implementation Guide

**Research Date**: 2025-10-13
**Project**: newerahockey
**Goal**: Implement working contact/registration forms with email notifications

---

## 📋 Executive Summary

**Your Questions Answered**:

1. ✅ **Contact Form**: Use Netlify Functions + SendGrid for email sending
2. ✅ **Netlify Server Hosting**: YES - Netlify Functions provide serverless API endpoints (no dedicated server needed)
3. ✅ **Registration API**: Netlify Functions can handle registration logic + email confirmations
4. ✅ **Admin + User Emails**: Send both admin notification + user confirmation via SendGrid

**Cost**: $0/month (Netlify Functions + SendGrid free tiers sufficient)

---

## 🎯 Solution Architecture

### Two Implementation Options

#### Option 1: Netlify Forms (Simplest)
```
User Form → Netlify Forms → Email Notification
                ↓
        Admin receives email
```
**Pros**: Zero code, built-in spam protection
**Cons**: No user confirmation email, limited customization

#### Option 2: Netlify Functions + SendGrid (Recommended)
```
User Form → React/Formik → Netlify Function → SendGrid API
                                    ↓
                    Admin Email + User Confirmation
```
**Pros**: Full control, dual emails, custom logic
**Cons**: Requires SendGrid API key, more setup

---

## 🚀 Recommended Implementation: Netlify Functions + SendGrid

### Why This Approach?

- ✅ **Serverless**: No server management needed
- ✅ **Scalable**: Auto-scales with traffic
- ✅ **Cost-Effective**: Free tier covers most use cases
- ✅ **Dual Emails**: Admin notification + user confirmation
- ✅ **Custom Logic**: Validation, database integration, analytics

---

## 📦 Setup Requirements

### 1. SendGrid Account (FREE)

**Sign Up**: https://signup.sendgrid.com/

**Free Tier Includes**:
- 100 emails/day (sufficient for contact forms)
- No credit card required for trial
- Single sender verification

**Setup Steps**:
1. Create SendGrid account
2. Navigate to Settings → API Keys
3. Create API key with "Mail Send" permission
4. **Save key securely** (shown only once)
5. Verify sender email address (Settings → Sender Authentication)

### 2. Netlify Environment Variables

**Add to Netlify**:
1. Site settings → Environment variables
2. Add variable:
   - **Key**: `SENDGRID_API_KEY`
   - **Value**: `SG.xxxxx...` (your API key)
   - **Scopes**: `Builds` + `Functions`

**Add to Local `.env`** (for development):
```bash
SENDGRID_API_KEY=SG.xxxxx...
ADMIN_EMAIL=admin@newerahockeytraining.com
```

⚠️ **IMPORTANT**: Add `.env` to `.gitignore` (never commit API keys!)

---

## 💻 Implementation Guide

### Step 1: Project Structure

```
newerahockey/
├── netlify/
│   └── functions/
│       ├── contact.js          # Contact form handler
│       └── register.js         # Registration handler
├── .env                        # Local env vars (gitignored)
└── netlify.toml                # Netlify configuration
```

### Step 2: Install Dependencies

```bash
npm install @sendgrid/mail
```

### Step 3: Create `netlify.toml`

```toml
[build]
  functions = "netlify/functions"

[dev]
  functions = "netlify/functions"
```

### Step 4: Create Contact Function

**File**: `netlify/functions/contact.js`

```javascript
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse form data
    const { name, email, phone, message } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name and email are required' }),
      };
    }

    // Admin notification email
    const adminEmail = {
      to: 'admin@newerahockeytraining.com', // Your admin email
      from: 'noreply@newerahockeytraining.com', // Verified sender in SendGrid
      replyTo: email, // User's email for easy replies
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
      `,
    };

    // User confirmation email
    const userEmail = {
      to: email,
      from: 'noreply@newerahockeytraining.com',
      subject: "Thanks for Contacting New Era Hockey!",
      html: `
        <h2>Hi ${name},</h2>
        <p>Thank you for reaching out to New Era Hockey! We've received your message and will get back to you within 24-48 hours.</p>
        <p><strong>Your message:</strong></p>
        <p style="background: #f5f5f5; padding: 15px; border-left: 4px solid #14b8a6;">
          ${message || 'No message provided'}
        </p>
        <p>If you have any urgent questions, feel free to call us directly.</p>
        <br>
        <p>Best regards,<br><strong>Coach Will & The New Era Hockey Team</strong></p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated confirmation email. Please do not reply directly to this message.
        </p>
      `,
    };

    // Send both emails
    await sgMail.send(adminEmail);
    await sgMail.send(userEmail);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Message sent successfully!',
      }),
    };
  } catch (error) {
    console.error('SendGrid Error:', error);

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send message. Please try again later.',
        details: error.message,
      }),
    };
  }
};
```

### Step 5: Update ContactForm Component

**File**: `src/components/contact/ContactForm/ContactForm.jsx`

Replace the simulated API call (lines 24-37) with:

```javascript
onSubmit: async (values, { resetForm }) => {
  setIsSubmitting(true);

  try {
    // Call Netlify Function
    const response = await fetch('/.netlify/functions/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    toast.success("Message sent successfully! We'll get back to you soon.");
    resetForm();
  } catch (error) {
    console.error('Contact form error:', error);
    toast.error('Failed to send message. Please try again or contact us directly.');
  } finally {
    setIsSubmitting(false);
  }
},
```

### Step 6: Create Registration Function

**File**: `netlify/functions/register.js`

```javascript
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse registration data
    const {
      name,
      email,
      phone,
      eventType,
      playerAge,
      skillLevel,
      additionalInfo,
    } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !email || !eventType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name, email, and event type are required' }),
      };
    }

    // Admin notification with registration details
    const adminEmail = {
      to: 'admin@newerahockeytraining.com',
      from: 'noreply@newerahockeytraining.com',
      replyTo: email,
      subject: `New Registration: ${eventType} - ${name}`,
      html: `
        <h2>New Event Registration</h2>
        <h3>Event Details</h3>
        <p><strong>Event Type:</strong> ${eventType}</p>
        <p><strong>Player Age:</strong> ${playerAge || 'Not specified'}</p>
        <p><strong>Skill Level:</strong> ${skillLevel || 'Not specified'}</p>

        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>

        <h3>Additional Information</h3>
        <p>${additionalInfo || 'None provided'}</p>

        <hr>
        <p style="font-size: 12px; color: #666;">
          <strong>Action Required:</strong> Please follow up with this registration within 24 hours.
        </p>
      `,
    };

    // User confirmation with event details
    const userEmail = {
      to: email,
      from: 'noreply@newerahockeytraining.com',
      subject: `Registration Confirmed - ${eventType}`,
      html: `
        <h2>Hi ${name},</h2>
        <p>Thank you for registering for <strong>${eventType}</strong> with New Era Hockey!</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Registration Summary</h3>
          <p><strong>Event:</strong> ${eventType}</p>
          <p><strong>Player Age:</strong> ${playerAge || 'Not specified'}</p>
          <p><strong>Skill Level:</strong> ${skillLevel || 'Not specified'}</p>
        </div>

        <h3>What's Next?</h3>
        <ol>
          <li>Our team will review your registration within 24-48 hours</li>
          <li>You'll receive an email with payment instructions and event details</li>
          <li>If you have questions, reply to our confirmation email</li>
        </ol>

        <p>We're excited to have you join us on the ice!</p>

        <br>
        <p>Best regards,<br><strong>Coach Will & The New Era Hockey Team</strong></p>

        <hr>
        <p style="font-size: 12px; color: #666;">
          Questions? Contact us at admin@newerahockeytraining.com or call XXX-XXX-XXXX
        </p>
      `,
    };

    // Send both emails
    await sgMail.send(adminEmail);
    await sgMail.send(userEmail);

    // Optional: Store registration in database here
    // await saveToDatabase(registrationData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Registration submitted successfully!',
      }),
    };
  } catch (error) {
    console.error('Registration Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process registration. Please try again later.',
        details: error.message,
      }),
    };
  }
};
```

---

## 🧪 Testing

### Local Testing with Netlify CLI

**Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

**Run locally**:
```bash
netlify dev
```

**Access**:
- Frontend: `http://localhost:8888`
- Functions: `http://localhost:8888/.netlify/functions/contact`

**Test function directly**:
```bash
curl -X POST http://localhost:8888/.netlify/functions/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
```

### Production Testing

1. **Deploy to Netlify**
2. **Submit test form**
3. **Verify**:
   - Admin receives notification email
   - User receives confirmation email
   - Check Netlify Functions logs: Site settings → Functions → Logs

---

## 💰 Cost Breakdown

### SendGrid Free Tier
- ✅ 100 emails/day (3,000/month)
- ✅ Single sender verification
- ✅ Email API access
- ⚠️ No dedicated IP (shared)

**Estimated Usage**:
- Contact forms: ~5-10/day = 10-20 emails/day
- Registrations: ~2-5/day = 4-10 emails/day
- **Total**: ~14-30 emails/day (well under limit)

### Netlify Functions Free Tier
- ✅ 125,000 requests/month
- ✅ 100 hours runtime/month
- ✅ No credit card required

**Estimated Usage**:
- Contact submissions: ~150/month
- Registrations: ~75/month
- **Total**: ~225 requests/month (0.18% of limit)

**Conclusion**: **$0/month** for foreseeable traffic levels

---

## ⚠️ Important Considerations

### 1. Sender Verification

**SendGrid requires verified sender addresses**:
1. Go to SendGrid → Settings → Sender Authentication
2. Verify your "from" email: `noreply@newerahockeytraining.com`
3. Add DNS records to your domain (SPF, DKIM)
4. **Without verification, emails won't send!**

### 2. Spam Protection

**Implement basic spam protection**:

```javascript
// Add honeypot field to form (hidden from users)
<input type="text" name="website" style={{ display: 'none' }} />

// Check in function
const { website } = JSON.parse(event.body);
if (website) {
  // Likely spam bot
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}
```

**Rate limiting**:
- Netlify Functions auto-scale but can be abused
- Consider adding IP-based rate limiting for production

### 3. Error Handling

**Always handle SendGrid errors**:
- Invalid API key
- Sender not verified
- Rate limit exceeded
- Network failures

**Log errors** but don't expose details to users:
```javascript
catch (error) {
  console.error('Detailed error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Failed to send message' }), // Generic message
  };
}
```

### 4. GDPR Compliance

**If collecting user data**:
- Add privacy policy link
- Get consent checkbox
- Store data securely
- Provide data deletion mechanism

---

## 🔧 Advanced Enhancements

### 1. Email Templates

**Use SendGrid dynamic templates**:
```javascript
const userEmail = {
  to: email,
  from: 'noreply@newerahockeytraining.com',
  templateId: 'd-xxxxxxxxxxxxx', // SendGrid template ID
  dynamicTemplateData: {
    name: name,
    eventType: eventType,
    playerAge: playerAge,
  },
};
```

### 2. Database Integration

**Store submissions in Airtable/Firebase**:
```javascript
// After sending emails
const registrationData = {
  name,
  email,
  phone,
  eventType,
  timestamp: new Date().toISOString(),
};

await saveToAirtable(registrationData);
```

### 3. Slack Notifications

**Send admin alerts to Slack**:
```javascript
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({
    text: `🆕 New registration: ${name} for ${eventType}`,
  }),
});
```

### 4. Calendar Integration

**Add registration to Google Calendar**:
```javascript
// Use Google Calendar API
await addToCalendar({
  summary: `${name} - ${eventType}`,
  start: eventDate,
  attendees: [{ email: email }],
});
```

---

## 📝 Implementation Checklist

### Phase 1: Setup (15 minutes)
- [ ] Create SendGrid account
- [ ] Generate API key
- [ ] Verify sender email
- [ ] Add API key to Netlify env vars
- [ ] Create `.env` file locally (add to `.gitignore`)

### Phase 2: Contact Form (30 minutes)
- [ ] Install `@sendgrid/mail`: `npm install @sendgrid/mail`
- [ ] Create `netlify/functions/contact.js`
- [ ] Update `ContactForm.jsx` with API call
- [ ] Test locally with `netlify dev`
- [ ] Deploy and test in production

### Phase 3: Registration Form (30 minutes)
- [ ] Create `netlify/functions/register.js`
- [ ] Update registration form component
- [ ] Customize email templates
- [ ] Test locally
- [ ] Deploy and test

### Phase 4: Polish (optional, 30 minutes)
- [ ] Add honeypot spam protection
- [ ] Implement SendGrid dynamic templates
- [ ] Add Slack notifications
- [ ] Set up error monitoring
- [ ] Add GDPR consent checkbox

---

## 🔗 Resources

**SendGrid**:
- [SendGrid Quickstart](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
- [API Reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [Dynamic Templates](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates)

**Netlify Functions**:
- [Functions Overview](https://docs.netlify.com/build/functions/overview/)
- [Environment Variables](https://docs.netlify.com/build/environment-variables/)
- [Local Development](https://docs.netlify.com/cli/get-started/#run-a-local-development-environment)

**Email Best Practices**:
- [Email Deliverability Guide](https://sendgrid.com/blog/email-deliverability-guide/)
- [SPF/DKIM Setup](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)

---

## ❓ FAQ

**Q: Do I need a backend server?**
A: No! Netlify Functions provide serverless API endpoints. No server management needed.

**Q: Can I use a different email service?**
A: Yes! Mailgun, Postmark, Amazon SES all work similarly. SendGrid recommended for ease of use.

**Q: What if I exceed SendGrid's free tier?**
A: Upgrade to SendGrid Essentials ($19.95/month) for 50,000 emails/month.

**Q: How do I debug email issues?**
A: Check Netlify Functions logs (Site settings → Functions → Logs) and SendGrid Activity Feed.

**Q: Can I customize email templates?**
A: Yes! Use SendGrid's Dynamic Templates for visual email builder + variable substitution.

**Q: Is this solution secure?**
A: Yes, if you:
  - Never commit API keys (use env vars)
  - Validate all inputs
  - Add spam protection
  - Use HTTPS (automatic on Netlify)

**Q: Can I send attachments?**
A: Yes, SendGrid supports attachments. Add `attachments` array to email object.

**Q: How do I handle unsubscribe requests?**
A: Add unsubscribe link in emails, store opt-out list, check before sending marketing emails.

---

## 🚀 Next Steps

1. **Immediate**: Set up SendGrid account + verify sender
2. **This Week**: Implement contact form function
3. **Next Week**: Implement registration form function
4. **Ongoing**: Monitor email deliverability and function logs

**Estimated Setup Time**: 1-2 hours for complete implementation

**Risk Level**: Low (non-destructive, fully reversible)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-13
**Author**: Claude Code Research Agent
