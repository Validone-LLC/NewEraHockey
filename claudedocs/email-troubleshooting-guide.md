# Email Troubleshooting Guide

## Email Implementation Overview

Registration confirmation emails are sent automatically after successful payment via the Stripe webhook.

**Two emails are sent:**
1. **Admin Notification** → `ADMIN_EMAIL` with full registration details
2. **Guardian Confirmation** → Guardian's email with event details and next steps

## Environment Variables Required

All email-related environment variables must be configured in Netlify:

```bash
# AWS SES Credentials (same as contact form)
NEH_AWS_ACCESS_KEY_ID=AKIA...
NEH_AWS_SECRET_ACCESS_KEY=...
NEH_AWS_REGION=us-east-1

# Email Addresses
ADMIN_EMAIL=coachwill@newerahockeytraining.com
SES_FROM_EMAIL=noreply@newerahockeytraining.com
```

## Verification Steps

### 1. Check Environment Variables in Netlify

**For Deploy Preview:**
1. Go to Netlify dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Verify all 5 variables are set:
   - ✅ `NEH_AWS_ACCESS_KEY_ID`
   - ✅ `NEH_AWS_SECRET_ACCESS_KEY`
   - ✅ `NEH_AWS_REGION`
   - ✅ `ADMIN_EMAIL`
   - ✅ `SES_FROM_EMAIL`

**Important**: Deploy previews inherit environment variables from production settings.

### 2. Check Webhook Logs

After completing a test registration:

**Local Development:**
```bash
netlify dev
# Watch terminal output for:
# "Sending registration confirmation emails..."
# "Admin notification sent. MessageId: ..."
# "User confirmation sent to ... MessageId: ..."
```

**Deploy Preview:**
1. Go to Netlify dashboard
2. Navigate to: **Functions** → **stripe-webhook**
3. View recent logs for email status

### 3. Test Registration Flow

1. **Create Test Event** in Google Calendar:
   ```
   Title: Test Email Camp
   Description: Testing email notifications

   Price: $10
   Spots: 5
   ```

2. **Register on Deploy Preview:**
   - Visit: `https://deploy-preview-27--super-fenglisu-968777.netlify.app/schedule`
   - Click "Register" on test event
   - Fill out form with YOUR email address
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete payment

3. **Check Emails:**
   - Guardian email should arrive within 1-2 minutes
   - Check spam folder if not in inbox
   - Admin email should arrive at `ADMIN_EMAIL` address

## Common Issues

### Issue 1: No Emails Received

**Symptoms**: Registration succeeds but no emails arrive

**Diagnosis**:
```bash
# Check webhook logs for errors
# Look for: "Failed to send confirmation emails: ..."
```

**Possible Causes:**
1. **Missing Environment Variables**
   - Solution: Verify all 5 env vars are set in Netlify
   - Redeploy after adding missing variables

2. **AWS SES Credentials Invalid**
   - Solution: Test credentials with contact form first
   - Verify IAM permissions include `ses:SendEmail`

3. **Email in Spam Folder**
   - Solution: Check spam/junk folders
   - Add sender to safe senders list

4. **AWS SES in Sandbox Mode**
   - Solution: Verify recipient email is verified in AWS SES
   - OR request production access for AWS SES

### Issue 2: Admin Email Works, Guardian Email Fails

**Symptoms**: Admin receives notification but guardian doesn't

**Diagnosis**:
```bash
# Check webhook logs for:
# "Admin notification sent. MessageId: ..."
# "User confirmation sent to ... MessageId: ..."
```

**Possible Cause**: AWS SES in sandbox mode restricts sending to unverified addresses

**Solution**:
1. Verify guardian email address in AWS SES console
2. OR request production access to remove sandbox restrictions

### Issue 3: Webhook Fails with Email Error

**Symptoms**: Registration not recorded, webhook returns 500 error

**Diagnosis**:
```bash
# Check webhook logs for:
# "Error processing webhook: ..."
```

**Solution**: Email errors are caught and logged but don't fail the webhook
- Registration is still recorded even if emails fail
- Check specific error message in logs for root cause

## Email Content Preview

### Admin Notification Email

**Subject**: New Registration: Test Email Camp

**Content**:
- Event details (name, ID, amount paid)
- Player information (name, age)
- Guardian information (name, email)
- Emergency contact details
- Medical notes (if provided)

### Guardian Confirmation Email

**Subject**: Registration Confirmed: Test Email Camp

**Content**:
- Personalized greeting
- Registration summary (player, event, amount)
- "What's Next?" checklist
- Contact information for questions
- Professional signature

## Testing Checklist

- [ ] Verify all 5 environment variables are set in Netlify
- [ ] Confirm AWS SES credentials are valid (test with contact form)
- [ ] Check AWS SES sending limits and sandbox status
- [ ] Create test event with Price in description
- [ ] Complete test registration with real email address
- [ ] Verify guardian confirmation email received
- [ ] Verify admin notification email received
- [ ] Check both emails render correctly (HTML)
- [ ] Verify Stripe payment receipt also received (separate from our emails)
- [ ] Test with multiple registrations to ensure consistency

## Debugging Commands

### Check Email Delivery Status (AWS SES)
```bash
# Via AWS CLI
aws ses get-send-statistics --region us-east-1

# Check for bounces/complaints
aws ses list-identities --region us-east-1
```

### Local Testing
```bash
# Start Netlify dev server
netlify dev

# In another terminal, trigger Stripe webhook
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Complete test payment and watch logs
```

### Verify Environment Variables Loaded
```bash
# Add temporary logging to stripe-webhook.cjs
console.log('AWS Environment Check:', {
  hasAccessKey: !!process.env.NEH_AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.NEH_AWS_SECRET_ACCESS_KEY,
  hasAdminEmail: !!process.env.ADMIN_EMAIL,
  hasFromEmail: !!process.env.SES_FROM_EMAIL,
});
```

## Expected Logs (Success)

```
Processing checkout.session.completed: cs_test_...
Registration added for event 7p9uhqocns8fnaq3fgiums5gkk: {
  eventSummary: 'Test Email Camp',
  currentRegistrations: 1,
  maxCapacity: 5,
  isSoldOut: false
}
Sending registration confirmation emails...
Admin notification sent. MessageId: 01000...
User confirmation sent to test@example.com. MessageId: 01000...
Registration confirmation emails sent successfully
```

## Support

If emails still aren't working after following this guide:

1. **Check Webhook Logs**: Look for specific error messages
2. **Test Contact Form**: Verify AWS SES is working via contact form
3. **Verify AWS SES Status**: Check AWS console for service issues
4. **Review Environment Variables**: Double-check all values are correct
5. **Check Email Spam Filters**: Whitelist sender domain

For AWS SES production access request:
https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
