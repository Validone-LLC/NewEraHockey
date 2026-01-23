/**
 * Event Utility Functions
 *
 * Shared utilities for Google Calendar event processing.
 * Used by calendar-events.cjs and calendar-event.cjs
 */

const { getEventRegistrations, DEFAULT_CAPACITY } = require('./registrationStore.cjs');

/**
 * Categorize calendar event based on extended properties, color, or keywords
 * @param {Object} event - Google Calendar event object
 * @returns {string} - 'camp', 'lesson', 'at_home_training', 'mt_vernon_skating', or 'other'
 */
function categorizeEvent(event) {
  if (!event) return 'other';

  // Method 1: Extended Properties (most reliable - requires manual setup)
  const eventType = event.extendedProperties?.shared?.eventType;
  if (eventType) {
    const normalized = eventType.toLowerCase();
    if (
      normalized === 'camp' ||
      normalized === 'lesson' ||
      normalized === 'at_home_training' ||
      normalized === 'mt_vernon_skating'
    ) {
      return normalized;
    }
  }

  // Method 2: Title-based detection (check before color for Mt Vernon Skating)
  // This is needed because registered Mt Vernon Skating events use yellow (same as AT_HOME_BOOKED)
  const title = (event.summary || '').toLowerCase();
  if (title.includes('mount vernon skating') || title.includes('mt vernon skating')) {
    return 'mt_vernon_skating';
  }

  // Method 3: Color-based categorization (easiest for Coach Will)
  // Red (#11) = Camps, Blue (#9) = Lessons, Orange (#6) = At Home Training (available),
  // Yellow (#5) = At Home Training (booked), Green (#10) = Mt Vernon Skating (available)
  const colorMap = {
    '11': 'camp', // Red
    '9': 'lesson', // Blue
    '6': 'at_home_training', // Orange (Tangerine) - available slots
    '5': 'at_home_training', // Yellow (Banana) - booked slots
    '10': 'mt_vernon_skating', // Green (Basil) - available for registration
  };

  if (event.colorId && colorMap[event.colorId]) {
    return colorMap[event.colorId];
  }

  // Method 4: Keyword detection in title (automatic fallback)
  if (title.includes('camp')) return 'camp';
  if (title.includes('lesson')) return 'lesson';
  if (title.includes('at home') || title.includes('training')) return 'at_home_training';

  return 'other';
}

/**
 * Parse price from event description
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
 * Parse custom capacity/spots from event description
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
 * Enrich event with registration metadata
 *
 * AUTO-DETECTION LOGIC:
 * - If event has price in description → registration enabled automatically
 * - Custom capacity from "Spots: X" or "Capacity: X" in description
 * - Falls back to default capacity based on event type (camp: 20, lesson: 10)
 * - Fetches current registration count from Netlify Blob Storage
 *
 * NO MANUAL EXTENDED PROPERTIES NEEDED!
 *
 * @param {Object} event - Google Calendar event object
 * @returns {Promise<Object>} - Enriched event object
 */
async function enrichEventWithRegistrationData(event) {
  // Get event type for default capacity
  const eventType = categorizeEvent(event);

  // Parse price from description (auto-detection)
  const priceFromDescription = parsePriceFromDescription(event.description);
  const price = priceFromDescription || null;

  // Parse custom capacity from description (optional)
  const customSpotsFromDescription = parseSpotsFromDescription(event.description);

  // AUTO-ENABLE registration if price exists
  const registrationEnabled = price !== null;

  // Fetch registration data from Netlify Blob Storage
  let registrationData = null;
  let maxCapacity = null;
  let currentRegistrations = 0;

  try {
    registrationData = await getEventRegistrations(event.id);

    // Capacity priority: custom from description > stored > default by type
    // Calendar description is source of truth - allows updating capacity dynamically
    maxCapacity =
      customSpotsFromDescription ||
      registrationData.maxCapacity ||
      DEFAULT_CAPACITY[eventType] ||
      DEFAULT_CAPACITY.other;

    currentRegistrations = registrationData.currentRegistrations || 0;
  } catch (error) {
    console.warn(`Could not fetch registration data for ${event.id}:`, error.message);
    // Fallback: custom from description or default
    maxCapacity =
      customSpotsFromDescription || DEFAULT_CAPACITY[eventType] || DEFAULT_CAPACITY.other;
    currentRegistrations = 0;
  }

  // Calculate sold out status
  const isSoldOut = currentRegistrations >= maxCapacity;

  // Add registration metadata to event object
  return {
    ...event,
    registrationData: {
      price,
      maxCapacity,
      currentRegistrations,
      isSoldOut,
      registrationEnabled,
      hasCapacityInfo: true, // Always true now with defaults
    },
  };
}

module.exports = {
  categorizeEvent,
  parsePriceFromDescription,
  parseSpotsFromDescription,
  enrichEventWithRegistrationData,
};
