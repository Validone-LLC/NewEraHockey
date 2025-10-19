# Google Sheets to Calendar Automation Guide

## Overview

Automatically create Google Calendar events from Google Sheets data with field validation and duplicate prevention.

**Research Date**: 2025-10-18
**Approach**: Google Apps Script (native, free, maintainable)

## Implementation Summary

### Required Fields
- ✅ **Event Title** (required)
- ✅ **Start Date** (required)
- ✅ **Start Time** (required for timed events, optional for all-day)
- ✅ **End Date** (required)
- ✅ **End Time** (required for timed events, optional for all-day)
- Optional: Description, Location, Attendees

### Validation Requirements
1. Required fields must exist and not be empty
2. Dates must be valid format
3. Start date/time must be before end date/time
4. Status tracking to prevent duplicates

## Sheet Setup

### Column Structure
```
| A: Event Title | B: Start Date | C: Start Time | D: End Date | E: End Time | F: Description | G: Location | H: Status |
```

### Data Validation Setup
1. Select column B (Start Date) → Data → Data validation → Date → Is valid date
2. Select column D (End Date) → Data → Data validation → Date → Is valid date
3. Select column C/E (Times) → Data → Data validation → Text → Custom formula: `=TIMEVALUE(C2)` works

## Apps Script Implementation

### Step 1: Open Script Editor
1. In your Google Sheet: Extensions → Apps Script
2. Delete default code
3. Paste the code below

### Step 2: Complete Working Code

