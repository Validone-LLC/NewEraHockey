/**
 * S3 Registration Store
 *
 * AWS S3-based registration storage that mirrors the Netlify Blob Storage API.
 * Used for migration from Netlify Blobs to S3 for cross-platform access.
 *
 * Environment Variables Required:
 * - NEH_AWS_ACCESS_KEY_ID: AWS access key (reuses existing SES credentials)
 * - NEH_AWS_SECRET_ACCESS_KEY: AWS secret key
 * - NEH_AWS_REGION: AWS region (default: us-east-1)
 * - S3_REGISTRATIONS_BUCKET: S3 bucket name for registrations
 */

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

// Default capacities by event type (same as Netlify store)
const DEFAULT_CAPACITY = {
  camp: 20,
  lesson: 10,
  mt_vernon_skating: 1,
  rockville_small_group: 5,
  other: 15,
};

let s3Client = null;

/**
 * Get configured S3 client (lazy initialization)
 */
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.NEH_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Get S3 bucket name from environment
 */
function getBucketName() {
  const bucket = process.env.S3_REGISTRATIONS_BUCKET;
  if (!bucket) {
    throw new Error('S3_REGISTRATIONS_BUCKET environment variable is required');
  }
  return bucket;
}

/**
 * Helper to convert stream to string
 */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Get registration data for an event from S3
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<Object>} Registration data
 */
async function getEventRegistrations(eventId) {
  const client = getS3Client();
  const bucket = getBucketName();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: `registrations/${eventId}.json`,
      })
    );

    const bodyString = await streamToString(response.Body);
    const data = JSON.parse(bodyString);

    return data;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
      // No registrations yet, return empty state
      return {
        eventId,
        maxCapacity: null,
        currentRegistrations: 0,
        registrations: [],
        createdAt: null,
        updatedAt: null,
      };
    }

    console.error(`[S3] Error fetching registrations for ${eventId}:`, error);
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
 * Initialize registration tracking for an event in S3
 * @param {string} eventId - Google Calendar event ID
 * @param {string} eventType - 'camp' or 'lesson'
 * @param {number|null} customCapacity - Optional custom capacity
 * @returns {Promise<Object>} Initialized registration data
 */
async function initializeEventRegistrations(eventId, eventType, customCapacity = null) {
  const client = getS3Client();
  const bucket = getBucketName();

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

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `registrations/${eventId}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        eventtype: eventType,
        capacity: maxCapacity.toString(),
      },
    })
  );

  return data;
}

/**
 * Add a registration to an event in S3
 * @param {string} eventId - Google Calendar event ID
 * @param {string} eventType - 'camp' or 'lesson'
 * @param {Object} registrationData - Registration details from Stripe metadata
 * @param {number} playerCount - Number of players in this registration
 * @returns {Promise<Object>} Updated registration data
 */
async function addRegistration(eventId, eventType, registrationData, playerCount = 1) {
  const client = getS3Client();
  const bucket = getBucketName();

  // Get current registration data
  let data = await getEventRegistrations(eventId);

  // Initialize if this is the first registration
  if (!data.maxCapacity) {
    data = await initializeEventRegistrations(eventId, eventType);
  }

  // Check if already sold out (skip for camps - unlimited capacity)
  if (eventType !== 'camp' && data.currentRegistrations >= data.maxCapacity) {
    throw new Error('Event is sold out');
  }

  // Add new registration with player count
  const registration = {
    id: registrationData.stripeSessionId || registrationData.id,
    timestamp: new Date().toISOString(),
    playerCount: playerCount,
    playerFirstName: registrationData.playerFirstName,
    playerLastName: registrationData.playerLastName,
    playerDateOfBirth: registrationData.playerDateOfBirth,
    playerAge: registrationData.playerAge || null,
    playerLevelOfPlay: registrationData.playerLevelOfPlay || null,
    players: registrationData.players || null,
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
  data.currentRegistrations = data.registrations.reduce((sum, reg) => sum + (reg.playerCount || 1), 0);
  data.updatedAt = new Date().toISOString();
  data.eventType = eventType;

  // Save updated data
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `registrations/${eventId}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        eventtype: eventType,
        capacity: data.maxCapacity.toString(),
        registrations: data.currentRegistrations.toString(),
      },
    })
  );

  return data;
}

/**
 * Update a registration in S3
 * @param {string} eventId - Google Calendar event ID
 * @param {string} registrationId - Registration ID to update
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated registration data
 */
async function updateRegistration(eventId, registrationId, updateData) {
  const client = getS3Client();
  const bucket = getBucketName();

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

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `registrations/${eventId}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    })
  );

  return data;
}

/**
 * Delete a registration from S3 (frees up spot)
 * @param {string} eventId - Google Calendar event ID
 * @param {string} registrationId - Registration ID to delete
 * @returns {Promise<Object>} Updated registration data
 */
async function deleteRegistration(eventId, registrationId) {
  const client = getS3Client();
  const bucket = getBucketName();

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

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `registrations/${eventId}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        eventtype: data.eventType || 'other',
        capacity: data.maxCapacity.toString(),
        registrations: data.currentRegistrations.toString(),
      },
    })
  );

  return data;
}

/**
 * Get all registrations for reporting from S3
 * @returns {Promise<Array>} All event registration data
 */
async function getAllRegistrations() {
  const client = getS3Client();
  const bucket = getBucketName();

  try {
    const listResponse = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'registrations/',
      })
    );

    const allData = [];

    for (const item of listResponse.Contents || []) {
      if (item.Key.endsWith('.json')) {
        try {
          const response = await client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: item.Key,
            })
          );

          const bodyString = await streamToString(response.Body);
          const data = JSON.parse(bodyString);
          allData.push(data);
        } catch (err) {
          console.error(`[S3] Error reading ${item.Key}:`, err);
        }
      }
    }

    return allData;
  } catch (error) {
    console.error('[S3] Error fetching all registrations:', error);
    return [];
  }
}

/**
 * Update event capacity in S3
 * @param {string} eventId - Google Calendar event ID
 * @param {number} newCapacity - New maximum capacity
 * @returns {Promise<Object>} Updated registration data
 */
async function updateEventCapacity(eventId, newCapacity) {
  const client = getS3Client();
  const bucket = getBucketName();

  let data = await getEventRegistrations(eventId);

  if (!data.createdAt) {
    throw new Error('Event has no registration data. Initialize first.');
  }

  data.maxCapacity = newCapacity;
  data.updatedAt = new Date().toISOString();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `registrations/${eventId}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    })
  );

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
    return false;
  }

  return data.currentRegistrations >= data.maxCapacity;
}

/**
 * Check if S3 storage is properly configured
 * @returns {boolean} True if S3 is configured
 */
function isS3Configured() {
  return !!(
    process.env.NEH_AWS_ACCESS_KEY_ID &&
    process.env.NEH_AWS_SECRET_ACCESS_KEY &&
    process.env.S3_REGISTRATIONS_BUCKET
  );
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
  isS3Configured,
  DEFAULT_CAPACITY,
};
