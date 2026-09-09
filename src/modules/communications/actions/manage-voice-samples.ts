/**
 * Manage Voice Samples Actions
 *
 * Server actions for adding and removing voice training samples.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

export interface AddVoiceSampleResult {
  success: boolean
  error?: string
}

export interface RemoveVoiceSampleResult {
  success: boolean
  error?: string
}

/**
 * Add a new voice sample to the organization's training data
 */
export async function addVoiceSample(
  content: string,
  source: string
): Promise<AddVoiceSampleResult> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    // Validate input
    if (!content || content.trim().length < 50) {
      return {
        success: false,
        error: 'Sample must be at least 50 characters long',
      }
    }

    if (content.trim().length > 10000) {
      return {
        success: false,
        error: 'Sample must be less than 10,000 characters',
      }
    }

    // Verify user has access and appropriate role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Access denied to this organization',
      }
    }

    // Only admins can manage voice samples
    if (membership.role !== 'admin') {
      return {
        success: false,
        error: 'Only organization admins can manage voice samples',
      }
    }

    // Get current voice samples
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('voice_samples')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Failed to fetch organization data' }
    }

    const currentSamples = org?.voice_samples || []

    // Check if we've reached the max samples (15)
    if (currentSamples.length >= 15) {
      return {
        success: false,
        error: 'Maximum 15 samples allowed. Please remove some samples first.',
      }
    }

    // Create new sample object
    const newSample = JSON.stringify({
      content: content.trim(),
      source: source.trim() || 'Manual entry',
      created_at: new Date().toISOString(),
    })

    // Add the new sample
    const updatedSamples = [...currentSamples, newSample]

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        voice_samples: updatedSamples,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Failed to add voice sample:', updateError)
      return { success: false, error: 'Failed to add sample' }
    }

    // Revalidate the voice training page
    revalidatePath('/communications/voice')

    return { success: true }
  } catch (error) {
    console.error('Add voice sample error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to add sample. Please try again.',
    }
  }
}

/**
 * Remove a voice sample from the organization's training data
 */
export async function removeVoiceSample(
  sampleId: string
): Promise<RemoveVoiceSampleResult> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    // Verify user has access and appropriate role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Access denied to this organization',
      }
    }

    if (membership.role !== 'admin') {
      return {
        success: false,
        error: 'Only organization admins can manage voice samples',
      }
    }

    // Get current voice samples
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('voice_samples')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Failed to fetch organization data' }
    }

    const currentSamples = org?.voice_samples || []

    // Extract index from sampleId (format: "sample-{index}")
    const index = parseInt(sampleId.replace('sample-', ''), 10)

    if (isNaN(index) || index < 0 || index >= currentSamples.length) {
      return { success: false, error: 'Invalid sample ID' }
    }

    // Remove the sample
    const updatedSamples = currentSamples.filter((_, i) => i !== index)

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        voice_samples: updatedSamples,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Failed to remove voice sample:', updateError)
      return { success: false, error: 'Failed to remove sample' }
    }

    // Revalidate the voice training page
    revalidatePath('/communications/voice')

    return { success: true }
  } catch (error) {
    console.error('Remove voice sample error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to remove sample. Please try again.',
    }
  }
}
