# Stripe Integration Testing Guide

**Phase 3**: Stripe Checkout Payment Integration
**Environment**: Sandbox (Test Mode)
**Last Updated**: 2025-10-16

---

## Overview

Phase 3 implements Stripe Checkout for secure payment processing during event registration. This guide covers testing the complete payment flow from registration form to payment confirmation.

## Prerequisites

### Environment Variables

Verify these are set in `.env` (already configured):

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Sandbox publishable key
STRIPE_SECRET_KEY=sk_test_...       # Sandbox secret key
STRIPE_WEBHOOK_SECRET=whsec_...     # Webhook signing secret
```

### Test Event Setup

Create a test event with extended properties:

```json
{
  "extendedProperties": {
    "shared": {
      "eventType": "camp",
      "price": "25",
      "maxCapacity": "10",
      "currentRegistrations": "0",
      "registrationEnabled": "true"
    }
  }
}
```

---

## Complete Payment Flow

### Step 1: Start Development Server

```bash
cd P:\Repos\newerahockey
netlify dev
```

**Expected Output**:
```
◈ Server now ready on http://localhost:8888
```

### Step 2: Navigate to Schedule

1. Open http://localhost:8888/schedule
2. Switch to "Camps" or "Lessons" tab
3. Find your test event
4. Verify "Register" button appears (not "Sold Out" or "View Details")

### Step 3: Fill Registration Form

Click "Register" button → redirects to `/register/:eventId`

**Fill out all required fields**:

**Player Information**:
- First Name: `Test`
- Last Name: `Player`
- Date of Birth: `2010-01-01`
- Age: `14` (optional)

**Guardian Information**:
- First Name: `Test`
- Last Name: `Guardian`
- Email: `test@example.com`
- Phone: `555-123-4567`
- Relationship: `Parent`

**Emergency Contact**:
- Name: `Emergency Contact`
- Phone: `555-987-6543`
- Relationship: `Aunt`

**Additional**:
- Medical Notes: Leave blank or add test notes
- ✅ Accept Waiver checkbox: **MUST CHECK**

### Step 4: Submit to Stripe Checkout

Click "Continue to Payment • $25" button

**Expected Behavior**:
1. Form validates (red errors if fields missing)
2. Submitting state → "Processing..." with spinner
3. Redirect to Stripe Checkout hosted page

**Stripe Checkout Page**:
- Shows event name
- Shows price ($25.00)
- Email pre-filled (`test@example.com`)
- Secure Stripe-hosted page

### Step 5: Complete Test Payment

**Stripe Test Cards** (use these ONLY in test mode):

**Successful Payment**:
```
Card Number: 4242 4242 4242 4242
Expiration: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Declined Card** (test error handling):
```
Card Number: 4000 0000 0000 0002
Expiration: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Authentication Required** (3D Secure):
```
Card Number: 4000 0025 0000 3155
Expiration: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Step 6: Success Page

After successful payment with `4242 4242 4242 4242`:

**Expected Behavior**:
1. Redirect to `/register/success?session_id=cs_test_...`
2. Confetti animation (5 seconds)
3. Green checkmark icon
4. "Registration Complete!" title
5. Confirmation number displayed
6. Next steps information
7. Action buttons: "View Schedule" | "Back to Home"

**Verify**:
- ✅ Confetti appears and stops after 5s
- ✅ Session ID displayed correctly
- ✅ All buttons work
- ✅ Responsive on mobile

### Step 7: Cancel Flow

To test cancellation:

1. Start registration process (Steps 1-4)
2. On Stripe Checkout page, click browser back button OR click "← Back" link
3. Redirect to `/register/cancel?event_id=abc123`

**Expected Behavior**:
1. Amber warning icon
2. "Registration Cancelled" title
3. Explanation of what happened
4. Common reasons list
5. Action buttons: "Try Again" | "Contact Us"
6. Help links (FAQs, Email, Phone)

**Verify**:
- ✅ "Try Again" button returns to registration form
- ✅ Event ID preserved in URL
- ✅ All links functional
- ✅ Responsive on mobile

---

## Testing Scenarios

### Scenario 1: Successful Registration

**Steps**:
1. Fill form completely
2. Use card `4242 4242 4242 4242`
3. Complete payment

**Expected**:
- ✅ Redirect to success page
- ✅ Confetti animation
- ✅ Confirmation number shown

### Scenario 2: Card Declined

**Steps**:
1. Fill form completely
2. Use card `4000 0000 0000 0002`
3. Attempt payment

**Expected**:
- ✅ Stripe shows "Your card was declined"
- ✅ Option to try different card
- ✅ No redirect (stays on Stripe)

### Scenario 3: Form Validation Errors

**Steps**:
1. Leave required fields blank
2. Click submit button

