# Deploy Preview Testing Guide

## Understanding Deploy Previews

Deploy previews are temporary environments created by Netlify for testing pull requests before merging to production. Each preview has its own unique URL.

**Example URLs:**
- **Deploy Preview**: `https://deploy-preview-27--super-fenglisu-968777.netlify.app`
- **Production**: `https://newerahockey.co` or `https://newerahockey.validone-llc.com`

## Stripe Redirect Fix

### Issue
Previously, after completing payment on a deploy preview, users were redirected to the production domain instead of staying on the preview domain.

### Root Cause
The `create-checkout-session.cjs` function was using `process.env.URL` which points to the primary site URL (production custom domain), not the specific deployment URL.

### Solution Applied
Changed to use `process.env.DEPLOY_URL` which provides the actual deployment URL:

```javascript
// Before (WRONG):
const baseUrl = isProduction
  ? 'https://newerahockey.co'
  : process.env.URL || 'http://localhost:8888';

// After (CORRECT):
const baseUrl = process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';
```

**Netlify Environment Variables:**
- `DEPLOY_URL` - Specific deployment URL (e.g., preview URL, production URL)
- `URL` - Primary site URL (often the custom domain)
- `CONTEXT` - Deployment context ('production', 'deploy-preview', 'branch-deploy')

### Expected Behavior Now
✅ **Deploy Preview**: Redirects to `https://deploy-preview-27--super-fenglisu-968777.netlify.app/register/success`
✅ **Production**: Redirects to `https://newerahockey.co/register/success`
✅ **Local Dev**: Redirects to `http://localhost:8888/register/success`

## Stripe Webhook Limitation

### Important: Webhooks Don't Work on Deploy Previews

**Why:**
Stripe webhooks are configured in the Stripe Dashboard with a specific endpoint URL (typically production). Stripe doesn't automatically know about deploy preview URLs.

**What This Means:**
1. ✅ Payment will process successfully on deploy previews
2. ✅ You'll be redirected to the success page
3. ❌ Webhook won't be triggered for the preview deployment
4. ❌ Registration won't be recorded in preview's Netlify Blob Storage
5. ❌ Confirmation emails won't be sent from preview

**Webhook Configuration (Stripe Dashboard):**
```
Production Webhook: https://newerahockey.co/.netlify/functions/stripe-webhook
```

Stripe will send webhooks to this URL regardless of which environment initiated the checkout.

## Testing Strategies

### Strategy 1: Test on Production (Recommended)

**Best for:** End-to-end testing with real webhook delivery

**Process:**
1. Merge PR to main branch (deploy to production)
2. Test registration flow on `https://newerahockey.co`
3. Verify webhook execution in Netlify Functions logs
4. Confirm emails received

**Pros:**
- ✅ Complete end-to-end testing
- ✅ Webhooks work as expected
- ✅ Emails sent successfully
- ✅ Registration recorded

**Cons:**
- ❌ Requires merging code first
- ❌ Test data created in production

### Strategy 2: Local Development + Stripe CLI

**Best for:** Testing webhook logic during development

**Setup:**
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# In output, copy the webhook signing secret
# Add to .env file:
STRIPE_WEBHOOK_SECRET=whsec_...

# Start local dev server
netlify dev
```

**Process:**
1. Test on `http://localhost:8888`
2. Complete payment flow
3. Stripe CLI forwards webhook to local server
4. Check terminal for webhook logs
5. Verify email sending and registration recording

**Pros:**
- ✅ Full webhook testing locally
- ✅ Fast iteration cycle
- ✅ No production impact
- ✅ Real-time webhook logs

**Cons:**
- ❌ Requires Stripe CLI setup
- ❌ Only tests on localhost

### Strategy 3: Deploy Preview UI Testing (Limited)

**Best for:** Testing UI changes and payment flow without webhooks

**What You Can Test:**
- ✅ Registration form UI and validation
- ✅ Stripe Checkout integration
- ✅ Payment processing
- ✅ Success/cancel page redirects
- ✅ URL stays on preview domain (fixed)

**What You Can't Test:**
- ❌ Webhook functionality
- ❌ Email sending
- ❌ Registration recording
- ❌ Capacity tracking

**Process:**
1. Test on deploy preview URL
2. Complete registration and payment
3. Verify redirect stays on preview domain
4. **Note**: Webhook won't fire, emails won't send

**Use Case:**
Good for testing frontend changes before merging to production, but not for testing complete registration flow.

