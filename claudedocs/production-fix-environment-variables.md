# Production Contact Form Fix - Environment Variables

## Problem
Contact form works locally (port 8888) but returns 500 error in production.

## Root Cause
Missing `ADMIN_EMAIL` environment variable in Netlify production environment.

- **Local**: Works because `.env` file has `ADMIN_EMAIL=Nehockeytraining@outlook.com`
- **Production**: Fails because Netlify environment variable not configured

## Solution Applied

Added validation to `netlify/functions/contact.js` (lines 45-49):
```javascript
// Validate admin email is configured
if (!adminEmail) {
  console.error('ADMIN_EMAIL environment variable is not set');
  throw new Error('Server configuration error: Admin email not configured');
}
```

This provides a clear error message instead of cryptic AWS SES errors.

## Steps to Fix Production

### 1. Add Environment Variable to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (newerahockey)
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - **Key**: `ADMIN_EMAIL`
   - **Value**: `Nehockeytraining@outlook.com`
   - **Scopes**: Production, Deploy previews, Branch deploys (all checked)
6. Click **Create variable**

### 2. Verify AWS SES Email (If in Sandbox Mode)
If your AWS SES account is still in Sandbox mode, you MUST verify the Outlook email:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses)
2. Navigate to **Verified identities**
3. Click **Create identity**
4. Select **Email address**
5. Enter: `Nehockeytraining@outlook.com`
6. Click **Create identity**
7. **Check Outlook inbox** for verification email from AWS
8. Click the verification link in that email
9. Confirmation: Identity status should show "Verified" in AWS Console

### 3. Redeploy Site
1. Go to Netlify Dashboard → Deploys
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

### 4. Test Contact Form
1. Visit production site: https://newerahockeytraining.com/contact
2. Fill out and submit contact form
3. **Expected behavior**:
   - User receives confirmation email
   - Admin (Nehockeytraining@outlook.com) receives notification email

## Troubleshooting

### Still Getting Errors?
Check Netlify Function logs:
1. Netlify Dashboard → Functions → contact
2. Look for recent invocations
3. Check for error messages or success logs showing MessageIds

### Admin Still Not Receiving Emails?
1. **Check spam/junk folder** in Outlook
2. **Verify SES Sandbox status**:
   - If in Sandbox: Email MUST be verified in AWS SES Console
   - Request production access if needed (aws-ses-setup-instructions.md Part 6)
3. **Check Netlify Function logs** for actual send confirmation with AWS MessageId

### How to Check if Email Was Sent?
Look for these logs in Netlify Functions:
```
Sending admin notification to: Nehockeytraining@outlook.com
Sending emails via AWS SES...
Admin email sent successfully. MessageId: <aws-message-id>
User confirmation sent successfully. MessageId: <aws-message-id>
```

## Environment Variables Checklist

Ensure these are set in Netlify:
- ✅ `NEH_AWS_ACCESS_KEY_ID` - Your AWS access key
- ✅ `NEH_AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- ✅ `NEH_AWS_REGION` - AWS region (us-east-1)
- ✅ `SES_FROM_EMAIL` - noreply@newerahockeytraining.com
- ✅ `ADMIN_EMAIL` - Nehockeytraining@outlook.com ← **THIS WAS MISSING**

## Reference
For detailed AWS SES setup instructions, see: `claudedocs/aws-ses-setup-instructions.md`
