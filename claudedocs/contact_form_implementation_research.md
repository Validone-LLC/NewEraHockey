# Contact Form Implementation Research
**Date**: 2025-10-09
**Status**: Research Complete

## Requirements Summary
Implement full-featured contact form system with:
1. ✉️ User submission → sends email to admin
2. ✅ User receives confirmation email
3. 📋 Submission appears in CMS for management
4. 🏷️ Status tracking (new/viewed/responded)
5. 💬 Admin response from CMS → sends email to user

## Current Stack
- **Frontend**: React 18.3.1 + Vite 5.4
- **CMS**: Sveltia CMS (Git-based, no backend)
- **Hosting**: TBD (likely Netlify or Vercel)
- **Repository**: GitHub

---

## 🎯 Recommended Architecture

### **Option 1: Netlify Functions + Resend + GitHub Integration** ⭐ RECOMMENDED

**Why This Approach:**
- Complete control over submission workflow
- No monthly fees (Resend free tier: 3K emails/month, 100/day)
- Submissions stored as JSON in Git → visible in Sveltia CMS
- Serverless → no infrastructure management
- Modern, developer-friendly stack

**Architecture Flow:**

```
User Submits Form
       ↓
Netlify Function (/netlify/functions/contact)
       ↓
    ┌──────────────────┐
    │  Process Data    │
    │  Validate Input  │
    └──────────────────┘
       ↓
   ┌────────────────────────────┐
   │                            │
   ▼                            ▼
Resend API                GitHub API
Send 2 Emails:           Create Commit:
- Admin notification     - JSON file in
- User confirmation        src/data/contact-submissions/
                          - {timestamp}-{name}.json
   │                            │
   └────────────┬───────────────┘
                ▼
         CMS Displays
         New Submission
         (status: "new")
```

**Components:**

1. **Netlify Function** (`netlify/functions/contact.js`)
   - Validates form data
   - Calls Resend API for emails
   - Creates GitHub commit via API
   - Returns success/error to frontend

2. **Resend Email Service**
   - Admin notification email
   - User confirmation email (transactional)
   - React Email templates for beautiful emails

3. **GitHub API Integration**
   - Auto-commit JSON submission to repo
   - Triggers on form submission
   - No GitHub Actions needed

4. **Sveltia CMS Collection** (already configured!)
   - Collection: `contact-submissions`
   - Fields: name, email, phone, message, submittedAt, status, response
   - Status widget: select ["new", "viewed", "responded"]

5. **Response Functionality** (Future Phase)
   - Add "Response" field in CMS
   - Another Netlify Function to send response email
   - Update status to "responded" via GitHub API

---

## 📊 Alternative Options

### **Option 2: Third-Party Form Service**

**Services**: Formbackend, Headlessforms, Formspree

**Pros:**
- Extremely easy setup (just form endpoint)
- Built-in spam protection
- No code required

**Cons:**
- Monthly cost ($5-15/month)
- Limited CMS integration
- Less control over workflow
- Can't respond from CMS

**Best For**: Quick MVP, non-technical teams

---

### **Option 3: Netlify Forms (Native)**

**Pros:**
- Zero code setup (`data-netlify="true"`)
- Built into hosting platform
- Can trigger functions on submission

**Cons:**
- **$19+/month** after 100 submissions
- Submissions not in Git/CMS
- Webhook integration complex

**Best For**: Existing Netlify sites with budget

---

## 💰 Cost Analysis

| Solution | Setup Cost | Monthly Cost | Email Cost |
|----------|------------|--------------|------------|
| **Netlify + Resend** | Free | $0 | Free (3K/mo) |
| **Formbackend** | Free | $8/mo | Included |
| **Netlify Forms** | Free | $19+/mo | Extra config |
| **Headlessforms** | Free | $5/mo | Via webhook |

---

## 🔧 Implementation Guide (Recommended Option)

### **Phase 1: Email Functionality** (1-2 hours)

1. **Setup Resend**
   ```bash
   npm install resend
   ```
   - Create account at resend.com
   - Get API key
   - Add to Netlify environment variables

2. **Create Netlify Function**
   ```javascript
   // netlify/functions/contact.js
   import { Resend } from 'resend';

   const resend = new Resend(process.env.RESEND_API_KEY);

   export async function handler(event) {
     const { name, email, phone, message } = JSON.parse(event.body);

     // Send admin notification
     await resend.emails.send({
       from: 'contact@newerahockey.com',
       to: 'Nehockeytraining@outlook.com',
       subject: `New Contact: ${name}`,
       html: `<p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Message:</strong><br>${message}</p>`
     });

     // Send user confirmation
     await resend.emails.send({
       from: 'noreply@newerahockey.com',
       to: email,
       subject: 'We received your message!',
       html: `<p>Hi ${name},</p>
              <p>Thank you for contacting New Era Hockey...</p>`
     });

     return { statusCode: 200, body: 'Success' };
   }
   ```

