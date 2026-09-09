/**
 * REST API v1 - Enroll in Sequence
 *
 * POST /api/v1/sequences/enroll
 * Enrolls a contact in an email sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '../../_lib/auth'

interface EnrollSequenceRequest {
  contact_id?: string
  contact_email?: string
  sequence_id: string
  trigger_event_type?: string
  trigger_event_id?: string
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate API key
    const auth = await validateApiKey(req)
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      )
    }

    // Check write permission
    if (!auth.permissions.includes('write') && !auth.permissions.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Requires write access.' },
        { status: 403 }
      )
    }

    // Parse request body
    let body: EnrollSequenceRequest
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.sequence_id) {
      return NextResponse.json(
        { success: false, error: 'sequence_id is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find contact
    let contactId = body.contact_id

    if (!contactId && body.contact_email) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', auth.organizationId)
        .eq('email', body.contact_email)
        .single()

      if (!contact) {
        return NextResponse.json(
          { success: false, error: 'Contact not found with provided email' },
          { status: 404 }
        )
      }
      contactId = contact.id
    }

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'contact_id or contact_email is required' },
        { status: 400 }
      )
    }

    // Verify contact belongs to organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name')
      .eq('id', contactId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Verify sequence exists and is active
    const { data: sequence, error: seqError } = await supabase
      .from('email_sequences')
      .select('id, name, is_active')
      .eq('id', body.sequence_id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (seqError || !sequence) {
      return NextResponse.json(
        { success: false, error: 'Sequence not found' },
        { status: 404 }
      )
    }

    if (!sequence.is_active) {
      return NextResponse.json(
        { success: false, error: 'Sequence is not active' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('sequence_enrollments')
      .select('id, status')
      .eq('sequence_id', body.sequence_id)
      .eq('contact_id', contactId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        return NextResponse.json(
          {
            success: false,
            error: 'Contact is already enrolled in this sequence',
            data: { enrollment_id: existingEnrollment.id },
          },
          { status: 409 }
        )
      }
      // If previously enrolled but not active, we can re-enroll
    }

    // Get first step timing
    const { data: firstStep } = await supabase
      .from('email_sequence_steps')
      .select('delay_days, delay_hours')
      .eq('sequence_id', body.sequence_id)
      .eq('step_order', 1)
      .single()

    if (!firstStep) {
      return NextResponse.json(
        { success: false, error: 'Sequence has no steps' },
        { status: 400 }
      )
    }

    // Calculate next step time
    const now = new Date()
    const nextStepAt = new Date(
      now.getTime() +
        (firstStep.delay_days || 0) * 24 * 60 * 60 * 1000 +
        (firstStep.delay_hours || 0) * 60 * 60 * 1000
    )

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('sequence_enrollments')
      .insert({
        organization_id: auth.organizationId,
        sequence_id: body.sequence_id,
        contact_id: contactId,
        trigger_event_type: body.trigger_event_type || 'api',
        trigger_event_id: body.trigger_event_id,
        current_step: 0,
        status: 'active',
        next_step_at: nextStepAt.toISOString(),
      })
      .select('id')
      .single()

    if (enrollError) {
      console.error('Error enrolling contact:', enrollError)
      if (enrollError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Contact already enrolled in this sequence' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to enroll contact' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: auth.organizationId,
      contact_id: contactId,
      activity_type: 'sequence_enrolled',
      description: `Enrolled in sequence: ${sequence.name}`,
      metadata: {
        source: 'api_v1',
        enrollment_id: enrollment.id,
        sequence_id: body.sequence_id,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        enrollment_id: enrollment.id,
        sequence_id: body.sequence_id,
        sequence_name: sequence.name,
        contact: {
          id: contact.id,
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
        },
        next_step_at: nextStepAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('API v1 enroll sequence error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List sequences available for enrollment
export async function GET(req: NextRequest) {
  try {
    // Authenticate API key
    const auth = await validateApiKey(req)
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      )
    }

    const supabase = createAdminClient()

    // Fetch active sequences
    const { data: sequences, error } = await supabase
      .from('email_sequences')
      .select(`
        id,
        name,
        description,
        trigger_type,
        is_active,
        created_at,
        steps:email_sequence_steps(count)
      `)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching sequences:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sequences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sequences: (sequences || []).map((s: { id: string; name: string; description: string; trigger_type: string; created_at: string; steps?: { count: number }[] }) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          trigger_type: s.trigger_type,
          step_count: s.steps?.[0]?.count || 0,
          created_at: s.created_at,
        })),
      },
    })
  } catch (error) {
    console.error('API v1 list sequences error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  })
}
