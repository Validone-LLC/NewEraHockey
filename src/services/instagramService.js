/**
 * Instagram oEmbed Service
 * Fetches embed data for Instagram posts/reels via Netlify Function proxy
 */

const OEMBED_ENDPOINT = '/.netlify/functions/instagram-oembed';

// In-memory cache for client-side
const clientCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch Instagram oEmbed data for a given URL
 * @param {string} instagramUrl - Full Instagram post/reel URL
 * @returns {Promise<Object>} oEmbed response with html, thumbnail_url, etc.
 */
export async function getInstagramEmbed(instagramUrl) {
  if (!instagramUrl) {
    throw new Error('Instagram URL is required');
  }

  // Check client cache
  const cached = clientCache.get(instagramUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(`${OEMBED_ENDPOINT}?url=${encodeURIComponent(instagramUrl)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch embed: ${response.status}`);
    }

    const data = await response.json();

    // Cache the result
    clientCache.set(instagramUrl, {
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    console.error('Instagram embed fetch error:', error);
    throw error;
  }
}

/**
 * Clear the client-side cache
 */
export function clearInstagramCache() {
  clientCache.clear();
}

/**
 * Validate an Instagram URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is a valid Instagram post/reel URL
 */
export function isValidInstagramUrl(url) {
  if (!url) return false;
  const pattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
  return pattern.test(url);
}

/**
 * Extract the post ID from an Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string|null} Post ID or null if invalid
 */
export function extractInstagramId(url) {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/);
  return match ? match[2] : null;
}
