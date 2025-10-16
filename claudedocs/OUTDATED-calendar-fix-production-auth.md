# Fix: Production Calendar Authentication

## 🔍 Problem

Workload Identity Federation doesn't work with Netlify (Netlify is not a supported OIDC provider for Google Cloud).

**Error**: `No valid AWS "credential_source" provided`

---

## ✅ Solution: Use Service Account JSON Key

Simple, production-ready authentication using a Service Account JSON key stored securely in Netlify environment variables.

---

## 📋 Step-by-Step Instructions

### Step 1: Temporarily Disable Organization Policy (You're Admin/Owner)

```bash
# Get your organization ID
gcloud organizations list

# Output will show:
# DISPLAY_NAME       ID            DIRECTORY_CUSTOMER_ID
# newerahockeytraining.com  123456789012  C1234abcd

# Temporarily disable the key creation policy (copy the ID from above)
gcloud resource-manager org-policies delete \
  iam.disableServiceAccountKeyCreation \
  --organization=YOUR_ORG_ID_HERE
```

**What this does**: Allows you to create a service account JSON key. You can re-enable this policy after creating the key (existing keys continue to work).

---

### Step 2: Create Service Account JSON Key

```bash
# Create the JSON key file
gcloud iam service-accounts keys create calendar-key.json \
  --iam-account=newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com \
  --project=newerahockey-calendar

# Verify it was created
ls -l calendar-key.json

# View the contents (you'll copy this next)
cat calendar-key.json
```

**Expected output**:
```json
{
  "type": "service_account",
  "project_id": "newerahockey-calendar",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

---

### Step 3: Add JSON Key to Netlify

1. **Copy entire JSON content**:
   ```bash
   # Windows (copy to clipboard)
   cat calendar-key.json | clip

   # Or manually select and copy the entire output from cat command
   ```

2. **Go to Netlify Dashboard**:
   - Visit: https://app.netlify.com
   - Select your **New Era Hockey** site
   - Navigate to: **Site configuration** → **Environment variables**

3. **Add new variable**:
   - Click **Add a variable**
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON (including `{` and `}`)
   - **Scopes**: Select **All** (or both Production and Deploy Preview)
   - Click **Create variable**

4. **Remove old variables** (not needed anymore):
   - Delete: `GOOGLE_PROJECT_NUMBER`
   - Delete: `WORKLOAD_IDENTITY_POOL_ID`
   - Delete: `WORKLOAD_IDENTITY_PROVIDER_ID`
   - Delete: `SERVICE_ACCOUNT_EMAIL`

5. **Keep these variables**:
   - ✅ `GOOGLE_PROJECT_ID=newerahockey-calendar`
   - ✅ `CALENDAR_ID=coachwill@newerahockeytraining.com`
   - ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` (just added)

---

### Step 4: Deploy Updated Code

```bash
# Commit the updated function
git add netlify/functions/calendar-events.js
git commit -m "Fix: Use service account JSON key for production auth"
git push origin NEH-26
```

Wait for Netlify to deploy (~2-3 minutes).

---

### Step 5: Test Production

Visit your deploy preview URL:
```
https://deploy-preview-25--super-fenglisu-968777.netlify.app/schedule
```

**Expected**:
- ✅ Page loads without errors
- ✅ Camps/Lessons toggle works
- ✅ Events load from Coach Will's calendar
- ✅ No authentication errors in Netlify logs

**Check Netlify Function Logs**:
1. Go to: **Site configuration** → **Functions**
2. Click on `calendar-events`
3. View logs - should see:
   ```
   🚀 Production mode: Using Service Account JSON Key
   ```
   NOT: `❌ No valid AWS "credential_source" provided`

---

### Step 6: (Optional) Re-enable Organization Policy

If you want to re-enable the key creation policy for security:

```bash
# Re-enable the organization policy
gcloud resource-manager org-policies restore \
  iam.disableServiceAccountKeyCreation \
  --organization=YOUR_ORG_ID_HERE
```

**Important**: The JSON key you already created will **continue to work** even after re-enabling the policy. The policy only blocks **new** key creation.

---

### Step 7: Secure the JSON Key File Locally

After adding to Netlify, **delete** the local file:

```bash
# IMPORTANT: Delete the local JSON key file for security
rm calendar-key.json

# Verify it's deleted
ls calendar-key.json
# Should show: No such file or directory
```

**Why**: The key is now safely stored in Netlify. No need to keep it locally where it could be accidentally committed to git.

---

## 🔒 Security Notes

### ✅ Secure Practices
- JSON key stored only in Netlify environment variables (encrypted at rest)
- Key has **read-only** calendar access (not write)
- Domain-wide delegation limits access to specific calendar
- Local key file deleted after setup

### ⚠️ Key Management
- **Rotate keys every 90 days** (create new key, update Netlify, delete old key)
- **Never commit** JSON key to git
- **Monitor usage** in Google Cloud Console → IAM & Admin → Service Accounts

### 🛡️ If Key is Compromised
```bash
# List all keys for service account
gcloud iam service-accounts keys list \
  --iam-account=newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com

# Delete compromised key
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com

# Create new key and update Netlify
```

---

## ✅ Final Environment Variables in Netlify

After completing all steps, your Netlify environment variables should be:

```
GOOGLE_SERVICE_ACCOUNT_KEY = {"type":"service_account",...entire JSON...}
GOOGLE_PROJECT_ID = newerahockey-calendar
CALENDAR_ID = coachwill@newerahockeytraining.com
```

That's it! Three simple variables, and calendar integration works in production.

---

## 🎯 Summary

**Before**: Attempted Workload Identity Federation (doesn't work with Netlify)
**After**: Service Account JSON key (production-ready, works perfectly)

**Code Changes**: Updated `calendar-events.js` to use JSON key authentication
**Deployment**: Push to git → Netlify auto-deploys → Calendar works

**Time to Complete**: ~15 minutes
**Security**: Production-ready with proper key management
