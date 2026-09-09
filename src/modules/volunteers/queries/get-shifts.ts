'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface GetShiftsOptions {
  status?: 'upcoming' | 'past' | 'all'
  limit?: number
  offset?: number
}

export async function getShifts(options: GetShiftsOptions = {}) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { shifts: [], total: 0 }
    }

    const {
      status = 'upcoming',
      limit = 50,
      offset = 0,
    } = options

    let query = supabase
      .from('shifts')
      .select(`
        *,
        shift_signups!shift_signups_shift_id_fkey (
          id,
          status
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .neq('status', 'cancelled')

    // Filter by time
    const now = new Date().toISOString()
    if (status === 'upcoming') {
      query = query.gte('start_time', now)
      query = query.order('start_time', { ascending: true })
    } else if (status === 'past') {
      query = query.lt('start_time', now)
      query = query.order('start_time', { ascending: false })
    } else {
      query = query.order('start_time', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: shifts, error, count } = await query

    if (error) {
      console.error('Error fetching shifts:', error)
      throw new Error('Failed to fetch shifts')
    }

    // Calculate signup counts for each shift
    const shiftsWithCounts = (shifts || []).map(shift => {
      const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
      const confirmedCount = signups.filter(s => s.status === 'confirmed').length
      const waitlistedCount = signups.filter(s => s.status === 'waitlisted').length

      return {
        ...shift,
        confirmed_signups: confirmedCount,
        waitlisted_signups: waitlistedCount,
        total_signups: confirmedCount + waitlistedCount,
        fill_rate: shift.capacity && shift.capacity > 0 ? (confirmedCount / shift.capacity) * 100 : 0,
      }
    })

    return {
      shifts: shiftsWithCounts,
      total: count || 0,
    }
  } catch (error) {
    console.error('Unexpected error fetching shifts:', error)
    throw error
  }
}

export async function getShiftById(shiftId: string) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return null
    }

    const { data: shift, error } = await supabase
      .from('shifts')
      .select(`
        *,
        shift_signups (
          id,
          contact_id,
          status,
          checked_in_at,
          hours_logged,
          no_show,
          created_at,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('id', shiftId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching shift:', error)
      throw new Error('Failed to fetch shift')
    }

    const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
    const confirmedCount = signups.filter(s => s.status === 'confirmed').length
    const waitlistedCount = signups.filter(s => s.status === 'waitlisted').length

    return {
      ...shift,
      confirmed_signups: confirmedCount,
      waitlisted_signups: waitlistedCount,
      total_signups: confirmedCount + waitlistedCount,
      fill_rate: shift.capacity && shift.capacity > 0 ? (confirmedCount / shift.capacity) * 100 : 0,
    }
  } catch (error) {
    console.error('Unexpected error fetching shift:', error)
    throw error
  }
}

export async function getShiftStats() {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { upcoming_shifts: 0, hours_this_month: 0, average_fill_rate: 0 }
    }

    const now = new Date().toISOString()
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    // Count upcoming shifts
    const { count: upcomingCount } = await supabase
      .from('shifts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('start_time', now)
      .neq('status', 'cancelled')

    // Calculate hours this month
    const { data: monthlySignups } = await supabase
      .from('shift_signups')
      .select('hours_logged, shifts!inner(organization_id)')
      .eq('shifts.organization_id', organizationId)
      .gte('created_at', firstDayOfMonth.toISOString())
      .not('hours_logged', 'is', null)

    const hoursThisMonth = (monthlySignups || [])
      .reduce((sum, signup) => sum + (signup.hours_logged || 0), 0)

    // Calculate average fill rate
    const { data: shifts } = await supabase
      .from('shifts')
      .select(`
        capacity,
        shift_signups!shift_signups_shift_id_fkey (
          status
        )
      `)
      .eq('organization_id', organizationId)
      .gte('start_time', now)
      .neq('status', 'cancelled')

    let totalFillRate = 0
    let shiftsWithCapacity = 0

    if (shifts) {
      shifts.forEach(shift => {
        if (shift.capacity && shift.capacity > 0) {
          const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
          const confirmedCount = signups.filter(s => s.status === 'confirmed').length
          totalFillRate += (confirmedCount / shift.capacity) * 100
          shiftsWithCapacity++
        }
      })
    }

    const averageFillRate = shiftsWithCapacity > 0
      ? Math.round(totalFillRate / shiftsWithCapacity)
      : 0

    return {
      upcoming_shifts: upcomingCount || 0,
      hours_this_month: Math.round(hoursThisMonth * 100) / 100,
      average_fill_rate: averageFillRate,
    }
  } catch (error) {
    console.error('Unexpected error fetching shift stats:', error)
    throw error
  }
}
