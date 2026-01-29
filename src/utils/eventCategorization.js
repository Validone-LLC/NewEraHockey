/**
 * Event Categorization Utility
 *
 * Provides functions to categorize Google Calendar events into camps, lessons, or other types
 * using a three-tier approach: Extended Properties → Color Coding → Keyword Detection
 */

import { COLOR_TO_EVENT_TYPE, EVENT_TYPES } from '@/config/constants';

/**
 * Categorize a single calendar event
 * @param {Object} event - Google Calendar event object
 * @returns {string} - 'camp', 'lesson', 'at_home_training', 'mt_vernon_skating', 'rockville_small_group', or 'other'
 */
export const categorizeEvent = event => {
  if (!event) return EVENT_TYPES.OTHER;

  // Method 1: Extended Properties (most reliable - requires manual setup)
  const eventType = event.extendedProperties?.shared?.eventType;
  if (eventType) {
    const normalized = eventType.toLowerCase();
    if (
      normalized === EVENT_TYPES.CAMP ||
      normalized === EVENT_TYPES.LESSON ||
      normalized === EVENT_TYPES.AT_HOME_TRAINING ||
      normalized === EVENT_TYPES.MT_VERNON_SKATING ||
      normalized === EVENT_TYPES.ROCKVILLE_SMALL_GROUP
    ) {
      return normalized;
    }
  }

  // Method 2: Title-based detection (check before color for specific event types)
  // This is needed because some events share colors or need explicit title matching
  const title = (event.summary || '').toLowerCase();

  // Rockville Small Group - check before color since title is definitive
  if (title.includes('rockville small group')) {
    return EVENT_TYPES.ROCKVILLE_SMALL_GROUP;
  }

  // Mt Vernon events - Matches: "Mount Vernon...", "Mt Vernon...", "Mt. Vernon..."
  if (
    title.includes('mount vernon') ||
    title.includes('mt vernon') ||
    title.includes('mt. vernon')
  ) {
    return EVENT_TYPES.MT_VERNON_SKATING;
  }

  // Method 3: Color-based categorization (easiest for Coach Will)
  // Uses centralized COLOR_TO_EVENT_TYPE mapping from constants
  if (event.colorId && COLOR_TO_EVENT_TYPE[event.colorId]) {
    return COLOR_TO_EVENT_TYPE[event.colorId];
  }

  // Method 4: Keyword detection in title (automatic fallback)
  if (title.includes('camp')) return EVENT_TYPES.CAMP;
  if (title.includes('lesson')) return EVENT_TYPES.LESSON;
  if (title.includes('at home') || title.includes('training')) return EVENT_TYPES.AT_HOME_TRAINING;

  return EVENT_TYPES.OTHER;
};

/**
 * Filter events by type
 * @param {Array} events - Array of Google Calendar event objects
 * @param {string} type - 'camp', 'lesson', 'at_home_training', or 'all'
 * @returns {Array} - Filtered events
 */
export const filterEventsByType = (events, type) => {
  if (!events || !Array.isArray(events)) return [];
  if (!type || type === 'all') return events;

  const normalizedType = type.toLowerCase();
  return events.filter(event => categorizeEvent(event) === normalizedType);
};

/**
 * Group events by category
 * @param {Array} events - Array of Google Calendar event objects
 * @returns {Object} - { camps: [], lessons: [], atHomeTraining: [], mtVernonSkating: [], rockvilleSmallGroup: [], other: [] }
 */
export const groupEventsByType = events => {
  if (!events || !Array.isArray(events)) {
    return {
      camps: [],
      lessons: [],
      atHomeTraining: [],
      mtVernonSkating: [],
      rockvilleSmallGroup: [],
      other: [],
    };
  }

  return events.reduce(
    (grouped, event) => {
      const category = categorizeEvent(event);
      if (category === 'camp') {
        grouped.camps.push(event);
      } else if (category === 'lesson') {
        grouped.lessons.push(event);
      } else if (category === 'at_home_training') {
        grouped.atHomeTraining.push(event);
      } else if (category === 'mt_vernon_skating') {
        grouped.mtVernonSkating.push(event);
      } else if (category === 'rockville_small_group') {
        grouped.rockvilleSmallGroup.push(event);
      } else {
        grouped.other.push(event);
      }
      return grouped;
    },
    {
      camps: [],
      lessons: [],
      atHomeTraining: [],
      mtVernonSkating: [],
      rockvilleSmallGroup: [],
      other: [],
    }
  );
};

