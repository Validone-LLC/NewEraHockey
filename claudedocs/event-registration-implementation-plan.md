# Event Registration System - Implementation Plan

Comprehensive plan for implementing event registration with payment processing, capacity management, and email notifications.

---

## 📋 Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Google Calendar Extended Properties](#google-calendar-extended-properties)
4. [Stripe Integration Guide](#stripe-integration-guide)
5. [Component Structure](#component-structure)
6. [Email Notification System](#email-notification-system)
7. [Implementation Phases](#implementation-phases)
8. [Testing Strategy](#testing-strategy)

---

## Feature Overview

### Core Requirements

**Registration Flow**:
1. User clicks "Register" button on event
2. Navigates to registration page showing event details
3. Fills out registration form
4. Completes Stripe payment
5. Receives confirmation emails
6. System updates Google Calendar with registration count

**Pricing**:
- Parse price from event description (e.g., "Price: $350")
- Display prominently on registration page
- Send to Stripe for payment processing

**Capacity Management**:
- Track current registrations vs. maximum capacity
- **Camps**: Show "SOLD OUT" badge when full (remain visible)
- **Lessons**: Hide completely when sold out
- Never show registration count publicly

**Form Fields**:
- Player first name (required)
- Player last name (required)
- Current level of play (required)
- Group session permission (lessons only, required)
- Parent email (required)
- Specific hockey requests (optional, textarea)
- Marketing opt-in checkbox (optional)

**Email Notifications**:
- **To Coach**: All form data + event details
- **To Registrant**: Confirmation + event info + T&C link + waiver link

---

## Architecture

### High-Level Flow

```
Schedule Page (List View)
  ↓
[Register Button]
  ↓
Registration Page (/register/:eventId)
  ↓
Registration Form
  ↓
Stripe Checkout Session
  ↓
Payment Success/Cancel
  ↓
Email Notifications (both parties)
  ↓
Google Calendar Update (increment registration count)
```

### Technology Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| **Frontend** | React + React Router | Existing stack |
| **Payment** | Stripe Checkout | Hosted payment page |
| **Backend** | Netlify Functions | Serverless endpoints |
| **Email** | AWS SES | Already configured |
| **Storage** | Google Calendar Extended Properties | No additional database needed |

---

## Google Calendar Extended Properties

### Strategy: Use Extended Properties for Capacity Tracking

Google Calendar events support **extended properties** - custom metadata attached to events that don't affect display.

### Implementation

**Event Extended Properties Structure**:
```json
{
  "extendedProperties": {
    "shared": {
      "eventType": "camp",          // Already used for categorization
      "price": "350",                // Price in dollars (no decimal for Stripe)
      "maxCapacity": "20",           // Maximum registrations
      "currentRegistrations": "5",   // Current count
      "registrationEnabled": "true"  // Enable/disable registration
    }
  }
}
```

### How to Set Extended Properties

**Via Google Calendar UI** (for Coach Will):
1. Create/edit event
2. Click "More options"
3. Scroll to "Add extended properties" (not visible in UI - requires API)

**Alternative: Via Google Calendar API** (recommended):
```javascript
// Example: Update event with extended properties
calendar.events.patch({
  calendarId: 'coachwill@newerahockeytraining.com',
  eventId: 'event_id_here',
  resource: {
    extendedProperties: {
      shared: {
        eventType: 'camp',
        price: '350',
        maxCapacity: '20',
        currentRegistrations: '0',
        registrationEnabled: 'true'
      }
    }
  }
});
```

**Initial Setup Script** (one-time):
- Create Netlify function to batch-update existing events
- Coach Will provides: event ID, price, capacity for each event
- Script updates all events with extended properties

### Reading Extended Properties

Already accessible in `calendar-events` function:
```javascript
const price = event.extendedProperties?.shared?.price;
const maxCapacity = parseInt(event.extendedProperties?.shared?.maxCapacity || 0);
const currentRegistrations = parseInt(event.extendedProperties?.shared?.currentRegistrations || 0);
const isSoldOut = currentRegistrations >= maxCapacity;
```

### Updating Registration Count

**POST endpoint**: `/.netlify/functions/register-event`
```javascript
// After successful payment:
1. Get current event from Google Calendar
2. Parse currentRegistrations
3. Increment by 1
4. Update event with new count via calendar.events.patch()
```

---

## Stripe Integration Guide

### Stripe Setup Steps

#### 1. Stripe Account Configuration

**A. Get API Keys**:
1. Login to https://dashboard.stripe.com
2. Navigate to: **Developers** → **API keys**
3. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

**B. Configure Webhook** (for payment confirmation):
1. Go to: **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://newerahockey.com/.netlify/functions/stripe-webhook`
4. Events to send:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy **Signing secret** (starts with `whsec_`)

**C. Add to Netlify Environment Variables**:
- `STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (or `pk_live_...` for production)
- `STRIPE_SECRET_KEY` = `sk_test_...` (or `sk_live_...` for production)
- `STRIPE_WEBHOOK_SECRET` = `whsec_...`

#### 2. Implementation Flow

**Stripe Checkout Session** (not Stripe Elements):
- Redirects user to Stripe-hosted payment page
- Handles all payment UI and security
- Returns to your success/cancel URLs

**Why Stripe Checkout?**:
- ✅ PCI compliance handled by Stripe
- ✅ No credit card data touches your server
- ✅ Built-in mobile optimization
- ✅ Supports Apple Pay, Google Pay, cards
- ✅ Faster implementation than Elements

### Implementation Steps

#### Step 1: Create Checkout Session (Netlify Function)

**Endpoint**: `POST /.netlify/functions/create-checkout-session`

**Request Body**:
```json
{
  "eventId": "abc123",
  "eventName": "Summer Hockey Camp 2025",
  "price": 350,
  "currency": "usd",
  "registrationData": {
    "playerFirstName": "John",
    "playerLastName": "Smith",
    "levelOfPlay": "Intermediate",
    "groupSessionPermission": "yes",
    "parentEmail": "parent@example.com",
    "hockeyRequests": "Work on skating",
    "marketingOptIn": true
  }
}
```

**Response**:
```json
{
  "sessionId": "cs_test_abc123",
  "url": "https://checkout.stripe.com/pay/cs_test_abc123"
}
```

**Function Implementation**:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const {
    eventId,
    eventName,
    price,
    currency,
    registrationData
  } = JSON.parse(event.body);

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency,
          unit_amount: price * 100, // Stripe uses cents
          product_data: {
            name: eventName,
            description: 'New Era Hockey Training Event Registration',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.URL}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL}/registration-cancel?event_id=${eventId}`,
    customer_email: registrationData.parentEmail,
    metadata: {
      eventId: eventId,
      eventName: eventName,
      playerFirstName: registrationData.playerFirstName,
      playerLastName: registrationData.playerLastName,
      levelOfPlay: registrationData.levelOfPlay,
      groupSessionPermission: registrationData.groupSessionPermission || 'N/A',
      parentEmail: registrationData.parentEmail,
      hockeyRequests: registrationData.hockeyRequests || 'None',
      marketingOptIn: registrationData.marketingOptIn ? 'Yes' : 'No',
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      url: session.url,
    }),
  };
};
```

#### Step 2: Handle Webhook (Payment Confirmation)

**Endpoint**: `POST /.netlify/functions/stripe-webhook`

**Purpose**: Stripe sends event when payment completes

**Function Implementation**:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendRegistrationEmails } = require('./utils/emailService');
const { updateEventRegistrationCount } = require('./utils/calendarService');

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  // Handle checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const metadata = session.metadata;

    // 1. Update Google Calendar registration count
    await updateEventRegistrationCount(metadata.eventId);

    // 2. Send confirmation emails
    await sendRegistrationEmails({
      coachEmail: 'coachwill@newerahockeytraining.com',
      parentEmail: metadata.parentEmail,
      eventName: metadata.eventName,
      registrationData: metadata,
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
```

#### Step 3: Frontend Registration Flow

**Registration Page** (`src/pages/EventRegistration.jsx`):

1. Display event details
2. Registration form
3. On submit:
   - Call `create-checkout-session`
   - Redirect to Stripe Checkout URL

```javascript
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        eventName: event.summary,
        price: event.extendedProperties?.shared?.price || 0,
        currency: 'usd',
        registrationData: formData,
      }),
    });

    const { url } = await response.json();

    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Registration error:', error);
  }
};
```

#### Step 4: Success/Cancel Pages

**Success Page** (`src/pages/RegistrationSuccess.jsx`):
```javascript
import Confetti from 'react-confetti';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    // Retrieve session details for confirmation
    fetch(`/.netlify/functions/get-checkout-session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => setSessionData(data));
  }, [sessionId]);

  return (
    <div className="min-h-screen">
      <Confetti />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 gradient-text">
          Congratulations! 🎉
        </h1>
        <p className="text-2xl text-neutral-light mb-8">
          You've successfully registered for <strong>{sessionData?.eventName}</strong>!
        </p>
        <p className="text-lg text-neutral-light mb-8">
          See you soon! Check your email for confirmation and event details.
        </p>
        <p className="text-sm text-neutral-light mb-8">
          Need to cancel? Contact Coach Will via our{' '}
          <a href="/contact" className="text-teal-500 hover:underline">Contact Page</a>
        </p>
        <a
          href="/schedule"
          className="inline-block px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-lg hover:shadow-lg transition-all"
        >
          Back to Schedule
        </a>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
```

**Cancel Page** (`src/pages/RegistrationCancel.jsx`):
```javascript
const RegistrationCancel = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-6 text-neutral-light">
          Registration Cancelled
        </h1>
        <p className="text-lg text-neutral-light mb-8">
          Your registration was not completed. No charges have been made.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href={`/register/${eventId}`}
            className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Try Again
          </a>
          <a
            href="/schedule"
            className="px-6 py-3 bg-primary border border-neutral-dark text-neutral-light rounded-lg hover:border-teal-500 transition-colors"
          >
            Back to Schedule
          </a>
        </div>
      </div>
    </div>
  );
};

