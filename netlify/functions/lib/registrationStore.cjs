/**
 * Registration Tracking Store
 *
 * Uses AWS S3 to track event registrations without
 * modifying Google Calendar events.
 *
 * Environment Variables Required:
 * - NEH_AWS_ACCESS_KEY_ID: AWS access key
 * - NEH_AWS_SECRET_ACCESS_KEY: AWS secret key
 * - NEH_AWS_REGION: AWS region (default: us-east-1)
 * - S3_REGISTRATIONS_BUCKET: S3 bucket name for registrations
 */

const s3Store = require('./s3RegistrationStore.cjs');

module.exports = {
  getEventRegistrations: s3Store.getEventRegistrations,
  initializeEventRegistrations: s3Store.initializeEventRegistrations,
  addRegistration: s3Store.addRegistration,
  updateRegistration: s3Store.updateRegistration,
  deleteRegistration: s3Store.deleteRegistration,
  getAllRegistrations: s3Store.getAllRegistrations,
  updateEventCapacity: s3Store.updateEventCapacity,
  isEventSoldOut: s3Store.isEventSoldOut,
  DEFAULT_CAPACITY: s3Store.DEFAULT_CAPACITY,
};