```javascript
/**
 * Google Sheets to Calendar Automation
 * Validates sheet data and creates calendar events
 */

// Configuration
const CONFIG = {
  SHEET_NAME: 'Sheet1', // Change to your sheet name
  HEADER_ROW: 1,
  FIRST_DATA_ROW: 2,
  CALENDAR_ID: 'primary', // Use 'primary' for default calendar

  // Column indices (0-based)
  COLS: {
    TITLE: 0,
    START_DATE: 1,
    START_TIME: 2,
    END_DATE: 3,
    END_TIME: 4,
    DESCRIPTION: 5,
    LOCATION: 6,
    STATUS: 7
  }
};

/**
 * Adds custom menu on sheet open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 Calendar Sync')
    .addItem('Create Calendar Events', 'processSheet')
    .addItem('Clear Status Column', 'clearStatus')
    .addToUi();
}

/**
 * Main function - processes all rows and creates events
 */
function processSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Sheet not found: ' + CONFIG.SHEET_NAME);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    SpreadsheetApp.getUi().alert('No data rows found');
    return;
  }

  // Get all data at once (efficient)
  const dataRange = sheet.getRange(CONFIG.FIRST_DATA_ROW, 1, lastRow - CONFIG.FIRST_DATA_ROW + 1, 8);
  const data = dataRange.getValues();

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);

  // Process each row
  data.forEach((row, index) => {
    const rowNumber = CONFIG.FIRST_DATA_ROW + index;
    const statusCell = sheet.getRange(rowNumber, CONFIG.COLS.STATUS + 1);

    // Skip if already processed
    if (row[CONFIG.COLS.STATUS] && row[CONFIG.COLS.STATUS].toString().includes('✅')) {
      skipCount++;
      return;
    }

    // Validate row
    const validation = validateRow(row, rowNumber);
    if (!validation.valid) {
      statusCell.setValue('❌ ' + validation.error);
      errorCount++;
      return;
    }

    // Create event
    try {
      const event = createCalendarEvent(row, calendar);
      statusCell.setValue('✅ Created: ' + event.getId());
      successCount++;
    } catch (error) {
      statusCell.setValue('❌ Error: ' + error.message);
      errorCount++;
    }
  });

  // Show summary
  const message = `
    ✅ Created: ${successCount}
    ⏭️ Skipped: ${skipCount}
    ❌ Errors: ${errorCount}
  `;
  SpreadsheetApp.getUi().alert('Calendar Sync Complete', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Validates a single row of data
 * @param {Array} row - Row data array
 * @param {number} rowNumber - Row number for error messages
 * @returns {Object} {valid: boolean, error: string}
 */
function validateRow(row, rowNumber) {
  const title = row[CONFIG.COLS.TITLE];
  const startDate = row[CONFIG.COLS.START_DATE];
  const endDate = row[CONFIG.COLS.END_DATE];
  const startTime = row[CONFIG.COLS.START_TIME];
  const endTime = row[CONFIG.COLS.END_TIME];

  // Check required fields
  if (!title || title.toString().trim() === '') {
    return { valid: false, error: 'Missing event title' };
  }

  if (!startDate || !(startDate instanceof Date)) {
    return { valid: false, error: 'Invalid start date' };
  }

  if (!endDate || !(endDate instanceof Date)) {
    return { valid: false, error: 'Invalid end date' };
  }

  // Combine date and time
  const startDateTime = combineDateTime(startDate, startTime);
  const endDateTime = combineDateTime(endDate, endTime);

  // Validate start < end
  if (startDateTime >= endDateTime) {
    return { valid: false, error: 'Start time must be before end time' };
  }

  return { valid: true, error: null };
}

/**
 * Combines date and time into a single Date object
 * @param {Date} date - Date object
 * @param {Date|string} time - Time value (can be Date or empty)
 * @returns {Date} Combined datetime
 */
function combineDateTime(date, time) {
  if (!time || time.toString().trim() === '') {
    // All-day event - return date at midnight
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Extract time components
  let hours, minutes;
  if (time instanceof Date) {
    hours = time.getHours();
    minutes = time.getMinutes();
  } else {
    // Parse time string (e.g., "14:30")
    const timeParts = time.toString().split(':');
    hours = parseInt(timeParts[0]);
    minutes = parseInt(timeParts[1] || 0);
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes
  );
}

/**
 * Creates a calendar event from row data
 * @param {Array} row - Row data
 * @param {Calendar} calendar - Calendar object
 * @returns {CalendarEvent} Created event
 */
function createCalendarEvent(row, calendar) {
  const title = row[CONFIG.COLS.TITLE].toString().trim();
  const startDate = row[CONFIG.COLS.START_DATE];
  const endDate = row[CONFIG.COLS.END_DATE];
  const startTime = row[CONFIG.COLS.START_TIME];
  const endTime = row[CONFIG.COLS.END_TIME];
  const description = row[CONFIG.COLS.DESCRIPTION] ? row[CONFIG.COLS.DESCRIPTION].toString() : '';
  const location = row[CONFIG.COLS.LOCATION] ? row[CONFIG.COLS.LOCATION].toString() : '';

  const startDateTime = combineDateTime(startDate, startTime);
  const endDateTime = combineDateTime(endDate, endTime);

  // Determine if all-day event
  const isAllDay = (!startTime || startTime.toString().trim() === '') &&
                   (!endTime || endTime.toString().trim() === '');

  let event;

  if (isAllDay) {
    // Create all-day event
    if (startDate.getTime() === endDate.getTime()) {
      event = calendar.createAllDayEvent(title, startDate, {
        description: description,
        location: location
      });
    } else {
      event = calendar.createAllDayEvent(title, startDate, endDate, {
        description: description,
        location: location
      });
    }
  } else {
    // Create timed event
    event = calendar.createEvent(title, startDateTime, endDateTime, {
      description: description,
      location: location
    });
  }

  return event;
}

/**
 * Clears the status column for re-processing
 */
function clearStatus() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.FIRST_DATA_ROW) return;

  const statusRange = sheet.getRange(CONFIG.FIRST_DATA_ROW, CONFIG.COLS.STATUS + 1, lastRow - CONFIG.FIRST_DATA_ROW + 1, 1);
  statusRange.clearContent();

  SpreadsheetApp.getUi().alert('Status column cleared');
}
```

### Step 3: Configure Script

1. Update `CONFIG.SHEET_NAME` to match your sheet name
2. Adjust `CONFIG.COLS` if your columns are in different order
3. Save the script (Ctrl+S)

### Step 4: Authorize & Test

