/**
 * Event Categorization Utility
 *
 * Provides functions to categorize Google Calendar events into camps, lessons, or other types
 * using a three-tier approach: Extended Properties → Color Coding → Keyword Detection
 */

/**
 * Categorize a single calendar event
 * @param {Object} event - Google Calendar event object
 * @returns {string} - 'camp', 'lesson', or 'other'
 */
export const categorizeEvent = event => {
  if (!event) return 'other';

  // Method 1: Extended Properties (most reliable - requires manual setup)
  const eventType = event.extendedProperties?.shared?.eventType;
  if (eventType) {
    const normalized = eventType.toLowerCase();
    if (normalized === 'camp' || normalized === 'lesson') {
      return normalized;
    }
  }

  // Method 2: Color-based categorization (easiest for Coach Will)
  // Red (#11) = Camps, Blue (#9) = Lessons
  const colorMap = {
    11: 'camp', // Red
    9: 'lesson', // Blue
  };

  if (event.colorId && colorMap[event.colorId]) {
    return colorMap[event.colorId];
  }

  // Method 3: Keyword detection in title (automatic fallback)
  const title = (event.summary || '').toLowerCase();

  if (title.includes('camp')) return 'camp';
  if (title.includes('lesson') || title.includes('training') || title.includes('session')) {
    return 'lesson';
  }

  return 'other';
};

/**
 * Filter events by type
 * @param {Array} events - Array of Google Calendar event objects
 * @param {string} type - 'camp', 'lesson', or 'all'
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
 * @returns {Object} - { camps: [], lessons: [], other: [] }
 */
export const groupEventsByType = events => {
  if (!events || !Array.isArray(events)) {
    return { camps: [], lessons: [], other: [] };
  }

  return events.reduce(
    (grouped, event) => {
      const category = categorizeEvent(event);
      if (category === 'camp') {
        grouped.camps.push(event);
      } else if (category === 'lesson') {
        grouped.lessons.push(event);
      } else {
        grouped.other.push(event);
      }
      return grouped;
    },
    { camps: [], lessons: [], other: [] }
  );
};

/**
 * Get count of events by type
 * @param {Array} events - Array of Google Calendar event objects
 * @returns {Object} - { camps: 0, lessons: 0, other: 0, total: 0 }
 */
export const getEventCounts = events => {
  if (!events || !Array.isArray(events)) {
    return { camps: 0, lessons: 0, other: 0, total: 0 };
  }

  const grouped = groupEventsByType(events);

  return {
    camps: grouped.camps.length,
    lessons: grouped.lessons.length,
    other: grouped.other.length,
    total: events.length,
  };
};

/**
 * Format event date/time for display
 * @param {Object} event - Google Calendar event object
 * @returns {Object} - { date: 'Mon, Jan 15', time: '2:00 PM - 4:00 PM', isAllDay: false }
 */
export const formatEventDateTime = event => {
  if (!event) return { date: '', time: '', isAllDay: false };

  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;

  if (!start) return { date: '', time: '', isAllDay: false };

  const isAllDay = !event.start?.dateTime;
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Format date: "Mon, Jan 15"
  const date = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

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
