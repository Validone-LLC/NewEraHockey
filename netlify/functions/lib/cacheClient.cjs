/**
 * Cache Client - DynamoDB cache write-through for Stripe webhook
 *
 * Lightweight client that writes to the admin API's DynamoDB cache
 * when registrations are created via Stripe payments.
 *
 * This ensures the admin dashboard sees fresh data immediately
 * after a payment completes.
 */

const {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

// TTL Configuration (seconds)
const TTL = {
  REGISTRATION: 60,      // 60s for registration data
  REGISTRATION_META: 60, // 60s for lightweight meta
};

// Cache key patterns (must match admin cacheService.js)
const CACHE_KEYS = {
  registration: (eventId) => ({ pk: `REG#${eventId}`, sk: 'DATA' }),
  registrationMeta: (eventId) => ({ pk: `REG#${eventId}`, sk: 'META' }),
  globalStats: () => ({ pk: 'STATS', sk: 'GLOBAL' }),
  monthlyStats: (yearMonth) => ({ pk: 'STATS', sk: `MONTHLY#${yearMonth}` }),
  etag: (eventId) => ({ pk: `ETAG#${eventId}`, sk: 'S3' }),
};

let dynamoClient = null;

/**
 * Check if cache is configured
 */
function isCacheConfigured() {
  return !!(
    process.env.CACHE_TABLE_NAME &&
    process.env.NEH_AWS_ACCESS_KEY_ID &&
    process.env.NEH_AWS_SECRET_ACCESS_KEY
  );
}

/**
 * Get configured DynamoDB client (lazy initialization)
 */
function getDynamoClient() {
  if (!dynamoClient) {
    dynamoClient = new DynamoDBClient({
      region: process.env.NEH_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.NEH_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEH_AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return dynamoClient;
}

/**
 * Get cache table name from environment
 */
function getTableName() {
  return process.env.CACHE_TABLE_NAME || null;
}

/**
 * Calculate TTL timestamp
 */
function calculateTTL(seconds) {
  return Math.floor(Date.now() / 1000) + seconds;
}

/**
 * Store registration data in cache (write-through)
 * @param {string} eventId - Event ID
 * @param {Object} data - Registration data to cache
 */
async function setCachedRegistration(eventId, data) {
  if (!isCacheConfigured()) {
    console.log('[Cache] Not configured, skipping write-through');
    return;
  }

  const tableName = getTableName();
  if (!tableName) return;

  try {
    const client = getDynamoClient();
    const key = CACHE_KEYS.registration(eventId);

    await client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall({
          ...key,
          data,
          ttl: calculateTTL(TTL.REGISTRATION),
          updatedAt: new Date().toISOString(),
        }),
      })
    );

    // Also update lightweight meta for listings
    const metaKey = CACHE_KEYS.registrationMeta(eventId);
    await client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall({
          ...metaKey,
          currentRegistrations: data.currentRegistrations || 0,
          maxCapacity: data.maxCapacity || null,
          eventType: data.eventType,
          ttl: calculateTTL(TTL.REGISTRATION_META),
        }),
      })
    );

    console.log(`[Cache] Write-through complete for event ${eventId}`);
  } catch (error) {
    // Log but don't fail - S3 is source of truth
    console.error('[Cache] Write-through error:', error.message);
  }
}

/**
 * Invalidate registration cache (on delete)
 * @param {string} eventId - Event ID to invalidate
 */
async function invalidateRegistrationCache(eventId) {
  if (!isCacheConfigured()) return;

  const tableName = getTableName();
  if (!tableName) return;

  try {
    const client = getDynamoClient();

    await Promise.all([
      client.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: marshall(CACHE_KEYS.registration(eventId)),
        })
      ),
      client.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: marshall(CACHE_KEYS.registrationMeta(eventId)),
        })
      ),
    ]);

    console.log(`[Cache] Invalidated cache for event ${eventId}`);
  } catch (error) {
    console.error('[Cache] Invalidation error:', error.message);
  }
}

/**
 * Increment stats atomically on registration add
 * @param {Object} registration - New registration data
 */
async function incrementStats(registration) {
  if (!isCacheConfigured()) return;

  const tableName = getTableName();
  if (!tableName) return;

  try {
    const client = getDynamoClient();
    const key = CACHE_KEYS.globalStats();

    await client.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: marshall(key),
        UpdateExpression: `
          SET totalRegistrations = if_not_exists(totalRegistrations, :zero) + :count,
              totalRevenue = if_not_exists(totalRevenue, :zero) + :amount,
              lastUpdated = :now,
              computedBy = :method
        `,
        ExpressionAttributeValues: marshall({
          ':count': registration.playerCount || 1,
          ':amount': registration.amount || 0,
          ':now': new Date().toISOString(),
          ':method': 'incremental',
          ':zero': 0,
        }),
      })
    );

    // Update monthly stats
    const yearMonth = new Date().toISOString().slice(0, 7);
    const monthlyKey = CACHE_KEYS.monthlyStats(yearMonth);

    await client.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: marshall(monthlyKey),
        UpdateExpression: `
          SET registrations = if_not_exists(registrations, :zero) + :count,
              revenue = if_not_exists(revenue, :zero) + :amount,
              ttl = :ttl
        `,
        ExpressionAttributeValues: marshall({
          ':count': registration.playerCount || 1,
          ':amount': registration.amount || 0,
          ':ttl': calculateTTL(300), // 5min TTL for stats
          ':zero': 0,
        }),
      })
    );

    console.log('[Cache] Stats incremented for new registration');
  } catch (error) {
    console.error('[Cache] Stats increment error:', error.message);
  }
}

module.exports = {
  isCacheConfigured,
  setCachedRegistration,
  invalidateRegistrationCache,
  incrementStats,
  CACHE_KEYS,
  TTL,
};
