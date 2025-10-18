# Testing Strategy Comparison

Quick reference for choosing the right testing approach for email and registration functionality.

## Decision Tree

```
Need to test emails/webhooks?
├─ Development/iteration? → Use LOCAL + Stripe CLI ✅
├─ Pre-merge verification? → Use LOCAL + Stripe CLI ✅
├─ Final validation? → Test on PRODUCTION (after merge) ⚠️
└─ Emergency fix needed? → Test on PRODUCTION ⚠️
```

## Comparison Matrix

| Aspect | Local + Stripe CLI | Deploy Preview | Production |
|--------|-------------------|----------------|------------|
| **Stripe Keys** | 🟢 Sandbox (`sk_test_`) | 🟢 Sandbox | 🔴 Live (`sk_live_`) |
| **Payment Processing** | ✅ Test cards | ✅ Test cards | ⚠️ Real charges |
| **Webhook Delivery** | ✅ Forwarded to localhost | ❌ Goes to production | ✅ Works |
| **Email Sending** | ✅ Real emails sent | ❌ Not triggered | ✅ Real emails sent |
| **Registration Recording** | ✅ Local storage | ❌ Not recorded | ✅ Production DB |
| **Setup Effort** | 🟡 One-time CLI setup | 🟢 None | 🟢 None |
| **Iteration Speed** | 🟢 Very fast | 🟡 Medium (PR required) | 🔴 Slow (merge required) |
| **Risk Level** | 🟢 Zero risk | 🟢 Zero risk | 🔴 Production impact |
| **Real Email Delivery** | ✅ Yes | ❌ No | ✅ Yes |
| **Cost** | 🟢 Free (test mode) | 🟢 Free | 🔴 Real charges |

## Use Cases

### ✅ Use Local + Stripe CLI When:

- **Developing new features** - Fast iteration without deployment
- **Testing webhook logic** - Verify registration recording and emails
- **Debugging payment flow** - See webhook payloads in real-time
- **Verifying email templates** - Check email content and formatting
- **Pre-commit validation** - Test before pushing to repo
- **Testing repeatedly** - No limit on test payments
- **Learning/experimenting** - Safe environment for exploration

**Example Scenario:**
> "I'm implementing a new email template and want to see how it looks in Gmail. I'll test locally with my email address using Stripe CLI to trigger the webhook."

### 🟡 Use Deploy Preview When:

- **Testing frontend changes** - UI/UX modifications
- **Verifying form validation** - Input handling and error messages
- **Checking payment flow** - Stripe Checkout integration
- **Confirming redirects work** - Success/cancel page navigation
- **Visual regression testing** - Layout and styling verification
- **Stakeholder review** - Show progress without production impact

**Limitation:**
❌ Cannot test webhooks or emails (they go to production endpoint)

**Example Scenario:**
> "I changed the registration form layout. I'll test on the deploy preview to verify the UI looks good, then merge to production and test webhooks there."

### ⚠️ Use Production When:

- **Final validation** - Confirm everything works end-to-end in production environment
- **After major changes** - Verify production configuration is correct
- **Monitoring real usage** - First few real registrations after deployment
- **Troubleshooting prod issues** - Debug problems only happening in production

**Requirements:**
- Use production Stripe keys (already configured)
- Real payment will be charged (refund if needed)
- Real emails sent to real addresses
- Real registration recorded in production database

**Example Scenario:**
> "I've merged the PR and want to verify emails work in production. I'll do one test registration with a real payment, check that emails arrive, then refund the charge."

## Key Considerations

### Stripe Keys: Sandbox vs Production

| Environment | Stripe Keys | Payment Behavior |
|-------------|-------------|------------------|
| **Local (Recommended)** | 🟢 Sandbox `sk_test_` | Test cards only, no real charges |
| **Deploy Preview** | 🟢 Sandbox `sk_test_` | Test cards only, no real charges |
| **Production** | 🔴 Live `sk_live_` | **Real charges with real money** |

**Critical:**
- ✅ **NEVER** use production keys locally or in deploy previews
- ✅ **ALWAYS** use sandbox keys for development and testing
- ❌ **NEVER** put production keys in code or version control

### Email Configuration: Always Real

