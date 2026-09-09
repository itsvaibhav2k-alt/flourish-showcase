'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface UpcomingShift {
  id: string
  title: string
  description: string | null
  location: string | null
  startTime: string
  endTime: string
  capacity: number | null
  confirmedSignups: number
  fillRate: number
  status: string
}

export interface GetUpcomingShiftsOptions {
  daysAhead?: number
  limit?: number
}

/**
 * Get upcoming volunteer shifts for the dashboard
 * Shows shifts in the next N days with their fill rates
 */
export async function getUpcomingShifts(
  options: GetUpcomingShiftsOptions = {}
): Promise<UpcomingShift[]> {
  const { daysAhead = 7, limit = 5 } = options

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    // Calculate date range
    const now = new Date()
    const futureDate = new Date(now)
    futureDate.setDate(now.getDate() + daysAhead)

    // Fetch upcoming shifts with signups
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        id,
        title,
        description,
        location,
        start_time,
        end_time,
        capacity,
        status,
        shift_signups (
          id,
          status
        )
      `)
      .eq('organization_id', organizationId)
      .gte('start_time', now.toISOString())
      .lte('start_time', futureDate.toISOString())
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming shifts:', error)
      throw new Error(error.message)
    }

    // Calculate signup counts and fill rates
    const formattedShifts: UpcomingShift[] = (shifts || []).map((shift) => {
      const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
      const confirmedCount = signups.filter(s => s.status === 'confirmed' || s.status === 'completed').length
      const fillRate = shift.capacity && shift.capacity > 0 ? (confirmedCount / shift.capacity) * 100 : 0

      return {
        id: shift.id,
        title: shift.title,
        description: shift.description,
        location: shift.location,
        startTime: shift.start_time,
        endTime: shift.end_time,
        capacity: shift.capacity,
        confirmedSignups: confirmedCount,
        fillRate: Math.round(fillRate),
        status: shift.status,
      }
    })

    return formattedShifts
  } catch (error) {
    console.error('Error in getUpcomingShifts:', error)
    throw error
  }
}
