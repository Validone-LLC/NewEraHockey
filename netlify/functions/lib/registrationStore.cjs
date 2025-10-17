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
  other: 15,
};

/**
 * Get registration data for an event
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<Object>} Registration data
 */
async function getEventRegistrations(eventId) {
  const store = getStore('registrations');

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
  const store = getStore('registrations');

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
 * @returns {Promise<Object>} Updated registration data
 */
async function addRegistration(eventId, eventType, registrationData) {
  const store = getStore('registrations');

  // Get current registration data
  let data = await getEventRegistrations(eventId);

  // Initialize if this is the first registration
  if (!data.maxCapacity) {
    data = await initializeEventRegistrations(eventId, eventType);
  }

  // Check if already sold out
  if (data.currentRegistrations >= data.maxCapacity) {
    throw new Error('Event is sold out');
  }

  // Add new registration
  const registration = {
    id: registrationData.stripeSessionId || registrationData.id,
    timestamp: new Date().toISOString(),
    playerFirstName: registrationData.playerFirstName,
    playerLastName: registrationData.playerLastName,
    playerDateOfBirth: registrationData.playerDateOfBirth,
    guardianEmail: registrationData.guardianEmail,
    guardianPhone: registrationData.guardianPhone,
    emergencyContactName: registrationData.emergencyContactName,
    emergencyContactPhone: registrationData.emergencyContactPhone,
    medicalNotes: registrationData.medicalNotes,
  };

  data.registrations.push(registration);
  data.currentRegistrations = data.registrations.length;
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
  const store = getStore('registrations');

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
  const store = getStore('registrations');

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
