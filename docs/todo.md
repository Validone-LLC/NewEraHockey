# TODO

## 🎯 Where We Are & What to Do Next

### ✅ What You've Already Completed (via gcloud CLI)

You used **gcloud commands** to set up everything:
- ✅ Created Google Cloud project: `newerahockey-calendar`
- ✅ Created Workload Identity Pool: `netlify-pool`
- ✅ Created OIDC Provider: `netlify-provider`
- ✅ Created Service Account: `newerahockey-calendar-service`
- ✅ Enabled Calendar API
- ✅ Set up domain-wide delegation (via Google Admin Console)

**All backend code is also complete** - frontend, Netlify functions, everything.

---

## ❌ Current Blocker: Organization Policy

The policy `iam.disableServiceAccountKeyCreation` **blocks JSON key creation** via:
- ❌ gcloud CLI (you tried, it failed)
- ❌ Google Cloud Console UI (will also fail)

**The policy is enforced at organization level** and you don't have org admin permissions to disable it.

---

## ✅ Solution: Use Google Cloud Console UI Anyway

**Try this** - the Console UI sometimes has an override that gcloud doesn't:

### Step 1: Try Creating Key via Console

1. Visit: https://console.cloud.google.com/iam-admin/serviceaccounts?project=newerahockey-calendar

2. Click on: `newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com`

3. Click **KEYS** tab

4. Click **ADD KEY** → **Create new key**

5. Select **JSON** → Click **CREATE**

**If this works**: JSON file downloads, you're done! Go to Step 2.

**If you see error**: "Key creation is not allowed" → Go to Alternative Solution below.

---

### Alternative Solution: Ask Google Workspace Admin

If Console UI also blocks key creation, you need help from your **Google Workspace Super Admin**:

**Ask them to**:
1. Go to: https://admin.google.com/ac/owl/domainwidedelegation
2. They already see your service account there (from domain-wide delegation setup)
3. OR: Temporarily add you to **Organization Policy Administrator** role
4. Then you can create the key

**Who is your Google Workspace Super Admin?**
- Check: https://admin.google.com → Admin roles
- Or contact whoever manages newerahockeytraining.com Google Workspace

---

## 📋 Next Steps (After Getting JSON Key)

Once you have the JSON key (from either Console UI or admin help):

### Step 2: Configure Netlify
1. Go to: https://app.netlify.com → Site configuration → Environment variables
2. **Delete**: `GOOGLE_PROJECT_NUMBER`, `WORKLOAD_IDENTITY_POOL_ID`, `WORKLOAD_IDENTITY_PROVIDER_ID`, `SERVICE_ACCOUNT_EMAIL`
3. **Add**: `GOOGLE_SERVICE_ACCOUNT_KEY` = (paste entire JSON)
4. **Keep**: `GOOGLE_PROJECT_ID`, `CALENDAR_ID`

### Step 3: Deploy
```bash
git add .
git commit -m "Add Google Calendar integration"
git push origin NEH-26
```

### Step 4: Test
Visit: `https://deploy-preview-25--super-fenglisu-968777.netlify.app/schedule`

---

## 🧹 Cleanup (Nothing to Delete!)

**You asked about duplicates** - there are NONE. Everything you did via gcloud is necessary:

- ✅ Project `newerahockey-calendar` - **NEEDED** (production project)
- ✅ Service Account - **NEEDED** (for authentication)
- ✅ Calendar API enabled - **NEEDED** (for fetching events)
- ✅ Domain-wide delegation - **NEEDED** (for calendar access)

The Workload Identity Pool and OIDC Provider are NOT needed (they don't work with Netlify), but they're harmless. You can leave them there or delete them later - doesn't matter.

**No cleanup needed!** Everything is set up correctly.

---

## 📚 Complete Guide

**Full instructions**: `claudedocs/calendar-setup-final.md`

**Current step**: Just need to create the JSON key somehow (Console UI or admin help).

---

**Try the Console UI first** - it might work even though gcloud failed!
