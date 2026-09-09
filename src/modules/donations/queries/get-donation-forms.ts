'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { DonationForm } from '../schemas/donation.schema'

/**
 * Get all donation forms for the current organization
 */
export async function getDonationForms(): Promise<DonationForm[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('donation_forms')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching donation forms:', error)
      throw new Error(error.message)
    }

    return (data as DonationForm[]) || []
  } catch (error) {
    console.error('Error in getDonationForms:', error)
    throw error
  }
}

/**
 * Get a single donation form by ID
 */
export async function getDonationForm(formId: string): Promise<DonationForm | null> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('donation_forms')
      .select('*')
      .eq('id', formId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching donation form:', error)
      return null
    }

    return data as DonationForm
  } catch (error) {
    console.error('Error in getDonationForm:', error)
    return null
  }
}

/**
 * Get a donation form by slug for public access
 * Does not require authentication
 */
export async function getPublicDonationForm(
  organizationSlug: string,
  formSlug: string
): Promise<DonationForm | null> {
  try {
    const supabase = await createClient()

    // First get organization by slug
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organizationSlug)
      .single()

    if (orgError || !org) {
      console.error('Organization not found:', orgError)
      return null
    }

    // Then get the form
    const { data, error } = await supabase
      .from('donation_forms')
      .select('*')
      .eq('organization_id', org.id)
      .eq('slug', formSlug)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching public donation form:', error)
      return null
    }

    return data as DonationForm
  } catch (error) {
    console.error('Error in getPublicDonationForm:', error)
    return null
  }
}

/**
 * Get donation form by slug (authenticated, for organization members)
 */
export async function getDonationFormBySlug(slug: string): Promise<DonationForm | null> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('donation_forms')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching donation form by slug:', error)
      return null
    }

    return data as DonationForm
  } catch (error) {
    console.error('Error in getDonationFormBySlug:', error)
    return null
  }
}
