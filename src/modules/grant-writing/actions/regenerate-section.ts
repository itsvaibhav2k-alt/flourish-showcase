'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { regenerateSection as regenerateSectionAI } from '@/lib/ai/grant-writing/proposal-generator'
import { getOrganizationContext, getGrantApplication } from '../queries/get-org-context'
import { regenerateSectionSchema, type RegenerateSectionInput } from '../schemas/proposal.schema'
import { trackAIUsage } from '@/lib/ai/cost-tracker-helpers'

export interface RegenerateSectionResult {
  success: boolean
  data?: {
    content: string
    wordCount: number
  }
  error?: string
}

/**
 * Regenerate a specific section of a grant proposal using AI
 */
export async function regenerateSection(
  input: RegenerateSectionInput
): Promise<RegenerateSectionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = regenerateSectionSchema.parse(input)
    const supabase = await createClient()

    // Fetch the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('grant_proposals')
      .select('*, grant_id')
      .eq('id', validated.proposalId)
      .eq('organization_id', organizationId)
      .single()

    if (proposalError || !proposal) {
      return { success: false, error: 'Proposal not found' }
    }

    // Fetch grant application details
    const grant = await getGrantApplication(proposal.grant_id)

    // Build opportunity data from grant
    const opportunity = {
      funderName: grant.funder_name,
      grantName: grant.grant_name || undefined,
      amountRequested: grant.amount_requested || undefined,
      deadline: grant.deadline || undefined,
      focusAreas: [], // We don't store this, would need to add
      requirements: grant.notes || 'No specific requirements provided',
      additionalNotes: undefined,
    }

    // Get organization context
    const orgContext = await getOrganizationContext()

    // Get current sections
    const currentSections = proposal.sections as any

    // Regenerate the specific section with AI
    const result = await regenerateSectionAI(
      validated.sectionName,
      opportunity,
      orgContext,
      currentSections
    )

    // Update the proposal
    const updatedSections = {
      ...currentSections,
      [validated.sectionName]: result.section,
    }

    const { error: updateError } = await supabase
      .from('grant_proposals')
      .update({ sections: updatedSections })
      .eq('id', validated.proposalId)

    if (updateError) {
      console.error('Error updating proposal:', updateError)
      return { success: false, error: 'Failed to save regenerated section' }
    }

    // Calculate cost
    const costPerMillionInputTokens = 3.0 // Sonnet pricing
    const costPerMillionOutputTokens = 15.0

    const inputCost = (result.usage.inputTokens / 1_000_000) * costPerMillionInputTokens
    const outputCost = (result.usage.outputTokens / 1_000_000) * costPerMillionOutputTokens
    const totalCost = inputCost + outputCost

    // Track AI usage
    try {
      await trackAIUsage({
        organizationId,
        feature: 'grant_proposal_regenerate',
        model: 'claude-sonnet-4-20250514',
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cacheCreationTokens: result.usage.cacheCreationInputTokens || 0,
        cacheReadTokens: result.usage.cacheReadInputTokens || 0,
        costUsd: totalCost,
        metadata: {
          proposalId: validated.proposalId,
          sectionName: validated.sectionName,
        },
      })
    } catch (trackingError) {
      console.warn('Failed to track AI usage:', trackingError)
    }

    return {
      success: true,
      data: result.section,
    }
  } catch (error) {
    console.error('Error regenerating section:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate section',
    }
  }
}
