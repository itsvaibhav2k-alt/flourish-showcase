'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { calculateReliabilityScore } from '../services/reliability-scorer'

export interface GetVolunteersOptions {
  limit?: number
  offset?: number
  searchQuery?: string
}

export async function getVolunteers(options: GetVolunteersOptions = {}) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const {
      limit = 50,
      offset = 0,
      searchQuery = '',
    } = options

    let query = supabase
      .from('contacts')
      .select(`
        *,
        shift_signups (
          id,
          status,
          hours_logged,
          no_show,
          checked_in_at,
          shift_id,
          shifts (
            start_time,
            end_time,
            title
          )
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_volunteer', true)

    // Apply search filter
    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: volunteers, error, count } = await query

    if (error) {
      console.error('Error fetching volunteers:', error)
      throw new Error('Failed to fetch volunteers')
    }

    // Calculate stats for each volunteer
    const volunteersWithStats = (volunteers || []).map(volunteer => {
      const signups = Array.isArray(volunteer.shift_signups) ? volunteer.shift_signups : []

      const totalHours = signups
        .filter(s => s.hours_logged !== null)
        .reduce((sum, s) => sum + (s.hours_logged || 0), 0)

      const totalShifts = signups.filter(s => s.status === 'confirmed').length
      const completedShifts = signups.filter(s =>
        s.status === 'confirmed' && s.checked_in_at !== null
      ).length
      const noShowCount = signups.filter(s => s.no_show === true).length

      const reliabilityScore = calculateReliabilityScore({
        totalShifts,
        completedShifts,
        noShowCount,
      })

      // Get recent shifts (last 5)
      const recentShifts = signups
        .filter(s => s.shifts)
        .sort((a, b) => {
          const shiftA = Array.isArray(a.shifts) ? a.shifts[0] : a.shifts
          const shiftB = Array.isArray(b.shifts) ? b.shifts[0] : b.shifts
          if (!shiftA || !shiftB) return 0
          return new Date(shiftB.start_time).getTime() - new Date(shiftA.start_time).getTime()
        })
        .slice(0, 5)

      return {
        ...volunteer,
        total_hours: Math.round(totalHours * 100) / 100,
        total_shifts: totalShifts,
        completed_shifts: completedShifts,
        no_show_count: noShowCount,
        reliability_score: reliabilityScore,
        recent_shifts: recentShifts,
      }
    })

    return {
      volunteers: volunteersWithStats,
      total: count || 0,
    }
  } catch (error) {
    console.error('Unexpected error fetching volunteers:', error)
    throw error
  }
}

export async function getVolunteerById(contactId: string) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const { data: volunteer, error } = await supabase
      .from('contacts')
      .select(`
        *,
        shift_signups (
          id,
          status,
          hours_logged,
          no_show,
          checked_in_at,
          created_at,
          shift_id,
          shifts (
            id,
            title,
            start_time,
            end_time,
            location
          )
        )
      `)
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching volunteer:', error)
      throw new Error('Failed to fetch volunteer')
    }

    const signups = Array.isArray(volunteer.shift_signups) ? volunteer.shift_signups : []

    const totalHours = signups
      .filter(s => s.hours_logged !== null)
      .reduce((sum, s) => sum + (s.hours_logged || 0), 0)

    const totalShifts = signups.filter(s => s.status === 'confirmed').length
    const completedShifts = signups.filter(s =>
      s.status === 'confirmed' && s.checked_in_at !== null
    ).length
    const noShowCount = signups.filter(s => s.no_show === true).length

    const reliabilityScore = calculateReliabilityScore({
      totalShifts,
      completedShifts,
      noShowCount,
    })

    // Sort shifts by date
    const sortedSignups = signups.sort((a, b) => {
      const shiftA = Array.isArray(a.shifts) ? a.shifts[0] : a.shifts
      const shiftB = Array.isArray(b.shifts) ? b.shifts[0] : b.shifts
      if (!shiftA || !shiftB) return 0
      return new Date(shiftB.start_time).getTime() - new Date(shiftA.start_time).getTime()
    })

    return {
      ...volunteer,
      total_hours: Math.round(totalHours * 100) / 100,
      total_shifts: totalShifts,
      completed_shifts: completedShifts,
      no_show_count: noShowCount,
      reliability_score: reliabilityScore,
      shift_history: sortedSignups,
    }
  } catch (error) {
    console.error('Unexpected error fetching volunteer:', error)
    throw error
  }
}

export async function getVolunteerStats() {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    // Count total volunteers
    const { count: totalVolunteers } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_volunteer', true)

    // Get signups for hours calculation
    // Note: shift_signups doesn't have organization_id, so we query through shifts
    const { data: signups } = await supabase
      .from('shift_signups')
      .select('hours_logged, created_at, shifts!inner(organization_id)')
      .eq('shifts.organization_id', organizationId)
      .not('hours_logged', 'is', null)

    const totalHours = (signups || [])
      .reduce((sum, s) => sum + (s.hours_logged || 0), 0)

    const hoursThisMonth = (signups || [])
      .filter(s => new Date(s.created_at) >= firstDayOfMonth)
      .reduce((sum, s) => sum + (s.hours_logged || 0), 0)

    return {
      total_volunteers: totalVolunteers || 0,
      total_hours: Math.round(totalHours * 100) / 100,
      hours_this_month: Math.round(hoursThisMonth * 100) / 100,
    }
  } catch (error) {
    console.error('Unexpected error fetching volunteer stats:', error)
    throw error
  }
}
