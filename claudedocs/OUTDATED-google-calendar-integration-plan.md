# Google Calendar Integration - Implementation Plan

**Date**: 2025-01-16
**Objective**: Integrate Google Workspace calendar (coachwill@newerahockeytraining.com) with New Era Hockey React app

## Architecture Decisions

### Authentication: Service Account ✅
**Why**: Automated server-side access without user interaction required

**Implementation**:
- Service Account with domain-wide delegation
- Google Workspace admin grants access to Coach Will's calendar
- Backend securely stores service account credentials (Netlify environment variables)
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
1. Extended Properties (preferred)
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
**Phase 1**: Incremental polling (every 5-10 minutes) with sync tokens
**Phase 2** (Future): Webhook push notifications for real-time updates

---

## Phased Implementation Plan

## Phase 1: Google Calendar API Setup & Authentication (1-2 weeks)

### 1.1 Google Cloud Console Setup

**Steps**:
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "NewEraHockey-Calendar"
3. Enable Google Calendar API:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click "Enable"

### 1.2 Create Service Account & Handle Organization Policy

**🔓 Step 0: Temporarily Disable Key Creation Policy (Admin Only)**

Since your organization has the `iam.disableServiceAccountKeyCreation` policy enforced, you'll need to temporarily disable it:

**Option A: Disable Policy at Organization Level** (Recommended for development)
```bash
# Get your organization ID
gcloud organizations list

# Disable the policy
gcloud resource-manager org-policies delete \
  iam.disableServiceAccountKeyCreation \
  --organization=YOUR_ORG_ID
```

**Option B: Create Project-Specific Exception**
```bash
# Create policy file
cat > allow-keys-policy.yaml <<EOF
constraint: constraints/iam.disableServiceAccountKeyCreation
listPolicy:
  allowedValues:
    - "projects/newerahockey-calendar"  # Your project ID
EOF

# Apply exception
gcloud resource-manager org-policies set-policy allow-keys-policy.yaml \
  --organization=YOUR_ORG_ID
```

⚠️ **Security Note**: After creating the JSON key in Step 4, you can **re-enable** the policy. The existing key will continue to work. Plan to migrate to Workload Identity Federation in Phase 1.8 (see below).

---

**Steps**:
1. APIs & Services → Credentials → Create Credentials → Service Account
2. Service account details:
   - Name: `newerahockey-calendar-service`
   - Description: "Service account for calendar integration"
3. Grant permissions (skip - not needed for service accounts)
4. **Create key** (after disabling policy above):
   - Click on the service account you just created (from Service Accounts list)
   - Click **"KEYS" tab** at the top of the page
   - Click **"ADD KEY"** button → "Create new key" → JSON → Create
   - Download JSON key file (KEEP SECURE - never commit to Git)
5. **Re-enable policy** (optional - after key downloaded):
   ```bash
   # Re-enable security policy
   gcloud resource-manager org-policies restore \
     iam.disableServiceAccountKeyCreation \
     --organization=YOUR_ORG_ID
   ```

### 1.3 Domain-Wide Delegation

**Steps**:
1. Copy service account's "Unique ID" (Client ID)
2. Google Workspace Admin Console → Security → API Controls → Domain-wide Delegation
3. Add new:
   - Client ID: [paste from step 1]
   - OAuth Scopes: `https://www.googleapis.com/auth/calendar.readonly`
   - Authorize
4. Share Coach Will's calendar with service account email:
   - Google Calendar → Settings → coachwill@newerahockeytraining.com calendar settings
   - Share with specific people → Add service account email (e.g., `newerahockey-calendar-service@project-id.iam.gserviceaccount.com`)
   - Permissions: "See all event details"

### 1.4 Backend API Setup (Netlify Function)

**Create**: `netlify/functions/calendar-events.js`

```javascript
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  try {
    // Parse service account credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth });

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
      body: JSON.stringify({
        error: 'Failed to fetch calendar events',
        message: error.message,
      }),
    };
  }
};
```

### 1.5 Environment Variables

**Netlify Dashboard**:
1. Site settings → Environment variables → Add variable
2. Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
3. Value: Paste entire contents of JSON key file
4. Scope: Production + Deploy previews

**Local Development** (`.env`):
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"..."}'
```

**IMPORTANT**: Add `.env` to `.gitignore`

### 1.6 Install Dependencies

```bash
npm install googleapis
```

### 1.7 Test Authentication

**Create test script**: `scripts/test-calendar-auth.js`

```javascript
const { google } = require('googleapis');
require('dotenv').config();

async function testAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId: 'coachwill@newerahockeytraining.com',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  console.log('✅ Authentication successful!');
  console.log(`📅 Found ${response.data.items.length} upcoming events`);
  console.log('\nFirst event:', response.data.items[0]?.summary);
}

