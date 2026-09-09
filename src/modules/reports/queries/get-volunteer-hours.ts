'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface VolunteerHoursByMonth {
  month: string // "2024-01"
  hours: number
  volunteers: number // Unique volunteer count
}

/**
 * Get monthly volunteer hours for reports
 * Supports optional date range filtering
 */
export async function getVolunteerHours(options?: {
  startDate?: string
  endDate?: string
}): Promise<VolunteerHoursByMonth[]> {
  try {
    const supabase = await createClient()

    // In BYPASS_AUTH mode, get org from cookie; otherwise from user membership
    let organizationId: string | null = null

    if (process.env.BYPASS_AUTH === 'true') {
      organizationId = await getCurrentOrganizationId()
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (memberError || !memberData) {
        throw new Error('Organization not found')
      }

      organizationId = memberData.organization_id
    }

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Build query - get shifts with signups
    let query = supabase
      .from('shifts')
      .select(`
        start_time,
        end_time,
        shift_signups (
          contact_id,
          status
        )
      `)
      .eq('organization_id', organizationId)
      .lte('start_time', new Date().toISOString()) // Only past shifts

    // Apply filters
    if (options?.startDate) {
      query = query.gte('start_time', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('start_time', options.endDate)
    }

    query = query.order('start_time', { ascending: true })

    const { data: shifts, error: shiftsError } = await query

    if (shiftsError) {
      throw new Error('Failed to fetch volunteer shifts')
    }

    // Group by month
    const monthlyMap = new Map<string, { hours: number; volunteerIds: Set<string> }>()

    shifts?.forEach((shift) => {
      const startDate = new Date(shift.start_time)
      const endDate = new Date(shift.end_time)
      const shiftHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`

      const existing = monthlyMap.get(monthKey) || { hours: 0, volunteerIds: new Set<string>() }

      // Count hours for each confirmed signup
      const confirmedSignups = shift.shift_signups?.filter(
        (signup: { status: string; contact_id: string }) => signup.status === 'confirmed' || signup.status === 'checked_in'
      ) || []

      confirmedSignups.forEach((signup: { status: string; contact_id: string }) => {
        existing.hours += shiftHours
        if (signup.contact_id) {
          existing.volunteerIds.add(signup.contact_id)
        }
      })

      monthlyMap.set(monthKey, existing)
    })

    // Convert to array and sort
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        hours: data.hours,
        volunteers: data.volunteerIds.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  } catch (error) {
    console.error('Error fetching volunteer hours:', error)
    throw error
  }
}
