/**
 * Registration Tracking Store
 *
 * Uses Netlify Blob Storage to track event registrations without
 * modifying Google Calendar events.
 *
 * This provides:
 * - Zero-config registration (no manual extended properties)
 * - Automatic capacity tracking
 * - Registration history
 * - Sold-out detection
 */

const { getStore } = require('@netlify/blobs');

// Default capacities by event type
const DEFAULT_CAPACITY = {
  camp: 20,
  lesson: 10,
  mt_vernon_skating: 1, // Each skating slot is typically for one person
  rockville_small_group: 5, // Small group lessons - typically 5 spots
  other: 15,
};

/**
 * Get configured Netlify Blobs store
 * Handles both local development (requires explicit config) and production (auto-configured)
 */
function getRegistrationStore() {
  // For local development, explicitly pass credentials in options object
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN) {
    return getStore({
      name: 'registrations',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });
  }

  // Production: auto-configured by Netlify
  return getStore('registrations');
}

/**
 * Get registration data for an event
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<Object>} Registration data
 */
async function getEventRegistrations(eventId) {
  const store = getRegistrationStore();

  try {
    const data = await store.get(eventId, { type: 'json' });

    if (!data) {
      // No registrations yet, return empty state
      return {
        eventId,
        maxCapacity: null, // Will be set on first registration
        currentRegistrations: 0,
        registrations: [],
        createdAt: null,
        updatedAt: null,
      };
    }

    return data;
  } catch (error) {
    console.error(`Error fetching registrations for ${eventId}:`, error);
    return {
      eventId,
      maxCapacity: null,
      currentRegistrations: 0,
      registrations: [],
      createdAt: null,
      updatedAt: null,
    };
  }
}

/**
 * Initialize registration tracking for an event
 * @param {string} eventId - Google Calendar event ID
 * @param {string} eventType - 'camp' or 'lesson'
 * @param {number|null} customCapacity - Optional custom capacity
 * @returns {Promise<Object>} Initialized registration data
 */
async function initializeEventRegistrations(eventId, eventType, customCapacity = null) {
  const store = getRegistrationStore();

  const maxCapacity = customCapacity || DEFAULT_CAPACITY[eventType] || DEFAULT_CAPACITY.other;

  const data = {
    eventId,
    maxCapacity,
    currentRegistrations: 0,
    registrations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.set(eventId, JSON.stringify(data), {
    metadata: {
      eventType,
      capacity: maxCapacity.toString(),
    },
  });

  return data;
}

/**
 * Add a registration to an event
 * @param {string} eventId - Google Calendar event ID
 * @param {string} eventType - 'camp' or 'lesson'
 * @param {Object} registrationData - Registration details from Stripe metadata
 * @param {number} playerCount - Number of players in this registration (for multi-player events)
 * @returns {Promise<Object>} Updated registration data
 */
async function addRegistration(eventId, eventType, registrationData, playerCount = 1) {
  const store = getRegistrationStore();

  // Get current registration data
  let data = await getEventRegistrations(eventId);

  // Initialize if this is the first registration
  if (!data.maxCapacity) {
    data = await initializeEventRegistrations(eventId, eventType);
  }

  // Check if already sold out (skip for camps - unlimited capacity)
  // Note: Camps have unlimited spots as of Jan 2026
  if (eventType !== 'camp' && data.currentRegistrations >= data.maxCapacity) {
    throw new Error('Event is sold out');
  }

  // Add new registration with player count
  const registration = {
    id: registrationData.stripeSessionId || registrationData.id,
    timestamp: new Date().toISOString(),
    playerCount: playerCount, // Track number of players in this registration
    playerFirstName: registrationData.playerFirstName,
    playerLastName: registrationData.playerLastName,
    playerDateOfBirth: registrationData.playerDateOfBirth,
    players: registrationData.players || null, // Store players array for multi-player events
    guardianEmail: registrationData.guardianEmail,
    guardianPhone: registrationData.guardianPhone,
    emergencyContactName: registrationData.emergencyContactName,
    emergencyContactPhone: registrationData.emergencyContactPhone,
    medicalNotes: registrationData.medicalNotes,
  };

  data.registrations.push(registration);
  // Sum up all player counts from registrations (supports multi-player events)
  data.currentRegistrations = data.registrations.reduce((sum, reg) => sum + (reg.playerCount || 1), 0);
  data.updatedAt = new Date().toISOString();

  // Save updated data
  await store.set(eventId, JSON.stringify(data), {
    metadata: {
      eventType,
      capacity: data.maxCapacity.toString(),
      registrations: data.currentRegistrations.toString(),
    },
  });

  return data;
}

/**
 * Get all registrations for reporting
 * @returns {Promise<Array>} All event registration data
 */
async function getAllRegistrations() {
  const store = getRegistrationStore();

  try {
    const list = await store.list();
    const allData = [];

    for (const item of list.blobs) {
      const data = await store.get(item.key, { type: 'json' });
      if (data) {
        allData.push(data);
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all registrations:', error);
    return [];
  }
}

/**
 * Update event capacity
 * @param {string} eventId - Google Calendar event ID
 * @param {number} newCapacity - New maximum capacity
 * @returns {Promise<Object>} Updated registration data
 */
async function updateEventCapacity(eventId, newCapacity) {
  const store = getRegistrationStore();

  let data = await getEventRegistrations(eventId);

  if (!data.createdAt) {
    throw new Error('Event has no registration data. Initialize first.');
  }

  data.maxCapacity = newCapacity;
  data.updatedAt = new Date().toISOString();

  await store.set(eventId, JSON.stringify(data));

  return data;
}

/**
 * Check if event is sold out
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<boolean>} True if sold out
 */
async function isEventSoldOut(eventId) {
  const data = await getEventRegistrations(eventId);

  if (!data.maxCapacity) {
    return false; // No capacity set = not sold out
  }

  return data.currentRegistrations >= data.maxCapacity;
}

module.exports = {
  getEventRegistrations,
  initializeEventRegistrations,
  addRegistration,
  getAllRegistrations,
  updateEventCapacity,
  isEventSoldOut,
  DEFAULT_CAPACITY,
};
