# Automated Registration System

## 🎯 Problem Solved

**Before**: Manual extended properties setup for every calendar event
**After**: Zero-config registration - just add price to event description

## ✅ How It Works Now

### Admin Workflow (Simple!)

1. **Create Calendar Event** in Google Calendar
   - Add title: "Summer Hockey Camp" or "Private Lesson"
   - Add description with price: `Price: $350`
   - **(Optional)** Add custom capacity: `Spots: 25` or `Capacity: 2`
   - Choose color: Red (camps) or Blue (lessons) *(optional)*
   - Save event

2. **That's it!** System automatically:
   - Detects event type from title/color
   - Enables registration (price = registration enabled)
   - Uses custom capacity from description OR default (camps: 20, lessons: 10)
   - Tracks registrations in database
   - Shows Register button on website

### What Changed

#### Auto-Detection Logic
```javascript
// Event with price in description → Registration automatically enabled
// No manual properties needed!

if (description.includes("Price: $350")) {
  registrationEnabled = true;
  price = 350;
  maxCapacity = eventType === 'camp' ? 20 : 10; // Auto-assigned
}
```

#### Event Type Detection
System detects event type from:
1. **Title keywords**: "camp", "lesson", "training"
2. **Calendar color**: Red (11) = camp, Blue (9) = lesson
3. **Extended properties**: eventType (if manually set)

#### Registration Tracking
- **Storage**: Netlify Blob Storage (no external database needed)
- **Auto-created**: First registration initializes tracking
- **Real-time updates**: Webhook updates count after payment
- **Capacity management**: Auto sold-out when capacity reached

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN: Create Event with Price in Description           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. calendar-events.js AUTO-DETECTS:                         │
│    ✓ Event type (camp/lesson)                              │
│    ✓ Price from description                                 │
│    ✓ registrationEnabled = true (if price exists)          │
│    ✓ Default capacity based on type                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. WEBSITE: Shows Register Button                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. USER: Fills form & pays via Stripe                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. stripe-webhook.js:                                        │
│    ✓ Receives payment confirmation                          │
│    ✓ Adds registration to Netlify Blob Storage             │
│    ✓ Increments registration count                          │
│    ✓ Marks sold out when capacity reached                  │
│    ✓ Sends confirmation emails (admin + guardian)          │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### Netlify Blob Storage: `registrations` store

```javascript
{
  // Key: Google Calendar event ID

  "eventId": "abc123xyz",
  "maxCapacity": 20,
  "currentRegistrations": 5,
  "registrations": [
    {
      "id": "stripe_session_id",
      "timestamp": "2025-01-17T12:00:00Z",
      "playerFirstName": "John",
      "playerLastName": "Doe",
      "playerDateOfBirth": "2010-05-15",
      "guardianEmail": "parent@example.com",
      "guardianPhone": "555-123-4567",
      "emergencyContactName": "Jane Doe",
      "emergencyContactPhone": "555-987-6543",
      "medicalNotes": "No allergies"
    }
  ],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-17T12:00:00Z"
}
```

## 🔧 Implementation Details

### calendar-events.js
- **Purpose**: Fetch events and enrich with registration data
- **Auto-detection**: Price in description → registration enabled
- **Blob integration**: Fetches current registration count
- **Default capacity**: camps: 20, lessons: 10, other: 15

### registrationStore.js
- **Purpose**: Database abstraction layer for Netlify Blobs
- **Functions**:
  - `getEventRegistrations(eventId)` - Get current count
  - `addRegistration(eventId, eventType, data)` - Record registration
  - `isEventSoldOut(eventId)` - Check capacity
  - `getAllRegistrations()` - Admin reporting

### stripe-webhook.js
- **Purpose**: Handle successful payment webhooks
- **Listens for**: `checkout.session.completed`
- **Actions**:
  1. Extract registration data from Stripe metadata
  2. Call `addRegistration()` to store in blob
  3. Auto-increment registration count
  4. Check if sold out
  5. Send confirmation emails via AWS SES
- **Email Integration**: Uses AWS SES (same as contact form)
- **Email Recipients**:
  - Admin notification to ADMIN_EMAIL with registration details
  - User confirmation to guardian with event details and receipt

