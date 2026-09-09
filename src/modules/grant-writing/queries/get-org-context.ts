'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { OrganizationContext } from '@/lib/ai/grant-writing/proposal-generator'

/**
 * Get organization context for AI grant proposal generation
 *
 * Aggregates data from:
 * - Organization settings (name, mission, vision)
 * - Impact metrics from program_metrics table
 * - Donor statistics from gifts table
 * - Volunteer data from shift_signups table
 */
export async function getOrganizationContext(): Promise<OrganizationContext> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    // Fetch organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, settings')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      throw new Error('Failed to fetch organization details')
    }

    const settings = (org.settings as Record<string, any>) || {}
    const mission = settings.mission as string | undefined
    const vision = settings.vision as string | undefined

    // Fetch program metrics (from impact module)
    const { data: metrics } = await supabase
      .from('program_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    const programMetrics =
      metrics?.map(m => ({
        name: m.metric_name,
        value: m.metric_value,
        unit: m.metric_unit || 'units',
        description: m.description || undefined,
      })) || []

    // Calculate funding statistics
    const { data: gifts } = await supabase
      .from('gifts')
      .select('amount')
      .eq('organization_id', organizationId)

    const totalRaised = gifts?.reduce((sum, g) => sum + g.amount, 0) || 0
    const donorCount = new Set(gifts?.map(g => g.contact_id) || []).size
    const averageGift = gifts && gifts.length > 0 ? totalRaised / gifts.length : 0

    // Count major donors (lifetime giving >= $1000)
    const { data: majorDonors } = await supabase
      .from('contacts')
      .select('id, lifetime_giving')
      .eq('organization_id', organizationId)
      .gte('lifetime_giving', 1000)

    const majorDonorCount = majorDonors?.length || 0

    // Calculate volunteer statistics
    const { data: signups } = await supabase
      .from('shift_signups')
      .select('hours_logged, contact_id')
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .not('checked_in_at', 'is', null)

    const totalHours = signups?.reduce((sum, s) => sum + (s.hours_logged || 0), 0) || 0
    const activeVolunteers = new Set(signups?.map(s => s.contact_id) || []).size

    // Get years operating (from organization created_at)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('created_at')
      .eq('id', organizationId)
      .single()

    const yearsOperating = orgData
      ? Math.max(1, new Date().getFullYear() - new Date(orgData.created_at).getFullYear())
      : undefined

    // Get people served from impact metrics or settings
    const peopleServedMetric = metrics?.find(
      m => m.metric_name.toLowerCase().includes('people') || m.metric_name.toLowerCase().includes('served')
    )
    const peopleServed = peopleServedMetric?.metric_value || settings.people_served || undefined

    return {
      organization: {
        name: org.name,
        mission,
        vision,
      },
      impact: {
        programMetrics,
        peopleServed,
        yearsOperating,
      },
      funding: {
        totalRaised: totalRaised > 0 ? totalRaised : undefined,
        donorCount: donorCount > 0 ? donorCount : undefined,
        majorDonorCount: majorDonorCount > 0 ? majorDonorCount : undefined,
        averageGift: averageGift > 0 ? averageGift : undefined,
      },
      volunteers: {
        totalHours: totalHours > 0 ? totalHours : undefined,
        activeVolunteers: activeVolunteers > 0 ? activeVolunteers : undefined,
      },
    }
  } catch (error) {
    console.error('Error fetching organization context:', error)
    throw new Error(
      `Failed to fetch organization context: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get a specific grant application by ID
 */
export async function getGrantApplication(grantId: string) {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data: grant, error } = await supabase
      .from('grant_applications')
      .select('*')
      .eq('id', grantId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      throw new Error('Failed to fetch grant application')
    }

    return grant
  } catch (error) {
    console.error('Error fetching grant application:', error)
    throw error
  }
}

/**
 * Get existing proposal for a grant (if any)
 */
export async function getGrantProposal(grantId: string) {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data: proposal, error } = await supabase
      .from('grant_proposals')
      .select('*')
      .eq('grant_id', grantId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching proposal:', error)
      return null
    }

    return proposal
  } catch (error) {
    console.error('Error fetching grant proposal:', error)
    return null
  }
}
