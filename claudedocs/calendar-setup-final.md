# Google Calendar Integration - Final Setup Guide

## 🎯 Current Status

### ✅ What's Already Done
- ✅ All Google Cloud setup (project, service account, Calendar API, domain-wide delegation)
- ✅ All code implementation (frontend + backend complete)
- ✅ React Router SPA fix
- ✅ Local dev authentication

### ⏳ What Remains
**Just 1 thing**: Create a service account JSON key (blocked by organization policy)

**Time to complete**: ~10 minutes (once you have the key)

---

## ⚠️ Known Issue: Organization Policy Blocking

The `iam.disableServiceAccountKeyCreation` policy is preventing JSON key creation via:
- ❌ gcloud CLI
- ❌ Possibly Google Cloud Console UI

**You need**: Either Console UI access (try first) OR help from Google Workspace Super Admin

---

## Step 1: Try Creating JSON Key via Console UI

**Worth trying** - Console UI sometimes works when gcloud fails:

### 1.1: Open Service Accounts Page
Visit: https://console.cloud.google.com/iam-admin/serviceaccounts?project=newerahockey-calendar

### 1.2: Find Your Service Account
Look for:
```
newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com
```

Click on the **email address** (the blue link).

### 1.3: Create JSON Key
1. Click the **KEYS** tab at the top
2. Click **ADD KEY** button
3. Select **Create new key**
4. Choose **JSON** format
5. Click **CREATE**

**If successful**: A JSON file downloads to your Downloads folder (`newerahockey-calendar-[random-id].json`)

**If you see error**: "Key creation is not allowed on this service account"
→ Go to **Alternative Solution** below

### 1.4: View the JSON Content

**Windows PowerShell**:
```powershell
cd C:\Users\Validone\Downloads
Get-Content newerahockey-calendar-*.json | clip
```

**Or manually**:
1. Open the downloaded JSON file in Notepad
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)

**Expected content** (should look like this):
```json
{
  "type": "service_account",
  "project_id": "newerahockey-calendar",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

---

## Alternative Solution: If Console UI Fails

### Option A: Ask Google Workspace Super Admin

**Who to contact**: Your Google Workspace Super Admin (manages newerahockeytraining.com)

**Find them**:
1. Go to: https://admin.google.com → Admin roles
2. Look for "Super Admin" role
3. Contact person listed there

**What to ask**:
> "Can you temporarily add me (coachwill@newerahockeytraining.com) to the 'Organization Policy Administrator' role so I can create a service account key? I need it for our Google Calendar integration. I'll only need it for 5 minutes."

**OR ask them to**:
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=newerahockey-calendar
2. Click on: `newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com`
3. KEYS tab → ADD KEY → Create new key → JSON → CREATE
4. Send you the downloaded JSON file securely

### Option B: Temporarily Disable Policy (Requires Org Admin)

If they give you org admin access:
```bash
# Get org ID (you already have: 349115078925)
gcloud organizations list

# Temporarily disable policy
gcloud resource-manager org-policies delete \
  iam.disableServiceAccountKeyCreation \
  --organization=349115078925

# Create key
gcloud iam service-accounts keys create calendar-key.json \
  --iam-account=newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com \
  --project=newerahockey-calendar

# (Optional) Re-enable policy - key continues to work
gcloud resource-manager org-policies restore \
  iam.disableServiceAccountKeyCreation \
  --organization=349115078925
```

---

## Step 2: Configure Netlify Environment Variables

### 2.1: Go to Netlify Dashboard
1. Visit: https://app.netlify.com
2. Select your **New Era Hockey** site
3. Navigate to: **Site configuration** → **Environment variables**

### 2.2: Delete Old Variables
Remove these (they're from the failed Workload Identity approach):
- ❌ Click the `•••` menu next to `GOOGLE_PROJECT_NUMBER` → Delete
- ❌ Delete: `WORKLOAD_IDENTITY_POOL_ID`
- ❌ Delete: `WORKLOAD_IDENTITY_PROVIDER_ID`
- ❌ Delete: `SERVICE_ACCOUNT_EMAIL`

### 2.3: Add New Variable
1. Click **Add a variable**
2. Fill in:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON you copied (including `{` and `}`)
   - **Scopes**: Select **All** (includes both Production and Deploy Previews)
3. Click **Create variable**

### 2.4: Verify Existing Variables
Make sure these are still there:
- ✅ `GOOGLE_PROJECT_ID` = `newerahockey-calendar`
- ✅ `CALENDAR_ID` = `coachwill@newerahockeytraining.com`

**Final count**: You should have exactly **3 environment variables** total.

### 2.5: Delete Local JSON File (Security)
```bash
# After adding to Netlify, delete the local file
cd C:\Users\Validone\Downloads
del newerahockey-calendar-*.json
```

---

## Step 3: Deploy and Test

### 3.1: Commit and Push
```bash
cd P:\Repos\newerahockey

