# Local Email Testing Guide

## Best Practice: Test Locally with Stripe CLI

You **don't need to test on production** to verify emails. You can test the complete registration flow locally with real email delivery using the Stripe CLI.

## Setup: One-Time Configuration

### 1. Install Stripe CLI

**Windows (PowerShell):**
```powershell
# Using Scoop package manager
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# OR download from:
# https://github.com/stripe/stripe-cli/releases/latest
```

**Verify Installation:**
```bash
stripe --version
```

### 2. Login to Stripe CLI

```bash
stripe login
# This will open browser to authenticate with your Stripe account
# Choose your test/sandbox account
```

### 3. Forward Webhooks to Localhost

**Terminal 1 - Start Webhook Listener:**
```bash
cd P:/Repos/newerahockey

stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

**Output will show:**
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

**Copy the webhook signing secret** (starts with `whsec_`)

### 4. Add Webhook Secret to .env

Create or update `.env` file in project root:

```bash
# Stripe Configuration (SANDBOX KEYS)
STRIPE_SECRET_KEY=sk_test_51...  # Your existing sandbox secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # From stripe listen output

# AWS SES Configuration (REAL - for email sending)
NEH_AWS_ACCESS_KEY_ID=AKIA...
NEH_AWS_SECRET_ACCESS_KEY=...
NEH_AWS_REGION=us-east-1

# Email Configuration (REAL)
ADMIN_EMAIL=coachwill@newerahockeytraining.com
SES_FROM_EMAIL=noreply@newerahockeytraining.com
```

**Important:**
- ✅ Use **sandbox** Stripe keys (`sk_test_...`)
- ✅ Use **real** AWS SES credentials (to send actual emails)
- ✅ Use **real** email addresses for testing

### 5. Start Netlify Dev Server

**Terminal 2 - Start Dev Server:**
```bash
cd P:/Repos/newerahockey
netlify dev
```

Server will start on `http://localhost:8888`

## Testing Workflow

### Step 1: Create Test Event in Google Calendar

```
Title: Email Test Camp
Description: Testing the complete email workflow.

Price: $10
Spots: 5

Location: Test Arena
```

### Step 2: Navigate to Local Site

Open browser: `http://localhost:8888/schedule`

### Step 3: Complete Registration

1. **Click "Register"** on your test event
2. **Fill out form** with **YOUR REAL EMAIL** as guardian email
3. **Submit** - redirects to Stripe Checkout
4. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. **Complete payment**

### Step 4: Watch Webhook Logs

**Terminal 1 (Stripe CLI)** will show:
```
[200] POST /stripe-webhook [evt_1ABC123...]
```

**Terminal 2 (Netlify Dev)** will show:
```
Processing checkout.session.completed: cs_test_...
Registration added for event 7p9uhqocns8fnaq3fgiums5gkk
Sending registration confirmation emails...
Admin notification sent. MessageId: 01000...
User confirmation sent to your@email.com. MessageId: 01000...
Registration confirmation emails sent successfully
```

### Step 5: Check Your Email

**Within 1-2 minutes**, you should receive:

1. **Guardian Confirmation Email**
   - Subject: "Registration Confirmed: Email Test Camp"
   - From: noreply@newerahockeytraining.com
   - Contains: Registration summary, next steps, contact info

2. **Admin should receive**
   - Subject: "New Registration: Email Test Camp"
   - From: noreply@newerahockeytraining.com
   - Contains: Full registration details, player info, emergency contact

3. **Stripe Receipt (separate)**
   - From: Stripe
   - Contains: Payment receipt

**Check spam folders** if emails don't appear in inbox.

## What's Being Tested

| Component | Environment | Notes |
|-----------|-------------|-------|
| **Frontend** | Local (`localhost:8888`) | Registration form, UI |
| **Stripe Payment** | Sandbox (test mode) | No real charges |
| **Netlify Functions** | Local | Running via `netlify dev` |
| **Stripe Webhook** | Local (forwarded) | Stripe CLI forwards events |
| **Database** | Local Blob Storage | Netlify dev uses local storage |
| **AWS SES** | **PRODUCTION** | **Real emails sent** |
| **Email Recipients** | **REAL** | **Actual inboxes** |

## Sandbox vs Production Keys

### Stripe Keys

**Always use SANDBOX keys for testing:**

```bash
# Sandbox Keys (use these)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Production Keys (DO NOT use for testing)
STRIPE_SECRET_KEY=sk_live_51...  # ❌ Don't use locally
STRIPE_PUBLISHABLE_KEY=pk_live_51...  # ❌ Don't use locally
```

**Why:**
- ✅ Sandbox keys process test payments (no real charges)
- ✅ Use test card numbers like `4242 4242 4242 4242`
- ✅ Safe to test repeatedly without financial impact
- ❌ Production keys process REAL payments with REAL money

