/**
 * HTML Utility Functions for Serverless Functions
 *
 * Provides security utilities for handling user input in HTML contexts
 */

/**
 * Escape HTML entities to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string safe for HTML insertion
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return String(str).replace(/[&<>"'`=/]/g, char => htmlEntities[char]);
}

/**
 * Escape multiple values in an object
 * @param {Object} obj - Object with string values to escape
 * @returns {Object} - Object with escaped values
 */
function escapeHtmlObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const escaped = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      escaped[key] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      escaped[key] = value.map(item =>
        typeof item === 'object' ? escapeHtmlObject(item) : escapeHtml(item)
      );
    } else if (typeof value === 'object' && value !== null) {
      escaped[key] = escapeHtmlObject(value);
    } else {
      escaped[key] = value;
    }
  }
  return escaped;
}

/**
 * Format date from YYYY-MM-DD to MM/DD/YYYY
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Date in MM/DD/YYYY format or 'N/A' if invalid
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return escapeHtml(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date in YYYY-MM-DD format
 * @returns {number|null} - Age in years or null if invalid
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return null;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format an event date/time string for display in emails
 * Handles both date-only (YYYY-MM-DD) and ISO datetime (YYYY-MM-DDTHH:MM:SSZ) formats
 * @param {string} dateTimeString - Date or datetime string
 * @returns {string} - Formatted date/time or 'N/A' if invalid
 */
function formatEventDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return escapeHtml(dateTimeString);

  // Check if this is a date-only value (no time component)
  const isDateOnly = !dateTimeString.includes('T');

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  };

  if (!isDateOnly) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return date.toLocaleString('en-US', options);
}

module.exports = {
  escapeHtml,
  escapeHtmlObject,
  formatDate,
  formatEventDateTime,
  calculateAge,
};
