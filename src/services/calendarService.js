/**
 * Calendar Service
 *
 * Provides API for fetching calendar events from Netlify function
 * with support for incremental sync, automatic polling, and 60-second caching
 */

import {
  isRegistrationEnabled,
  isSoldOut,
  isDescriptionMarkedFull,
  getCurrentRegistrations,
  getMaxCapacity,
  getRemainingSpots,
  hasCapacityInfo,
  getRegistrationButtonText,
  shouldHideEvent,
  getPrice,
  getFormattedPrice,
  canRegister,
  getRegistrationStatus,
  getEventCustomText,
  getEventWarningText,
} from '../utils/registrationHelpers';
import { shouldShowTestEvents } from '../config/featureFlags';
import { GOOGLE_CALENDAR_COLORS } from '../config/constants';

let syncToken = null;
let pollingInterval = null;

// Cache configuration
const CACHE_TTL = 60 * 1000; // 60 seconds in milliseconds (reduced for real-time updates)
const CACHE_KEY_PREFIX = 'calendar_events_';

/**
 * Cache utilities
 */
const cache = {
  get(key, { allowExpired = false } = {}) {
    try {
      const item = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      const now = Date.now();
      const isExpired = now - timestamp > CACHE_TTL;

      if (isExpired && !allowExpired) {
        this.remove(key);
        return null;
      }

      // Tag stale data so consumers can display a warning
      if (isExpired && allowExpired) {
        return { ...data, _stale: true, _cachedAt: timestamp };
      }

      return data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  },

  set(key, data) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  },
};

/**
 * Fetch a single event by ID (no caching, always fresh)
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<Object>} - { event: Object, timestamp: string }
 */
export const fetchEventById = async eventId => {
  try {
    // Build URL with eventId parameter
    const url = new URL('/.netlify/functions/calendar-event', window.location.origin);
    url.searchParams.set('eventId', eventId);

    // Fetch from Netlify function
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch event');
    }

    const data = await response.json();

    return {
      event: data.event,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Calendar service error (single event):', error);
    throw error;
  }
};

/**
 * Fetch events from the calendar API with caching
 * @param {string|null} eventType - 'camp', 'lesson', or null for all events
 * @param {boolean} useSync - Whether to use incremental sync with sync token
 * @param {boolean} useCache - Whether to check cache before API call (default: true)
 * @returns {Promise<Object>} - { events: [], total: number, nextSyncToken: string, cached: boolean }
 */
export const fetchEvents = async (eventType = null, useSync = true, useCache = true) => {
  try {
    // Generate cache key based on event type
    const cacheKey = eventType || 'all';

    // Check cache first (if enabled)
    if (useCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return {
          ...cachedData,
          cached: true,
        };
      }
    }

    // Build URL with query parameters
    const url = new URL('/.netlify/functions/calendar-events', window.location.origin);

    if (eventType) {
      url.searchParams.set('type', eventType);
    }

    if (useSync && syncToken) {
      url.searchParams.set('syncToken', syncToken);
    }

    // Fetch from Netlify function
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch events');
    }

    const data = await response.json();

    // Update sync token for next incremental fetch
    if (data.nextSyncToken) {
      syncToken = data.nextSyncToken;
    }

    const result = {
      events: data.events || [],
      total: data.total || 0,
      nextSyncToken: data.nextSyncToken,
      timestamp: data.timestamp,
      cached: false,
    };

    // Cache the result
    cache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Calendar service error:', error);

    // Fallback: return expired cache data if API fails
    const cacheKey = eventType || 'all';
    const staleData = cache.get(cacheKey, { allowExpired: true });
    if (staleData) {
      console.warn('Using stale cached data as fallback');
      return {
        ...staleData,
        cached: true,
      };
    }

    throw error;
  }
};

/**
 * Fetch only camp events
 * @returns {Promise<Object>}
 */
export const fetchCamps = async () => {
  return fetchEvents('camp');
};

/**
 * Fetch only lesson events
 * @returns {Promise<Object>}
 */
export const fetchLessons = async () => {
  return fetchEvents('lesson');
};

/**
 * Fetch only Mt Vernon Skating events
 * @returns {Promise<Object>}
 */
export const fetchMtVernonSkating = async () => {
  return fetchEvents('mt_vernon_skating');
};

/**
 * Fetch only Rockville Small Group events
 * @returns {Promise<Object>}
 */
export const fetchRockvilleSmallGroup = async () => {
  return fetchEvents('rockville_small_group');
};

/**
 * Fetch all events without filtering
 * @returns {Promise<Object>}
 */
export const fetchAllEvents = async () => {
  return fetchEvents(null);
};

/**
 * Reset sync token to force full refresh
 */