export default RegistrationCancel;
```

---

## Component Structure

### New Components

```
src/
├── pages/
│   ├── EventRegistration.jsx        # Main registration page
│   ├── RegistrationSuccess.jsx      # Payment success page
│   └── RegistrationCancel.jsx       # Payment cancel page
│
├── components/
│   └── registration/
│       ├── RegistrationForm/
│       │   ├── RegistrationForm.jsx # Form component
│       │   └── RegistrationForm.css
│       ├── EventSummary/
│       │   ├── EventSummary.jsx     # Event details display
│       │   └── EventSummary.css
│       └── SoldOutBadge/
│           ├── SoldOutBadge.jsx     # "SOLD OUT" badge
│           └── SoldOutBadge.css
│
├── utils/
│   └── priceParser.js               # Parse price from description
│
└── services/
    └── registrationService.js       # Registration API calls
```

### Routing Changes

**`src/routes/AppRoutes.jsx`**:
```javascript
import EventRegistration from '@pages/EventRegistration';
import RegistrationSuccess from '@pages/RegistrationSuccess';
import RegistrationCancel from '@pages/RegistrationCancel';

// Add routes:
<Route path="/register/:eventId" element={<EventRegistration />} />
<Route path="/registration-success" element={<RegistrationSuccess />} />
<Route path="/registration-cancel" element={<RegistrationCancel />} />
```

### EventList Changes

**`src/components/schedule/EventList/EventList.jsx`**:

**Before**:
```javascript
<button onClick={() => setSelectedEvent(event)}>
  View Details
