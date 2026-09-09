import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateICS, type CalendarEvent } from '@/lib/calendar/generate-ics'

/**
 * GET /api/calendar/shifts/[orgId]
 * Returns an ICS feed of all upcoming shifts for an organization
 * This can be subscribed to in calendar applications
 * The endpoint is public and doesn't require authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: organizationId } = await params

    // Validate UUID format to prevent invalid queries
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(organizationId)) {
      return NextResponse.json(
        { error: 'Invalid organization ID' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for public access
    const supabase = await createAdminClient()

    // Fetch the organization to validate it exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Fetch all upcoming public shifts for this organization
    const now = new Date().toISOString()
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id, title, description, location, start_time, end_time')
      .eq('organization_id', organizationId)
      .eq('is_public', true)
      .gte('start_time', now)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })
      .limit(100) // Limit to next 100 shifts to keep feed size reasonable

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError)
      return NextResponse.json(
        { error: 'Failed to fetch shifts' },
        { status: 500 }
      )
    }

    // Convert shifts to calendar events
    const events: CalendarEvent[] = (shifts || []).map(shift => ({
      uid: `shift-${shift.id}@flourish.app`,
      title: shift.title,
      description: shift.description || undefined,
      location: shift.location || undefined,
      startTime: new Date(shift.start_time),
      endTime: new Date(shift.end_time),
      organizer: {
        name: organization.name,
        email: 'noreply@flourish.app',
      },
    }))

    // Generate ICS content
    const icsContent = generateICS(events)

    // Create a safe filename from the organization name
    const safeName = organization.name
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50)
    const filename = `${safeName}-volunteer-shifts.ics`

    // Return the ICS feed with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        // Allow caching for up to 1 hour for calendar feeds
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating calendar feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar feed' },
      { status: 500 }
    )
  }
}
