import { useState, useEffect, useCallback } from 'react';
import { getInstagramEmbed, isValidInstagramUrl } from '@services/instagramService';

/**
 * Custom hook for loading Instagram embed data
 * @param {string} instagramUrl - Instagram post/reel URL
 * @returns {Object} { embedData, isLoading, error, retry }
 */
export function useInstagramEmbed(instagramUrl) {
  const [embedData, setEmbedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmbed = useCallback(async () => {
    if (!instagramUrl) {
      setIsLoading(false);
      setError(new Error('No URL provided'));
      return;
    }

    if (!isValidInstagramUrl(instagramUrl)) {
      setIsLoading(false);
      setError(new Error('Invalid Instagram URL'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getInstagramEmbed(instagramUrl);
      setEmbedData(data);
    } catch (err) {
      console.error('useInstagramEmbed error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [instagramUrl]);

  useEffect(() => {
    fetchEmbed();
  }, [fetchEmbed]);

  const retry = useCallback(() => {
    fetchEmbed();
  }, [fetchEmbed]);

  return { embedData, isLoading, error, retry };
}

/**
 * Hook to manage Instagram embed script loading
 * Ensures the Instagram embed.js script is loaded and processes embeds
 */
export function useInstagramScript() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script already exists
    if (window.instgrm) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script tag already added
    const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    // Add script
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup - it should persist
    };
  }, []);

  // Function to process new embeds
  const processEmbeds = useCallback(() => {
    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
    }
  }, []);

  return { isScriptLoaded, processEmbeds };
}
