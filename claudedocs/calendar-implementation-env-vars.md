# Environment Variables for Calendar Integration

## Required Environment Variables

After completing Phase 1 (Google Cloud Setup), you'll need to configure these environment variables in Netlify:

### Google Cloud Configuration

```bash
# Google Cloud Project Identifiers
GOOGLE_PROJECT_ID="newerahockey-calendar"
GOOGLE_PROJECT_NUMBER="YOUR_PROJECT_NUMBER"

# Workload Identity Federation
WORKLOAD_IDENTITY_POOL_ID="netlify-pool"
WORKLOAD_IDENTITY_PROVIDER_ID="netlify-provider"

# Service Account
SERVICE_ACCOUNT_EMAIL="newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com"

# Calendar Configuration
CALENDAR_ID="coachwill@newerahockeytraining.com"
```

---

## How to Get These Values

### 1. GOOGLE_PROJECT_ID
This is the project ID you created in Phase 1.1.

**Command to verify**:
```bash
gcloud config get-value project
```

**Expected**: `newerahockey-calendar`

---

### 2. GOOGLE_PROJECT_NUMBER
Your Google Cloud project number (different from project ID).

**How to get it**:
```bash
gcloud projects describe newerahockey-calendar --format="value(projectNumber)"
```

**Example**: `123456789012`

---

### 3. WORKLOAD_IDENTITY_POOL_ID
The workload identity pool you created in Phase 1.2.

**Value**: `netlify-pool`

**Command to verify**:
```bash
gcloud iam workload-identity-pools describe netlify-pool \
  --location="global" \
  --project=newerahockey-calendar
```

---

### 4. WORKLOAD_IDENTITY_PROVIDER_ID
The OIDC provider you created in Phase 1.3.

**Value**: `netlify-provider`

**Command to verify**:
```bash
gcloud iam workload-identity-pools providers describe netlify-provider \
  --location="global" \
  --workload-identity-pool=netlify-pool \
  --project=newerahockey-calendar
```

---

### 5. SERVICE_ACCOUNT_EMAIL
The service account email created in Phase 1.4.

**Format**: `SERVICE_ACCOUNT_NAME@PROJECT_ID.iam.gserviceaccount.com`

**Expected**: `newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com`

**Command to verify**:
```bash
gcloud iam service-accounts list --project=newerahockey-calendar
```

---

### 6. CALENDAR_ID
The Google Calendar to fetch events from.

**Value**: `coachwill@newerahockeytraining.com`

---

## Setting Environment Variables in Netlify

### Option A: Netlify UI (Recommended)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your **New Era Hockey** site
3. Navigate to **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Add each variable with its value:
   - Key: `GOOGLE_PROJECT_ID`
   - Value: `newerahockey-calendar`
   - Scopes: **All** (or specific contexts if needed)
6. Click **Save**
7. Repeat for all 6 variables

### Option B: Netlify CLI

```bash
# Set all variables at once
netlify env:set GOOGLE_PROJECT_ID "newerahockey-calendar"
netlify env:set GOOGLE_PROJECT_NUMBER "YOUR_PROJECT_NUMBER"
netlify env:set WORKLOAD_IDENTITY_POOL_ID "netlify-pool"
netlify env:set WORKLOAD_IDENTITY_PROVIDER_ID "netlify-provider"
netlify env:set SERVICE_ACCOUNT_EMAIL "newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com"
netlify env:set CALENDAR_ID "coachwill@newerahockeytraining.com"
```

---

## Verification

After setting environment variables:

1. **Trigger a new deploy** in Netlify (environment variables require redeployment)
2. **Check build logs** for any environment variable errors
3. **Test the function**:
   ```bash
   curl https://newerahockey.netlify.app/.netlify/functions/calendar-events
   ```
4. **Expected response**:
   ```json
   {
     "events": [...],
     "total": 5,
     "nextSyncToken": "...",
     "timestamp": "2025-01-16T..."
   }
   ```

---

## Troubleshooting

### Missing Environment Variables Error
**Error**: `Missing required environment variables`

**Solution**: Verify all 6 variables are set in Netlify and redeploy.

### Authentication Failed
**Error**: `Authentication failed - check service account permissions`

**Solution**:
1. Verify service account has domain-wide delegation (Phase 1.5)
2. Check Calendar API is enabled (Phase 1.6)
3. Verify service account has Calendar Reader role (Phase 1.7)

### Calendar Not Found
**Error**: `Calendar not found`

**Solution**:
1. Verify `CALENDAR_ID` is correct
2. Check service account has access to the calendar
3. Ensure domain-wide delegation includes calendar scope

---

## Security Best Practices

✅ **DO**:
- Keep environment variables in Netlify only (never commit to git)
- Use Workload Identity Federation (no JSON keys)
- Restrict service account to read-only calendar access
- Use least-privilege permissions

❌ **DON'T**:
- Commit environment variables to version control
- Share environment variable values publicly
- Use overly permissive service account roles
- Store JSON keys (not needed with Workload Identity)

---

## Next Steps

After configuring environment variables:

1. ✅ Deploy to Netlify
2. ✅ Test calendar function endpoint
3. ✅ Verify events load in Training Schedule page
4. ✅ Set up automatic polling (already configured - 5 min intervals)
5. ✅ Monitor function logs for any errors

**Implementation Status**: Ready for deployment after Phase 1 completion

**Page URL**: `https://newerahockey.com/schedule`
