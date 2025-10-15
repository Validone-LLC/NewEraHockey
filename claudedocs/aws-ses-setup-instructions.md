# AWS SES Setup Instructions for New Era Hockey

Complete guide for setting up Amazon Simple Email Service (SES) for the New Era Hockey contact form system.

## Overview

This guide covers:
6. Environment variable configuration
7. Testing and troubleshooting

## Part 5: Configure Environment Variables

### 5.1 Local Development (.env file)

Create `.env` file in project root:

# Email Configuration
SES_FROM_EMAIL=noreply@newerahockeytraining.com
ADMIN_EMAIL=Nehockeytraining@outlook.com

**Important Note About ADMIN_EMAIL:**

You can use **ANY email address** as your ADMIN_EMAIL, including external providers like Outlook, Gmail, Yahoo, etc.

**In Sandbox Mode:**
- You MUST verify `Nehockeytraining@outlook.com` in AWS SES Console
- Go to SES Console → Verified identities → Create identity → Email address
- AWS will send a verification email to the Outlook inbox
- Click the verification link in that email
- Once verified, AWS SES can send admin notifications to this address

**After Production Access (Recommended):**
- NO verification needed for ADMIN_EMAIL
- AWS SES can send to ANY email address automatically
- Simply set `ADMIN_EMAIL=Nehockeytraining@outlook.com` in environment variables
- Request production access (Part 6) for unrestricted sending

### 6.1 Request Production Access

1. In SES Console, look for banner "Your Amazon SES account is in the sandbox"
2. Click **Request production access**
3. Fill out the form:

**Mail type:** Transactional
**Website URL:** https://newerahockey.validone-llc.com
**Use case description:**
```
We operate New Era Hockey, a professional hockey training organization.
We need to send transactional emails including:
- Contact form confirmations to customers
- Contact form notifications to administrators
- Customer inquiry responses

Expected volume: ~500-1000 emails per month
All emails are customer-initiated through our website contact form.
We implement proper unsubscribe mechanisms and SPF/DKIM authentication.
```

**Compliance:** Acknowledge you'll follow AWS policies
**Additional contacts:** (optional)

4. Click **Submit request**

### 6.2 Wait for Approval

- **Typical approval time:** 24-48 hours
- AWS may ask clarifying questions via support case
- Check email and AWS Support Center for updates

### 6.3 After Approval

Once approved:
- ✅ Send to ANY email address (no pre-verification needed)
- ✅ 50,000 emails/day default limit (can request increase)
- ✅ 14 emails/second sending rate

## Part 7: Testing the Setup

### 7.1 Install Dependencies

```bash
npm install aws-sdk
```

### 7.2 Test Locally with Netlify Dev

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Run local development server
netlify dev
```

This starts local server at `http://localhost:8888` with Netlify Functions at `http://localhost:8888/.netlify/functions/contact`

### 7.3 Test Contact Form

1. Navigate to `http://localhost:8888/contact`
2. Fill out contact form:
   - Name: Test User
   - Email: **[verified email]** - if in Sandbox, use an email you've verified in SES Console
   - Phone: (optional)
   - Message: Test message from local development
3. Click "Send Message"
4. Check for success toast notification
5. Check both email inboxes:
   - **Outlook inbox (Nehockeytraining@outlook.com)** should receive admin notification
   - User's email should receive confirmation

**Sandbox Mode Testing:**
- If still in sandbox, verify BOTH the user's test email AND `Nehockeytraining@outlook.com` in SES Console first
- You can only send TO verified email addresses in sandbox mode

**Production Mode Testing:**
- After production access is approved, you can send to ANY email address
- No pre-verification needed for recipients

### 7.4 Verify Email JSON Creation

Check that email JSON file was created:

```bash
ls -la src/data/emails/
```

You should see a file like: `2025-10-15-test-user-1697389200000.json`

Open the file to verify structure:

```json
{
  "id": "email_1697389200000",
  "messageId": "<1697389200000.abc123@newerahockeytraining.com>",
  "threadId": "thread_1697389200000",
  "status": "NEW",
  "from": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": ""
  },
  "subject": "Contact Form: General Inquiry",
  "message": "Test message from local development",
  "timestamp": "2025-10-15T14:20:00Z",
  "replies": [],
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ip": "127.0.0.1",
    "formType": "contact"
  }
}
```

### 7.5 Test Production Deployment

1. Commit and push changes to GitHub
2. Netlify automatically deploys
3. Wait for deployment to complete
4. Test contact form on live site
5. Verify emails are sent successfully

## Part 8: Monitoring and Troubleshooting

### 8.1 Monitor SES Sending

**AWS Console Monitoring:**
1. Go to SES Console → **Account dashboard**
2. View sending statistics:
   - Sends
   - Deliveries
   - Bounces
   - Complaints

**Set up CloudWatch Alarms (optional):**
- Alert on high bounce rates
- Alert on complaint rates
- Monitor sending quotas

### 8.2 Common Issues and Solutions

#### Issue: "Email address not verified"

**Cause:** Still in Sandbox mode, recipient email not verified
**Solution:**
- **For testing:** Verify `Nehockeytraining@outlook.com` in SES Console → Verified identities → Create identity → Email address
- Check Outlook inbox for AWS verification email and click the link
- **For production:** Request production access (Part 6) to send to any email without verification

#### Issue: "MessageRejected: Email address is not verified"

