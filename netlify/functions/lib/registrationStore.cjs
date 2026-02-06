/**
 * Registration Tracking Store
 *
 * Uses Netlify Blob Storage to track event registrations without
 * modifying Google Calendar events.
 *
 * MIGRATION STATUS:
 * - Phase 1: Dual-write to Netlify Blobs + S3, read from Netlify
 * - Phase 2: Switch reads to S3 (set REGISTRATION_READ_SOURCE=s3)
 * - Phase 3: Disable Netlify writes (set DISABLE_NETLIFY_BLOBS=true)
 *
 * Note: Setting DISABLE_NETLIFY_BLOBS=true automatically enables S3 reads
 * and S3 sync to prevent data loss from inconsistent flag combinations.
 *
 * Environment Variables:
 * - ENABLE_S3_SYNC: Set to 'true' to enable S3 dual-write (Phase 1)
 * - REGISTRATION_READ_SOURCE: 'netlify' (default) or 's3' (Phase 2)
 * - DISABLE_NETLIFY_BLOBS: Set to 'true' to stop writing to Netlify (Phase 3)
 */

const { getStore } = require('@netlify/blobs');
const s3Store = require('./s3RegistrationStore.cjs');

// Default capacities by event type
const DEFAULT_CAPACITY = {
  camp: 20,
  lesson: 10,
  mt_vernon_skating: 1, // Each skating slot is typically for one person
  rockville_small_group: 5, // Small group lessons - typically 5 spots
  other: 15,
};

/**
 * Migration feature flags
 *
 * Auto-detection: When Netlify Blobs are disabled (Phase 3), S3 is automatically
 * used for both reads and writes. This prevents data loss if ENABLE_S3_SYNC or
 * REGISTRATION_READ_SOURCE aren't explicitly set alongside DISABLE_NETLIFY_BLOBS.
 */
