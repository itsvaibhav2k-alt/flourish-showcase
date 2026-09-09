/**
 * Rate Limit Cleanup Function
 *
 * Scheduled job that cleans up old rate limit entries from the database.
 * This prevents the rate_limit_entries table from growing indefinitely.
 *
 * Runs every 5 minutes to remove entries older than 5 minutes
 * (gives buffer beyond the 1-minute rate limit windows).
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cleanup rate limit entries
 *
 * Cron schedule: Every 5 minutes
 */
export const cleanupRateLimitEntries = inngest.createFunction(
  {
    id: 'cleanup-rate-limit-entries',
    name: 'Cleanup Rate Limit Entries',
    // Retry configuration for resilience
    retries: 3,
  },
  // Run every hour
  { cron: '0 3 * * *' }, // Daily at 3 AM
  async ({ step }) => {
    const result = await step.run('cleanup-entries', async () => {
      const supabase = createAdminClient()

      // Call the database cleanup function
      const { error } = await supabase.rpc('cleanup_rate_limit_entries')

      if (error) {
        console.error('[Rate Limit Cleanup] Failed:', error)
        throw new Error(`Cleanup failed: ${error.message}`)
      }

      // Get count of remaining entries for monitoring
      const { count } = await supabase
        .from('rate_limit_entries')
        .select('*', { count: 'exact', head: true })

      return {
        success: true,
        remaining_entries: count || 0,
        timestamp: new Date().toISOString(),
      }
    })

    return result
  }
)
