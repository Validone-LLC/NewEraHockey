/**
 * Feature Flags Configuration
 *
 * Centralized feature toggle management using environment variables
 */

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name ('campRegistration' | 'lessonRegistration' | 'atHomeTrainingRegistration' | 'mtVernonSkatingRegistration' | 'showTestEvents')
 * @returns {boolean}
 */
export const isFeatureEnabled = feature => {
  const flags = {
    campRegistration: import.meta.env.VITE_ENABLE_CAMP_REGISTRATION === 'true',
    lessonRegistration: import.meta.env.VITE_ENABLE_LESSON_REGISTRATION === 'true',
    atHomeTrainingRegistration:
      import.meta.env.VITE_ENABLE_AT_HOME_TRAINING_REGISTRATION === 'true',
    mtVernonSkatingRegistration:
      import.meta.env.VITE_ENABLE_MT_VERNON_SKATING_REGISTRATION === 'true',
    showTestEvents: import.meta.env.VITE_SHOW_TEST_EVENTS === 'true',
  };

  return flags[feature] ?? false;
};

/**
 * Check if test events should be visible
 * Test events have [TEST] prefix in title and are hidden in production
 * @returns {boolean}
 */
export const shouldShowTestEvents = () => isFeatureEnabled('showTestEvents');

/**
 * Get feature flag for specific event type
 * @param {string} eventType - 'camp' | 'camps' | 'lesson' | 'lessons' | 'at_home_training' | 'at-home' | 'mt_vernon_skating' | 'skating'
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

  if (normalized === 'at_home_training' || normalized === 'at-home') {
    return isFeatureEnabled('atHomeTrainingRegistration');
  }

  if (normalized === 'mt_vernon_skating' || normalized === 'skating') {
    return isFeatureEnabled('mtVernonSkatingRegistration');
  }

  return false;
};