### AWS SES Credentials

**Always use REAL AWS SES credentials:**

```bash
# AWS SES (use REAL credentials even for testing)
NEH_AWS_ACCESS_KEY_ID=AKIA...
NEH_AWS_SECRET_ACCESS_KEY=...
```

**Why:**
- ✅ AWS SES doesn't have "test mode" - it sends real emails
- ✅ You want to verify emails are actually delivered
- ✅ Same credentials work for dev and production

### Email Addresses

**Use REAL email addresses for testing:**

```bash
# Email Configuration (REAL addresses)
ADMIN_EMAIL=coachwill@newerahockeytraining.com
SES_FROM_EMAIL=noreply@newerahockeytraining.com

# Guardian email in form: Use YOUR real email
```

**Why:**
- ✅ Verifies emails are delivered successfully
- ✅ Allows you to see the actual email content
- ✅ Checks spam filter handling

## Testing on Production (NOT Recommended for Email Testing)

**If you absolutely must test on production:**

### ⚠️ WRONG Approach (Don't Do This)
```bash
# ❌ BAD: Using sandbox keys on production
# This would break production for real users!
# Real users couldn't make real payments
```

### ✅ CORRECT Approach (If Production Testing Required)

1. **Use production keys** (already configured in Netlify)
2. **Test with real payment** (then refund immediately)
3. **Or use test mode in Stripe Dashboard:**
   - Stripe Dashboard → Developers → Webhooks
   - Can trigger test events manually

**But this is unnecessary** - local testing with Stripe CLI is better!

## Troubleshooting

### Issue: Stripe CLI Says "Command not found"

**Solution:**
```bash
# Install Stripe CLI
# Windows: Use Scoop or download from GitHub
# Mac: brew install stripe/stripe-cli/stripe
# Linux: Download from GitHub releases
```

### Issue: Webhook Secret Invalid

**Symptoms:**
```
Webhook signature verification failed
```

**Solution:**
1. Copy webhook secret from `stripe listen` output
2. Update `.env` with correct `STRIPE_WEBHOOK_SECRET`
3. Restart `netlify dev`

### Issue: No Emails Received

**Check:**
1. ✅ AWS SES credentials in `.env` are correct
2. ✅ `ADMIN_EMAIL` is set correctly
3. ✅ Webhook fired successfully (check Terminal 1)
4. ✅ Email logs show "sent successfully" (Terminal 2)
5. ✅ Check spam folders
6. ⚠️ AWS SES sandbox mode limits (see below)

### Issue: AWS SES Sandbox Restrictions

**Symptoms:**
- Admin email works (verified email)
- Guardian email fails (unverified email)

**Why:**
AWS SES starts in "sandbox mode" which only allows sending to:
- Verified email addresses
- Verified domains

**Solution:**
```
Option 1: Verify your test email in AWS SES console
1. AWS SES Console → Verified identities
2. Create identity → Email address
3. Enter your test email
4. Click verification link sent to that email

Option 2: Request production access
1. AWS SES Console → Account dashboard
2. Click "Request production access"
3. Fill out form (usually approved within 24 hours)
4. After approved, can send to any email address
```

### Issue: Registration Not Showing in Blob Storage

**Expected:**
Local testing uses local blob storage, not production database.

**To check local registrations:**
```bash
# Local blob storage location
# Check Netlify dev terminal for storage path
```

## Complete Testing Checklist

- [ ] Stripe CLI installed and logged in
- [ ] Webhook listener running (`stripe listen`)
- [ ] Webhook secret added to `.env`
- [ ] Netlify dev server running (`netlify dev`)
- [ ] Test event created in Google Calendar with price
- [ ] Registration form completed with YOUR email
- [ ] Payment completed with test card `4242 4242 4242 4242`
- [ ] Webhook fired successfully (Terminal 1 shows 200 POST)
- [ ] Registration recorded (Terminal 2 shows success logs)
- [ ] Admin email received at `ADMIN_EMAIL`
- [ ] Guardian email received at your test email
- [ ] Both emails render correctly in email client
- [ ] Stripe receipt email received (separate from our emails)

## Summary

**Best Practice:**
```
✅ Test locally with Stripe CLI
✅ Use sandbox Stripe keys (sk_test_...)
✅ Use real AWS SES credentials
✅ Use real email addresses for testing
✅ Real emails sent to real inboxes
❌ No need to test on production
❌ Don't use production Stripe keys for testing
```

**This gives you:**
- Complete end-to-end testing
- Real email delivery verification
- No risk to production environment
- No real payments processed
- Fast iteration cycle

**Local testing with Stripe CLI is the professional way to test payment webhooks and email notifications!** 🎉
