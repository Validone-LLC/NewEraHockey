/**
 * Registration Form Configurations
 *
 * Config-driven form rendering for different event types.
 * Each event type can customize which sections appear and their behavior.
 */

import { EVENT_TYPES, PLAYER_LEVEL_OPTIONS, PLAYER_LEAGUE_OPTIONS } from '@/config/constants';
import { categorizeEvent } from '@/utils/eventCategorization';

/**
 * Form configuration for each event type
 */
export const FORM_CONFIGS = {
  [EVENT_TYPES.AT_HOME_TRAINING]: {
    label: 'At-Home Training',
    features: {
      multiPlayer: true,
      showAddress: true,
      addressLabel: 'Training Location Address',
      addressDescription:
        'Enter the address where the at-home training will take place. Start typing and select from suggestions, or manually enter your address.',
      emergencyRequired: false,
    },
    pricing: {
      model: 'event_price', // Pull from Google Calendar Price: parser
    },
    levelOptions: PLAYER_LEVEL_OPTIONS,
    leagueOptions: PLAYER_LEAGUE_OPTIONS,
    // Page display settings
    display: {
      pageTitle: 'At Home Training Registration',
      pageSubtitle: 'Book your personalized at-home training session',
      sidebarTitle: 'Session Details',
      gradientClasses: 'from-orange-400 to-orange-600',
      bgClasses: 'bg-orange-500/20',
      textClasses: 'text-orange-400',
      hoverClasses: 'hover:text-orange-300',
      borderClasses: 'border-orange-500',
      // Full class strings for dynamic Tailwind JIT
      gradientBgClasses: 'from-orange-500/10',
      statusBgClasses: 'bg-orange-500/10 border border-orange-500/30',
    },
  },

  [EVENT_TYPES.CAMP]: {
    label: 'Camp',
    features: {
      multiPlayer: false,
      showAddress: false,
      emergencyRequired: true,
    },
    pricing: {
      model: 'event_price', // Pull from Google Calendar Price: parser
    },
    levelOptions: PLAYER_LEVEL_OPTIONS,
    leagueOptions: PLAYER_LEAGUE_OPTIONS,
    // Page display settings
    display: {
      pageTitle: 'Camp Registration',
      pageSubtitle: 'Complete the form below to register for this camp',
      sidebarTitle: 'Event Details',
      gradientClasses: 'from-teal-400 to-teal-600',
      bgClasses: 'bg-teal-500/20',
      textClasses: 'text-teal-400',
      hoverClasses: 'hover:text-teal-300',
      borderClasses: 'border-teal-500',
      gradientBgClasses: 'from-teal-500/10',
      statusBgClasses: 'bg-teal-500/10 border border-teal-500/30',
    },
  },

  [EVENT_TYPES.LESSON]: {
    label: 'Lesson',
    features: {
      multiPlayer: false,
      showAddress: false,
      emergencyRequired: true,
    },
    pricing: {
      model: 'event_price', // Pull from Google Calendar Price: parser
    },
    levelOptions: PLAYER_LEVEL_OPTIONS,
    leagueOptions: PLAYER_LEAGUE_OPTIONS,
    // Page display settings
    display: {
      pageTitle: 'Lesson Registration',
      pageSubtitle: 'Complete the form below to register for this lesson',
      sidebarTitle: 'Event Details',
      gradientClasses: 'from-blue-400 to-blue-600',
      bgClasses: 'bg-blue-500/20',
      textClasses: 'text-blue-400',
      hoverClasses: 'hover:text-blue-300',
      borderClasses: 'border-blue-500',
      gradientBgClasses: 'from-blue-500/10',
      statusBgClasses: 'bg-blue-500/10 border border-blue-500/30',
    },
  },

  [EVENT_TYPES.MT_VERNON_SKATING]: {
    label: 'Mt Vernon Skating',
    features: {
      multiPlayer: false,
      showAddress: false,
      emergencyRequired: true,
    },
    pricing: {
      model: 'event_price', // Pull from Google Calendar Price: parser
    },
    levelOptions: PLAYER_LEVEL_OPTIONS,
    leagueOptions: PLAYER_LEAGUE_OPTIONS,
    // Page display settings
    display: {
      pageTitle: 'Mt Vernon Skating Registration',
      pageSubtitle: 'Complete the form below to register for this skating session',
      sidebarTitle: 'Event Details',
      gradientClasses: 'from-green-400 to-green-600',
      bgClasses: 'bg-green-500/20',
      textClasses: 'text-green-400',
      hoverClasses: 'hover:text-green-300',
      borderClasses: 'border-green-500',
      gradientBgClasses: 'from-green-500/10',
      statusBgClasses: 'bg-green-500/10 border border-green-500/30',
    },
  },

  [EVENT_TYPES.SMALL_GROUP]: {
    label: 'Small Group',
    features: {
      multiPlayer: true, // Allow multiple siblings to be registered
      showAddress: false, // No parent address needed
      emergencyRequired: true,
    },
    pricing: {
      model: 'event_price', // Pull from Google Calendar Price: parser
    },
    levelOptions: PLAYER_LEVEL_OPTIONS,
    leagueOptions: PLAYER_LEAGUE_OPTIONS,
    // Page display settings
    display: {
      pageTitle: 'Small Group Registration',
      pageSubtitle: 'Complete the form below to register for this small group session',
      sidebarTitle: 'Event Details',
      gradientClasses: 'from-cyan-400 to-cyan-600',
      bgClasses: 'bg-cyan-500/20',
      textClasses: 'text-cyan-400',
      hoverClasses: 'hover:text-cyan-300',
      borderClasses: 'border-cyan-500',
      gradientBgClasses: 'from-cyan-500/10',
      statusBgClasses: 'bg-cyan-500/10 border border-cyan-500/30',
    },
  },

  // Default fallback config
  [EVENT_TYPES.OTHER]: {
    label: 'Event',
    features: {
      multiPlayer: false,
      showAddress: false,
      emergencyRequired: true,
    },
    pricing: {
      model: 'event_price',
    },
    levelOptions: PLAYER_LEVEL_OPTIONS,
    leagueOptions: PLAYER_LEAGUE_OPTIONS,
    // Page display settings
    display: {
      pageTitle: 'Event Registration',
      pageSubtitle: 'Complete the form below to register for this event',
      sidebarTitle: 'Event Details',
      gradientClasses: 'from-teal-400 to-teal-600',
      bgClasses: 'bg-teal-500/20',
      textClasses: 'text-teal-400',
      hoverClasses: 'hover:text-teal-300',
      borderClasses: 'border-teal-500',
      gradientBgClasses: 'from-teal-500/10',
      statusBgClasses: 'bg-teal-500/10 border border-teal-500/30',
    },
  },
};

/**
 * Get form configuration for an event
 * @param {Object} event - Google Calendar event object
 * @returns {Object} Form configuration
 */
export const getFormConfig = event => {
  const eventType = categorizeEvent(event);
  return FORM_CONFIGS[eventType] || FORM_CONFIGS[EVENT_TYPES.OTHER];
};

/**
 * Get event type from event
 * @param {Object} event - Google Calendar event object
 * @returns {string} Event type
 */
export const getEventType = event => {
  return categorizeEvent(event);
};