export const resetSync = () => {
  syncToken = null;
};

/**
 * Start automatic polling for calendar updates
 * @param {Function} callback - Function to call with new events
 * @param {string|null} eventType - Type of events to fetch ('camp', 'lesson', or null)
 * @param {number} interval - Poll interval in milliseconds (default: 5 minutes)
 * @param {boolean} skipInitialFetch - Skip initial fetch if data already loaded (default: false)
 * @returns {Function} - Stop function to cancel polling
 */
export const startPolling = (
  callback,
  eventType = null,
  interval = 300000,
  skipInitialFetch = false
) => {
  // Clear any existing polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // Initial fetch (unless skipped)
  if (!skipInitialFetch) {
    fetchEvents(eventType, true)
      .then(data => callback(data.events))
      .catch(error => console.error('Initial fetch error:', error));
  }

  // Set up polling (bypass cache to get fresh data)
  pollingInterval = setInterval(async () => {
    try {
      const data = await fetchEvents(eventType, true, false); // Skip cache for polling
      callback(data.events);
    } catch (error) {
      console.error('Polling error:', error);
      // Don't stop polling on error - calendar might be temporarily unavailable
    }
  }, interval);

  // Return stop function
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };
};

/**
 * Stop automatic polling
 */
export const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

/**
 * Check if polling is active
 * @returns {boolean}
 */
export const isPolling = () => {
  return pollingInterval !== null;
};

/**
 * Sync events with incremental update
 * Used for efficient polling - only fetches changes since last sync
 * @param {string|null} eventType - Type of events to sync
 * @returns {Promise<Object>} - { events: [], hasChanges: boolean }
 */
