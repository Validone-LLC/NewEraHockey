/**
 * Shared calendar utility functions.
 * Used by both calendar-event.cjs (single event) and calendar-events.cjs (event list).
 */

const { getEventRegistrations, DEFAULT_CAPACITY } = require('./registrationStore.cjs');

/**
 * Categorize calendar event based on extended properties, color, or keywords.
 * @param {Object} event - Google Calendar event object
 * @returns {string} - 'camp', 'lesson', 'at_home_training', 'mt_vernon_skating', 'small_group', or 'other'
 */
function categorizeEvent(event) {
  if (!event) return 'other';

  // Method 1: Extended Properties (most reliable)
  const eventType = event.extendedProperties?.shared?.eventType;
  if (eventType) {
    const normalized = eventType.toLowerCase();
    if (['camp', 'lesson', 'at_home_training', 'mt_vernon_skating', 'small_group'].includes(normalized)) {
      return normalized;
    }
    // Backward compat: map old type to new
    if (normalized === 'rockville_small_group') {
      return 'small_group';
    }
  }

  // Method 2: Title-based detection (check before color for specific event types)
  const title = (event.summary || '').toLowerCase();

  // Small Group - check before color since title is definitive
  if (title.includes('small group')) {
    return 'small_group';
  }

  // Mt Vernon events - Matches: "Mount Vernon...", "Mt Vernon...", "Mt. Vernon..."
  if (title.includes('mount vernon') || title.includes('mt vernon') || title.includes('mt. vernon')) {
    return 'mt_vernon_skating';
  }

  // Method 3: Color-based categorization
  // Red (#11) = Camps, Blue (#9) = Lessons, Orange (#6) = At Home Training (available),
  // Yellow (#5) = At Home Training (booked), Green (#10) = Mt Vernon Skating (available),
  // Peacock (#7) = Small Group
  const colorMap = {
    '11': 'camp',
    '9': 'lesson',
    '6': 'at_home_training', // Orange (Tangerine) - available slots
    '5': 'at_home_training', // Yellow (Banana) - booked slots
    '10': 'mt_vernon_skating', // Green (Basil)
    '7': 'small_group', // Peacock (Teal/Cyan)
  };

  if (event.colorId && colorMap[event.colorId]) {
    return colorMap[event.colorId];
  }

  // Method 4: Keyword detection in title (fallback)
  if (title.includes('camp')) return 'camp';
  if (title.includes('lesson')) return 'lesson';
  if (title.includes('at home') || title.includes('training')) return 'at_home_training';

  return 'other';
}

/**
 * Parse price from event description.
 * Looks for patterns like "Price: $350", "$350.00", "Price: 350"
 * @param {string} description - Event description
 * @returns {number|null} - Price in dollars, or null if not found
 */
function parsePriceFromDescription(description) {
  if (!description) return null;

  // Pattern 1: "Price: $350" or "Price: $350.00"
  const pricePattern1 = /price:\s*\$?(\d+(?:\.\d{2})?)/i;
  const match1 = description.match(pricePattern1);
  if (match1) {
    return parseFloat(match1[1]);
  }

  // Pattern 2: Standalone "$350" or "$350.00"
  const pricePattern2 = /\$(\d+(?:\.\d{2})?)/;
  const match2 = description.match(pricePattern2);
  if (match2) {
    return parseFloat(match2[1]);
  }

  return null;
}

/**
 * Parse custom capacity/spots from event description.
 * Looks for patterns like "Spots: 25", "Slot: 2", "Capacity: 15"
 * @param {string} description - Event description
 * @returns {number|null} - Number of spots, or null if not found
 */
function parseSpotsFromDescription(description) {
  if (!description) return null;

  // Pattern: "Spots: 25", "Slot: 2", or "Capacity: 15" (case insensitive)
  const spotsPattern = /(?:spots?|capacity|slots?):\s*(\d+)/i;
  const match = description.match(spotsPattern);

  if (match) {
    const spots = parseInt(match[1], 10);
    // Validate reasonable capacity (1-100)
    if (spots >= 1 && spots <= 100) {
      return spots;
    }
  }

  return null;
}

/**
 * Enrich event with registration metadata.
 *
 * AUTO-DETECTION LOGIC:
 * - If event has price in description → registration enabled automatically
 * - Custom capacity from "Spots: X" or "Capacity: X" in description
 * - Falls back to default capacity based on event type (camp: 20, lesson: 10, etc.)
 * - Fetches current registration count from S3
 *
 * @param {Object} event - Google Calendar event object
 * @returns {Promise<Object>} - Enriched event object
 */
async function enrichEventWithRegistrationData(event) {
  const eventType = categorizeEvent(event);

  const priceFromDescription = parsePriceFromDescription(event.description);
  const price = priceFromDescription || null;

  const customSpotsFromDescription = parseSpotsFromDescription(event.description);

  // AUTO-ENABLE registration if price exists
  const registrationEnabled = price !== null;

  let registrationData = null;
  let maxCapacity = null;
  let currentRegistrations = 0;

  try {
    registrationData = await getEventRegistrations(event.id);

    // Capacity priority: custom from description > stored > default by type
    maxCapacity =
      customSpotsFromDescription ||
      registrationData.maxCapacity ||
      DEFAULT_CAPACITY[eventType] ||
      DEFAULT_CAPACITY.other;

    currentRegistrations = registrationData.currentRegistrations || 0;
  } catch (error) {
    console.warn(`Could not fetch registration data for ${event.id}:`, error.message);
    maxCapacity =
      customSpotsFromDescription ||
      DEFAULT_CAPACITY[eventType] ||
      DEFAULT_CAPACITY.other;
    currentRegistrations = 0;
  }

  const isSoldOut = currentRegistrations >= maxCapacity;

  return {
    ...event,
    registrationData: {
      price,
      maxCapacity,
      currentRegistrations,
      isSoldOut,
      registrationEnabled,
      hasCapacityInfo: true,
    },
  };
}

module.exports = {
  categorizeEvent,
  parsePriceFromDescription,
  parseSpotsFromDescription,
  enrichEventWithRegistrationData,
};
