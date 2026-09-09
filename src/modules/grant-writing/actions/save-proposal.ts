'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import { saveProposalSchema, type SaveProposalInput } from '../schemas/proposal.schema'

export interface SaveProposalResult {
  success: boolean
  data?: {
    proposalId: string
  }
  error?: string
}

/**
 * Save or update a grant proposal
 */
export async function saveProposal(input: SaveProposalInput): Promise<SaveProposalResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = saveProposalSchema.parse(input)
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    // Check if proposal already exists for this grant
    const { data: existing } = await supabase
      .from('grant_proposals')
      .select('id, version')
      .eq('grant_id', validated.grantId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let proposalId: string

    if (existing) {
      // Update existing proposal
      const { data: updated, error: updateError } = await supabase
        .from('grant_proposals')
        .update({
          sections: validated.sections,
          status: validated.status,
          version: existing.version + 1,
        })
        .eq('id', existing.id)
        .select('id')
        .single()

      if (updateError || !updated) {
        console.error('Error updating proposal:', updateError)
        return { success: false, error: 'Failed to update proposal' }
      }

      proposalId = updated.id
    } else {
      // Create new proposal
      const { data: created, error: createError } = await supabase
        .from('grant_proposals')
        .insert({
          organization_id: organizationId,
          grant_id: validated.grantId,
          sections: validated.sections,
          status: validated.status,
          created_by: userId,
        })
        .select('id')
        .single()

      if (createError || !created) {
        console.error('Error creating proposal:', createError)
        return { success: false, error: 'Failed to create proposal' }
      }

      proposalId = created.id
    }

    revalidatePath('/addon/grant-tracker')
    revalidatePath(`/addon/grant-tracker/${validated.grantId}`)

    return {
      success: true,
      data: { proposalId },
    }
  } catch (error) {
    console.error('Error saving proposal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save proposal',
    }
  }
}

/**
 * Update a single section of a proposal
 */
export async function updateProposalSection(
  proposalId: string,
  sectionName: string,
  content: string
): Promise<SaveProposalResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    // Fetch existing proposal
    const { data: proposal, error: fetchError } = await supabase
      .from('grant_proposals')
      .select('sections, grant_id')
      .eq('id', proposalId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !proposal) {
      return { success: false, error: 'Proposal not found' }
    }

    // Update the specific section
    const sections = proposal.sections as any
    const wordCount = content.split(/\s+/).length

    sections[sectionName] = {
      content,
      wordCount,
    }

    // Save updated sections
    const { error: updateError } = await supabase
      .from('grant_proposals')
      .update({ sections })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Error updating section:', updateError)
      return { success: false, error: 'Failed to update section' }
    }

    revalidatePath('/addon/grant-tracker')
    revalidatePath(`/addon/grant-tracker/${proposal.grant_id}`)

    return {
      success: true,
      data: { proposalId },
    }
  } catch (error) {
    console.error('Error updating section:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update section',
    }
  }
}

/**
 * Export proposal as plain text
 */
export async function exportProposalAsText(proposalId: string): Promise<string> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization found')
    }

    const supabase = await createClient()

    const { data: proposal, error } = await supabase
      .from('grant_proposals')
      .select('sections, grant_id')
      .eq('id', proposalId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !proposal) {
      throw new Error('Proposal not found')
    }

    // Get grant details
    const { data: grant } = await supabase
      .from('grant_applications')
      .select('funder_name, grant_name, amount_requested')
      .eq('id', proposal.grant_id)
      .single()

    const sections = proposal.sections as any
    let text = ''

    // Header
    if (grant) {
      text += `GRANT PROPOSAL\n`
      text += `Funder: ${grant.funder_name}\n`
      if (grant.grant_name) text += `Grant: ${grant.grant_name}\n`
      if (grant.amount_requested) text += `Amount Requested: $${grant.amount_requested.toLocaleString()}\n`
      text += `\n${'='.repeat(80)}\n\n`
    }

    // Sections
    const sectionOrder = [
      'executive_summary',
      'statement_of_need',
      'project_description',
      'goals_and_objectives',
      'methods',
      'evaluation',
      'budget_narrative',
      'organizational_capacity',
    ]

    const sectionTitles: Record<string, string> = {
      executive_summary: 'EXECUTIVE SUMMARY',
      statement_of_need: 'STATEMENT OF NEED',
      project_description: 'PROJECT DESCRIPTION',
      goals_and_objectives: 'GOALS AND OBJECTIVES',
      methods: 'METHODS',
      evaluation: 'EVALUATION',
      budget_narrative: 'BUDGET NARRATIVE',
      organizational_capacity: 'ORGANIZATIONAL CAPACITY',
    }

    for (const sectionKey of sectionOrder) {
      if (sections[sectionKey]) {
        text += `${sectionTitles[sectionKey]}\n`
        text += `${'-'.repeat(80)}\n\n`
        text += `${sections[sectionKey].content}\n\n`
        text += `(${sections[sectionKey].wordCount} words)\n\n`
        text += `${'='.repeat(80)}\n\n`
      }
    }

    return text
  } catch (error) {
    console.error('Error exporting proposal:', error)
    throw new Error('Failed to export proposal')
  }
}
