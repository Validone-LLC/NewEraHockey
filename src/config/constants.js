/**
 * Application Constants
 *
 * Centralized constants to avoid magic numbers and improve maintainability
 */

/**
 * Google Calendar color IDs mapped to event types
 * These correspond to Google Calendar's color palette
 */
export const GOOGLE_CALENDAR_COLORS = {
  CAMP: '11', // Red (Tomato)
  LESSON: '9', // Blue (Blueberry)
  AT_HOME_AVAILABLE: '6', // Orange (Tangerine)
  AT_HOME_BOOKED: '5', // Yellow (Banana)
  MT_VERNON_SKATING_AVAILABLE: '10', // Green (Basil) - available for registration
  MT_VERNON_SKATING_REGISTERED: '5', // Yellow (Banana) - already registered
  ROCKVILLE_SMALL_GROUP: '7', // Peacock (Teal/Cyan) - Rockville Small Group lessons
  DEV_ONLY: '8', // Graphite - dev-only events, hidden in production
};

/**
 * Event type identifiers
 */
export const EVENT_TYPES = {
  CAMP: 'camp',
  LESSON: 'lesson',
  AT_HOME_TRAINING: 'at_home_training',
  MT_VERNON_SKATING: 'mt_vernon_skating',
  ROCKVILLE_SMALL_GROUP: 'rockville_small_group',
  OTHER: 'other',
};

/**
 * Map color IDs to event types
 * Note: Banana yellow (5) is shared between AT_HOME_BOOKED and MT_VERNON_SKATING_REGISTERED
 * We use title matching to distinguish them
 */
export const COLOR_TO_EVENT_TYPE = {
  [GOOGLE_CALENDAR_COLORS.CAMP]: EVENT_TYPES.CAMP,
  [GOOGLE_CALENDAR_COLORS.LESSON]: EVENT_TYPES.LESSON,
  [GOOGLE_CALENDAR_COLORS.AT_HOME_AVAILABLE]: EVENT_TYPES.AT_HOME_TRAINING,
  [GOOGLE_CALENDAR_COLORS.AT_HOME_BOOKED]: EVENT_TYPES.AT_HOME_TRAINING,
  [GOOGLE_CALENDAR_COLORS.MT_VERNON_SKATING_AVAILABLE]: EVENT_TYPES.MT_VERNON_SKATING,
  [GOOGLE_CALENDAR_COLORS.ROCKVILLE_SMALL_GROUP]: EVENT_TYPES.ROCKVILLE_SMALL_GROUP,
};

/**
 * Calendar display colors (UI)
 */
export const CALENDAR_DISPLAY_COLORS = {
  [EVENT_TYPES.CAMP]: '#ef4444', // Red
  [EVENT_TYPES.LESSON]: '#3b82f6', // Blue
  [EVENT_TYPES.AT_HOME_TRAINING]: '#f97316', // Orange
  [EVENT_TYPES.MT_VERNON_SKATING]: '#22c55e', // Green (Basil-like)
  [EVENT_TYPES.ROCKVILLE_SMALL_GROUP]: '#0891b2', // Peacock/Cyan
  [EVENT_TYPES.OTHER]: '#6b7280', // Gray
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  TTL_MS: 60 * 1000, // 60 seconds - for real-time updates
  KEY_PREFIX: 'calendar_events_',
};

/**
 * Polling configuration
 */
export const POLLING_CONFIG = {
  DEFAULT_INTERVAL_MS: 300000, // 5 minutes
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  MAX_SUBMISSIONS_PER_HOUR: 3,
  WINDOW_MS: 3600000, // 1 hour in milliseconds
};

/**
 * Player level options for registration forms
 */
export const PLAYER_LEVEL_OPTIONS = [
  { value: 'Mini Mite/U6: Ages 5-6', label: 'Mini Mite/U6: Ages 5-6' },
  { value: 'Mite/U8: Ages 7-8', label: 'Mite/U8: Ages 7-8' },
  { value: 'Squirt/U10: Ages 9-10', label: 'Squirt/U10: Ages 9-10' },
  { value: 'PeeWee/U12: Ages 11-12', label: 'PeeWee/U12: Ages 11-12' },
  { value: 'Bantam/U14: Ages 13-14', label: 'Bantam/U14: Ages 13-14' },
  {
    value: 'Midget U16 (Minor Midget): Ages 15-16',
    label: 'Midget U16 (Minor Midget): Ages 15-16',
  },
  {
    value: 'Midget U18 (Major Midget): Ages 15-18',
    label: 'Midget U18 (Major Midget): Ages 15-18',
  },
];

/**
 * Player league options for registration forms
 */
export const PLAYER_LEAGUE_OPTIONS = [
  { value: 'Travel', label: 'Travel' },
  { value: 'House', label: 'House' },
  { value: 'None', label: 'None' },
];

/**
 * Guardian relationship options
 */
export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  { value: 'Parent', label: 'Parent' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Other', label: 'Other' },
];
