/**
 * Activity Logging
 *
 * Centralized activity logging for contact timeline tracking
 */

export {
  logActivity,
  logActivities,
  logGiftActivity,
  logVolunteerActivity,
  logEmailActivity,
  logContactActivity,
} from './log-activity'

export type { ActivityType, ActivityMetadata, LogActivityParams } from './types'
