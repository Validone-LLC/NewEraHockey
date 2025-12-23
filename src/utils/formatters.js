/**
 * Shared Formatting Utilities
 *
 * Common formatting functions used across the application
 */

/**
 * Format phone number to (XXX) XXX-XXXX format
 * @param {string} value - Raw phone number input
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = value => {
  if (!value) return value;

  // Remove all non-numeric characters
  const phoneNumber = value.replace(/[^\d]/g, '');

  // Format as (XXX) XXX-XXXX
  if (phoneNumber.length < 4) return phoneNumber;
  if (phoneNumber.length < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};
