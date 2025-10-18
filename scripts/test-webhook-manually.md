# Manual Webhook Testing Guide

## Issue Identified

The webhook is not firing after payment completion. This could be because:
1. Stripe needs time to process the payment before sending webhook
2. The success page redirect happens before Stripe triggers the webhook
3. Network timing issues

## Solution: Manually Trigger Webhook

Use Stripe CLI to simulate a `checkout.session.completed` event with test data.

### Step 1: Create Test Session (Optional - Get Real Session ID)

Complete a test payment to get a real session ID, OR use Stripe CLI to trigger with sample data.

### Step 2: Trigger Webhook Event

**In Terminal 1 (where stripe listen is running), press Ctrl+C to stop it temporarily**

**Run this command to trigger the webhook:**

```bash
stripe trigger checkout.session.completed
```

This will:
1. Create a test `checkout.session.completed` event
2. Send it to your local webhook endpoint
3. Show you the webhook response

### Expected Output

**You should see:**
```
Setting up fixture for: checkout.session.completed
Running fixture for: checkout.session.completed
Trigger succeeded! Check dashboard for event details.
```

**Then check Terminal 2 (netlify dev) for:**
```
Processing checkout.session.completed: cs_test_...
Registration added for event ...
Sending registration confirmation emails...
Admin notification sent. MessageId: ...
User confirmation sent to ... MessageId: ...
Registration confirmation emails sent successfully
```

### Step 3: Restart Stripe Listen

After testing with trigger, restart:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

## Alternative: Wait Longer After Payment

Sometimes webhooks take 10-30 seconds to fire after payment.

**Try this:**
1. Complete payment
2. Wait on success page for 30 seconds
3. Watch Terminal 1 for delayed webhook

## Debugging Real Payment Webhooks

If manual trigger works but real payments don't trigger webhook:

**Check Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/test/payments
2. Find your recent payment
3. Click on it
4. Look at "Events" section
5. See if `checkout.session.completed` event was created
6. Check if it was sent to webhook endpoint

**Common Issue:**
Stripe only sends `checkout.session.completed` after the customer returns to your success URL. If there's a redirect issue, the event might not fire.

## Next Steps

1. Stop Terminal 1 (Ctrl+C)
2. Run: `stripe trigger checkout.session.completed`
3. Check Terminal 2 for email logs
4. Report results
