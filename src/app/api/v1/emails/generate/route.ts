/**
 * REST API v1 - Generate Email Drafts
 *
 * POST /api/v1/emails/generate
 * Generates AI-powered email drafts for contacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDraft, EmailType } from '@/modules/communications/actions/generate-draft'
import { validateApiKey } from '../../_lib/auth'

interface GenerateEmailRequest {
  contact_id?: string
  contact_email?: string
  email_type: EmailType
  gift_id?: string
  shift_id?: string
  count?: number // Generate multiple drafts
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
    let body: GenerateEmailRequest
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.email_type) {
      return NextResponse.json(
        { success: false, error: 'email_type is required' },
        { status: 400 }
      )
    }

    const validEmailTypes: EmailType[] = [
      'thank_you',
      'reengagement',
      'volunteer_confirmation',
      'volunteer_reminder',
      'volunteer_thank_you',
      'custom',
      'general_thanks',
    ]

    if (!validEmailTypes.includes(body.email_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid email_type. Must be one of: ${validEmailTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find contact(s)
    let contactIds: string[] = []

    if (body.contact_id) {
      contactIds = [body.contact_id]
    } else if (body.contact_email) {
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
      contactIds = [contact.id]
    } else {
      return NextResponse.json(
        { success: false, error: 'contact_id or contact_email is required' },
        { status: 400 }
      )
    }

    // Generate drafts
    const results = []

    for (const contactId of contactIds) {
      const result = await generateDraft({
        organizationId: auth.organizationId,
        contactId,
        emailType: body.email_type,
        context: {
          giftId: body.gift_id,
          shiftId: body.shift_id,
        },
      })

      results.push({
        contact_id: contactId,
        success: result.success,
        draft_id: result.draftId,
        subject: result.subject,
        body: result.body,
        used_fallback: result.usedFallback,
        error: result.error,
      })
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: successCount > 0,
      data: {
        drafts: results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
        },
      },
    })
  } catch (error) {
    console.error('API v1 generate email error:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  })
}