export const syncEvents = async eventType => {
  try {
    const data = await fetchEvents(eventType, true);

    // If no events returned, it means no changes (when using sync token)
    const hasChanges = !syncToken || data.events.length > 0;

    return {
      events: data.events,
      hasChanges,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
};

/**
 * Force full refresh of all events
 * Clears cache, sync token, and fetches fresh data
 * @param {string|null} eventType - Type of events to fetch
 * @returns {Promise<Object>}
 */
export const refreshEvents = async eventType => {
  const cacheKey = eventType || 'all';
  cache.remove(cacheKey);
  resetSync();
  return fetchEvents(eventType, false, false); // Skip cache check
};

/**
 * Invalidate cache for specific event type or all
 * @param {string|null} eventType - Type to invalidate, null for all
 */
export const invalidateCache = eventType => {
  if (eventType) {
    cache.remove(eventType);
  } else {
    cache.clear();
  }
};

/**
 * Check if data is cached
 * @param {string|null} eventType - Type to check
 * @returns {boolean}
 */
export const isCached = eventType => {
  const cacheKey = eventType || 'all';
  return cache.get(cacheKey) !== null;
};

// ============================================================
// Registration Data Utilities
// ============================================================

/**
 * Filter out sold out events (for lessons display)
 * @param {Array} events - Array of calendar events
 * @param {string} eventType - 'camps' or 'lessons'
 * @returns {Array} - Filtered events
 */
export const filterVisibleEvents = (events, eventType) => {
  return events.filter(event => !shouldHideEvent(event, eventType));
};

/**
 * Filter out booked At Home Training events
 * Yellow color (AT_HOME_BOOKED) = booked, hide from public view
 * @param {Array} events - Array of calendar events
 * @returns {Array} - Only available (non-booked) events
 */
export const filterAvailableAtHomeTraining = events => {
  return events.filter(event => {
    // Yellow (AT_HOME_BOOKED) = booked slot, filter out
    if (event.colorId === GOOGLE_CALENDAR_COLORS.AT_HOME_BOOKED) return false;
    return true;
  });
};

/**
 * Filter out registered, sold-out, and incomplete Mt Vernon Skating events
 * Yellow color (MT_VERNON_SKATING_REGISTERED) = already registered, hide from public view
 * Green color (MT_VERNON_SKATING_AVAILABLE) = available for registration
 * Also hides events marked as sold out via registrationData
 * Also hides events missing required fields (price) to prevent incomplete listings
 *
 * Note: This function is only called on events already fetched as mt_vernon_skating type,
 * so no title matching is needed - all events in the array are Mt Vernon events.
 * @param {Array} events - Array of calendar events (pre-filtered to mt_vernon_skating type)
 * @returns {Array} - Only available Mt Vernon Skating events with complete info
 */
export const filterAvailableMtVernonSkating = events => {
  return events.filter(event => {
    // Hide registered events (yellow color)
    if (event.colorId === GOOGLE_CALENDAR_COLORS.MT_VERNON_SKATING_REGISTERED) return false;
    // Hide sold out events
    if (isSoldOut(event)) return false;
    // Hide events without a price (incomplete setup)
    if (getPrice(event) === null) return false;
    return true;
  });
};

/**
 * Filter out sold-out or incomplete Rockville Small Group events
 * Hides events marked as sold out via registrationData
 * Hides events missing required fields (price) to prevent incomplete listings
 *
 * @param {Array} events - Array of calendar events (pre-filtered to rockville_small_group type)
 * @returns {Array} - Only available Rockville Small Group events with complete info
 */
export const filterAvailableRockvilleSmallGroup = events => {
  return events.filter(event => {
    // Hide sold out events
    if (isSoldOut(event)) return false;
    // Hide events without a price (incomplete setup)
    if (getPrice(event) === null) return false;
    return true;
  });
};

/**
 * Filter out dev-only events based on environment flag
 * Dev-only events are identified by:
 * - Graphite color (#8) in Google Calendar, OR
 * - [DEV ONLY] or [DEV-ONLY] marker in title (with or without hyphen)
 * These are only visible when VITE_SHOW_TEST_EVENTS=true (local dev)
 * @param {Array} events - Array of calendar events
 * @returns {Array} - Events with dev-only events filtered based on environment
 */
export const filterTestEvents = events => {
  // If flag is enabled, show all events including dev-only events
  if (shouldShowTestEvents()) {
    return events;
  }
  // Otherwise, filter out dev-only events (Graphite color OR [DEV ONLY]/[DEV-ONLY] in title)
  return events.filter(event => {
    // Check for Graphite color (dev-only marker)
    if (event.colorId === GOOGLE_CALENDAR_COLORS.DEV_ONLY) {
      return false;
    }
    // Check for [DEV ONLY] or [DEV-ONLY] in title (handles both space and hyphen variants)
    const title = (event.summary || '').toLowerCase();
    if (title.includes('[dev only]') || title.includes('[dev-only]')) {
      return false;
    }
    return true;
  });
};

/**
 * Fetch At Home Training events for a specific month
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} - { events: [], total: number, timestamp: string }
 */
export const fetchAtHomeTrainingByMonth = async (year, month) => {
  try {
    const url = new URL('/.netlify/functions/calendar-events', window.location.origin);
    url.searchParams.set('type', 'at_home_training');
    url.searchParams.set('year', year);
    url.searchParams.set('month', month);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the month data
    const cacheKey = `at_home_training_${year}_${month}`;
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

    return data;
  } catch (error) {
    console.error('Error fetching At Home Training events by month:', error);
    throw error;
  }
};

/**
 * Get only events that accept registrations
 * @param {Array} events - Array of calendar events
 * @returns {Array} - Events that can be registered for
 */
export const getRegisterableEvents = events => {
  return events.filter(event => canRegister(event));
};

/**
 * Get only sold out events
 * @param {Array} events - Array of calendar events
 * @returns {Array} - Sold out events
 */
export const getSoldOutEvents = events => {
  return events.filter(event => isSoldOut(event));
};

/**
 * Sort events by remaining spots (low to high)
 * Events with no capacity info are placed at the end
 * @param {Array} events - Array of calendar events
 * @returns {Array} - Sorted events
 */
export const sortByRemainingSpots = events => {
  return [...events].sort((a, b) => {
    const remainingA = getRemainingSpots(a);
    const remainingB = getRemainingSpots(b);

    // Events with no capacity info go to end
    if (remainingA === null) return 1;
    if (remainingB === null) return -1;

    return remainingA - remainingB;
  });
};

/**
 * Get event statistics for a set of events
 * @param {Array} events - Array of calendar events
 * @returns {Object} - Statistics object
 */
export const getEventStatistics = events => {
  return {
    total: events.length,
    registrationEnabled: events.filter(e => isRegistrationEnabled(e)).length,
    soldOut: events.filter(e => isSoldOut(e)).length,
    available: events.filter(e => canRegister(e)).length,
    withCapacity: events.filter(e => hasCapacityInfo(e)).length,
    totalCapacity: events.reduce((sum, e) => sum + (getMaxCapacity(e) || 0), 0),
    totalRegistrations: events.reduce((sum, e) => sum + getCurrentRegistrations(e), 0),
  };
};

// Re-export registration helpers for convenience
export {
  isRegistrationEnabled,
  isSoldOut,
  isDescriptionMarkedFull,
  getCurrentRegistrations,
  getMaxCapacity,
  getRemainingSpots,
  hasCapacityInfo,
  getRegistrationButtonText,
  shouldHideEvent,
  getPrice,
  getFormattedPrice,
  canRegister,
  getRegistrationStatus,
  getEventCustomText,
  getEventWarningText,
};
