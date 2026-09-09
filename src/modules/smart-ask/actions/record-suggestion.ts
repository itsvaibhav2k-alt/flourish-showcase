'use server'

import { createClient } from '@/lib/supabase/server'
import { recordSmartAskSchema, type RecordSmartAskInput } from '../schemas/smart-ask.schema'

export type RecordSuggestionResult =
  | { success: true; suggestionId: string }
  | { success: false; error: string }

/**
 * Server action to record a Smart Ask suggestion
 * - Validates input
 * - Inserts suggestion into smart_ask_results table
 * - Returns suggestion ID for tracking conversion
 */
export async function recordSmartAskSuggestion(
  input: RecordSmartAskInput
): Promise<RecordSuggestionResult> {
  try {
    // Validate input
    const validatedData = recordSmartAskSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Verify contact belongs to this organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validatedData.contact_id)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Insert suggestion record
    const { data: suggestion, error: insertError } = await supabase
      .from('smart_ask_results')
      .insert({
        organization_id: organizationId,
        contact_id: validatedData.contact_id,
        stretch_amount: validatedData.stretch_amount,
        target_amount: validatedData.target_amount,
        accessible_amount: validatedData.accessible_amount,
        stretch_confidence: validatedData.stretch_confidence || null,
        target_confidence: validatedData.target_confidence || null,
        accessible_confidence: validatedData.accessible_confidence || null,
        base_amount: validatedData.base_amount,
        capacity_score: validatedData.capacity_score || null,
        lapse_risk: validatedData.lapse_risk || null,
        calculation_method: validatedData.calculation_method,
        reasoning: validatedData.reasoning,
        suggestion_type: validatedData.suggestion_type,
        shown_amount: validatedData.shown_amount,
        campaign: validatedData.campaign || null,
        appeal_type: validatedData.appeal_type || null,
        converted: false,
      })
      .select('id')
      .single()

    if (insertError || !suggestion) {
      console.error('Supabase insert error:', insertError)
      return {
        success: false,
        error: insertError?.message || 'Failed to record suggestion',
      }
    }

    return { success: true, suggestionId: suggestion.id }
  } catch (error) {
    console.error('Error recording smart ask suggestion:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
