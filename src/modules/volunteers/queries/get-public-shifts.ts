'use server'

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Public queries for volunteer shift portal
 * Uses admin client to bypass RLS for unauthenticated public access
 */

export async function getOrgBySlug(slug: string) {
  try {
    const supabase = await createAdminClient()

    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, public_slug')
      .eq('public_slug', slug)
      .single()

    if (error || !org) {
      console.error('Error fetching organization:', error)
      return null
    }

    return org
  } catch (error) {
    console.error('Unexpected error fetching organization:', error)
    return null
  }
}

export async function getPublicShifts(orgSlug: string) {
  try {
    const supabase = await createAdminClient()

    // First get the organization
    const org = await getOrgBySlug(orgSlug)
    if (!org) {
      return null
    }

    const now = new Date().toISOString()

    // Fetch public shifts that are upcoming and not cancelled
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        shift_signups!shift_signups_shift_id_fkey (
          id,
          status
        )
      `)
      .eq('organization_id', org.id)
      .eq('is_public', true)
      .gte('start_time', now)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching public shifts:', error)
      return null
    }

    // Calculate signup counts and available spots for each shift
    const shiftsWithCounts = (shifts || []).map(shift => {
      const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
      const confirmedCount = signups.filter(s => s.status === 'confirmed').length
      const availableSpots = shift.capacity ? Math.max(0, shift.capacity - confirmedCount) : null
      const isFull = shift.capacity ? confirmedCount >= shift.capacity : false

      return {
        ...shift,
        confirmed_signups: confirmedCount,
        available_spots: availableSpots,
        is_full: isFull,
      }
    })

    return {
      organization: org,
      shifts: shiftsWithCounts,
    }
  } catch (error) {
    console.error('Unexpected error fetching public shifts:', error)
    return null
  }
}

export async function getPublicShiftById(orgSlug: string, shiftId: string) {
  try {
    const supabase = await createAdminClient()

    // First get the organization
    const org = await getOrgBySlug(orgSlug)
    if (!org) {
      return null
    }

    const { data: shift, error } = await supabase
      .from('shifts')
      .select(`
        *,
        shift_signups!shift_signups_shift_id_fkey (
          id,
          status
        )
      `)
      .eq('id', shiftId)
      .eq('organization_id', org.id)
      .eq('is_public', true)
      .neq('status', 'cancelled')
      .single()

    if (error || !shift) {
      console.error('Error fetching public shift:', error)
      return null
    }

    // Calculate signup counts and availability
    const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
    const confirmedCount = signups.filter(s => s.status === 'confirmed').length
    const availableSpots = shift.capacity ? Math.max(0, shift.capacity - confirmedCount) : null
    const isFull = shift.capacity ? confirmedCount >= shift.capacity : false

    return {
      organization: org,
      shift: {
        ...shift,
        confirmed_signups: confirmedCount,
        available_spots: availableSpots,
        is_full: isFull,
      },
    }
  } catch (error) {
    console.error('Unexpected error fetching public shift:', error)
    return null
  }
}