const MIGRATION_FLAGS = {
  // Phase 1: Enable S3 sync (dual-write)
  // Auto-enabled when Netlify is disabled to prevent data loss
  isS3SyncEnabled: () =>
    (process.env.ENABLE_S3_SYNC === 'true' || process.env.DISABLE_NETLIFY_BLOBS === 'true') &&
    s3Store.isS3Configured(),

  // Phase 2: Read from S3 instead of Netlify
  // Auto-enabled when Netlify is disabled (no point reading from disabled store)
  shouldReadFromS3: () =>
    (process.env.REGISTRATION_READ_SOURCE === 's3' || process.env.DISABLE_NETLIFY_BLOBS === 'true') &&
    s3Store.isS3Configured(),

  // Phase 3: Stop writing to Netlify Blobs
  isNetlifyDisabled: () => process.env.DISABLE_NETLIFY_BLOBS === 'true',
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
 * Sync to S3 in background (non-blocking)
 * Logs errors but doesn't fail the main operation
 */
async function syncToS3(operation, ...args) {
  if (!MIGRATION_FLAGS.isS3SyncEnabled()) {
    return;
  }

  try {
    await s3Store[operation](...args);
    console.log(`[S3 Sync] Successfully synced ${operation}`);
  } catch (error) {
    // Log but don't fail - S3 is secondary during Phase 1
    console.error(`[S3 Sync] Error during ${operation}:`, error.message);
  }
}

/**
 * Get registration data for an event
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<Object>} Registration data
 */
async function getEventRegistrations(eventId) {
  // Phase 2: Read from S3
  if (MIGRATION_FLAGS.shouldReadFromS3()) {
    console.log(`[Migration] Reading from S3 for event ${eventId}`);
    return s3Store.getEventRegistrations(eventId);
  }

  // Default: Read from Netlify Blobs
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
  const maxCapacity = customCapacity || DEFAULT_CAPACITY[eventType] || DEFAULT_CAPACITY.other;

  const data = {
    eventId,
    eventType,
    maxCapacity,
    currentRegistrations: 0,
    registrations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Write to Netlify (unless disabled in Phase 3)
  if (!MIGRATION_FLAGS.isNetlifyDisabled()) {
    const store = getRegistrationStore();
    await store.set(eventId, JSON.stringify(data), {
      metadata: {
        eventType,
        capacity: maxCapacity.toString(),
      },
    });
  }

  // Sync to S3 (Phase 1+)
  await syncToS3('initializeEventRegistrations', eventId, eventType, customCapacity);

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
  // Get current registration data (from appropriate source)
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
    playerAge: registrationData.playerAge || null,
    playerLevelOfPlay: registrationData.playerLevelOfPlay || null,
    playerLeague: registrationData.playerLeague || null,
    players: registrationData.players || null, // Store players array for multi-player events
    guardianFirstName: registrationData.guardianFirstName || null,
    guardianLastName: registrationData.guardianLastName || null,
    guardianEmail: registrationData.guardianEmail,
    guardianPhone: registrationData.guardianPhone,
    guardianRelationship: registrationData.guardianRelationship || null,
    emergencyContactName: registrationData.emergencyContactName,
    emergencyContactPhone: registrationData.emergencyContactPhone,
    emergencyContactRelationship: registrationData.emergencyContactRelationship || null,
    medicalNotes: registrationData.medicalNotes,
    // Additional fields for admin panel
    amount: registrationData.amount || null,
    stripePaymentId: registrationData.stripePaymentId || registrationData.stripeSessionId || null,
    status: registrationData.status || 'confirmed',
  };

  data.registrations.push(registration);
  // Sum up all player counts from registrations (supports multi-player events)
  data.currentRegistrations = data.registrations.reduce((sum, reg) => sum + (reg.playerCount || 1), 0);
  data.updatedAt = new Date().toISOString();
  data.eventType = eventType;

  // Write to Netlify (unless disabled in Phase 3)
  if (!MIGRATION_FLAGS.isNetlifyDisabled()) {
    const store = getRegistrationStore();
    await store.set(eventId, JSON.stringify(data), {
      metadata: {
        eventType,
        capacity: data.maxCapacity.toString(),
        registrations: data.currentRegistrations.toString(),
      },
    });
  }

  // Sync to S3 (Phase 1+)
  await syncToS3('addRegistration', eventId, eventType, registrationData, playerCount);

  return data;
}

/**
 * Update a registration
 * @param {string} eventId - Google Calendar event ID
 * @param {string} registrationId - Registration ID to update
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated registration data
 */
async function updateRegistration(eventId, registrationId, updateData) {
  let data = await getEventRegistrations(eventId);

  if (!data.createdAt) {
    throw new Error('Event has no registration data');
  }

  const regIndex = data.registrations.findIndex((r) => r.id === registrationId);
  if (regIndex === -1) {
    throw new Error('Registration not found');
  }

  // Update registration fields
  data.registrations[regIndex] = {
    ...data.registrations[regIndex],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate player count if needed
  if (updateData.playerCount !== undefined) {
    data.currentRegistrations = data.registrations.reduce((sum, reg) => sum + (reg.playerCount || 1), 0);
  }

  data.updatedAt = new Date().toISOString();

  // Write to Netlify (unless disabled in Phase 3)
  if (!MIGRATION_FLAGS.isNetlifyDisabled()) {
    const store = getRegistrationStore();
    await store.set(eventId, JSON.stringify(data));
  }

  // Sync to S3
  await syncToS3('updateRegistration', eventId, registrationId, updateData);

  return data;
}

/**
 * Delete a registration (frees up spot)
 * @param {string} eventId - Google Calendar event ID
 * @param {string} registrationId - Registration ID to delete
 * @returns {Promise<Object>} Updated registration data
 */
async function deleteRegistration(eventId, registrationId) {
  let data = await getEventRegistrations(eventId);

  if (!data.createdAt) {
    throw new Error('Event has no registration data');
  }

  const regIndex = data.registrations.findIndex((r) => r.id === registrationId);
  if (regIndex === -1) {
    throw new Error('Registration not found');
  }

  // Remove registration
  data.registrations.splice(regIndex, 1);

  // Recalculate spot count
  data.currentRegistrations = data.registrations.reduce((sum, reg) => sum + (reg.playerCount || 1), 0);
  data.updatedAt = new Date().toISOString();

  // Write to Netlify (unless disabled in Phase 3)
  if (!MIGRATION_FLAGS.isNetlifyDisabled()) {
    const store = getRegistrationStore();
    await store.set(eventId, JSON.stringify(data), {
      metadata: {
        eventType: data.eventType || 'other',
        capacity: data.maxCapacity.toString(),
        registrations: data.currentRegistrations.toString(),
      },
    });
  }

  // Sync to S3
  await syncToS3('deleteRegistration', eventId, registrationId);

  return data;
}

/**
 * Get all registrations for reporting
 * @returns {Promise<Array>} All event registration data
 */
async function getAllRegistrations() {
  // Phase 2: Read from S3
  if (MIGRATION_FLAGS.shouldReadFromS3()) {
    console.log('[Migration] Reading all registrations from S3');
    return s3Store.getAllRegistrations();
  }

  // Default: Read from Netlify Blobs
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
  let data = await getEventRegistrations(eventId);

  if (!data.createdAt) {
    throw new Error('Event has no registration data. Initialize first.');
  }

  data.maxCapacity = newCapacity;
  data.updatedAt = new Date().toISOString();

  // Write to Netlify (unless disabled in Phase 3)
  if (!MIGRATION_FLAGS.isNetlifyDisabled()) {
    const store = getRegistrationStore();
    await store.set(eventId, JSON.stringify(data));
  }

  // Sync to S3
  await syncToS3('updateEventCapacity', eventId, newCapacity);

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

/**
 * Get current migration status (for debugging)
 * @returns {Object} Migration flags status
 */
function getMigrationStatus() {
  return {
    s3SyncEnabled: MIGRATION_FLAGS.isS3SyncEnabled(),
    readSource: MIGRATION_FLAGS.shouldReadFromS3() ? 's3' : 'netlify',
    netlifyDisabled: MIGRATION_FLAGS.isNetlifyDisabled(),
    s3Configured: s3Store.isS3Configured(),
  };
}

module.exports = {
  getEventRegistrations,
  initializeEventRegistrations,
  addRegistration,
  updateRegistration,
  deleteRegistration,
  getAllRegistrations,
  updateEventCapacity,
  isEventSoldOut,
  getMigrationStatus,
  DEFAULT_CAPACITY,
};