</button>
```

**After**:
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Check if sold out
const maxCapacity = parseInt(event.extendedProperties?.shared?.maxCapacity || 0);
const currentRegistrations = parseInt(event.extendedProperties?.shared?.currentRegistrations || 0);
const isSoldOut = currentRegistrations >= maxCapacity;
const registrationEnabled = event.extendedProperties?.shared?.registrationEnabled === 'true';

// Hide sold out lessons
if (eventType === 'lessons' && isSoldOut) {
  return null;
}

// Show sold out badge for camps
{isSoldOut && eventType === 'camps' && (
  <SoldOutBadge />
)}

// Register button
<button
  onClick={() => navigate(`/register/${event.id}`)}
  disabled={isSoldOut || !registrationEnabled}
  className={isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}
>
  {isSoldOut ? 'Sold Out' : 'Register'}
</button>
```

---

## Email Notification System

### AWS SES Configuration

Already configured in project:
- `NEH_AWS_ACCESS_KEY_ID`
- `NEH_AWS_SECRET_ACCESS_KEY`
- `NEH_AWS_REGION`
- `SES_FROM_EMAIL`

### Email Templates

#### Template 1: Coach Notification

**To**: `coachwill@newerahockeytraining.com`
**Subject**: `New Registration: {Event Name}`

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #14b8a6; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .field { margin-bottom: 15px; }
    .field strong { display: inline-block; width: 180px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Event Registration</h1>
    </div>
    <div class="content">
      <h2>Event: {Event Name}</h2>
      <p><strong>Date:</strong> {Event Date}</p>
      <p><strong>Time:</strong> {Event Time}</p>
      <hr>
      <h3>Registrant Information:</h3>
      <div class="field"><strong>Player Name:</strong> {First} {Last}</div>
      <div class="field"><strong>Level of Play:</strong> {Level}</div>
      <div class="field"><strong>Group Session:</strong> {Permission}</div>
      <div class="field"><strong>Parent Email:</strong> {Email}</div>
      <div class="field"><strong>Hockey Requests:</strong> {Requests}</div>
      <div class="field"><strong>Marketing Opt-In:</strong> {OptIn}</div>
      <hr>
      <p><strong>Payment:</strong> ${Price} - Confirmed via Stripe</p>
      <p><strong>Registration Count:</strong> {Current} / {Max}</p>
    </div>
  </div>
</body>
</html>
```

#### Template 2: Registrant Confirmation

**To**: `{Parent Email}`
**Subject**: `Registration Confirmed: {Event Name}`

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #14b8a6; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .cta { background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Registration Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi {First}'s Parent,</p>
      <p>Thank you for registering for <strong>{Event Name}</strong>!</p>

      <h3>Event Details:</h3>
      <p><strong>Date:</strong> {Event Date}</p>
      <p><strong>Time:</strong> {Event Time}</p>
      <p><strong>Location:</strong> {Event Location}</p>
      <p><strong>Description:</strong> {Event Description}</p>

      <h3>What You Registered:</h3>
      <p><strong>Player:</strong> {First} {Last}</p>
      <p><strong>Level:</strong> {Level}</p>
      <p><strong>Amount Paid:</strong> ${Price}</p>

      <hr>

      <h3>Important Information:</h3>
      <p><strong>Waiver:</strong> Please complete the waiver before the event:</p>
      <a href="https://newerahockey.com/waiver" class="cta">Complete Waiver</a>

      <p><strong>Cancellation Policy:</strong> Please review our cancellation policy:</p>
      <a href="https://newerahockey.com/terms-and-conditions" class="cta">View Terms & Conditions</a>

      <hr>

      <p><strong>Questions?</strong> Contact Coach Will:</p>
      <p>Email: coachwill@newerahockeytraining.com</p>
      <p>Phone: (571) 274-4691</p>

      <p style="margin-top: 30px;">See you soon!</p>
      <p><strong>Coach Will</strong><br>New Era Hockey Training</p>
    </div>
  </div>
</body>
</html>
```

### Email Service Implementation

**`netlify/functions/utils/emailService.js`**:
```javascript
const AWS = require('aws-sdk');

const ses = new AWS.SES({
  accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEH_AWS_REGION,
});

exports.sendRegistrationEmails = async ({ coachEmail, parentEmail, eventName, registrationData }) => {
  // Email to coach
  await ses.sendEmail({
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [coachEmail] },
    Message: {
      Subject: { Data: `New Registration: ${eventName}` },
      Body: {
        Html: { Data: generateCoachEmailHtml(eventName, registrationData) },
      },
    },
  }).promise();

  // Email to parent
  await ses.sendEmail({
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [parentEmail] },
    Message: {
      Subject: { Data: `Registration Confirmed: ${eventName}` },
      Body: {
        Html: { Data: generateParentEmailHtml(eventName, registrationData) },
      },
    },
  }).promise();
};
```

---

## Implementation Phases

### Phase 1: Google Calendar Setup (Week 1)

**Tasks**:
1. ✅ Create script to add extended properties to existing events
2. ✅ Update `calendar-events` function to parse extended properties
3. ✅ Document extended properties structure for Coach Will
4. ✅ Create utility to parse price from description (fallback)

**Deliverable**: Events have pricing and capacity metadata

---

### Phase 2: Basic Registration Flow (Week 2)

**Tasks**:
1. ✅ Create registration page route
2. ✅ Build registration form component
3. ✅ Implement sold out logic (hide lessons, badge camps)
4. ✅ Update EventList with "Register" button
5. ✅ Add price display to event cards

**Deliverable**: User can navigate to registration page and see form

---

### Phase 3: Stripe Integration (Week 3)

**Tasks**:
1. ✅ Set up Stripe account and get API keys
2. ✅ Create `create-checkout-session` Netlify function
3. ✅ Create `stripe-webhook` Netlify function
4. ✅ Implement frontend Stripe redirect
5. ✅ Create success/cancel pages with confetti

**Deliverable**: Payment processing works end-to-end

---

### Phase 4: Email Notifications (Week 4)

**Tasks**:
1. ✅ Create email templates (HTML)
2. ✅ Implement `emailService.js` utility
3. ✅ Integrate with stripe-webhook
4. ✅ Test email delivery to both parties
5. ✅ Add waiver and T&C links to emails

**Deliverable**: Both coach and parent receive confirmation emails

---

### Phase 5: Capacity Management (Week 5)

**Tasks**:
1. ✅ Implement Google Calendar update in webhook
2. ✅ Test registration count increment
3. ✅ Verify sold out detection works
4. ✅ Test lesson hiding when sold out
5. ✅ Test camp sold out badge

**Deliverable**: Capacity tracking fully functional

---

### Phase 6: Polish & Testing (Week 6)

**Tasks**:
1. ✅ Add form validation and error handling
2. ✅ Improve loading states and UX
3. ✅ Test entire flow end-to-end
4. ✅ Fix any bugs discovered
5. ✅ Deploy to production
6. ✅ Monitor for issues

**Deliverable**: Production-ready registration system

---

## Testing Strategy

### Test Scenarios

**Happy Path**:
1. ✅ User registers for camp with availability
2. ✅ Payment succeeds
3. ✅ Emails sent correctly
4. ✅ Calendar updated
5. ✅ User sees success page

**Edge Cases**:
1. ✅ User cancels payment → see cancel page
2. ✅ Event becomes sold out during checkout → handled gracefully
3. ✅ Webhook fails → manual reconciliation process
4. ✅ Email fails → retry mechanism
5. ✅ Network error during checkout → user guidance

### Test Data

**Test Event in Google Calendar**:
```json
{
  "summary": "Test Summer Camp",
  "description": "Test event - Price: $10",
  "extendedProperties": {
    "shared": {
      "eventType": "camp",
      "price": "10",
      "maxCapacity": "3",
      "currentRegistrations": "0",
      "registrationEnabled": "true"
    }
  }
}
```

**Stripe Test Cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Stripe account setup** - Get API keys and configure webhook
3. **Initial setup** - Add extended properties to a test event
4. **Start Phase 1** - Begin implementation with calendar setup

Would you like me to proceed with implementing Phase 1, or would you prefer to review/adjust the plan first?
