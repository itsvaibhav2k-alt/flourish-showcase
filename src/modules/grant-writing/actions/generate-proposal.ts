'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { generateGrantProposal } from '@/lib/ai/grant-writing/proposal-generator'
import { getOrganizationContext } from '../queries/get-org-context'
import { generateProposalSchema, type GenerateProposalInput } from '../schemas/proposal.schema'
import { trackAIUsage } from '@/lib/ai/cost-tracker-helpers'

export interface GenerateProposalResult {
  success: boolean
  data?: {
    proposalId: string
    sections: any
  }
  error?: string
}

/**
 * Generate AI grant proposal for a grant application
 */
export async function generateProposal(
  input: GenerateProposalInput
): Promise<GenerateProposalResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = generateProposalSchema.parse(input)
    const supabase = await createClient()

    // Verify grant belongs to organization
    const { data: grant, error: grantError } = await supabase
      .from('grant_applications')
      .select('*')
      .eq('id', validated.grantId)
      .eq('organization_id', organizationId)
      .single()

    if (grantError || !grant) {
      return { success: false, error: 'Grant application not found' }
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    // Get organization context for AI
    const orgContext = await getOrganizationContext()

    // Generate proposal with AI
    const proposal = await generateGrantProposal(validated.opportunity, orgContext)

    // Calculate cost (approximate based on model and tokens)
    const costPerMillionInputTokens = proposal.model.includes('sonnet') ? 3.0 : 1.0
    const costPerMillionOutputTokens = proposal.model.includes('sonnet') ? 15.0 : 5.0

    const inputCost = (proposal.usage.inputTokens / 1_000_000) * costPerMillionInputTokens
    const outputCost = (proposal.usage.outputTokens / 1_000_000) * costPerMillionOutputTokens
    const totalCost = inputCost + outputCost

    // Save proposal to database
    const { data: savedProposal, error: saveError } = await supabase
      .from('grant_proposals')
      .insert({
        organization_id: organizationId,
        grant_id: validated.grantId,
        sections: proposal.sections,
        status: 'draft',
        ai_model: proposal.model,
        ai_tokens_used: proposal.usage.inputTokens + proposal.usage.outputTokens,
        ai_cost_usd: totalCost,
        org_context_snapshot: orgContext,
        created_by: userId,
        generated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (saveError || !savedProposal) {
      console.error('Error saving proposal:', saveError)
      return { success: false, error: 'Failed to save generated proposal' }
    }

    // Track AI usage
    try {
      await trackAIUsage({
        organizationId,
        feature: 'grant_proposal',
        model: proposal.model,
        inputTokens: proposal.usage.inputTokens,
        outputTokens: proposal.usage.outputTokens,
        cacheCreationTokens: proposal.usage.cacheCreationInputTokens || 0,
        cacheReadTokens: proposal.usage.cacheReadInputTokens || 0,
        costUsd: totalCost,
        metadata: {
          grantId: validated.grantId,
          proposalId: savedProposal.id,
          funderName: validated.opportunity.funderName,
        },
      })
    } catch (trackingError) {
      // Don't fail the request if tracking fails
      console.warn('Failed to track AI usage:', trackingError)
    }

    return {
      success: true,
      data: {
        proposalId: savedProposal.id,
        sections: proposal.sections,
      },
    }
  } catch (error) {
    console.error('Error generating proposal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate proposal',
    }
  }
}