**Expected**:
- ✅ Red border on invalid fields
- ✅ Error messages below fields
- ✅ Scroll to first error
- ✅ No Stripe redirect

### Scenario 4: Payment Cancellation

**Steps**:
1. Fill form and submit
2. On Stripe page, click back button

**Expected**:
- ✅ Redirect to cancel page
- ✅ Event ID preserved
- ✅ "Try Again" button works

### Scenario 5: 3D Secure Authentication

**Steps**:
1. Fill form completely
2. Use card `4000 0025 0000 3155`
3. Complete authentication modal

**Expected**:
- ✅ Stripe shows authentication challenge
- ✅ Complete authentication
- ✅ Redirect to success page

---

## Verification Checklist

### Frontend Integration

- [ ] Registration form validates correctly
- [ ] Form submits to Netlify function
- [ ] Redirect to Stripe Checkout works
- [ ] Success page renders with confetti
- [ ] Cancel page renders with retry option
- [ ] All routes configured correctly

### Stripe Integration

- [ ] Checkout session created successfully
- [ ] Event metadata included in session
- [ ] Price calculated correctly (dollars → cents)
- [ ] Success URL includes session_id
- [ ] Cancel URL includes event_id
- [ ] Session expires after 30 minutes

### User Experience

- [ ] Loading states show during submission
- [ ] Error messages clear and helpful
- [ ] Success message celebratory and informative
- [ ] Cancel message supportive and actionable
- [ ] Mobile responsive on all pages
- [ ] Accessibility features functional

### Error Handling

- [ ] Invalid form data caught before Stripe
- [ ] Network errors handled gracefully
- [ ] Stripe API errors displayed to user
- [ ] 404 errors for invalid event IDs
- [ ] Timeout handling for slow connections

---

## Debugging

### Common Issues

**Issue**: "Failed to create checkout session"
**Cause**: Missing/invalid Stripe keys
**Fix**: Verify `STRIPE_SECRET_KEY` in `.env`

**Issue**: Form submits but no redirect
**Cause**: Network error or function timeout
**Fix**: Check browser console for errors, verify Netlify function running

**Issue**: Success page shows but no confetti
**Cause**: react-confetti not loaded
**Fix**: Verify `npm install react-confetti` completed

**Issue**: Stripe shows wrong price
**Cause**: Price not converted to cents
**Fix**: Verify `Math.round(price * 100)` in function

### Debugging Tools

**Browser DevTools**:
1. Open Console tab
2. Look for errors during form submission
3. Check Network tab for function calls

**Netlify Function Logs**:
```bash
# In terminal running netlify dev
# Watch for function invocation logs
# Check for Stripe API errors
```

**Stripe Dashboard**:
1. Go to https://dashboard.stripe.com/test/payments
2. View all test payments
3. Check payment metadata
4. Verify amount and status

---

## Stripe Dashboard Verification

### View Test Payments

1. Go to https://dashboard.stripe.com/test/payments
2. Find your test payment
3. Click to view details

**Verify Metadata**:
```
eventId: abc123
eventSummary: Summer Hockey Camp
eventPrice: 25
playerFirstName: Test
playerLastName: Player
guardianEmail: test@example.com
... (all form fields)
```

### Test Payment Details

**Status**: `succeeded`
**Amount**: `$25.00`
**Customer Email**: `test@example.com`
**Payment Method**: `card`
**Created**: Recent timestamp

---

## Next Steps (Phase 4)

After confirming payment flow works:

1. **Email Notifications**
   - Send confirmation to guardian
   - Send notification to Coach Will
   - Include event details and receipt

2. **Calendar Updates**
   - Increment `currentRegistrations`
   - Mark as sold out when at capacity

3. **Webhook Integration**
   - Listen for `checkout.session.completed`
   - Process registration after payment
   - Update Google Calendar

---

## Production Deployment

### Environment Variables (Netlify)

**Required in Production**:
```
STRIPE_SECRET_KEY=sk_live_...        # LIVE key (not test)
STRIPE_PUBLISHABLE_KEY=pk_live_...   # LIVE key (not test)
STRIPE_WEBHOOK_SECRET=whsec_...      # Production webhook secret
```

### Pre-Production Checklist

- [ ] Test all payment scenarios in sandbox
- [ ] Verify success/cancel flows
- [ ] Test on mobile devices
- [ ] Verify email addresses correct
- [ ] Review Stripe fee structure
- [ ] Update to production keys
- [ ] Test one production payment
- [ ] Monitor Stripe dashboard

---

## Support

**Stripe Test Documentation**:
https://stripe.com/docs/testing

**Test Card Numbers**:
https://stripe.com/docs/testing#cards

**Stripe Dashboard (Test)**:
https://dashboard.stripe.com/test

**Issues?**
- Check Netlify function logs
- Review browser console errors
- Verify environment variables
- Contact Stripe support if needed