testAuth().catch(console.error);
```

**Run test**:
```bash
node scripts/test-calendar-auth.js
```

**Expected Output**:
```
✅ Authentication successful!
📅 Found 5 upcoming events

First event: Youth Hockey Camp - Summer 2025
```

### 1.8 Future: Migrate to Workload Identity Federation (Optional - Production Security)

**⚠️ This is an optional future enhancement for maximum security. Complete Phases 1-5 first.**

Once your calendar integration is working with JSON keys, you can migrate to Workload Identity Federation to eliminate key management entirely.

**Why Migrate?**
- ✅ No JSON keys to manage, rotate, or secure
- ✅ Short-lived access tokens (automatic expiration)
- ✅ Meets strictest security requirements
- ✅ Complies with `iam.disableServiceAccountKeyCreation` policy

**When to Migrate?**
- After Phase 5 deployment is successful
- When you want to re-enable the organization security policy permanently
- During security audit or compliance review

**Implementation Guide**:

**Step 1: Create Workload Identity Pool**
```bash
PROJECT_ID="newerahockey-calendar"  # Your Google Cloud project ID
POOL_ID="netlify-pool"
PROVIDER_ID="netlify-provider"

# Create pool
gcloud iam workload-identity-pools create $POOL_ID \
  --location="global" \
  --description="Netlify Functions authentication" \
  --project=$PROJECT_ID

# Create OIDC provider (Netlify)
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_ID \
  --location="global" \
  --workload-identity-pool=$POOL_ID \
  --issuer-uri="https://netlify.com" \
  --attribute-mapping="google.subject=assertion.sub" \
  --project=$PROJECT_ID
```

**Step 2: Grant Workload Identity Permissions**
```bash
SERVICE_ACCOUNT="newerahockey-calendar-service@${PROJECT_ID}.iam.gserviceaccount.com"

