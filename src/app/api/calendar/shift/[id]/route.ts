import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSingleEventICS, type CalendarEvent } from '@/lib/calendar/generate-ics'

/**
 * GET /api/calendar/shift/[id]
 * Returns an ICS file for a single volunteer shift
 * This endpoint is public and doesn't require authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params

    // Validate UUID format to prevent invalid queries
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(shiftId)) {
      return NextResponse.json(
        { error: 'Invalid shift ID' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for public access
    const supabase = await createAdminClient()

    // Fetch the shift with organization details
    const { data: shift, error } = await supabase
      .from('shifts')
      .select(`
        id,
        title,
        description,
        location,
        start_time,
        end_time,
        organization_id,
        organizations (
          name
        )
      `)
      .eq('id', shiftId)
      .single()

    if (error || !shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    // Build the calendar event
    // Type the organizations relation - Supabase returns a single object for .single() queries with joins
    const organizations = shift.organizations as { name: string } | null
    const event: CalendarEvent = {
      uid: `shift-${shift.id}@flourish.app`,
      title: shift.title,
      description: shift.description || undefined,
      location: shift.location || undefined,
      startTime: new Date(shift.start_time),
      endTime: new Date(shift.end_time),
      organizer: organizations
        ? {
            name: organizations.name,
            email: 'noreply@flourish.app',
          }
        : undefined,
    }

    // Generate ICS content
    const icsContent = generateSingleEventICS(event)

    // Create a safe filename from the shift title
    const safeTitle = shift.title
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50)
    const filename = `shift-${safeTitle}.ics`

    // Return the ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating ICS file:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    )
  }
}
