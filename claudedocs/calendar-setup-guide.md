# Google Calendar Setup Guide for Registration System

## Problem
Register buttons not appearing because calendar events lack required metadata.

## Required Extended Properties

For each event that should have registration enabled, add these **Extended Properties** (Shared):

### Minimum Required
```json
{
  "registrationEnabled": "true",
  "price": "350",
  "eventType": "camp"  // or "lesson"
}
```

### Full Registration Setup (Recommended)
```json
{
  "registrationEnabled": "true",
  "price": "350",
  "eventType": "camp",
  "maxCapacity": "20",
  "currentRegistrations": "0"
}
```

## How to Add Extended Properties

### Method 1: Google Calendar API (Recommended for Bulk)

Use the Google Calendar API to update events programmatically:

```javascript
// Update event with registration metadata
const event = {
  extendedProperties: {
    shared: {
      registrationEnabled: 'true',
      price: '350',
      eventType: 'camp',
      maxCapacity: '20',
      currentRegistrations: '0'
    }
  }
};

await calendar.events.patch({
  calendarId: 'coachwill@newerahockeytraining.com',
  eventId: 'EVENT_ID',
  resource: event
});
```

### Method 2: Google Apps Script

1. Open Google Calendar
2. Go to Extensions → Apps Script
3. Create new script:

```javascript
function enableRegistrationForEvent() {
  const calendarId = 'coachwill@newerahockeytraining.com';
  const eventId = 'YOUR_EVENT_ID'; // Get from event URL

  const event = Calendar.Events.get(calendarId, eventId);

  event.extendedProperties = {
    shared: {
      registrationEnabled: 'true',
      price: '350',
      eventType: 'camp',
      maxCapacity: '20',
      currentRegistrations: '0'
    }
  };

  Calendar.Events.update(event, calendarId, eventId);
  Logger.log('Updated event: ' + event.summary);
}
```

### Method 3: Alternative - Price in Description

If you can't set extended properties immediately, add price to event description:

```
Event Description:
Join us for an awesome hockey camp!

Price: $350

Location: Arena XYZ
```

The system will parse `Price: $350` from the description, but you'll still need `registrationEnabled: 'true'` in extended properties.

## Verification

After setting properties, verify in your app:

1. Open browser console on localhost:8888/schedule
2. Check event data:
```javascript
// In console
fetch('/.netlify/functions/calendar-events?type=camp')
  .then(r => r.json())
  .then(data => console.log(data.events[0]))
```

3. Check for `registrationData` object:
```json
{
  "summary": "Summer Hockey Camp",
  "registrationData": {
    "registrationEnabled": true,
    "price": 350,
    "maxCapacity": 20,
    "currentRegistrations": 0,
    "isSoldOut": false,
    "hasCapacityInfo": true
  }
}
```

## Quick Test Event

Create a test event with these settings:

- **Summary**: Test Registration Camp
- **Date**: Tomorrow
- **Extended Properties (Shared)**:
  - `registrationEnabled`: `true`
  - `price`: `50`
  - `eventType`: `camp`
  - `maxCapacity`: `5`
  - `currentRegistrations`: `0`

This should show a Register button immediately.

## Bulk Update Script

To enable registration for all future camps:

```javascript
function enableAllCamps() {
  const calendarId = 'coachwill@newerahockeytraining.com';
  const now = new Date().toISOString();

  const events = Calendar.Events.list(calendarId, {
    timeMin: now,
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime'
  });

  events.items.forEach(event => {
    // Only update camps (check by color, title, etc.)
    if (event.colorId === '11' || event.summary.toLowerCase().includes('camp')) {
      event.extendedProperties = {
        shared: {
          registrationEnabled: 'true',
          price: '350',  // Adjust per event
          eventType: 'camp',
          maxCapacity: '20',  // Adjust per event
          currentRegistrations: '0'
        }
      };

      Calendar.Events.update(event, calendarId, event.id);
      Logger.log('Updated: ' + event.summary);
    }
  });
}
```

## Troubleshooting

### Register button still not showing?

Check each condition:
```javascript
// In browser console on /schedule page
const event = events[0]; // First event

console.log('Is upcoming?', new Date(event.start.dateTime) > new Date());
console.log('Registration enabled?', event.registrationData?.registrationEnabled);
console.log('Has price?', event.registrationData?.price);
console.log('Not sold out?', !event.registrationData?.isSoldOut);
console.log('Can register?', event.registrationData?.registrationEnabled &&
                              event.registrationData?.price &&
                              !event.registrationData?.isSoldOut);
```

### Common Issues

1. **Extended properties not syncing**: Clear browser cache, wait 5 minutes for calendar sync
2. **Price not detected**: Ensure price is number string ('350' not '$350')
3. **registrationEnabled not working**: Must be string `'true'` not boolean
4. **Button shows "View Details"**: Missing registrationEnabled or price
