/**
 * Registration Helper Utilities
 *
 * Helper functions for working with event registration data
 */

import { formatPrice, getEventPrice } from './priceParser';
import { categorizeEvent } from './eventCategorization';
import { isRegistrationEnabledForEventType } from '@/config/featureFlags';

/**
 * Check if event has registration enabled
 * @param {Object} event - Calendar event object
 * @returns {boolean}
 */
export const isRegistrationEnabled = event => {
  if (!event) return false;

  // For At Home Training, check if it has a price (auto-enabled)
  const eventType = categorizeEvent(event);
  if (eventType === 'at_home_training') {
    const price = getEventPrice(event);
    return price !== null && price > 0;
  }

  // For camps/lessons, check registrationData
  return event.registrationData?.registrationEnabled === true;
};

/**
 * Check if event description indicates full capacity
 * Looks for "Spots: FULL" or "Spots: full" in description
 * @param {Object} event - Calendar event object
 * @returns {boolean}
 */
export const isDescriptionMarkedFull = event => {
  if (!event?.description) return false;
  const description = event.description.toLowerCase();
  return /spots:\s*full/i.test(description);
};

/**
 * Check if event is sold out
 * @param {Object} event - Calendar event object
 * @returns {boolean}
 */
export const isSoldOut = event => {
  if (!event) return false;

  const eventType = categorizeEvent(event);

  // For At Home Training, yellow color (#5) = booked/sold out
  if (eventType === 'at_home_training') {
    return event.colorId === '5';
  }

  // Check registration data sold out flag
  if (event.registrationData?.isSoldOut === true) {
    return true;
  }

  // For camps only, check description for "Spots: FULL"
  if (eventType.toLowerCase() === 'camp' || eventType.toLowerCase() === 'camps') {
    return isDescriptionMarkedFull(event);
  }

  return false;
};

/**
 * Get current registration count
 * @param {Object} event - Calendar event object
 * @returns {number}
 */
export const getCurrentRegistrations = event => {
  if (!event) return 0;
  return event.registrationData?.currentRegistrations || 0;
};

/**
 * Get maximum capacity
 * @param {Object} event - Calendar event object
 * @returns {number|null}
 */
export const getMaxCapacity = event => {
  if (!event) return null;
  return event.registrationData?.maxCapacity || null;
};

/**
 * Get remaining spots
 * @param {Object} event - Calendar event object
 * @returns {number|null} - Null if capacity not set
 */
export const getRemainingSpots = event => {
  if (!event) return null;

  const max = getMaxCapacity(event);
  const current = getCurrentRegistrations(event);

  if (max === null) return null;

  return Math.max(0, max - current);
};

/**
 * Check if event has capacity information
 * @param {Object} event - Calendar event object
 * @returns {boolean}
 */
export const hasCapacityInfo = event => {
  if (!event) return false;
  return event.registrationData?.hasCapacityInfo === true;
};

/**
 * Get registration button text
 * @param {Object} event - Calendar event object
 * @returns {string}
 */
export const getRegistrationButtonText = event => {
  if (!event) return 'View Details';

  if (isSoldOut(event)) {
    return 'Sold Out';
  }

  // Check feature toggle - if registration disabled for this event type
  const eventType = categorizeEvent(event);
  if (!isRegistrationEnabledForEventType(eventType)) {
    // If toggle is off AND event is marked full in description, show "Sold Out"
    if (isDescriptionMarkedFull(event)) {
      return 'Sold Out';
    }
    return 'Contact';
  }

  if (!isRegistrationEnabled(event)) {
    return 'View Details';
  }

  return 'Register';
};

/**
 * Check if event should be hidden (lessons only)
 * @param {Object} event - Calendar event object
 * @param {string} eventType - 'camps' or 'lessons'
 * @returns {boolean}
 */
export const shouldHideEvent = (event, eventType) => {
  if (!event) return true;

  // Hide sold out lessons
  if (eventType === 'lessons' && isSoldOut(event)) {
    return true;
  }

  return false;
};

/**
 * Get event price with fallback
 * @param {Object} event - Calendar event object
 * @returns {number|null}
 */
export const getPrice = event => {
  if (!event) return null;
  return event.registrationData?.price || getEventPrice(event);
};

/**
 * Get formatted price display
 * @param {Object} event - Calendar event object
 * @param {boolean} includeCents - Whether to show cents
 * @returns {string}
 */
export const getFormattedPrice = (event, includeCents = false) => {
  const price = getPrice(event);
  return formatPrice(price, includeCents);
};

/**
 * Check if event can accept registrations
 * @param {Object} event - Calendar event object
 * @returns {boolean}
 */
export const canRegister = event => {
  if (!event) return false;

  // Check feature toggle first - if registration disabled for this event type, return false
  const eventType = categorizeEvent(event);
  if (!isRegistrationEnabledForEventType(eventType)) {
    return false;
  }

  // Must have registration enabled
  if (!isRegistrationEnabled(event)) return false;

  // Must not be sold out
  if (isSoldOut(event)) return false;

  // Must have a price
  if (getPrice(event) === null) return false;

  return true;
};

/**
 * Get registration status message
 * @param {Object} event - Calendar event object
 * @returns {string}
 */
export const getRegistrationStatus = event => {
  if (!event) return '';

  if (isSoldOut(event)) {
    return 'SOLD OUT';
  }

  if (!hasCapacityInfo(event)) {
    return 'Registration Available';
  }

  const remaining = getRemainingSpots(event);
  if (remaining !== null && remaining <= 5 && remaining > 0) {
    return `Only ${remaining} spot${remaining === 1 ? '' : 's'} left!`;
  }

  return 'Registration Open';
};

/**
 * Extract custom text from event description
 * Looks for "Text: " prefix in description and returns the text after it
 * @param {Object} event - Calendar event object
 * @returns {string|null} - Custom text or null if not found
 */
export const getEventCustomText = event => {
  if (!event?.description) return null;

  const match = event.description.match(/Text:\s*(.+?)(?:\n|<|$)/i);
  if (!match) return null;

  // Strip any HTML tags that might be in the text
  const text = match[1].replace(/<[^>]*>/g, '').trim();
  return text || null;
};

/**
 * Extract warning text from event description
 * Looks for "Warning: " prefix in description and returns the text after it
 * @param {Object} event - Calendar event object
 * @returns {string|null} - Warning text or null if not found
 */
export const getEventWarningText = event => {
  if (!event?.description) return null;

  const match = event.description.match(/Warning:\s*(.+?)(?:\n|<|$)/i);
  if (!match) return null;

  // Strip any HTML tags that might be in the text
  const text = match[1].replace(/<[^>]*>/g, '').trim();
  return text || null;
};