# Get project number (needed for binding)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Bind workload identity to service account
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/*" \
  --project=$PROJECT_ID
```

**Step 3: Update Netlify Function**
```javascript
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  try {
    // NO JSON KEY NEEDED - Uses Netlify's OIDC token
    const auth = new GoogleAuth({
      projectId: process.env.GOOGLE_PROJECT_ID,
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
      body: JSON.stringify({
        error: 'Failed to fetch calendar events',
        message: error.message,
      }),
    };
  }
};
```

**Step 4: Update Environment Variables**

In Netlify Dashboard:
- **Remove**: `GOOGLE_SERVICE_ACCOUNT_KEY` (no longer needed)
- **Add**: `GOOGLE_PROJECT_ID` = `newerahockey-calendar`

**Step 5: Test & Deploy**

```bash
# Test in deploy preview first
git checkout -b workload-identity-migration
git push origin workload-identity-migration

# After successful testing, merge to main
git checkout main
git merge workload-identity-migration
git push origin main
```

**Step 6: Re-enable Organization Policy**

Once Workload Identity is working:
```bash
# Re-enable security policy permanently
gcloud resource-manager org-policies restore \
  iam.disableServiceAccountKeyCreation \
  --organization=YOUR_ORG_ID
```

**Benefits After Migration**:
- ✅ No JSON keys stored in Netlify environment variables
- ✅ Automatic credential rotation
- ✅ Full compliance with organization security policy
- ✅ Reduced security attack surface

**Timeline**: 2-4 hours (after Phase 5 complete)

---

## Phase 2: Event Fetching & Categorization (1-2 weeks)

### 2.1 Event Type Detection System

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

### 2.2 Enhanced Backend Function

**Update**: `netlify/functions/calendar-events.js`

```javascript
const { google } = require('googleapis');
const { categorizeEvent, filterEventsByType } = require('../../src/utils/eventCategorization');

exports.handler = async (event, context) => {
  try {
    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const eventType = queryParams.type; // 'camp' or 'lesson'

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

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

### 2.3 Frontend Data Service

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

### 2.4 Test Categorization

**Create test events in Coach Will's calendar**:

1. **Test Camp Event**:
   - Title: "Summer Hockey Camp 2025"
   - Color: Red (#11)
   - Extended Property: `eventType: 'camp'`

2. **Test Lesson Event**:
   - Title: "Private Skating Lesson - John Doe"
   - Color: Blue (#9)
   - Extended Property: `eventType: 'lesson'`

3. **Test Uncategorized Event**:
   - Title: "Team Meeting"
   - No color or extended property

**Validation**:
```bash
# Test backend directly
curl "http://localhost:8888/.netlify/functions/calendar-events?type=camp"

# Expected: Only camp events returned
```

---

## Phase 3: UI Components - List & Calendar Views (2-3 weeks)

### 3.1 Install Dependencies

```bash
npm install react-big-calendar date-fns
```

### 3.2 Create Events Schedule Page

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

### 3.3 Create Event List Component

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

### 3.4 Style Calendar Component

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

### 3.5 Add Route

**Update**: `src/App.jsx`

```javascript
import EventsSchedule from './pages/EventsSchedule';

// Inside Routes component
<Route path="/schedule" element={<EventsSchedule />} />
```

### 3.6 Add Navigation Link

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

### 4.1 Implement Incremental Sync

**Update**: `netlify/functions/calendar-events.js`

Add sync token support for efficient polling:

```javascript
const { google } = require('googleapis');
const { categorizeEvent, filterEventsByType } = require('../../src/utils/eventCategorization');

exports.handler = async (event, context) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const eventType = queryParams.type;
    const syncToken = queryParams.syncToken; // For incremental sync

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

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

### 4.2 Frontend Polling Service

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

### 4.3 Integrate Polling in Component

**Update**: `src/pages/EventsSchedule.jsx`

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

  // ... rest of component
};
```

### 4.4 Add Polling Indicator (Optional)

**Add to EventsSchedule.jsx** for user feedback:

```javascript
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
- [ ] Service account authentication works
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

### 5.3 Environment Setup

**Production Netlify Environment Variables**:
1. Navigate to: Site settings → Environment variables
2. Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is set
3. Test with deploy preview first

**Deploy Preview Test**:
```bash
git checkout -b test-calendar-integration
git push origin test-calendar-integration
```

Netlify will create deploy preview → Test functionality → Merge to main

### 5.4 Deployment Steps

1. **Final Code Review**:
   - Check all console.logs removed
   - Verify error handling comprehensive
   - Test with production environment variables

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
git commit -m "Add Google Calendar integration with event scheduling"
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

## Phase 6 (Future Enhancement): Webhook Push Notifications

### Benefits Over Polling
- Real-time updates (no 5-minute delay)
- Reduced API calls (more efficient, lower costs)
- Better user experience (instant event updates)
- Lower server load

### Implementation Overview

#### 6.1 Create Webhook Endpoint

**Create**: `netlify/functions/calendar-webhook.js`

```javascript
exports.handler = async (event, context) => {
  // Google sends webhook notifications here
  // Notification contains minimal data - must fetch event details separately

  const headers = event.headers;
  const resourceState = headers['x-goog-resource-state'];
  const channelId = headers['x-goog-channel-id'];

  if (resourceState === 'sync') {
    // Initial sync notification when channel starts
    return { statusCode: 200, body: 'Sync acknowledged' };
  }

  if (resourceState === 'exists') {
    // Calendar was updated - fetch new events
    // Trigger event update for all connected clients
    // (Requires WebSocket or Server-Sent Events setup)
  }

  return { statusCode: 200, body: 'Webhook received' };
};
```

#### 6.2 Register Webhook Channel

Requires:
- HTTPS endpoint (verified ownership)
- Channel expiration management (auto-renew before expiration)
- WebSocket or SSE for client updates

#### 6.3 Client Updates

Use WebSocket or Server-Sent Events to push updates to connected clients in real-time.

### Complexity Assessment
- **Effort**: 2-3 weeks additional development
- **Technical Complexity**: High
- **Maintenance**: Requires channel renewal logic
- **Recommendation**: Implement only if real-time updates are critical

---

## Implementation Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: Setup & Auth | 1-2 weeks | Service account, API access, backend function |
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
- **Netlify Functions**: Serverless backend
- **Service Account**: Authentication method

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

**Alternatives**:
- "Events Schedule"
- "Upcoming Events"
- "Training Calendar"

**Rationale**: "Training Schedule" aligns with existing navigation ("Training Programs") and clearly communicates purpose.

### UX Design
- **Toggle**: Large, obvious buttons for Camps/Lessons
- **Visual Hierarchy**: List view first (easier to scan), calendar below
- **Empty States**: Clear messaging when no events scheduled
- **Loading States**: Spinner with text feedback
- **Error Handling**: User-friendly messages with retry option

### Event Categorization Priority
1. **Extended Properties** (most reliable, future-proof)
2. **Color Coding** (easiest for Coach Will)
3. **Keyword Detection** (automatic fallback)

### Polling Interval
**Recommended**: 5 minutes

**Rationale**:
- Balance between freshness and API quota
- Most events scheduled hours/days in advance (5-min delay acceptable)
- Google Calendar API quota: 1,000,000 requests/day (5-min polling well within limits)

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

---

## Next Steps

1. **Phase 1 Start**: Set up Google Cloud project and service account
2. **Get Approval**: Review plan with stakeholders
3. **Timeline Commitment**: Allocate 6-8 weeks for full implementation
4. **Developer Assignment**: Assign developer(s) to project
5. **Kickoff Meeting**: Review technical details and requirements

---

**Document Version**: 1.0
**Last Updated**: 2025-01-16
**Author**: Claude (AI Assistant)
**Status**: Ready for Implementation
