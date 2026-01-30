// Simple in-memory cache for local development
const memoryCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Try to use Netlify Blobs if available
let getStore;
try {
  getStore = require('@netlify/blobs').getStore;
} catch (e) {
  getStore = null;
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const url = event.queryStringParameters?.url;

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing url parameter' }),
      };
    }

    // Validate Instagram URL - allow posts, reels, and tv
    const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/;
    if (!instagramUrlPattern.test(url)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid Instagram URL' }),
      };
    }

    // Clean the URL (remove query params like ?img_index=1)
    const cleanUrl = url.split('?')[0].replace(/\/$/, '') + '/';

    // Generate cache key
    const cacheKey = `ig-${Buffer.from(cleanUrl).toString('base64').substring(0, 50)}`;

    // Check memory cache first (works in local dev)
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_TTL_MS) {
      console.log(`Memory cache hit for: ${cleanUrl}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(memoryCached.data),
      };
    }

    // Try Netlify Blobs cache (production)
    if (getStore) {
      try {
        const store = getStore('instagram-cache');
        const cached = await store.get(cacheKey, { type: 'json' });
        if (cached) {
          console.log(`Blob cache hit for: ${cleanUrl}`);
          // Also store in memory cache
          memoryCache.set(cacheKey, { data: cached, timestamp: Date.now() });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(cached),
          };
        }
      } catch (blobError) {
        console.log('Blob cache unavailable:', blobError.message);
      }
    }

    // Fetch from Instagram oEmbed API
    console.log(`Fetching oEmbed for: ${cleanUrl}`);
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(cleanUrl)}&maxwidth=640&hidecaption=false`;

    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`Instagram API error: ${response.status} - ${errorText}`);

      if (response.status === 404) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Instagram post not found or is private' }),
        };
      }

      if (response.status === 429) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Rate limited. Please try again later.' }),
        };
      }

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Failed to fetch Instagram embed',
          status: response.status,
        }),
      };
    }

    const data = await response.json();

    // Store in memory cache
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });

    // Try to store in Netlify Blobs (production)
    if (getStore) {
      try {
        const store = getStore('instagram-cache');
        await store.setJSON(cacheKey, data);
        console.log(`Cached in Blob store: ${cleanUrl}`);
      } catch (blobError) {
        console.log('Blob cache write failed:', blobError.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Instagram oEmbed error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
