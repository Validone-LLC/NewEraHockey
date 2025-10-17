/**
 * Price Parser Utility
 *
 * Extracts price information from event descriptions or extended properties
 * Supports multiple price formats for flexibility
 */

/**
 * Parse price from event description
 * Looks for patterns like:
 * - "Price: $350"
 * - "$350.00"
 * - "Price: 350"
 * - "Cost: $25"
 *
 * @param {string} description - Event description text
 * @returns {number|null} - Price in dollars, or null if not found
 */
export const parsePriceFromDescription = description => {
  if (!description || typeof description !== 'string') return null;

  // Pattern 1: "Price:" or "Cost:" followed by optional $ and number
  const pricePattern1 = /(price|cost):\s*\$?(\d+(?:\.\d{2})?)/i;
  const match1 = description.match(pricePattern1);
  if (match1) {
    return parseFloat(match1[2]);
  }

  // Pattern 2: Standalone dollar amount (e.g., "$350" or "$350.00")
  const pricePattern2 = /\$(\d+(?:\.\d{2})?)/;
  const match2 = description.match(pricePattern2);
  if (match2) {
    return parseFloat(match2[1]);
  }

  return null;
};

/**
 * Get price from event object
 * Priority: extended properties > description parsing
 *
 * @param {Object} event - Google Calendar event object
 * @returns {number|null} - Price in dollars, or null if not found
 */
export const getEventPrice = event => {
  if (!event) return null;

  // Priority 1: Extended properties
  const extProps = event.extendedProperties?.shared || {};
  if (extProps.price) {
    const price = parseFloat(extProps.price);
    if (!isNaN(price)) return price;
  }

  // Priority 2: registrationData (if event was already enriched)
  if (event.registrationData?.price !== undefined) {
    return event.registrationData.price;
  }

  // Priority 3: Parse from description
  return parsePriceFromDescription(event.description);
};

/**
 * Format price for display
 * @param {number|null} price - Price in dollars
 * @param {boolean} includeCents - Whether to include cents (default: false)
 * @returns {string} - Formatted price string (e.g., "$350" or "$350.00")
 */
export const formatPrice = (price, includeCents = false) => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Price TBD';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  });

  return formatter.format(price);
};

/**
 * Validate price value
 * @param {any} price - Price to validate
 * @returns {boolean} - True if valid price
 */
export const isValidPrice = price => {
  if (price === null || price === undefined) return false;
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};
