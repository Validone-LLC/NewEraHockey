# Event Registration Metadata Management Guide

**For**: Admin (Coach Will)
**Purpose**: Configure events for registration system using Google Calendar Extended Properties
**Last Updated**: 2025-10-16

---

## Overview

Event registration is controlled through **Extended Properties** attached to Google Calendar events. These properties store metadata like price, capacity, and registration status without affecting the visible event details.

## Extended Properties Structure

Each event can have the following metadata fields:

```json
{
  "extendedProperties": {
    "shared": {
      "eventType": "camp",              // "camp" or "lesson"
      "price": "350",                   // Price in dollars (string)
      "maxCapacity": "20",              // Maximum registrations (string)
      "currentRegistrations": "0",      // Current count (managed by system)
      "registrationEnabled": "true"     // "true" or "false"
    }
  }
}
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `eventType` | string | Event category | `"camp"` or `"lesson"` |
| `price` | string | Registration cost in dollars | `"350"`, `"125"`, `"50"` |
| `maxCapacity` | string | Maximum number of registrants | `"20"`, `"10"`, `"5"` |
| `currentRegistrations` | string | Current registration count | `"0"`, `"15"`, `"20"` |
| `registrationEnabled` | string | Whether registration is active | `"true"` or `"false"` |

**Important Notes:**
- All values must be strings (even numbers)
- `currentRegistrations` is automatically managed by the system when someone registers
- You only need to set the other four fields manually

---

## Method 1: Using the Batch Update Script (Recommended)

The easiest way to add registration metadata to multiple events.

### Step 1: Get Event IDs

1. Go to [Google Calendar](https://calendar.google.com)
2. Click on an event you want to configure
3. Click "More actions" (⋮) → "Publish event"
4. Copy the Event ID from the URL:
   ```
   https://www.google.com/calendar/event?eid=ABC123...
                                            ^^^^^^^^ Event ID
   ```
   OR use the simpler method:
   - Right-click the event → "Copy link to event"
   - The event ID is in the `eid=` parameter

### Step 2: Prepare Update Request

Create a JSON structure with your updates:

```json
{
  "updates": [
    {
      "eventId": "abc123xyz",
      "eventType": "camp",
      "price": "350",
      "maxCapacity": "20",
      "registrationEnabled": "true"
    },
    {
      "eventId": "def456uvw",
      "eventType": "lesson",
      "price": "125",
      "maxCapacity": "10",
      "registrationEnabled": "true"
    }
  ]
}
```

### Step 3: Call the Batch Update Function

**Development (Local Testing):**
```bash
curl -X POST http://localhost:8888/.netlify/functions/batch-update-events \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{
    "updates": [
      {
        "eventId": "abc123xyz",
        "eventType": "camp",
        "price": "350",
        "maxCapacity": "20",
        "registrationEnabled": "true"
      }
    ]
  }'
```

**Production:**
```bash
curl -X POST https://newerahockey.co/.netlify/functions/batch-update-events \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{
    "updates": [
      {
        "eventId": "abc123xyz",
        "eventType": "camp",
        "price": "350",
        "maxCapacity": "20",
        "registrationEnabled": "true"
      }
    ]
  }'
