/**
 * Feature Flags Configuration
 *
 * Centralized feature toggle management using environment variables
 */

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name ('campRegistration' | 'lessonRegistration')
 * @returns {boolean}
 */
export const isFeatureEnabled = feature => {
  const flags = {
    campRegistration: import.meta.env.VITE_ENABLE_CAMP_REGISTRATION === 'true',
    lessonRegistration: import.meta.env.VITE_ENABLE_LESSON_REGISTRATION === 'true',
  };

  return flags[feature] ?? false;
};

/**
 * Get feature flag for specific event type
 * @param {string} eventType - 'camp' | 'camps' | 'lesson' | 'lessons'
 * @returns {boolean}
 */
export const isRegistrationEnabledForEventType = eventType => {
  if (!eventType) return false;

  const normalized = eventType.toLowerCase();

  if (normalized === 'camp' || normalized === 'camps') {
    return isFeatureEnabled('campRegistration');
  }

  if (normalized === 'lesson' || normalized === 'lessons') {
    return isFeatureEnabled('lessonRegistration');
  }

  return false;
};
