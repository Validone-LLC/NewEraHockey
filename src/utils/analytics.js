const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

/**
 * Initialize Google Analytics 4
 * Loads the gtag.js script and configures the measurement ID
 */
export function initGA() {
  if (!GA_MEASUREMENT_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We handle page views manually on route change
  });
}

/**
 * Track a page view
 * @param {string} path - The page path (e.g., '/coaches')
 */
export function trackPageView(path) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
  });
}

/**
 * Track a custom event
 * @param {string} eventName - Event name (e.g., 'registration_complete')
 * @param {object} params - Optional event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag('event', eventName, params);
}