/**
 * Get count of events by type
 * @param {Array} events - Array of Google Calendar event objects
 * @returns {Object} - { camps: 0, lessons: 0, atHomeTraining: 0, mtVernonSkating: 0, rockvilleSmallGroup: 0, other: 0, total: 0 }
 */
export const getEventCounts = events => {
  if (!events || !Array.isArray(events)) {
    return {
      camps: 0,
      lessons: 0,
      atHomeTraining: 0,
      mtVernonSkating: 0,
      rockvilleSmallGroup: 0,
      other: 0,
      total: 0,
    };
  }

  const grouped = groupEventsByType(events);

  return {
    camps: grouped.camps.length,
    lessons: grouped.lessons.length,
    atHomeTraining: grouped.atHomeTraining.length,
    mtVernonSkating: grouped.mtVernonSkating.length,
    rockvilleSmallGroup: grouped.rockvilleSmallGroup.length,
    other: grouped.other.length,
    total: events.length,
  };
};

/**
 * Format event date/time for display
 * @param {Object} event - Google Calendar event object
 * @returns {Object} - { date: 'Mon, Jan 15' or 'Jan 1st - Jan 3rd', time: '2:00 PM - 4:00 PM', isAllDay: false }
 */
export const formatEventDateTime = event => {
  if (!event) return { date: '', time: '', isAllDay: false };

  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;

  if (!start) return { date: '', time: '', isAllDay: false };

  const isAllDay = !event.start?.dateTime;
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check if multi-day event (different dates, not just different times)
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  // For all-day events, Google Calendar sets end date to the day AFTER the last day
  // So we need to subtract 1 day from the end date for all-day multi-day events
  const adjustedEndDate = isAllDay ? new Date(endDay.getTime() - 24 * 60 * 60 * 1000) : endDate;
  const adjustedEndDay = new Date(
    adjustedEndDate.getFullYear(),
    adjustedEndDate.getMonth(),
    adjustedEndDate.getDate()
  );

  const isMultiDay = startDay.getTime() !== adjustedEndDay.getTime();

  let date;
  if (isMultiDay) {
    // Multi-day format: "Jan 1st - Jan 3rd"
    const startFormatted = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endFormatted = adjustedEndDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Add ordinal suffixes (1st, 2nd, 3rd, etc.)
    const addOrdinalSuffix = dateStr => {
      const parts = dateStr.split(' ');
      const day = parseInt(parts[1]);
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      else if (day === 2 || day === 22) suffix = 'nd';
      else if (day === 3 || day === 23) suffix = 'rd';
      return `${parts[0]} ${day}${suffix}`;
    };

    date = `${addOrdinalSuffix(startFormatted)} - ${addOrdinalSuffix(endFormatted)}`;
  } else {
    // Single day format: "Mon, Jan 15"
    date = startDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  // Format time: "2:00 PM - 4:00 PM" or "All Day"
  let time = 'All Day';
  if (!isAllDay) {
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    time = `${startTime} - ${endTime}`;
  }

  return { date, time, isAllDay };
};

/**
 * Check if event is upcoming (starts in the future)
 * @param {Object} event - Google Calendar event object
 * @returns {boolean}
 */
export const isUpcoming = event => {
  if (!event) return false;

  const start = event.start?.dateTime || event.start?.date;
  if (!start) return false;

  const startDate = new Date(start);
  const now = new Date();

  return startDate > now;
};

/**
 * Sort events by start date (ascending)
 * @param {Array} events - Array of Google Calendar event objects
 * @returns {Array} - Sorted events
 */
export const sortEventsByDate = events => {
  if (!events || !Array.isArray(events)) return [];

  return [...events].sort((a, b) => {
    const aStart = a.start?.dateTime || a.start?.date;
    const bStart = b.start?.dateTime || b.start?.date;

    if (!aStart) return 1;
    if (!bStart) return -1;

    return new Date(aStart) - new Date(bStart);
  });
};

/**
 * Parse multi-date/time format from event description
 * Format: "Date & Times: [3/13 - 4:45pm - 6pm] [3/14 - 7:30am - 8:45am]"
 * @param {string} description - Event description text
 * @param {number} year - Year to use for dates (defaults to current year, adjusts if date is past)
 * @returns {Object|null} - { sessions: [{ date, dayOfWeek, startTime, endTime, fullDate }] } or null
 */
export const parseMultiDateTimes = (description, year = new Date().getFullYear()) => {
  if (!description) return null;

  // Match "Date & Times:" or "Dates & Times:" followed by bracketed sessions
  const headerMatch = description.match(/Dates?\s*&\s*Times?\s*:\s*((?:\[.*?\]\s*)+)/i);
  if (!headerMatch) return null;

  const sessionsStr = headerMatch[1];
  // Pattern: [MM/DD - startTime - endTime]
  // Time formats: 4:45pm, 7:30am, 6pm, 8:45am (with or without minutes)
  const sessionPattern =
    /\[(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)\]/gi;

  const sessions = [];
  let match;

  while ((match = sessionPattern.exec(sessionsStr)) !== null) {
    const [, month, day, startTimeRaw, endTimeRaw] = match;

    // Create date object to get day of week
    let sessionYear = year;
    let sessionDate = new Date(sessionYear, parseInt(month) - 1, parseInt(day));

    // If date is in the past, use next year
    const now = new Date();
    if (sessionDate < now) {
      sessionYear = year + 1;
      sessionDate = new Date(sessionYear, parseInt(month) - 1, parseInt(day));
    }

    const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = sessionDate.toLocaleDateString('en-US', { month: 'short' });

    // Normalize time format (add :00 if no minutes, uppercase AM/PM)
    const normalizeTime = timeStr => {
      let time = timeStr.toLowerCase();
      // If no colon, add :00 before am/pm
      if (!time.includes(':')) {
        time = time.replace(/(am|pm)/, ':00$1');
      }
      // Format to standard time display
      const timeMatch = time.match(/(\d{1,2}):(\d{2})(am|pm)/);
      if (timeMatch) {
        let [, hours, mins, period] = timeMatch;
        hours = parseInt(hours);
        return `${hours}:${mins} ${period.toUpperCase()}`;
      }
      return timeStr;
    };

    sessions.push({
      date: `${monthName} ${parseInt(day)}`,
      dayOfWeek,
      startTime: normalizeTime(startTimeRaw),
      endTime: normalizeTime(endTimeRaw),
      fullDate: sessionDate,
    });
  }

  if (sessions.length === 0) return null;

  return { sessions };
};

/**
 * Check if event has multi-date format in description
 * @param {Object} event - Google Calendar event object
 * @returns {boolean}
 */
export const hasMultiDateFormat = event => {
  if (!event?.description) return false;
  return /Dates?\s*&\s*Times?\s*:/i.test(event.description);
};

/**
 * Get formatted multi-date display data
 * @param {Object} event - Google Calendar event object
 * @returns {Object|null} - { sessions: [...], dateRange: 'Mar 13 - Mar 15' } or null
 */
export const getMultiDateDisplay = event => {
  if (!event?.description) return null;

  const parsed = parseMultiDateTimes(event.description);
  if (!parsed || parsed.sessions.length === 0) return null;

  // Calculate date range for header display
  const firstSession = parsed.sessions[0];
  const lastSession = parsed.sessions[parsed.sessions.length - 1];
  const dateRange =
    parsed.sessions.length > 1 ? `${firstSession.date} - ${lastSession.date}` : firstSession.date;

  return {
    sessions: parsed.sessions,
    dateRange,
    sessionCount: parsed.sessions.length,
  };
};
