/**
 * Resend Webhook Handler
 *
 * Handles email tracking events from Resend:
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 * - email.delivery_delayed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role client for webhook processing (bypasses RLS)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration for webhook handler')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// Verify Resend webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('Missing signature or webhook secret')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Map Resend event types to our event types
function mapEventType(resendEventType: string): string | null {
  const eventMap: Record<string, string> = {
    'email.delivered': 'delivered',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.delivery_delayed': 'delivery_delayed',
  }

  return eventMap[resendEventType] || null
}

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    // Click-specific
    click?: {
      link: string
      timestamp: string
      user_agent?: string
      ip_address?: string
    }
    // Bounce-specific
    bounce?: {
      message: string
    }
    // Headers for tracking
    headers?: Array<{ name: string; value: string }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('resend-signature')
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const event: ResendWebhookPayload = JSON.parse(payload)

    // Map the event type
    const eventType = mapEventType(event.type)
    if (!eventType) {
      // Ignore events we don't track
      return NextResponse.json({ received: true, ignored: true })
    }

    const supabase = getServiceClient()
    const resendId = event.data.email_id

    // Find the email draft by resend_id
    const { data: draft, error: draftError } = await supabase
      .from('email_drafts')
      .select('id, organization_id, contact_id')
      .eq('resend_id', resendId)
      .single()

    if (draftError || !draft) {
      console.warn(`No draft found for resend_id: ${resendId}`)
      // Still return success - webhook was received, just no matching draft
      return NextResponse.json({ received: true, matched: false })
    }

    // Build event data
    const eventData: Record<string, unknown> = {
      from: event.data.from,
      to: event.data.to,
      subject: event.data.subject,
    }

    // Add click-specific data
    if (event.data.click) {
      eventData.link = event.data.click.link
      eventData.click_timestamp = event.data.click.timestamp
    }

    // Add bounce-specific data
    if (event.data.bounce) {
      eventData.bounce_message = event.data.bounce.message
    }

    // Insert the email event
    const { error: insertError } = await supabase
      .from('email_events')
      .insert({
        organization_id: draft.organization_id,
        draft_id: draft.id,
        contact_id: draft.contact_id,
        resend_id: resendId,
        event_type: eventType,
        event_data: eventData,
        user_agent: event.data.click?.user_agent || null,
        ip_address: event.data.click?.ip_address || null,
        occurred_at: event.created_at || new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error inserting email event:', insertError)
      return NextResponse.json(
        { error: 'Failed to record event' },
        { status: 500 }
      )
    }

    console.log(`Recorded ${eventType} event for email ${resendId}`)

    return NextResponse.json({
      received: true,
      matched: true,
      eventType,
      draftId: draft.id
    })

  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Resend also sends GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'resend-webhook',
    timestamp: new Date().toISOString()
  })
}
