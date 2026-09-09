/**
 * REST API v1 - Send Emails
 *
 * POST /api/v1/emails/send
 * Sends approved email drafts or direct emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { validateApiKey } from '../../_lib/auth'

interface SendEmailRequest {
  // Option 1: Send existing draft(s)
  draft_ids?: string[]
  draft_id?: string

  // Option 2: Send direct email
  contact_id?: string
  contact_email?: string
  to?: string // Direct email address
  subject?: string
  body?: string
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
    let body: SendEmailRequest
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Option 1: Send existing drafts
    const draftIds = body.draft_ids || (body.draft_id ? [body.draft_id] : [])

    if (draftIds.length > 0) {
      // Fetch drafts with contact info
      const { data: drafts, error: draftsError } = await supabase
        .from('email_drafts')
        .select(`
          id,
          subject,
          body,
          status,
          contact:contacts(id, email, first_name, last_name)
        `)
        .in('id', draftIds)
        .eq('organization_id', auth.organizationId)

      if (draftsError || !drafts || drafts.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No drafts found with provided IDs' },
          { status: 404 }
        )
      }

      // Send each draft
      const results = []

      for (const draft of drafts) {
        // Validate draft is in sendable state
        if (!['draft', 'reviewed', 'approved'].includes(draft.status)) {
          results.push({
            draft_id: draft.id,
            success: false,
            error: `Draft status is ${draft.status}, cannot send`,
          })
          continue
        }

        const contact = draft.contact as { id: string; email: string; first_name: string; last_name: string } | null
        if (!contact?.email) {
          results.push({
            draft_id: draft.id,
            success: false,
            error: 'Contact has no email address',
          })
          continue
        }

        // Send email
        const sendResult = await sendEmail({
          to: contact.email,
          subject: draft.subject,
          body: draft.body,
          from: process.env.RESEND_FROM_EMAIL || 'noreply@flourishnpo.com',
        })

        if (sendResult.success) {
          // Update draft status
          await supabase
            .from('email_drafts')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', draft.id)

          // Log activity
          await supabase.from('activities').insert({
            organization_id: auth.organizationId,
            contact_id: contact.id,
            activity_type: 'email_sent',
            description: `Email sent: ${draft.subject}`,
            metadata: {
              source: 'api_v1',
              draft_id: draft.id,
              message_id: sendResult.messageId,
            },
          })

          results.push({
            draft_id: draft.id,
            success: true,
            message_id: sendResult.messageId,
            contact_email: contact.email,
          })
        } else {
          results.push({
            draft_id: draft.id,
            success: false,
            error: sendResult.error,
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      return NextResponse.json({
        success: successCount > 0,
        data: {
          results,
          summary: {
            total: results.length,
            sent: successCount,
            failed: failureCount,
          },
        },
      })
    }

    // Option 2: Send direct email
    if (body.subject && body.body) {
      let toEmail = body.to

      // If contact_id or contact_email provided, look up the email
      if (!toEmail && (body.contact_id || body.contact_email)) {
        let query = supabase
          .from('contacts')
          .select('id, email')
          .eq('organization_id', auth.organizationId)

        if (body.contact_id) {
          query = query.eq('id', body.contact_id)
        } else if (body.contact_email) {
          query = query.eq('email', body.contact_email)
        }

        const { data: contact } = await query.single()

        if (!contact?.email) {
          return NextResponse.json(
            { success: false, error: 'Contact not found or has no email' },
            { status: 404 }
          )
        }
        toEmail = contact.email
      }

      if (!toEmail) {
        return NextResponse.json(
          { success: false, error: 'to, contact_id, or contact_email is required' },
          { status: 400 }
        )
      }

      // Send email
      const sendResult = await sendEmail({
        to: toEmail,
        subject: body.subject,
        body: body.body,
        from: process.env.RESEND_FROM_EMAIL || 'noreply@flourishnpo.com',
      })

      if (!sendResult.success) {
        return NextResponse.json(
          { success: false, error: sendResult.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          message_id: sendResult.messageId,
          to: toEmail,
          subject: body.subject,
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Either draft_ids/draft_id or subject+body is required',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('API v1 send email error:', error)
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
