/**
 * Calendar Service
 *
 * Provides API for fetching calendar events from Netlify function
 * with support for incremental sync, automatic polling, and 6-hour caching
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
} from '../utils/registrationHelpers';

let syncToken = null;
let pollingInterval = null;

// Cache configuration
const CACHE_TTL = 60 * 1000; // 60 seconds in milliseconds (reduced for real-time updates)
const CACHE_KEY_PREFIX = 'calendar_events_';

/**
 * Cache utilities
 */
const cache = {
  get(key) {
    try {
      const item = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      const now = Date.now();

      // Check if expired
      if (now - timestamp > CACHE_TTL) {
        this.remove(key);
        return null;
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

    console.log(`🌐 Fetching single event: ${eventId}`);

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
        console.log(`📦 Cache hit: ${cacheKey}`);
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

    console.log(`🌐 API call: ${cacheKey}`);

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
    console.log(`🗑️ Cache invalidated: ${eventType}`);
  } else {
    cache.clear();
    console.log('🗑️ All cache invalidated');
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
};
