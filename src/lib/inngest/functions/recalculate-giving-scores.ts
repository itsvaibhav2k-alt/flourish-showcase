import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateScoresForContact } from '@/modules/giving-potential/actions/calculate-scores'
import type { WealthData } from '@/modules/giving-potential/schemas/giving-potential.schema'

/**
 * Recalculate giving potential scores for all contacts
 *
 * This job:
 * 1. Fetches all contacts with giving potential records
 * 2. Recalculates their scores based on current data
 * 3. Updates the scores in the database
 *
 * Useful for:
 * - Periodic refresh (run weekly/monthly)
 * - After algorithm changes
 * - Manual refresh via admin panel
 */
export const recalculateGivingScores = inngest.createFunction(
  {
    id: 'recalculate-giving-scores',
    name: 'Recalculate Giving Potential Scores',
    // Run weekly on Sunday at 2 AM
    cron: '0 2 * * 0',
  },
  { event: 'scores/recalculate.requested' },
  async ({ event, step }) => {
    const organizationId = event.data?.organizationId

    // Step 1: Fetch all giving potential records
    const records = await step.run('fetch-giving-potential-records', async () => {
      const supabase = createAdminClient()

      let query = supabase
        .from('giving_potential')
        .select(`
          contact_id,
          organization_id,
          real_estate_value,
          stock_holdings,
          political_donations,
          estimated_net_worth,
          nonprofit_board_count,
          employer,
          job_title
        `)

      // Filter by organization if specified
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch giving potential records: ${error.message}`)
      }

      return data || []
    })

    if (records.length === 0) {
      return {
        success: true,
        message: 'No giving potential records to recalculate',
        updated: 0,
        errors: 0,
      }
    }

    // Step 2: Process each record in batches of 10
    const BATCH_SIZE = 10
    let totalUpdated = 0
    let totalErrors = 0

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)

      await step.run(`recalculate-batch-${Math.floor(i / BATCH_SIZE)}`, async () => {
        const supabase = createAdminClient()
        let batchUpdated = 0
        let batchErrors = 0

        for (const record of batch) {
          try {
            // Build wealth data from record
            const wealthData: Partial<WealthData> = {
              real_estate_value: record.real_estate_value || undefined,
              stock_holdings: record.stock_holdings || undefined,
              political_donations: record.political_donations || undefined,
              estimated_net_worth: record.estimated_net_worth || undefined,
            }

            // Calculate new scores
            const result = await calculateScoresForContact(record.contact_id, wealthData)

            if (result.success) {
              // Update scores in database
              const { error: updateError } = await supabase
                .from('giving_potential')
                .update({
                  capacity_score: result.scores.capacity_score,
                  affinity_score: result.scores.affinity_score,
                  propensity_score: result.scores.propensity_score,
                  overall_score: result.scores.overall_score,
                  giving_gap_ratio: result.scores.giving_gap_ratio,
                  updated_at: new Date().toISOString(),
                })
                .eq('contact_id', record.contact_id)

              if (updateError) {
                console.error(`Failed to update scores for contact ${record.contact_id}:`, updateError)
                batchErrors++
              } else {
                batchUpdated++
              }
            } else {
              console.error(`Failed to calculate scores for contact ${record.contact_id}:`, result.error)
              batchErrors++
            }
          } catch (err) {
            console.error(`Error processing contact ${record.contact_id}:`, err)
            batchErrors++
          }
        }

        totalUpdated += batchUpdated
        totalErrors += batchErrors

        return {
          batchUpdated,
          batchErrors,
        }
      })
    }

    return {
      success: true,
      message: `Recalculated scores for ${totalUpdated} contacts`,
      total: records.length,
      updated: totalUpdated,
      errors: totalErrors,
    }
  }
)

/**
 * Recalculate scores for a single contact
 * Triggered when wealth data is updated
 */
export const recalculateSingleContactScore = inngest.createFunction(
  {
    id: 'recalculate-single-contact-score',
    name: 'Recalculate Single Contact Giving Score',
  },
  { event: 'contact/giving-potential.updated' },
  async ({ event, step }) => {
    const { contactId, wealthData } = event.data

    // Step 1: Calculate new scores
    const result = await step.run('calculate-scores', async () => {
      return await calculateScoresForContact(contactId, wealthData)
    })

    if (!result.success) {
      throw new Error(`Failed to calculate scores: ${result.error}`)
    }

    // Step 2: Update scores in database
    await step.run('update-scores', async () => {
      const supabase = createAdminClient()

      const { error } = await supabase
        .from('giving_potential')
        .update({
          capacity_score: result.scores.capacity_score,
          affinity_score: result.scores.affinity_score,
          propensity_score: result.scores.propensity_score,
          overall_score: result.scores.overall_score,
          giving_gap_ratio: result.scores.giving_gap_ratio,
          updated_at: new Date().toISOString(),
        })
        .eq('contact_id', contactId)

      if (error) {
        throw new Error(`Failed to update scores: ${error.message}`)
      }
    })

    return {
      success: true,
      contactId,
      scores: result.scores,
    }
  }
)