3. **Update ContactForm Component**
   ```javascript
   const handleSubmit = async (e) => {
     e.preventDefault();

     const response = await fetch('/.netlify/functions/contact', {
       method: 'POST',
       body: JSON.stringify(formData)
     });

     if (response.ok) {
       setSuccess(true);
     }
   };
   ```

### **Phase 2: CMS Integration** (2-3 hours)

1. **GitHub API Integration**
   ```javascript
   // In Netlify Function
   import { Octokit } from '@octokit/rest';

   const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

   // Create submission file
   const timestamp = new Date().toISOString();
   const filename = `${timestamp}-${name.replace(/\s/g, '-')}.json`;

   const submission = {
     name,
     email,
     phone,
     message,
     submittedAt: timestamp,
     status: 'new'
   };

   await octokit.repos.createOrUpdateFileContents({
     owner: 'Validone-LLC',
     repo: 'NewEraHockey',
     path: `src/data/contact-submissions/${filename}`,
     message: `New contact submission from ${name}`,
     content: Buffer.from(JSON.stringify(submission, null, 2)).toString('base64')
   });
   ```

2. **CMS Collection** (Already configured!)
   - Collection exists in `config.yml`
   - Just needs `status` field widget update
   - Add: `{ label: 'Status', name: 'status', widget: 'select', options: ['new', 'viewed', 'responded'] }`

### **Phase 3: Response Functionality** (Future)

1. **Add Response Field**
   ```yaml
   # config.yml
   - { label: 'Response', name: 'response', widget: 'text', required: false }
   - { label: 'Responded At', name: 'respondedAt', widget: 'datetime', required: false }
   ```

2. **Create Response Function**
   ```javascript
   // netlify/functions/send-response.js
   // Triggered manually or via CMS webhook
   // Sends response email + updates status
   ```

---

## 🔐 Security Considerations

1. **API Keys**: Store in Netlify environment variables
2. **Validation**:
   - Email format validation
   - Spam protection (honeypot field)
   - Rate limiting via Netlify
3. **CORS**: Configure for domain only
4. **GitHub Token**: Scope to repo content only

---

## 📚 Key Resources

### Netlify Functions
- [Functions Overview](https://docs.netlify.com/build/functions/overview/)
- [Contact Form Tutorial](https://dev.to/headwayio/contact-forms-with-netlify-serverless-functions-11cn)

### Resend Email
- [Official Docs](https://resend.com/docs)
- [React Email Integration](https://react.email/docs/integrations/resend)
- [Contact Form Example](https://billyle.dev/posts/configure-a-contact-form-email-server-with-resend-for-your-website)

### GitHub API
- [Octokit REST](https://github.com/octokit/rest.js)
- [Create File Contents](https://docs.github.com/en/rest/repos/contents)

### Git Auto Commit Actions
- [git-auto-commit-action](https://github.com/stefanzweifel/git-auto-commit-action)

---

## ⚡ Quick Start Checklist

- [ ] Sign up for Resend account
- [ ] Get Resend API key
- [ ] Create GitHub Personal Access Token (repo scope)
- [ ] Add environment variables to Netlify
- [ ] Install dependencies: `npm install resend @octokit/rest`
- [ ] Create `netlify/functions/contact.js`
- [ ] Update `ContactForm.jsx` to call function
- [ ] Update CMS config with status field
- [ ] Test submission flow
- [ ] Verify CMS displays submission
- [ ] Test email delivery

---

## 🎨 Enhanced Features (Optional)

1. **React Email Templates**
   - Beautiful branded emails
   - Responsive design
   - Professional appearance

2. **File Attachments**
   - Resume uploads
   - Player photos
   - Store in GitHub or Cloudinary

3. **Slack Notifications**
   - Real-time admin alerts
   - Integration via webhook

4. **Analytics**
   - Track submission sources
   - Conversion rates
   - Response times

---

## 📝 Notes

- **Sveltia CMS**: Git-based CMS, doesn't handle submissions natively
- **Form vs Content**: Submissions are user data, not content (separate concern)
- **Local Testing**: Use Netlify CLI (`netlify dev`) to test functions locally
- **Deployment**: Functions deploy automatically with site

---

## 🚀 Next Steps

1. Review architecture with team
2. Set up Resend account
3. Implement Phase 1 (emails only)
4. Test thoroughly
5. Add Phase 2 (CMS integration)
6. Plan Phase 3 (response functionality)

**Estimated Total Implementation Time**: 4-6 hours for Phases 1-2