```

**Note**: Replace `YOUR_ADMIN_SECRET` with the value from Netlify environment variables (`ADMIN_UPDATE_SECRET`)

### Step 4: Verify Results

The function returns a summary:

```json
{
  "message": "Batch update complete: 2 succeeded, 0 failed",
  "totalProcessed": 2,
  "successCount": 2,
  "failureCount": 0,
  "results": [
    {
      "eventId": "abc123xyz",
      "success": true,
      "message": "Event updated successfully"
    },
    {
      "eventId": "def456uvw",
      "success": true,
      "message": "Event updated successfully"
    }
  ]
}
```

---

## Method 2: Using Google Calendar UI (Manual)

Google Calendar's web interface doesn't directly expose Extended Properties, so this method requires using the Google Calendar API directly via API Explorer or code.

**This method is NOT recommended** - use the batch update script instead.

---

## Common Scenarios

### Scenario 1: New Hockey Camp with Registration

**Requirements:**
- Camp costs $350
- Maximum 20 participants
- Registration open

**Configuration:**
```json
{
  "eventId": "summer_camp_2024",
  "eventType": "camp",
  "price": "350",
  "maxCapacity": "20",
  "registrationEnabled": "true"
}
```

### Scenario 2: Private Training Lesson

**Requirements:**
- Lesson costs $125
- 1-on-1 (capacity = 1)
- Registration open

**Configuration:**
```json
{
  "eventId": "private_lesson_123",
  "eventType": "lesson",
  "price": "125",
  "maxCapacity": "1",
  "registrationEnabled": "true"
}
```

### Scenario 3: Group Lesson with Limited Spots

**Requirements:**
- Lesson costs $75
- Maximum 8 participants
- Registration open

**Configuration:**
```json
{
  "eventId": "group_lesson_456",
  "eventType": "lesson",
  "price": "75",
  "maxCapacity": "8",
  "registrationEnabled": "true"
}
```

### Scenario 4: Event Without Registration

**Requirements:**
- Event is informational only
- No registration needed

**Configuration:**
```json
{
  "eventId": "clinic_demo_789",
  "eventType": "camp",
  "price": "0",
  "maxCapacity": "0",
  "registrationEnabled": "false"
}
```

### Scenario 5: Temporarily Disable Registration

**Requirements:**
- Event exists but registration temporarily closed

**Configuration:**
```json
{
  "eventId": "existing_camp_101",
  "registrationEnabled": "false"
  // Keep other fields unchanged
}
```

**Note**: You can update just one field - the script preserves existing properties

---

## How the System Uses These Properties

### Frontend Display

**Camps Page (`/schedule?type=camps`):**
- Events with `registrationEnabled: "true"` show "Register" button
- Events at capacity show "SOLD OUT" badge
- Price is displayed from `price` field
- Remaining spots calculated: `maxCapacity - currentRegistrations`

**Lessons Page (`/schedule?type=lessons`):**
- Sold out lessons are **hidden** from the list
- Available lessons show "Register" button
- Price displayed from `price` field

### Registration Flow

1. User clicks "Register" button
2. System checks `canRegister`:
   - `registrationEnabled === "true"`
   - `isSoldOut === false` (currentRegistrations < maxCapacity)
   - `price` exists and is valid
3. If eligible, user proceeds to registration form
4. After payment, system increments `currentRegistrations`
5. If `currentRegistrations === maxCapacity`, event marked as sold out

---

## Verifying Configuration

### Check via Website

1. Go to [https://newerahockey.co/schedule](https://newerahockey.co/schedule)
2. Select "Camps" or "Lessons" tab
3. Verify:
   - ✅ Price displays correctly
   - ✅ "Register" button appears for eligible events
   - ✅ Sold out events show "SOLD OUT" badge/hidden
   - ✅ Capacity info displays (e.g., "5 spots left")

### Check via API

**Fetch all camps:**
```bash
curl https://newerahockey.co/.netlify/functions/calendar-events?type=camp
```

**Look for `registrationData` object in response:**
```json
{
  "events": [
    {
      "id": "abc123xyz",
      "summary": "Summer Hockey Camp",
      "registrationData": {
        "price": 350,
        "maxCapacity": 20,
        "currentRegistrations": 0,
        "isSoldOut": false,
        "registrationEnabled": true,
        "hasCapacityInfo": true
      }
    }
  ]
}
```

---

## Troubleshooting

### Event not showing "Register" button

**Check:**
1. `registrationEnabled` is set to `"true"`
2. `price` field exists and is a valid number
3. Event is not sold out (`currentRegistrations < maxCapacity`)

**Fix:**
Run batch update with correct values

### Price not displaying

**Check:**
1. `price` field exists in extended properties
2. Price is a valid number (not empty or non-numeric)

**Fallback:**
If `price` property missing, system attempts to parse from event description:
- `"Price: $350"`
- `"$350.00"`
- `"Cost: 125"`

### Sold out status incorrect

**Check:**
1. `currentRegistrations` value
2. `maxCapacity` value
3. Calculation: isSoldOut = currentRegistrations >= maxCapacity

**Fix:**
- Check registration count in extended properties
- Manually adjust `currentRegistrations` if needed (rare)

### Changes not appearing on website

**Possible causes:**
1. Browser cache - hard refresh (Ctrl+Shift+R)
2. Polling interval - wait up to 5 minutes for automatic refresh
3. Deployment not complete - check Netlify deploy status

---

## Best Practices

### 1. Always Set All Fields Together
When creating a new registerable event, set all fields at once:
```json
{
  "eventType": "camp",
  "price": "350",
  "maxCapacity": "20",
  "registrationEnabled": "true"
}
```

### 2. Use Batch Updates
Update multiple events in one request to save time and reduce errors

### 3. Keep Event Descriptions Clean
Don't duplicate price in both description and extended properties - use extended properties as source of truth

### 4. Test Before Production
Use development environment (`netlify dev`) to test configurations before applying to production events

### 5. Document Event IDs
Keep a spreadsheet of Event IDs and their configurations for easy reference

### 6. Regular Audits
Periodically review events to ensure:
- Sold out events are marked correctly
- Prices are current
- Old events have registration disabled

---

## Security Notes

- **Admin Secret**: The `ADMIN_UPDATE_SECRET` must be kept secure and only known to authorized admins
- **Production vs Development**: Use different admin secrets for production and development
- **Access Control**: Only admins should have access to the batch update function
- **Audit Trail**: All updates are logged in Netlify function logs

---

## Next Steps

After configuring event metadata:
1. Verify events display correctly on website
2. Test registration flow (Phase 2 implementation)
3. Monitor registration counts
4. Adjust capacity as needed

---

## Support

**Issues with metadata configuration?**
- Check Netlify function logs for errors
- Verify Event IDs are correct
- Ensure admin secret is configured in Netlify environment variables
- Contact technical support with Event ID and error details
