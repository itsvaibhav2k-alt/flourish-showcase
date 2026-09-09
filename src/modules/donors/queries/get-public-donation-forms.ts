import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

/**
 * Get all active donation forms for a public organization
 */
export async function getPublicDonationForms(orgSlug: string) {
  const supabase = createAdminClient()

  // First, get the organization by public_slug
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, public_slug, settings')
    .eq('public_slug', orgSlug)
    .single()

  if (orgError || !org) {
    return null
  }

  // Get all active donation forms for this organization
  const { data: forms, error: formsError } = await supabase
    .from('donation_forms')
    .select('*')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (formsError) {
    console.error('Error fetching donation forms:', formsError)
    return null
  }

  return {
    organization: org,
    forms: forms || [],
  }
}

/**
 * Get a specific donation form by slug for public access
 */
export async function getPublicDonationFormBySlug(orgSlug: string, formSlug: string) {
  const supabase = createAdminClient()

  // First, get the organization by public_slug
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, public_slug, settings')
    .eq('public_slug', orgSlug)
    .single()

  if (orgError || !org) {
    return null
  }

  // Get the specific donation form by slug
  const { data: form, error: formError } = await supabase
    .from('donation_forms')
    .select('*')
    .eq('organization_id', org.id)
    .eq('slug', formSlug)
    .eq('is_active', true)
    .single()

  if (formError || !form) {
    return null
  }

  return {
    organization: org,
    form,
  }
}

export type PublicDonationFormsData = NonNullable<
  Awaited<ReturnType<typeof getPublicDonationForms>>
>

export type PublicDonationFormData = NonNullable<
  Awaited<ReturnType<typeof getPublicDonationFormBySlug>>
>