# Add all changes
git add .

# Commit
git commit -m "Add Google Calendar integration with service account auth"

# Push to your branch
git push origin NEH-26
```

### 3.2: Wait for Deploy
- Netlify will automatically build and deploy (takes ~2-3 minutes)
- Watch the deploy at: https://app.netlify.com → Your site → Deploys

### 3.3: Test Deploy Preview
Visit your deploy preview URL:
```
https://deploy-preview-25--super-fenglisu-968777.netlify.app/schedule
```

**Expected result**:
- ✅ Page loads without errors
- ✅ "Camps" and "Lessons" toggle buttons work
- ✅ Events load from Coach Will's Google Calendar
- ✅ Can toggle between List and Calendar views
- ✅ Click events to see details in modal

### 3.4: Check Function Logs (If Issues)
If you see errors:

1. Go to: Netlify dashboard → **Functions** → `calendar-events`
2. Click **Function log**
3. Look for:
   - ✅ Good: `🚀 Production mode: Using Service Account JSON Key`
   - ❌ Bad: Any errors about authentication or credentials

---

## 🎉 That's It!

Once Step 3.3 shows events loading correctly:

1. ✅ Create a Pull Request to merge `NEH-26` to main
2. ✅ Merge the PR
3. ✅ Production site will auto-deploy
4. ✅ Visit: `https://newerahockey.com/schedule`

Your Google Calendar integration is complete! 🎊

---

## 🔒 Security Notes

### What You Did Right
- ✅ JSON key stored only in Netlify (encrypted at rest)
- ✅ Service account has read-only calendar access
- ✅ Domain-wide delegation limits which calendar can be accessed
- ✅ Deleted local JSON file after uploading

### Ongoing Maintenance
**Key Rotation** (recommended every 90 days):
1. Create new key (same Steps 1.1-1.4)
2. Update `GOOGLE_SERVICE_ACCOUNT_KEY` in Netlify
3. Delete old key:
   ```bash
   # List keys
   gcloud iam service-accounts keys list \
     --iam-account=newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com

   # Delete old key
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com
   ```

---

## 🆘 Troubleshooting

### Issue: "Authentication failed" in Netlify logs

**Check**:
1. `GOOGLE_SERVICE_ACCOUNT_KEY` variable exists in Netlify
2. JSON is valid (paste into https://jsonlint.com to validate)
3. Service account email matches exactly

**Fix**: Re-create the variable with correct JSON.

---

### Issue: "Calendar not found"

**Check**:
1. `CALENDAR_ID` = `coachwill@newerahockeytraining.com`
2. Domain-wide delegation is set up (you did this already)

**Fix**: Verify calendar ID is correct.

---

### Issue: Events not showing

**Check**:
1. Coach Will's calendar has upcoming events
2. Events are set to "Public" or shared with service account
3. Check Netlify function logs for errors

---

## 📊 Summary

| Step | Status | Time |
|------|--------|------|
| 1. Create JSON key via Console | ⏳ Do now | 2 min |
| 2. Configure Netlify variables | ⏳ Do now | 3 min |
| 3. Deploy and test | ⏳ Do now | 5 min |

**Total time**: ~10 minutes

**What you already completed**:
- ✅ Google Cloud project setup
- ✅ Service account creation
- ✅ Calendar API enabled
- ✅ Domain-wide delegation
- ✅ All code implementation
- ✅ Frontend UI components
- ✅ Backend Netlify function

**What remains**: Just these 3 simple steps above! 🚀
