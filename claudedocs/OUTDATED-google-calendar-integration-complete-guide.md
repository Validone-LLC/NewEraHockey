# Google Calendar Integration - Complete Implementation Guide

**Date**: 2025-01-16
**Objective**: Integrate Google Workspace calendar (coachwill@newerahockeytraining.com) with New Era Hockey React app
**Security**: Maximum (Workload Identity Federation - No JSON keys)
**Timeline**: 6-8 weeks total

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Google Calendar API Setup & Authentication (1-2 weeks)](#phase-1-google-calendar-api-setup--authentication-1-2-weeks)
3. [Phase 2: Event Fetching & Categorization (1-2 weeks)](#phase-2-event-fetching--categorization-1-2-weeks)
4. [Phase 3: UI Components - List & Calendar Views (2-3 weeks)](#phase-3-ui-components---list--calendar-views-2-3-weeks)
5. [Phase 4: Real-Time Sync with Polling (1 week)](#phase-4-real-time-sync-with-polling-1-week)
6. [Phase 5: Testing & Deployment (1 week)](#phase-5-testing--deployment-1-week)
7. [Phase 6: Future Enhancements (Optional)](#phase-6-future-enhancements-optional)

---

## Architecture Overview

### Authentication: Workload Identity Federation ✅
**Why**: Maximum security without JSON key management

**Benefits**:
- ✅ No JSON keys to manage, rotate, or secure
- ✅ Short-lived access tokens (automatic expiration)
- ✅ Full compliance with `iam.disableServiceAccountKeyCreation` policy
- ✅ Reduced security attack surface

**Implementation**:
- Workload Identity Pool for Netlify Functions
- OIDC provider authentication
- Service account impersonation
- Backend securely manages authentication (Netlify environment variables only)
- No OAuth consent flow needed for public users

### Event Categorization: Extended Properties ✅
**Method**: Google Calendar Extended Properties (custom metadata)

```javascript
extendedProperties: {
  shared: {
    eventType: 'camp' // or 'lesson'
  }
}
```

**Fallback Methods**:
1. Extended Properties (preferred - most reliable)
2. Color-coding (red = camps, blue = lessons)
3. Keyword detection in event title

### Calendar Library: react-big-calendar ✅
**Why**:
- React-native, lightweight (~100KB)
- Flexible API for customization
- Good performance with large datasets
- Sufficient features (multiple views, event rendering)
- Easier learning curve than FullCalendar

### Sync Strategy: Polling → Webhooks ✅
**Phase 1**: Incremental polling (every 5 minutes) with sync tokens
**Phase 2** (Future): Webhook push notifications for real-time updates

---

## Phase 1: Google Calendar API Setup & Authentication (1-2 weeks)

### 1.1 Google Cloud Console Setup (5 min)

**Steps**:
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: **"NewEraHockey-Calendar"**
3. Enable Google Calendar API:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click **"Enable"**

---

### 1.2 Create Workload Identity Pool (10 min)

**Purpose**: Enable Netlify Functions to authenticate without JSON keys

**Commands**:
```bash
# Set your project ID
PROJECT_ID="newerahockey-calendar"
POOL_ID="netlify-pool"
PROVIDER_ID="netlify-provider"

# Set as default project
gcloud config set project $PROJECT_ID

# Create workload identity pool
gcloud iam workload-identity-pools create $POOL_ID \
  --location="global" \
  --description="Netlify Functions authentication for calendar integration" \
  --project=$PROJECT_ID

# Verify creation
gcloud iam workload-identity-pools describe $POOL_ID \
  --location="global" \
  --project=$PROJECT_ID
```

**Expected Output**:
```
Created workload identity pool [netlify-pool].
```

---

### 1.3 Create OIDC Provider for Netlify (10 min)

**Purpose**: Configure Netlify as trusted identity provider

**Commands**:
```bash
# Create OIDC provider
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_ID \
  --location="global" \
  --workload-identity-pool=$POOL_ID \
  --issuer-uri="https://netlify.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --project=$PROJECT_ID

# Verify creation
gcloud iam workload-identity-pools providers describe $PROVIDER_ID \
  --location="global" \
  --workload-identity-pool=$POOL_ID \
  --project=$PROJECT_ID
```

**Expected Output**:
```
Created workload identity pool provider [netlify-provider].
```

---

### 1.4 Create Service Account (5 min)

**Purpose**: Create service account that will access calendar (no keys needed)

**Commands**:
```bash
SERVICE_ACCOUNT_NAME="newerahockey-calendar-service"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="New Era Hockey Calendar Service" \
  --description="Service account for calendar integration via Workload Identity" \
  --project=$PROJECT_ID

# Verify creation
gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL \
  --project=$PROJECT_ID
```

**Expected Output**:
```
Created service account [newerahockey-calendar-service].
```

---

### 1.5 Grant Calendar Access to Service Account (5 min)

**Purpose**: Give service account permission to read calendar data

**Commands**:
```bash
# Grant Calendar API access at project level
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/calendar.reader" \
  --condition=None

# Verify permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SERVICE_ACCOUNT_EMAIL}"
```

---

### 1.6 Bind Workload Identity to Service Account (10 min)

**Purpose**: Allow Netlify Functions to impersonate service account

**Commands**:
```bash
# Get project number (needed for workload identity binding)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

echo "Project Number: $PROJECT_NUMBER"

# Bind workload identity pool to service account
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/*" \
  --project=$PROJECT_ID

# Verify binding
gcloud iam service-accounts get-iam-policy $SERVICE_ACCOUNT_EMAIL \
  --project=$PROJECT_ID
```

**Expected Output**: Policy with `workloadIdentityUser` role bound

---

### 1.7 Domain-Wide Delegation (10 min)

**Purpose**: Grant service account access to all Google Workspace calendars

**Step A: Get Client ID**
```bash
# Get service account's unique ID (Client ID)
CLIENT_ID=$(gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL \
  --format="value(uniqueId)" \
  --project=$PROJECT_ID)

echo "Client ID for Domain-Wide Delegation: $CLIENT_ID"
echo "Copy this Client ID for the next step"
```

**Step B: Configure Domain-Wide Delegation** (Manual - Google Workspace Admin Console)

1. Navigate to: https://admin.google.com
2. **Security** → **API Controls** → **Domain-wide Delegation**
3. Click **"Add new"**
4. Enter details:
   - **Client ID**: Paste the `$CLIENT_ID` from Step A
   - **OAuth Scopes**: `https://www.googleapis.com/auth/calendar.readonly`
5. Click **"Authorize"**

**Step C: Share Coach Will's Calendar**

1. Open Google Calendar: https://calendar.google.com
2. Settings → `coachwill@newerahockeytraining.com` calendar settings
3. **Share with specific people** → Add:
   - **Email**: `newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com`
   - **Permission**: **"See all event details"**
4. Click **"Send"**

---

### 1.8 Get Workload Identity Provider Resource Name (5 min)

**Purpose**: Get full provider path for Netlify environment variables

**Commands**:
```bash
# Get full provider resource name
PROVIDER_NAME="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

echo "Provider Resource Name:"
echo $PROVIDER_NAME
echo ""
echo "📝 SAVE THIS VALUE - You'll need it for Netlify environment variables"
```

**Example Output**:
```
Provider Resource Name:
projects/123456789/locations/global/workloadIdentityPools/netlify-pool/providers/netlify-provider
```

**⚠️ IMPORTANT**: Copy this value - you'll use it in Step 1.11

---

### 1.9 Install Dependencies (2 min)

```bash
cd /path/to/newerahockey
npm install googleapis google-auth-library
```

---

### 1.10 Backend API Setup (Netlify Function) (15 min)

**Create**: `netlify/functions/calendar-events.js`

```javascript
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  try {
    // Initialize Google Auth with Workload Identity Federation
    const auth = new GoogleAuth({
      projectId: process.env.GOOGLE_PROJECT_ID,
      // Workload Identity Federation configuration
      credentials: {
        type: 'external_account',
        audience: `//iam.googleapis.com/${process.env.WORKLOAD_IDENTITY_PROVIDER}`,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        token_url: 'https://sts.googleapis.com/v1/token',
        credential_source: {
          headers: {
            'Metadata-Flavor': 'Google',
          },
          url: process.env.NETLIFY_OIDC_TOKEN_URL || 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        },
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Fetch events from Coach Will's calendar
    const response = await calendar.events.list({
      calendarId: 'coachwill@newerahockeytraining.com',
      timeMin: new Date().toISOString(), // Only future events
      maxResults: 100,
      singleEvents: true, // Expand recurring events
      orderBy: 'startTime',
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        events: response.data.items,
        total: response.data.items.length,
      }),
    };
  } catch (error) {
    console.error('Calendar API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to fetch calendar events',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};
```

---

### 1.11 Environment Variables (5 min)

**Netlify Dashboard**:
1. Site settings → Environment variables → Add variable
2. Add the following 3 variables:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `GOOGLE_PROJECT_ID` | Your Google Cloud project ID | `newerahockey-calendar` |
| `WORKLOAD_IDENTITY_PROVIDER` | Provider resource name from Step 1.8 | `projects/123456789/locations/global/workloadIdentityPools/netlify-pool/providers/netlify-provider` |
| `SERVICE_ACCOUNT_EMAIL` | Service account email | `newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com` |

3. **Scope**: Production + Deploy previews

**Local Development** (`.env`):
```bash
GOOGLE_PROJECT_ID=newerahockey-calendar
WORKLOAD_IDENTITY_PROVIDER=projects/123456789/locations/global/workloadIdentityPools/netlify-pool/providers/netlify-provider
SERVICE_ACCOUNT_EMAIL=newerahockey-calendar-service@newerahockey-calendar.iam.gserviceaccount.com
```

**IMPORTANT**: Add `.env` to `.gitignore`

---

### 1.12 Test Authentication (10 min)

**Create test script**: `scripts/test-calendar-auth.js`

```javascript
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
require('dotenv').config();

async function testAuth() {
  try {
    console.log('🔐 Testing Workload Identity Federation...\n');

    const auth = new GoogleAuth({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        type: 'external_account',
        audience: `//iam.googleapis.com/${process.env.WORKLOAD_IDENTITY_PROVIDER}`,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        token_url: 'https://sts.googleapis.com/v1/token',
        credential_source: {
          headers: { 'Metadata-Flavor': 'Google' },
          url: 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        },
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const response = await calendar.events.list({
      calendarId: 'coachwill@newerahockeytraining.com',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log('✅ Authentication successful!');
    console.log(`📅 Found ${response.data.items.length} upcoming events\n`);

    if (response.data.items.length > 0) {
      console.log('First event:', response.data.items[0].summary);
      console.log('Date:', response.data.items[0].start.dateTime || response.data.items[0].start.date);
    }

    console.log('\n🎉 Workload Identity Federation is working!');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.error('\nFull error:', error);
  }
}

testAuth();
```

**Run test**:
```bash
node scripts/test-calendar-auth.js
```

**Expected Output**:
```
🔐 Testing Workload Identity Federation...

✅ Authentication successful!
📅 Found 5 upcoming events

First event: Youth Hockey Camp - Summer 2025
Date: 2025-06-15T09:00:00-04:00

🎉 Workload Identity Federation is working!
```

---

## Phase 2: Event Fetching & Categorization (1-2 weeks)

### 2.1 Event Type Detection System (30 min)

**Create**: `src/utils/eventCategorization.js`

```javascript
/**
 * Categorize event by type (camp, lesson, or other)
 * Uses multiple detection methods with fallback strategy
 */
export const categorizeEvent = (event) => {
  // Method 1: Extended Properties (preferred - most reliable)
  const eventType = event.extendedProperties?.shared?.eventType;
  if (eventType) {
    return eventType.toLowerCase();
  }

  // Method 2: Color-based categorization (fallback)
  const colorMap = {
    '11': 'camp',    // Red
    '9': 'lesson',   // Blue
  };
  if (event.colorId && colorMap[event.colorId]) {
    return colorMap[event.colorId];
  }

  // Method 3: Keyword detection in title (last resort)
  const title = event.summary?.toLowerCase() || '';
  if (title.includes('camp')) return 'camp';
  if (title.includes('lesson') || title.includes('training')) return 'lesson';

  return 'other'; // Uncategorized
};

/**
 * Filter events by type
 */
export const filterEventsByType = (events, type) => {
  return events.filter(event => categorizeEvent(event) === type);
};

/**
 * Group events by type
 */
export const groupEventsByType = (events) => {
  return events.reduce((acc, event) => {
    const type = categorizeEvent(event);
    if (!acc[type]) acc[type] = [];
    acc[type].push(event);
    return acc;
  }, {});
};
```

---

### 2.2 Enhanced Backend Function (20 min)

**Update**: `netlify/functions/calendar-events.js`

```javascript
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

// Import categorization utilities
const { categorizeEvent, filterEventsByType } = require('../../src/utils/eventCategorization');

exports.handler = async (event, context) => {
  try {
    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const eventType = queryParams.type; // 'camp' or 'lesson'

    // Initialize Google Auth with Workload Identity Federation
    const auth = new GoogleAuth({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        type: 'external_account',
        audience: `//iam.googleapis.com/${process.env.WORKLOAD_IDENTITY_PROVIDER}`,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        token_url: 'https://sts.googleapis.com/v1/token',
        credential_source: {
          headers: { 'Metadata-Flavor': 'Google' },
          url: process.env.NETLIFY_OIDC_TOKEN_URL || 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        },
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const response = await calendar.events.list({
      calendarId: 'coachwill@newerahockeytraining.com',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    let events = response.data.items;

    // Filter by type if specified
    if (eventType) {
      events = filterEventsByType(events, eventType);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        events,
        total: events.length,
        type: eventType || 'all',
      }),
    };
  } catch (error) {
    console.error('Calendar API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to fetch calendar events',
        message: error.message,
      }),
    };
  }
};
```

---

### 2.3 Frontend Data Service (15 min)

**Create**: `src/services/calendarService.js`

```javascript
/**
 * Fetch events from backend API
 * @param {string|null} eventType - 'camp', 'lesson', or null for all
 * @returns {Promise<Object>} - { events, total, type }
 */
export const fetchEvents = async (eventType = null) => {
  const url = eventType
    ? `/.netlify/functions/calendar-events?type=${eventType}`
    : '/.netlify/functions/calendar-events';

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch events');
  }

  return await response.json();
};

/**
 * Convenience methods
 */
export const fetchCamps = () => fetchEvents('camp');
export const fetchLessons = () => fetchEvents('lesson');
export const fetchAllEvents = () => fetchEvents();
```

---

### 2.4 Test Categorization (20 min)

**Create test events in Coach Will's calendar**:

1. **Test Camp Event**:
   - Title: "Summer Hockey Camp 2025"
   - Color: Red (color ID #11)
   - Date: Future date
   - Location: Ice rink address (optional)

2. **Test Lesson Event**:
   - Title: "Private Skating Lesson - John Doe"
   - Color: Blue (color ID #9)
   - Date: Future date
   - Location: Ice rink address (optional)

3. **Test Uncategorized Event**:
   - Title: "Team Meeting"
   - No color set
   - Date: Future date

**Validation**:
```bash
# Start local Netlify dev server
netlify dev

# Test backend directly (in another terminal)
curl "http://localhost:8888/.netlify/functions/calendar-events?type=camp"

# Expected: Only camp events returned
```

---

## Phase 3: UI Components - List & Calendar Views (2-3 weeks)

### 3.1 Install Dependencies (2 min)

```bash
npm install react-big-calendar date-fns
```

---

### 3.2 Create Events Schedule Page (1 hour)

**File**: `src/pages/EventsSchedule.jsx`

```javascript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fetchCamps, fetchLessons } from '@services/calendarService';
import EventList from '@components/events/EventList/EventList';
import Button from '@components/common/Button/Button';
import { HiCalendar } from 'react-icons/hi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@styles/calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EventsSchedule = () => {
  const [viewType, setViewType] = useState('camps'); // 'camps' or 'lessons'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = viewType === 'camps'
          ? await fetchCamps()
          : await fetchLessons();

        setEvents(transformEventsForCalendar(data.events));
      } catch (error) {
        console.error('Failed to load events:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [viewType]);

  const transformEventsForCalendar = (events) => {
    return events.map(event => ({
      id: event.id,
      title: event.summary,
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      description: event.description,
      location: event.location,
      allDay: !event.start.dateTime, // All-day if no time specified
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              Training <span className="gradient-text">Schedule</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              View upcoming camps and individual training sessions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Toggle Buttons */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setViewType('camps')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
              viewType === 'camps'
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/50'
                : 'bg-neutral-dark text-neutral-text hover:bg-neutral-text hover:text-primary'
            }`}
            aria-pressed={viewType === 'camps'}
          >
            Camps
          </button>
          <button
            onClick={() => setViewType('lessons')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
              viewType === 'lessons'
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/50'
                : 'bg-neutral-dark text-neutral-text hover:bg-neutral-text hover:text-primary'
            }`}
            aria-pressed={viewType === 'lessons'}
          >
            Lessons
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
            <p className="text-neutral-light mt-4">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-orange-500 mb-4">Failed to load events: {error}</p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Event List */}
            <EventList events={events} viewType={viewType} />

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 bg-white rounded-lg p-6 shadow-xl"
            >
              <h2 className="text-2xl font-display font-bold text-primary mb-6 flex items-center gap-2">
                <HiCalendar className="w-6 h-6 text-teal-500" />
                Calendar View
              </h2>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="month"
              />
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
};

export default EventsSchedule;
```

---

### 3.3 Create Event List Component (45 min)

**Create directory**: `src/components/events/EventList/`

**File**: `src/components/events/EventList/EventList.jsx`

```javascript
import { HiCalendar, HiLocationMarker, HiClock } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import { format } from 'date-fns';

const EventList = ({ events, viewType }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-primary/30 rounded-lg">
        <HiCalendar className="w-16 h-16 text-neutral-dark mx-auto mb-4" />
        <p className="text-neutral-light text-lg">
          No upcoming {viewType} scheduled
        </p>
        <p className="text-neutral-text text-sm mt-2">
          Check back soon for new events
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-6">
        Upcoming {viewType === 'camps' ? 'Camps' : 'Lessons'} ({events.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {events.map((event, index) => (
          <Card key={event.id} delay={index * 0.1}>
            <div className="flex items-start gap-4">
              <div className="bg-teal-500/20 p-3 rounded-lg flex-shrink-0">
                <HiCalendar className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-display font-bold text-white mb-2 break-words">
                  {event.title}
                </h3>

                <div className="space-y-2 text-neutral-light">
                  {/* Date & Time */}
                  <div className="flex items-start gap-2">
                    <HiClock className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                    <span className="text-sm">
                      {event.allDay
                        ? format(event.start, 'MMMM d, yyyy')
                        : format(event.start, 'MMMM d, yyyy • h:mm a')
                      }
                    </span>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-2">
                      <HiLocationMarker className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                      <span className="text-sm break-words">{event.location}</span>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-text break-words">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventList;
```

---

### 3.4 Style Calendar Component (30 min)

**Create**: `src/styles/calendar.css`

```css
/* Dark theme customization for react-big-calendar */

.rbc-calendar {
  background-color: #1a1a1a;
  color: #e5e5e5;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Header (days of week) */
.rbc-header {
  background-color: #2a2a2a;
  color: #14b8a6;
  padding: 12px;
  font-weight: 600;
  border-bottom: 2px solid #14b8a6;
}

.rbc-header + .rbc-header {
  border-left: 1px solid #3a3a3a;
}

/* Today highlight */
.rbc-today {
  background-color: #14b8a6 !important;
}

/* Events */
.rbc-event {
  background-color: #14b8a6;
  border: none;
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 0.85rem;
}

.rbc-event:hover {
  background-color: #0f9488;
}

.rbc-event.rbc-selected {
  background-color: #0d9488;
}

/* Off-range dates */
.rbc-off-range {
  color: #666;
}

.rbc-off-range-bg {
  background-color: #0f0f0f;
}

/* Month view */
.rbc-month-view,
.rbc-time-view {
  border: 1px solid #2a2a2a;
}

.rbc-day-bg + .rbc-day-bg {
  border-left: 1px solid #2a2a2a;
}

.rbc-month-row + .rbc-month-row {
  border-top: 1px solid #2a2a2a;
}

/* Toolbar */
.rbc-toolbar {
  background-color: #1a1a1a;
  padding: 15px;
  border-bottom: 1px solid #2a2a2a;
  margin-bottom: 0;
}

.rbc-toolbar button {
  background-color: #2a2a2a;
  color: #e5e5e5;
  border: 1px solid #3a3a3a;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.rbc-toolbar button:hover {
  background-color: #14b8a6;
  color: white;
  border-color: #14b8a6;
}

.rbc-toolbar button.rbc-active {
  background-color: #14b8a6;
  color: white;
  border-color: #14b8a6;
}

.rbc-toolbar-label {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

/* Agenda view */
.rbc-agenda-view {
  background-color: #1a1a1a;
}

.rbc-agenda-table {
  border: 1px solid #2a2a2a;
}

.rbc-agenda-date-cell,
.rbc-agenda-time-cell {
  color: #e5e5e5;
  padding: 8px 12px;
}

.rbc-agenda-event-cell {
  color: #e5e5e5;
  padding: 8px 12px;
}

/* Time slots */
.rbc-time-slot {
  border-top: 1px solid #2a2a2a;
}

.rbc-time-content {
  border-top: 1px solid #2a2a2a;
}

.rbc-current-time-indicator {
  background-color: #14b8a6;
  height: 2px;
}
```

---

### 3.5 Add Route (5 min)

**Update**: `src/App.jsx`

```javascript
import EventsSchedule from './pages/EventsSchedule';

// Inside Routes component
<Route path="/schedule" element={<EventsSchedule />} />
```

---

### 3.6 Add Navigation Link (10 min)

**Update**: `src/components/layout/Navbar/Navbar.jsx`

Add to navigation items:
```javascript
<NavLink
  to="/schedule"
  className={({ isActive }) =>
    `nav-link ${isActive ? 'text-teal-400 border-b-2 border-teal-400' : 'text-neutral-light hover:text-white'}`
  }
>
  Schedule
</NavLink>
```

---

## Phase 4: Real-Time Sync with Polling (1 week)

### 4.1 Implement Incremental Sync (30 min)

**Update**: `netlify/functions/calendar-events.js`

Add sync token support for efficient polling:

```javascript
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const { categorizeEvent, filterEventsByType } = require('../../src/utils/eventCategorization');

exports.handler = async (event, context) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const eventType = queryParams.type;
    const syncToken = queryParams.syncToken; // For incremental sync

    const auth = new GoogleAuth({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        type: 'external_account',
        audience: `//iam.googleapis.com/${process.env.WORKLOAD_IDENTITY_PROVIDER}`,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        token_url: 'https://sts.googleapis.com/v1/token',
        credential_source: {
          headers: { 'Metadata-Flavor': 'Google' },
          url: process.env.NETLIFY_OIDC_TOKEN_URL || 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        },
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const params = {
      calendarId: 'coachwill@newerahockeytraining.com',
      maxResults: 100,
      singleEvents: true,
    };

    // Use sync token if provided (incremental sync)
    // Otherwise use timeMin for initial fetch
    if (syncToken) {
      params.syncToken = syncToken;
    } else {
      params.timeMin = new Date().toISOString();
      params.orderBy = 'startTime';
    }

    const response = await calendar.events.list(params);
    let events = response.data.items || [];

    // Filter by type if specified
    if (eventType) {
      events = filterEventsByType(events, eventType);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        events,
        nextSyncToken: response.data.nextSyncToken, // For next incremental sync
        total: events.length,
        type: eventType || 'all',
      }),
    };
  } catch (error) {
    console.error('Calendar API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to fetch calendar events',
        message: error.message,
      }),
    };
  }
};
```

---

### 4.2 Frontend Polling Service (20 min)

**Update**: `src/services/calendarService.js`

```javascript
let syncToken = null;

/**
 * Fetch events with sync token support
 */
export const fetchEvents = async (eventType = null) => {
  const url = new URL('/.netlify/functions/calendar-events', window.location.origin);
  if (eventType) url.searchParams.set('type', eventType);
  if (syncToken) url.searchParams.set('syncToken', syncToken);

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch events');
  }

  const data = await response.json();
  syncToken = data.nextSyncToken; // Store for next sync

  return data;
};

/**
 * Sync events (incremental update)
 */
export const syncEvents = async (eventType = null) => {
  return fetchEvents(eventType);
};

/**
 * Start polling for event updates
 * @param {Function} callback - Called with new events when updated
 * @param {string|null} eventType - Event type to filter
 * @param {number} interval - Polling interval in milliseconds (default 5 minutes)
 * @returns {Function} - Stop polling function
 */
export const startPolling = (callback, eventType = null, interval = 300000) => {
  const pollId = setInterval(async () => {
    try {
      const data = await syncEvents(eventType);
      callback(data.events);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, interval);

  return () => clearInterval(pollId);
};

/**
 * Convenience methods
 */
export const fetchCamps = () => fetchEvents('camp');
export const fetchLessons = () => fetchEvents('lesson');
export const fetchAllEvents = () => fetchEvents();
```

---

### 4.3 Integrate Polling in Component (15 min)

**Update**: `src/pages/EventsSchedule.jsx`

Add polling functionality:

```javascript
import { startPolling } from '@services/calendarService';

const EventsSchedule = () => {
  const [viewType, setViewType] = useState('camps');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load + polling
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = viewType === 'camps'
          ? await fetchCamps()
          : await fetchLessons();

        setEvents(transformEventsForCalendar(data.events));
      } catch (error) {
        console.error('Failed to load events:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();

    // Start polling for updates (every 5 minutes)
    const stopPolling = startPolling(
      (newEvents) => {
        console.log('🔄 Events updated via polling');
        setEvents(transformEventsForCalendar(newEvents));
      },
      viewType === 'camps' ? 'camp' : 'lesson',
      300000 // 5 minutes
    );

    return () => stopPolling(); // Cleanup on unmount
  }, [viewType]);

  // ... rest of component remains the same
};
```

---

### 4.4 Add Polling Indicator (Optional - 10 min)

**Add to EventsSchedule.jsx** for user feedback:

```javascript
import { format } from 'date-fns';

const [lastUpdated, setLastUpdated] = useState(new Date());

// In polling callback
const stopPolling = startPolling(
  (newEvents) => {
    setEvents(transformEventsForCalendar(newEvents));
    setLastUpdated(new Date());
  },
  viewType === 'camps' ? 'camp' : 'lesson',
  300000
);

// In JSX (before event list)
<div className="text-center mb-4 text-sm text-neutral-text">
  Last updated: {format(lastUpdated, 'h:mm a')} • Auto-refresh every 5 minutes
</div>
```

---

## Phase 5: Testing & Deployment (1 week)

### 5.1 Testing Checklist

#### Functional Tests
- [ ] Service account authentication works via Workload Identity
- [ ] Events fetch correctly from Coach Will's calendar
- [ ] Event categorization works (all 3 methods: extended properties, color, keyword)
- [ ] Toggle switches between camps and lessons
- [ ] List view displays all event details correctly
- [ ] Calendar view renders events with correct dates/times
- [ ] All-day events display correctly
- [ ] Multi-day events span correctly on calendar
- [ ] Polling updates events automatically (wait 5 minutes)
- [ ] Error handling for API failures shows user-friendly messages

#### Edge Cases
- [ ] No events scheduled (empty state displays)
- [ ] Events with no location (location field hidden)
- [ ] Events with no description (description field hidden)
- [ ] All-day events vs timed events (correct time display)
- [ ] Events spanning multiple days (calendar rendering)
- [ ] Past events don't show (timeMin filter working)
- [ ] Recurring events expand correctly (singleEvents: true)
- [ ] Events with special characters in title/description

#### Performance Tests
- [ ] Initial load completes in < 2 seconds
- [ ] Calendar renders smoothly (no lag on month change)
- [ ] Polling doesn't cause UI lag or freezing
- [ ] Memory leaks checked (cleanup on unmount)
- [ ] Bundle size impact acceptable (check build output)

#### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### Responsive Design
- [ ] Mobile view (320px - 640px)
- [ ] Tablet view (641px - 1024px)
- [ ] Desktop view (1025px+)
- [ ] Toggle buttons work on touch devices
- [ ] Calendar gestures work on mobile

---

### 5.2 Documentation for Coach Will

**Create**: `docs/calendar-event-setup-guide.md`

```markdown
# How to Create Categorized Events for New Era Hockey Website

Coach Will, this guide shows you how to create events that will automatically appear on the website's Training Schedule page.

## Method 1: Color-Coding (Easiest - Recommended)

This is the simplest method and requires no technical knowledge.

### Steps:
1. Open Google Calendar: https://calendar.google.com
2. Make sure you're viewing `coachwill@newerahockeytraining.com` calendar
3. Create a new event (click on a date or click "+ Create")
4. Fill in event details:
   - **Title**: e.g., "Summer Hockey Camp 2025" or "Private Lesson - John Doe"
   - **Date/Time**: Set the date and time
   - **Location**: Ice rink address (optional but recommended)
   - **Description**: Add details about the event (optional)
5. **IMPORTANT - Set the color**:
   - Click the event color dropdown
   - **For Camps**: Select **Red** (Tomato)
   - **For Lessons**: Select **Blue** (Blueberry)
6. Save the event

The event will automatically appear on the website within 5 minutes!

## Method 2: Keyword in Title (Automatic Fallback)

If you forget to set the color, the system will automatically detect event type based on keywords in the title.

- If title contains "camp" → Categorized as Camp
- If title contains "lesson" or "training" → Categorized as Lesson

### Examples:
- "Youth Hockey Camp" → Automatically detected as Camp
- "Private Skating Lesson" → Automatically detected as Lesson

## Method 3: Extended Properties (Advanced - For Developers)

This method requires using Google Apps Script or API calls. Only use this if you're comfortable with coding.

Contact the web developer for assistance with this method.

## Tips

1. **Use descriptive titles**: "Summer Hockey Camp 2025" is better than "Camp"
2. **Add location**: Helps participants know where to go
3. **Include description**: Add important details, requirements, or what to bring
4. **Set correct times**: Make sure AM/PM is correct
5. **Check calendar regularly**: Events appear on website within 5 minutes

## Troubleshooting

**Event doesn't appear on website:**
- Wait 5 minutes (automatic refresh)
- Check that you're adding events to the correct calendar (coachwill@newerahockeytraining.com)
- Verify event date is in the future (past events don't show)
- Make sure color is set to Red (camps) or Blue (lessons)

**Event appears in wrong category:**
- Edit the event
- Change the color to the correct one (Red = Camps, Blue = Lessons)
- Save changes
- Wait 5 minutes for update

## Need Help?

Contact the web developer or IT support.
```

---

### 5.3 Environment Setup

**Production Netlify Environment Variables**:
1. Navigate to: Site settings → Environment variables
2. Verify these 3 variables are set:
   - `GOOGLE_PROJECT_ID`
   - `WORKLOAD_IDENTITY_PROVIDER`
   - `SERVICE_ACCOUNT_EMAIL`
3. Test with deploy preview first

**Deploy Preview Test**:
```bash
git checkout -b test-calendar-integration
git push origin test-calendar-integration
```

Netlify will create deploy preview → Test functionality → Merge to main

---

### 5.4 Deployment Steps

1. **Final Code Review**:
   - Check all console.logs removed (except error logging)
   - Verify error handling comprehensive
   - Confirm environment variables set correctly
   - No JSON keys anywhere in code

2. **Build Test**:
```bash
npm run build
```

Check bundle size:
```
File sizes after gzip:
  490.05 kB  build/static/js/main.[hash].js
  [new calendar libs should add ~50-100KB]
```

3. **Deploy to Production**:
```bash
git add .
git commit -m "Add Google Calendar integration with Workload Identity Federation"
git push origin main
```

4. **Post-Deployment Verification**:
   - Visit production URL
   - Navigate to /schedule
   - Verify events load
   - Test toggle between camps and lessons
   - Check calendar rendering
   - Monitor Netlify Function logs for errors

5. **Monitor**:
   - Check Netlify Function logs: Site → Functions → calendar-events
   - Look for errors or performance issues
   - Verify polling working (check Network tab after 5 minutes)

---

### 5.5 Performance Monitoring

**Metrics to Track**:
- API response time (target: < 500ms)
- Page load time (target: < 2s)
- Bundle size impact (acceptable: < 100KB increase)
- Function invocations per day
- Error rate (target: < 1%)

**Tools**:
- Netlify Analytics
- Chrome DevTools → Performance
- Chrome DevTools → Network (check polling requests)

---

## Phase 6: Future Enhancements (Optional)

### Webhook Push Notifications

**Benefits Over Polling**:
- Real-time updates (no 5-minute delay)
- Reduced API calls (more efficient, lower costs)
- Better user experience (instant event updates)
- Lower server load

**Complexity Assessment**:
- **Effort**: 2-3 weeks additional development
- **Technical Complexity**: High
- **Maintenance**: Requires channel renewal logic
- **Recommendation**: Implement only if real-time updates are critical

---

## Implementation Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: Setup & Auth | 1-2 weeks | Workload Identity, service account, backend function |
| Phase 2: Event Fetching | 1-2 weeks | Categorization system, filtered API |
| Phase 3: UI Components | 2-3 weeks | Events page, list view, calendar view |
| Phase 4: Polling | 1 week | Auto-refresh every 5 minutes |
| Phase 5: Testing | 1 week | Comprehensive testing, deployment |
| **Total** | **6-8 weeks** | Fully functional calendar integration |
| Phase 6: Webhooks (Optional) | 2-3 weeks | Real-time push notifications |

---

## Technical Stack Summary

### Backend
- **Google Calendar API**: v3
- **googleapis**: ^128.0.0 (npm package)
- **google-auth-library**: ^9.0.0 (npm package)
- **Netlify Functions**: Serverless backend
- **Workload Identity Federation**: Authentication method (no keys)

### Frontend
- **React**: 18.x
- **react-big-calendar**: ^1.8.x (calendar UI)
- **date-fns**: ^2.x (date manipulation)
- **Framer Motion**: Animations (existing)

### Sync Strategy
- **Initial**: Polling with sync tokens (5-minute interval)
- **Future**: Webhook push notifications (real-time)

---

## Key Recommendations

### Page Naming
**Recommended**: "Training Schedule"

**Rationale**: Aligns with existing navigation ("Training Programs") and clearly communicates purpose.

### Event Categorization Priority
1. **Extended Properties** (most reliable, future-proof)
2. **Color Coding** (easiest for Coach Will) ⭐ Recommended
3. **Keyword Detection** (automatic fallback)

### Polling Interval
**Recommended**: 5 minutes

**Rationale**:
- Balance between freshness and API quota
- Most events scheduled hours/days in advance (5-min delay acceptable)
- Google Calendar API quota: 1,000,000 requests/day (5-min polling well within limits)

---

## Security Benefits

### Workload Identity Federation Advantages

| Feature | Benefit |
|---------|---------|
| **No JSON Keys** | No credentials to steal or leak |
| **Short-Lived Tokens** | Auto-expire in ~1 hour |
| **Automatic Rotation** | No manual key rotation needed |
| **Policy Compliance** | Fully complies with `iam.disableServiceAccountKeyCreation` |
| **Audit Trail** | All access logged automatically |
| **Least Privilege** | Only calendar read access granted |

---

## Success Criteria

✅ Events automatically appear on website within 5 minutes of creation
✅ Coach Will can easily categorize events (color-coding)
✅ Users can toggle between Camps and Lessons
✅ Both list and calendar views work smoothly
✅ Mobile-responsive design
✅ No manual website updates needed
✅ Error handling prevents website crashes
✅ Performance impact < 100KB bundle increase
✅ **No JSON keys stored anywhere**
✅ **Maximum security compliance**

---

## Troubleshooting Guide

### Error: "Permission denied accessing calendar"
**Solution**: Verify service account has domain-wide delegation configured and calendar is shared

### Error: "Invalid workload identity pool"
**Solution**: Double-check `WORKLOAD_IDENTITY_PROVIDER` environment variable matches exact provider resource name

### Error: "Token exchange failed"
**Solution**: Verify OIDC provider configuration and Netlify OIDC token URL

### Events not returning
**Solution**:
1. Check domain-wide delegation scope is `https://www.googleapis.com/auth/calendar.readonly`
2. Verify calendar is shared with service account email
3. Check Netlify Function logs for detailed error messages

### Polling not working
**Solution**:
1. Check Network tab for 5-minute polling requests
2. Verify sync token is being stored and reused
3. Check console for polling errors

---

## Next Steps

1. **Phase 1 Start**: Begin with Step 1.1 (Google Cloud Console Setup)
2. **Follow Sequentially**: Complete each phase in order
3. **Test Frequently**: Verify each step before moving to next
4. **Document Issues**: Note any problems for troubleshooting
5. **Celebrate Success**: 6-8 weeks to fully functional, secure calendar integration!

---

**Document Version**: 2.0
**Last Updated**: 2025-01-16
**Author**: Claude (AI Assistant)
**Security**: Maximum (Workload Identity Federation)
**Status**: Ready for Implementation