### Strategy 4: Temporary Webhook Endpoint (Advanced)

**Best for:** Full testing on deploy previews (requires manual setup)

**Setup:**
1. Go to Stripe Dashboard → Webhooks
2. Add new endpoint: `https://deploy-preview-27--super-fenglisu-968777.netlify.app/.netlify/functions/stripe-webhook`
3. Copy webhook signing secret
4. Add to Netlify environment variables (preview context)
5. Redeploy preview

**Process:**
1. Test on deploy preview with temporary webhook
2. Complete registration
3. Verify webhook fires to preview endpoint
4. Check Netlify Functions logs for preview deployment
5. Confirm emails sent

**Cleanup:**
- Delete temporary webhook endpoint after testing
- Remove preview-specific webhook secret

**Pros:**
- ✅ Full end-to-end testing on preview
- ✅ Webhooks work correctly
- ✅ Emails sent from preview

**Cons:**
- ❌ Manual setup required per preview
- ❌ Additional Stripe webhook endpoint management
- ❌ Temporary configuration needed

## Recommended Testing Workflow

### For Frontend Changes (UI/UX)
```
1. Create PR → Deploy Preview
2. Test UI/form validation on preview
3. Test payment flow (verify redirect works)
4. Merge to production
5. Test webhooks/emails on production
```

### For Backend Changes (Webhook/Email Logic)
```
1. Test locally with Stripe CLI
2. Verify webhook logs and email sending
3. Create PR → Deploy Preview
4. Quick sanity check on preview (UI only)
5. Merge to production
6. Final verification on production
```

### For Critical Changes (Payment/Registration Logic)
```
1. Test locally with Stripe CLI first
2. Verify all functionality works locally
3. Create PR → Deploy Preview
4. Use Strategy 4 (temporary webhook) for full preview testing
5. Merge to production
6. Comprehensive production testing
7. Monitor for first few real registrations
```

## Verifying the Fix

### Test Redirect Stays on Preview Domain

1. **Navigate to Deploy Preview:**
   ```
   https://deploy-preview-27--super-fenglisu-968777.netlify.app/schedule
   ```

2. **Start Registration:**
   - Click "Register" on an event
   - Fill out form
   - Submit to Stripe Checkout

3. **Complete Payment:**
   - Use test card: `4242 4242 4242 4242`
   - Complete payment

4. **Verify Redirect:**
   - ✅ Success URL should be: `https://deploy-preview-27--super-fenglisu-968777.netlify.app/register/success?session_id=...`
   - ❌ Should NOT redirect to: `https://newerahockey.validone-llc.com/...`

5. **Check Netlify Functions Logs:**
   ```
   Netlify Dashboard → Functions → create-checkout-session → Logs

   Look for:
   "Checkout session baseUrl: https://deploy-preview-27--super-fenglisu-968777.netlify.app (context: deploy-preview)"
   ```

### Why No Email on Deploy Preview

**Expected Behavior:**
- ❌ Webhook does NOT fire to preview endpoint
- ❌ Emails will NOT be sent
- ❌ Registration NOT recorded in preview's database

**Why:**
Stripe webhook is configured to send to production URL only. The webhook will fire to production, but your test registration won't appear in the production database because the payment was made on the preview environment (different Stripe checkout session).

**To Test Emails:**
Use Strategy 1 (test on production) or Strategy 2 (local + Stripe CLI).

## Troubleshooting

### Issue: Still Redirecting to Wrong Domain

**Check:**
1. Verify changes are deployed to preview
2. Check Netlify Functions logs for baseUrl value
3. Clear browser cache
4. Try in incognito mode

### Issue: Payment Succeeds but No Webhook

**Expected on Deploy Previews** - See "Stripe Webhook Limitation" section above.

**To test webhooks:**
- Use local development + Stripe CLI (Strategy 2)
- OR test on production (Strategy 1)
- OR set up temporary webhook endpoint (Strategy 4)

### Issue: Success Page Shows Error

**Possible Causes:**
1. Success page trying to fetch session data that doesn't exist
2. CORS issues between domains

**Debug:**
- Check browser console for errors
- Check Network tab for failed requests
- Review success page code for hardcoded URLs

## Summary

**Fixed:** ✅ Deploy preview redirects now stay on preview domain
**Limitation:** ❌ Webhooks/emails don't work on previews (Stripe limitation)
**Recommendation:** Test frontend on previews, test webhooks locally or on production
**Production Testing:** Full end-to-end testing with webhooks and emails works correctly
