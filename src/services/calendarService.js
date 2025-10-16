/**
 * Calendar Service
 *
 * Provides API for fetching calendar events from Netlify function
 * with support for incremental sync and automatic polling
 */

let syncToken = null;
let pollingInterval = null;

/**
 * Fetch events from the calendar API
 * @param {string|null} eventType - 'camp', 'lesson', or null for all events
 * @param {boolean} useSync - Whether to use incremental sync with sync token
 * @returns {Promise<Object>} - { events: [], total: number, nextSyncToken: string }
 */
export const fetchEvents = async (eventType = null, useSync = true) => {
  try {
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

    return {
      events: data.events || [],
      total: data.total || 0,
      nextSyncToken: data.nextSyncToken,
      timestamp: data.timestamp,
    };
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
 * @returns {Function} - Stop function to cancel polling
 */
export const startPolling = (callback, eventType = null, interval = 300000) => {
  // Clear any existing polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // Initial fetch
  fetchEvents(eventType, true)
    .then(data => callback(data.events))
    .catch(error => console.error('Initial fetch error:', error));

  // Set up polling
  pollingInterval = setInterval(async () => {
    try {
      const data = await fetchEvents(eventType, true);
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
 * Clears sync token and fetches everything
 * @param {string|null} eventType - Type of events to fetch
 * @returns {Promise<Object>}
 */
export const refreshEvents = async eventType => {
  resetSync();
  return fetchEvents(eventType, false);
};
