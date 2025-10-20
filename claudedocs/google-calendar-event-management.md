# Google Calendar Event Management Guide

Step-by-step instructions for creating and managing New Era Hockey training events in Google Calendar.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Event Categories](#event-categories)
3. [Creating Events - Method 1: Using Event Colors (Recommended)](#method-1-using-event-colors-recommended)
4. [Creating Events - Method 2: Using Keywords in Title](#method-2-using-keywords-in-title)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The New Era Hockey website automatically syncs events from Coach Will's Google Calendar (`coachwill@newerahockeytraining.com`) and displays them on the **Training Schedule** page at `/schedule`.

Events are automatically categorized as either **Camps** or **Lessons** based on how you create them in Google Calendar.

---

## Event Categories

| Category | Description | Display |
|----------|-------------|---------|
| **Camps** | Multi-day training camps, clinics, or intensive programs | Shown when "Camps" toggle is active |
| **Lessons** | Individual or group training sessions | Shown when "Lessons" toggle is active |
| **Other** | Events that don't match either category | Not displayed on website |

---

## Method 1: Using Event Colors (Recommended)

The most reliable way to categorize events is by setting the **event color** in Google Calendar.

### Creating a Camp Event

1. **Open Google Calendar**
   - Go to: https://calendar.google.com
   - Make sure you're logged in as `coachwill@newerahockeytraining.com`

2. **Create New Event**
   - Click on a date/time slot OR click the **+ Create** button
   - Enter event details:
     - **Event title**: e.g., "Summer Hockey Camp 2025"
     - **Date and time**: Set start and end dates/times
     - **Location**: Add training facility address
     - **Description**: Add camp details, pricing, registration info

3. **Set Event Color to RED**
   - Click the **event color** dropdown (looks like a paint palette)
   - Select **Red** (color ID 11)
   - This automatically categorizes the event as a **Camp**

4. **Save Event**
   - Click **Save**
   - Event will appear on website under "Camps" toggle

### Creating a Lesson Event

1. **Open Google Calendar**
   - Go to: https://calendar.google.com
   - Make sure you're logged in as `coachwill@newerahockeytraining.com`

2. **Create New Event**
   - Click on a date/time slot OR click the **+ Create** button
   - Enter event details:
     - **Event title**: e.g., "Private Skating Lesson - John Smith"
     - **Date and time**: Set start and end times
     - **Location**: Add training facility address
     - **Description**: Add lesson details, client notes

3. **Set Event Color to BLUE**
   - Click the **event color** dropdown
   - Select **Blue** (color ID 9)
   - This automatically categorizes the event as a **Lesson**

4. **Save Event**
   - Click **Save**
   - Event will appear on website under "Lessons" toggle

---

## Method 2: Using Keywords in Title

If you **don't set an event color**, the system will automatically detect the category based on keywords in the event title.

### Automatic Camp Detection

Events with these keywords in the title are automatically categorized as **Camps**:
- "camp"
- Example titles:
  - "Summer Hockey Camp"
  - "Hockey Camp - Week 1"
  - "Goalie Camp"

### Automatic Lesson Detection

Events with these keywords in the title are automatically categorized as **Lessons**:
- "lesson"
- "training"
- Example titles:
  - "Private Lesson - Sarah Johnson"
  - "Group Training Session"
  - "Hockey Skills Training"

### Important Notes

- Keywords are **case-insensitive** ("Lesson", "lesson", "LESSON" all work)
- If an event has **no color** AND **no keywords**, it will **not appear** on the website
- Color-based categorization **takes priority** over keywords

---

## Best Practices

### ✅ Do's

1. **Use Event Colors** (most reliable)
   - Red = Camps
   - Blue = Lessons

2. **Include Clear Titles**
   - Good: "Summer Hockey Camp 2025"
   - Good: "Private Lesson - Client Name"
   - Bad: "Event 1" (unclear)

3. **Add Detailed Descriptions**
   - Include pricing information
   - Add registration links
   - Specify skill levels or age groups
   - Add contact information

4. **Set Correct Date/Time**
   - Use appropriate time zones
   - For multi-day camps, create a single event with start/end dates
   - For recurring lessons, use Google Calendar's "Repeat" feature

5. **Add Location**
   - Include full facility address
   - Add rink name if applicable

### ❌ Don'ts

1. **Don't Use Random Colors**
   - Only Red (Camps) and Blue (Lessons) are recognized
   - Other colors require keywords in title

2. **Don't Create Hidden Events**
   - Events without color AND without keywords won't appear on website
   - Always verify events appear on `/schedule` page

3. **Don't Forget Time Zones**
   - Ensure events are in correct timezone (Eastern Time)
   - Check daylight saving time adjustments

4. **Don't Use Abbreviations in Titles**
   - Spell out "Lesson" instead of "Lsn"
   - Spell out "Camp" instead of "Cmp"

---

## Workflow Examples

### Example 1: Creating a Week-Long Summer Camp

```
Title: Summer Hockey Camp - Week 1
Color: Red (Camp)
Start: June 15, 2025 @ 9:00 AM
End: June 19, 2025 @ 3:00 PM
Location: New Era Hockey Training Center, 123 Ice Rink Lane, Anytown, VA
Description:
  Ages: 8-14
  Price: $450/week
  Registration: https://newerahockeytraining.com/register

  Daily schedule:
  9:00 AM - 12:00 PM: On-ice training
  12:00 PM - 1:00 PM: Lunch
  1:00 PM - 3:00 PM: Skills development
```

**Result**: ✅ Appears under "Camps" on website

### Example 2: Creating a Private Lesson

```
Title: Private Skating Lesson - Alex Thompson
Color: Blue (Lesson)
Start: June 10, 2025 @ 6:00 PM
End: June 10, 2025 @ 7:00 PM
Location: MedStar Capitals Iceplex, Arlington, VA
Description:
  Focus: Power skating fundamentals
  Client age: 12
  Notes: Working on crossovers and edge work
```

**Result**: ✅ Appears under "Lessons" on website

### Example 3: Creating a Recurring Group Training

```
Title: Group Training Session
Color: Blue (Lesson)
Start: June 1, 2025 @ 7:00 PM
End: June 1, 2025 @ 8:00 PM
Repeat: Weekly on Thursdays (8 weeks)
Location: Kettler Capitals Iceplex, Arlington, VA
Description:
  Group size: 4-6 players
  Price: $50/session
  Focus: Stickhandling and shooting
```

**Result**: ✅ Creates 8 recurring events, all appear under "Lessons"

---

## Verification Steps

After creating an event, verify it appears on the website:

1. **Wait 30 seconds** (calendar sync happens automatically)
2. **Visit**: https://newerahockeytraining.com/schedule
3. **Toggle to appropriate category**:
   - Click "Camps" to see camp events
   - Click "Lessons" to see lesson events
4. **Verify event appears** with correct:
   - Title
   - Date and time
   - Location
   - Description

### If Event Doesn't Appear

**Check**:
1. Event color is set (Red or Blue)
2. OR event title contains "camp", "lesson", or "training"
3. Event date is in the future (past events don't display)
4. You're logged in as `coachwill@newerahockeytraining.com`
5. Event is not marked as "Private" or "Hidden"

---

## Troubleshooting

### Problem: Event doesn't appear on website

**Solution**:
- ✅ Check event color (should be Red or Blue)
- ✅ OR add keyword to title ("camp", "lesson", or "training")
- ✅ Ensure event is in the future
- ✅ Wait 30 seconds for calendar sync
- ✅ Refresh the `/schedule` page

### Problem: Event appears in wrong category

**Solution**:
- ✅ Check event color:
  - Red = Camps
  - Blue = Lessons
- ✅ Event color **overrides** keywords in title
- ✅ Change color to correct category
- ✅ Wait 30 seconds and refresh page

### Problem: Event date/time is wrong

**Solution**:
- ✅ Check timezone in Google Calendar settings
- ✅ Verify event is not set to "All Day" (unless intended)
- ✅ Edit event and correct date/time
- ✅ Save and verify on website

### Problem: Past events showing on website

**Note**: This should not happen - the system only fetches future events.

**If it occurs**:
- ✅ Clear browser cache
- ✅ Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
- ✅ Contact developer if issue persists

---

## Advanced: Understanding Event Categorization

The system uses a **3-tier fallback** to categorize events:

### Priority 1: Extended Properties (Hidden - Not Used Currently)
Reserved for future advanced categorization features.

### Priority 2: Event Colors (Recommended)
- **Red** (Color ID 11) → **Camp**
- **Blue** (Color ID 9) → **Lesson**
- Other colors → Fall through to Priority 3

### Priority 3: Title Keywords (Automatic Fallback)
- Title contains "**camp**" → **Camp**
- Title contains "**lesson**" OR "**training**" → **Lesson**
- No keywords → **Not displayed**

**Example Decision Flow**:
```
Event: "Summer Camp"
Color: Red
→ Result: CAMP (Color takes priority)

Event: "Summer Camp"
Color: Green (not recognized)
→ Result: CAMP (Keyword "camp" detected)

Event: "Hockey Skills Training"
Color: None
→ Result: LESSON (Keyword "training" detected)

Event: "Meeting with Client"
Color: None
→ Result: NOT DISPLAYED (No color, no keywords)
```

---

## Quick Reference

| Task | Steps |
|------|-------|
| **Create Camp** | 1. New event<br>2. Set color to **Red**<br>3. Add details<br>4. Save |
| **Create Lesson** | 1. New event<br>2. Set color to **Blue**<br>3. Add details<br>4. Save |
| **Edit Event** | 1. Click event<br>2. Click pencil icon<br>3. Make changes<br>4. Save |
| **Delete Event** | 1. Click event<br>2. Click trash icon<br>3. Confirm deletion |
| **Verify on Website** | Visit `/schedule` → Toggle category → Find event |

---

## Color Reference Chart

| Color | Hex Code | Category | Example Use |
|-------|----------|----------|-------------|
| 🔴 Red | `#dc2127` | **Camps** | Summer camps, clinics, intensive programs |
| 🔵 Blue | `#039be5` | **Lessons** | Private lessons, group training, skills sessions |
| Other | Various | Not categorized | Internal events, meetings, blocked time |

---

## Need Help?

**Technical Issues**:
- Check Netlify function logs at: https://app.netlify.com
- Verify Google Calendar API is accessible
- Ensure service account has proper permissions

**Calendar Management Questions**:
- Contact: coachwill@newerahockeytraining.com
- Review this guide: `claudedocs/google-calendar-event-management.md`

---

**Last Updated**: October 16, 2025
**Calendar**: coachwill@newerahockeytraining.com
**Website**: https://newerahockeytraining.com/schedule