1. Refresh your Google Sheet
2. You'll see new menu: "📅 Calendar Sync"
3. Click "Create Calendar Events"
4. Authorize the script (first time only)
5. Grant Calendar permissions

## Usage Instructions

### Creating Events
1. Fill in your sheet data
2. Menu: 📅 Calendar Sync → Create Calendar Events
3. Check Status column for results

### Status Indicators
- ✅ Created: [event-id] - Event created successfully
- ⏭️ Skipped - Already processed (has ✅ in status)
- ❌ Error: [reason] - Validation or creation failed

### Re-Running
The script automatically skips rows with ✅ status to prevent duplicates.

To re-create events:
1. Menu: 📅 Calendar Sync → Clear Status Column
2. Run "Create Calendar Events" again

## Automation Options

### Time-Based Trigger (Auto-run)
1. In Apps Script editor: Triggers (clock icon, left sidebar)
2. Add Trigger
3. Function: `processSheet`
4. Event source: Time-driven
5. Type: Hour timer / Day timer
6. Configure frequency

### On-Edit Trigger (Run on data change)
```javascript
function onEdit(e) {
  // Only run if edit was in data rows
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;

  const row = e.range.getRow();
  if (row < CONFIG.FIRST_DATA_ROW) return;

  // Process only the edited row
  // (Implementation left as exercise - see processSheet for reference)
}
```

## Best Practices

### Data Quality
- Use Data Validation on date/time columns
- Add dropdown lists for consistent data
- Include example row with proper formatting

### Performance
- Process in batches (<1000 rows at once)
- Use getValues() instead of getValue() in loops
- Consider splitting large datasets across sheets

### Error Handling
- Check Status column for errors
- Fix data and re-run (errors will retry)
- Keep backup of sheet before mass operations

### Duplicate Prevention
- Never clear Status column without reason
- Script checks Status before creating
- Use unique Event IDs in status for tracking

## Troubleshooting

### "Permission denied" errors
→ Re-authorize script via Triggers page

### Events not appearing in calendar
→ Check CONFIG.CALENDAR_ID matches target calendar
→ Verify calendar sharing permissions

### Date/time format issues
→ Use proper Date objects in sheet
→ Format cells as Date/Time
→ Check timezone settings (File → Settings → General)

### Duplicates being created
→ Status column not being updated
→ Check column index in CONFIG.COLS.STATUS

## Advanced Features

### Multiple Calendars
```javascript
// Change calendar based on event type
const calendarId = row[CONFIG.COLS.EVENT_TYPE] === 'Personal'
  ? 'personal@gmail.com'
  : 'team@example.com';
const calendar = CalendarApp.getCalendarById(calendarId);
```

### Event Colors
```javascript
event.setColor(CalendarApp.EventColor.RED);
```

### Add Attendees
```javascript
const attendees = row[CONFIG.COLS.ATTENDEES].split(',').map(e => e.trim());
event.addGuest(attendees.join(','));
```

### Recurring Events
```javascript
const recurrence = CalendarApp.newRecurrence()
  .addWeeklyRule()
  .interval(2); // Every 2 weeks

calendar.createEventSeries(title, startDateTime, endDateTime, recurrence, options);
```

## Resources

### Official Documentation
- [Apps Script Calendar Service](https://developers.google.com/apps-script/reference/calendar)
- [Calendar API Events](https://developers.google.com/calendar/api/guides/create-events)
- [Apps Script Data Validation](https://developers.google.com/apps-script/reference/spreadsheet/data-validation)

### Community Resources
- [Stack Overflow - Apps Script](https://stackoverflow.com/questions/tagged/google-apps-script)
- [FreeCodeCamp Tutorial](https://www.freecodecamp.org/news/google-sheets-automatically-post-events-to-google-calendar-with-apps-script/)

## Summary

✅ **Field Validation**: Implemented with validateRow() function
✅ **Auto-Create Events**: processSheet() handles batch creation
✅ **Duplicate Prevention**: Status column tracking
✅ **Error Handling**: Try-catch per row with detailed messages
✅ **User-Friendly**: Custom menu and clear status indicators

**Confidence**: High (based on 2024 official Google documentation and community best practices)
