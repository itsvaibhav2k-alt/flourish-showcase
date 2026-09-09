export const dynamic = 'force-dynamic'
import { getShifts, getShiftStats } from '@/modules/volunteers/queries/get-shifts'
import { getVolunteers, getVolunteerStats } from '@/modules/volunteers/queries/get-volunteers'
import { VolunteersPageClient } from './VolunteersPageClient'

// Default stats when data can't be fetched
const defaultShiftStats = {
  upcoming_shifts: 0,
  hours_this_month: 0,
  average_fill_rate: 0,
}

const defaultVolunteerStats = {
  total_volunteers: 0,
  total_hours: 0,
  hours_this_month: 0,
}

/**
 * Volunteers page
 * Shows volunteer statistics, upcoming shifts, and volunteer list
 */
export default async function VolunteersPage() {
  // Fetch stats and data in parallel with error handling
  let shiftStats = defaultShiftStats
  let volunteerStats = defaultVolunteerStats
  let upcomingShifts: Awaited<ReturnType<typeof getShifts>>['shifts'] = []
  let volunteers: Awaited<ReturnType<typeof getVolunteers>>['volunteers'] = []

  try {
    const [shiftStatsResult, volunteerStatsResult, upcomingShiftsResult, volunteersResult] = await Promise.all([
      getShiftStats().catch(() => defaultShiftStats),
      getVolunteerStats().catch(() => defaultVolunteerStats),
      getShifts({ status: 'upcoming', limit: 6 }).catch(() => ({ shifts: [] as typeof upcomingShifts, total: 0 })),
      getVolunteers({ limit: 12 }).catch(() => ({ volunteers: [] as typeof volunteers, total: 0 })),
    ])
    shiftStats = shiftStatsResult
    volunteerStats = volunteerStatsResult
    upcomingShifts = upcomingShiftsResult.shifts
    volunteers = volunteersResult.volunteers
  } catch {
    // Use defaults if all queries fail
  }

  return (
    <VolunteersPageClient
      shiftStats={shiftStats}
      volunteerStats={volunteerStats}
      upcomingShifts={upcomingShifts}
      volunteers={volunteers}
    />
  )
}