### create-checkout-session.js
- **Updated**: Now requires `eventType` in request body
- **Metadata**: Stores all 14 fields + event type
- **Used by**: Webhook to record registration

### RegistrationForm.jsx
- **Updated**: Auto-detects event type from title
- **Sends**: eventType in Stripe session request

## 📝 Default Capacities

```javascript
const DEFAULT_CAPACITY = {
  camp: 20,
  lesson: 10,
  other: 15,
};
```

**Future**: Admin UI to override defaults per event

## 🧪 Testing Guide

### 1. Create Test Event

In Google Calendar:
```
Title: Test Hockey Camp
Description: Join us for an awesome camp!

Price: $50

Location: Arena XYZ
```

### 2. Verify Auto-Detection

Browser console on localhost:8888/schedule:
```javascript
fetch('/.netlify/functions/calendar-events?type=camp')
  .then(r => r.json())
  .then(data => {
    const event = data.events[0];
    console.log('Registration enabled:', event.registrationData.registrationEnabled); // true
    console.log('Price:', event.registrationData.price); // 50
    console.log('Max capacity:', event.registrationData.maxCapacity); // 20
    console.log('Current registrations:', event.registrationData.currentRegistrations); // 0
  });
```

### 3. Test Registration Flow

1. Click Register button on test event
2. Fill out form with test data
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete payment
5. Check webhook logs: `netlify dev` output
6. Verify registration count: Run console test again

### 4. Test Sold Out

Register 20 times (for camp) and verify:
- Event shows "SOLD OUT" badge
- Register button disabled
- New registrations rejected by webhook

## 🔐 Webhook Setup

### Stripe Dashboard Setup

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **URL**: `https://newerahockey.co/.netlify/functions/stripe-webhook`
4. **Events**: Select `checkout.session.completed`
5. **Copy webhook signing secret**
6. Add to Netlify environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Local Testing

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Use the webhook signing secret from output
# Add to .env file
```

## 🚀 Deployment Checklist

- [x] Install @netlify/blobs package
- [x] Create registrationStore.js
- [x] Update calendar-events.js with auto-detection
- [x] Create stripe-webhook.js with email integration
- [x] Update create-checkout-session.js
- [x] Update RegistrationForm.jsx
- [ ] Set up Stripe webhook in dashboard
- [ ] Verify Netlify environment variables:
  - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
  - `NEH_AWS_ACCESS_KEY_ID` - AWS SES access key
  - `NEH_AWS_SECRET_ACCESS_KEY` - AWS SES secret key
  - `ADMIN_EMAIL` - Coach Will's email for notifications
  - `SES_FROM_EMAIL` - Sender email address
- [ ] Test end-to-end payment flow
- [ ] Verify emails are received (admin + guardian)
- [ ] Monitor webhook logs

## 📊 Monitoring

### Check Registration Data

```bash
# Node script (requires netlify dev running)
node scripts/check-calendar-data.js
```

### Netlify Blob Storage

```javascript
// In Netlify function
const { getStore } = require('@netlify/blobs');
const store = getStore('registrations');

// List all events with registrations
const list = await store.list();
console.log(list.blobs);

// Get specific event
const data = await store.get('event_id_here', { type: 'json' });
console.log(data);
```

### Webhook Logs

- **Local**: Watch `netlify dev` terminal output
- **Production**: Netlify Functions logs in dashboard

## 🎉 Benefits

✅ **Zero Manual Setup** - No extended properties needed
✅ **Auto-Detection** - Price in description = registration enabled
✅ **Default Capacities** - Camps: 20, Lessons: 10
✅ **Real-Time Tracking** - Webhook updates after payment
✅ **Sold Out Management** - Automatic when capacity reached
✅ **No External DB** - Uses Netlify Blob Storage (included)
✅ **Admin Friendly** - Just add price to description
✅ **Scalable** - Handles unlimited events and registrations
✅ **Email Notifications** - Automatic confirmation to admin & guardian

## 🔮 Future Enhancements

1. **Admin Dashboard**: View/manage registrations
2. **Custom Capacities**: Override defaults per event
3. **Waitlist**: Allow overflow registrations
4. **Refunds**: Cancel registration workflow
5. **CSV Export**: Download registration data
6. **Analytics**: Registration trends and insights
7. **Calendar Integration**: Automatically add event to guardian's calendar
