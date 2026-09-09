'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { CalendarEvent, GetCalendarEventsOptions, ShiftMetadata, TaskMetadata } from '../types/calendar.types'

export async function getCalendarEvents(
  options: GetCalendarEventsOptions
): Promise<CalendarEvent[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const { startDate, endDate } = options

    // Fetch shifts and tasks in parallel
    const [shiftsResult, tasksResult] = await Promise.all([
      // Fetch shifts within date range
      supabase
        .from('shifts')
        .select(
          `
          id,
          title,
          start_time,
          end_time,
          location,
          capacity,
          status,
          shift_signups!shift_signups_shift_id_fkey (
            id,
            status
          )
        `
        )
        .eq('organization_id', organizationId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .neq('status', 'cancelled'),

      // Fetch tasks within date range
      supabase
        .from('contact_tasks')
        .select(
          `
          id,
          title,
          description,
          due_date,
          status,
          contact_id,
          contact:contacts(id, first_name, last_name)
        `
        )
        .eq('organization_id', organizationId)
        .gte('due_date', startDate.split('T')[0])
        .lte('due_date', endDate.split('T')[0]),
    ])

    if (shiftsResult.error) {
      console.error('Error fetching shifts:', shiftsResult.error)
      throw new Error('Failed to fetch shifts')
    }

    if (tasksResult.error) {
      console.error('Error fetching tasks:', tasksResult.error)
      throw new Error('Failed to fetch tasks')
    }

    // Transform shifts to CalendarEvent format
    const shiftEvents: CalendarEvent[] = (shiftsResult.data || []).map((shift) => {
      const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
      const confirmedCount = signups.filter((s) => s.status === 'confirmed').length
      const fillRate =
        shift.capacity && shift.capacity > 0
          ? (confirmedCount / shift.capacity) * 100
          : 0

      const metadata: ShiftMetadata = {
        location: shift.location,
        capacity: shift.capacity,
        confirmedSignups: confirmedCount,
        fillRate,
      }

      return {
        id: shift.id,
        type: 'shift' as const,
        title: shift.title,
        startDate: new Date(shift.start_time),
        endDate: new Date(shift.end_time),
        status: shift.status,
        metadata,
      }
    })

    // Transform tasks to CalendarEvent format
    const taskEvents: CalendarEvent[] = (tasksResult.data || []).map((task) => {
      const contact = task.contact as { id: string; first_name: string | null; last_name: string | null } | null
      const contactName = contact
        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown'

      const metadata: TaskMetadata = {
        contactId: task.contact_id,
        contactName,
        description: task.description,
      }

      // Tasks are single-day events - set time to start of day
      const dueDate = new Date(task.due_date + 'T09:00:00')

      return {
        id: task.id,
        type: 'task' as const,
        title: task.title,
        startDate: dueDate,
        endDate: null, // Tasks don't have end dates
        status: task.status || 'OPEN', // Default to OPEN if status is null
        metadata,
      }
    })

    // Combine and sort by start date
    const allEvents = [...shiftEvents, ...taskEvents].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    )

    return allEvents
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    throw error
  }
}