| Component | Local | Deploy Preview | Production |
|-----------|-------|----------------|------------|
| **AWS SES Credentials** | ✅ Real | ✅ Real | ✅ Real |
| **Sender Email** | ✅ Real | ✅ Real | ✅ Real |
| **Recipient Emails** | ✅ Real | ❌ N/A (no emails) | ✅ Real |

**Why:**
AWS SES doesn't have a "test mode" - it always sends real emails. This is fine because:
- Email sending is cheap (pennies)
- Need to verify actual delivery
- Can test with your own email addresses

### AWS SES Sandbox Mode

**If AWS SES is in sandbox mode:**
- ✅ Can send to verified email addresses
- ❌ Cannot send to unverified addresses
- ✅ Request production access (usually approved in 24 hours)

**To verify an email for testing:**
```
1. AWS SES Console → Verified identities
2. Create identity → Email address
3. Enter your test email
4. Click verification link sent to email
5. Now you can receive test emails
```

## Recommended Workflow

### During Development

```
1. Make code changes
2. Test locally with Stripe CLI
   - Verify webhooks fire
   - Check emails received
   - Debug any issues
3. Iterate quickly without deployment
4. Once working, commit and create PR
```

### Before Merging

```
1. Create PR → Deploy preview generated
2. Test UI on deploy preview
   - Form validation
   - Payment flow UI
   - Redirect behavior
3. Do NOT test emails on preview (won't work)
4. Review code changes
5. Merge to production
```

### After Merging

```
1. Deployment completes
2. Do one test registration on production
   - Use real payment (refund after)
   - Verify webhook fires to production
   - Confirm emails sent successfully
3. Monitor first few real registrations
4. Done! ✅
```

## Common Mistakes

### ❌ Mistake 1: Using Production Keys Locally

**Wrong:**
```bash
# .env (local)
STRIPE_SECRET_KEY=sk_live_51...  # ❌ WRONG!
```

**Why bad:**
- Real payments would be processed
- Test cards won't work
- Risk of accidental charges

**Correct:**
```bash
# .env (local)
STRIPE_SECRET_KEY=sk_test_51...  # ✅ Correct!
```

### ❌ Mistake 2: Expecting Emails on Deploy Preview

**Wrong Expectation:**
> "I'll test emails on the deploy preview"

**Why won't work:**
- Webhook goes to production URL (not preview)
- Webhook handler on preview never triggered
- No emails sent from preview

**Correct Approach:**
> "I'll test emails locally with Stripe CLI, then verify on production after merging"

### ❌ Mistake 3: Testing on Production Without Refund Plan

**Wrong:**
> "I'll test on production with a real card... oh wait, how do I refund this?"

**Correct:**
1. Test with Stripe CLI locally first
2. If must test on production, know how to refund:
   - Stripe Dashboard → Payments → Find payment → Refund
   - Or accept that you're making a real payment for real services

### ❌ Mistake 4: Not Verifying Email in AWS SES Sandbox

**Wrong:**
> "Why aren't emails arriving at my test email?"

**Check:**
1. Is AWS SES in sandbox mode?
2. Is your test email verified in AWS SES?

**Solution:**
Verify your test email in AWS SES Console or request production access.

## Quick Setup Guide

### First Time: Local Testing Setup (5 minutes)

```bash
# 1. Install Stripe CLI
scoop install stripe  # Windows
# OR brew install stripe/stripe-cli/stripe  # Mac

# 2. Login to Stripe
stripe login

# 3. Start webhook forwarding
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
# Copy the webhook secret (whsec_...)

# 4. Add to .env file
STRIPE_WEBHOOK_SECRET=whsec_...

# 5. Start Netlify dev
netlify dev

# 6. Test on http://localhost:8888
# Done! ✅
```

## Summary

**For Email Testing:**
```
✅ Test locally with Stripe CLI (recommended)
   - Use sandbox keys
   - Real emails sent
   - Fast iteration
   - Zero risk

❌ Don't test on deploy preview
   - Webhooks don't reach preview
   - Emails won't be sent

⚠️ Test on production only for final validation
   - Use production keys (already configured)
   - Real payments charged
   - After merging code
```

**Key Takeaway:**
> **You DON'T need production to test emails. Use local development with Stripe CLI for the best testing experience!**