**Cause:** FROM email domain not verified
**Solution:**
- Complete domain verification (Part 2)
- Wait for DNS propagation (up to 72 hours)
- Verify DKIM records are correct

#### Issue: "The security token included in the request is invalid"

**Cause:** Incorrect AWS credentials
**Solution:**
- Verify NEH_AWS_ACCESS_KEY_ID and NEH_AWS_SECRET_ACCESS_KEY in environment variables
- Ensure no extra spaces or quotes
- Check IAM user has SES permissions

#### Issue: Emails going to spam

**Solutions:**
- Ensure SPF and DKIM are configured correctly
- Use reputable FROM address (noreply@yourdomain.com)
- Avoid spam trigger words in subject/body
- Maintain low bounce/complaint rates
- Warm up sending (start slow, increase gradually)

#### Issue: "Rate exceeded" errors

**Cause:** Sending too fast for current limits
**Solution:**
- In Sandbox: Max 1 email/second
- Request sending rate increase in SES Console

#### Issue: Function timeout on Netlify

**Cause:** Function taking too long (Netlify: 10s default, 26s max)
**Solution:**
- Check AWS region matches function region
- Use faster AWS region (us-east-1 recommended)
- Optimize email template size

### 8.3 Check Netlify Function Logs

1. Netlify Dashboard → **Functions**
2. Click on `contact` function
3. View recent invocations and logs
4. Look for errors or issues

### 8.4 Check SES Bounce and Complaint Notifications

Set up SNS notifications (recommended):

1. SES Console → **Configuration** → **Verified identities**
2. Click your domain
3. Click **Notifications** tab
4. Configure SNS topics for:
   - Bounces
   - Complaints
   - Deliveries (optional)

This helps you track email deliverability issues.

## Part 9: CMS Email Management

### 9.1 Access Email Management

1. Navigate to `/admin` on your site
2. Log in to Netlify CMS
3. Click **Email Management** in sidebar
4. View all contact form submissions

### 9.2 Filter Emails

Use built-in filters:
- **New:** Unread submissions
- **Viewed:** Read but not responded
- **Responded:** Already replied to

### 9.3 Reply to Emails

1. Click on an email to view details
2. Update status to "VIEWED" if reviewing
3. To reply, use `cms-reply` function:
   - This requires building a CMS widget or external interface
   - Alternative: Reply directly via email client to sender

**Note:** Direct CMS reply functionality requires additional UI development.

## Part 10: Cost Considerations

### Free Tier

**AWS SES Free Tier (when sending from EC2 or Netlify Functions):**
- **62,000 emails per month** - FREE
- Valid for all AWS accounts (no expiration)

### Pricing Beyond Free Tier

- **Outbound emails:** $0.10 per 1,000 emails
- **Incoming emails:** $0.10 per 1,000 emails
- **Attachments:** $0.12 per GB

**Estimated monthly cost for New Era Hockey:**
- Expected volume: 500-1,000 emails/month
- **Cost: $0/month** (well within free tier)

### Additional Costs

- **Data transfer:** Negligible for email
- **CloudWatch logs:** ~$0.50/month (optional)
- **SNS notifications:** $0.50 per 1 million notifications (optional)

## Part 11: Security Best Practices

### 11.1 Protect AWS Credentials

- ✅ Never commit credentials to Git
- ✅ Use environment variables
- ✅ Rotate IAM keys regularly (every 90 days)
- ✅ Use IAM user with minimal permissions (only SES)
- ✅ Enable MFA on AWS root account

### 11.2 Email Security

- ✅ Implement SPF, DKIM, and DMARC
- ✅ Use HTTPS for all form submissions
- ✅ Validate and sanitize user input
- ✅ Rate limit form submissions (prevent abuse)
- ✅ Implement CAPTCHA if spam becomes an issue

### 11.3 Data Privacy

- ✅ Store emails securely (Git-based CMS with private repo)
- ✅ Don't log sensitive information
- ✅ Comply with GDPR/privacy regulations
- ✅ Implement data retention policies
- ✅ Provide unsubscribe mechanism (if sending newsletters)

## Part 12: Next Steps

### Immediate Actions

1. ✅ Complete AWS account setup
2. ✅ Verify domain with DNS records
3. ✅ Create IAM user and save credentials
4. ✅ Configure environment variables in Netlify
5. ✅ Deploy and test contact form
6. ✅ Request production access (move out of Sandbox)

### Future Enhancements

- [ ] Implement CMS reply interface widget
- [ ] Add email templates for different form types
- [ ] Set up CloudWatch monitoring and alerts
- [ ] Implement rate limiting on contact form
- [ ] Add CAPTCHA if spam becomes an issue
- [ ] Create email analytics dashboard
- [ ] Implement automatic email categorization
- [ ] Add support for file attachments

## Part 13: Support Resources

### AWS Documentation

- [SES Developer Guide](https://docs.aws.amazon.com/ses/latest/dg/)
- [SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)

### AWS Support

- [AWS Support Center](https://console.aws.amazon.com/support/)
- [SES Forum](https://repost.aws/tags/TA4IvCeWI1TE-65sRXO_-Y6A/amazon-simple-email-service)

### Netlify Documentation

- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)

### Contact

For questions about this implementation:
- Review `claudedocs/email-service-alternatives-research.md` for architecture details
- Check Netlify function logs for runtime issues
- Review AWS SES Console for email delivery issues

---

**Document Version:** 1.0
**Last Updated:** 2025-10-15
**Author:** Claude Code Implementation
