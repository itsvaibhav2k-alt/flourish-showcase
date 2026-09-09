/**
 * Automation Webhook Endpoint
 *
 * Handles webhook requests from Zapier, n8n, and other automation platforms.
 * Supports actions: send_email, enroll_sequence, generate_custom_email, create_contact, update_contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDraft, EmailType } from '@/modules/communications/actions/generate-draft'
import { sendEmail } from '@/lib/email/resend'

// Rate limiting store (in-memory for single instance, use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

interface WebhookPayload {
  action?: string
  // For send_email / generate_custom_email
  contact_id?: string
  contact_email?: string
  email_type?: EmailType
  subject?: string
  body?: string
  // For enroll_sequence
  sequence_id?: string
  // For create_contact / update_contact
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  is_donor?: boolean
  is_volunteer?: boolean
  notes?: string
  tags?: string[]
  custom_fields?: Record<string, unknown>
  // Additional context
  gift_id?: string
  gift_amount?: number
}

interface WebhookConfig {
  default_email_type?: EmailType
  default_sequence_id?: string
  auto_approve_emails?: boolean
  field_mapping?: Record<string, string>
}

/**
 * Check rate limit for a webhook
 */
function checkRateLimit(
  webhookId: string,
  limitPerMinute: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = webhookId
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // Reset the counter
    const resetAt = now + 60000 // 1 minute
    rateLimitStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limitPerMinute - 1, resetAt }
  }

  if (entry.count >= limitPerMinute) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limitPerMinute - entry.count, resetAt: entry.resetAt }
}

/**
 * Log webhook invocation
 */
async function logWebhookInvocation(params: {
  webhookId: string
  organizationId: string
  method: string
  path: string
  requestBody: unknown
  responseStatus: number
  responseBody: unknown
  errorMessage?: string
  durationMs: number
  ipAddress?: string
}) {
  try {
    const supabase = createAdminClient()

    await supabase.from('automation_webhook_logs').insert({
      webhook_id: params.webhookId,
      organization_id: params.organizationId,
      request_method: params.method,
      request_path: params.path,
      request_body: params.requestBody as Record<string, unknown>,
      response_status: params.responseStatus,
      response_body: params.responseBody as Record<string, unknown>,
      error_message: params.errorMessage,
      duration_ms: params.durationMs,
      ip_address: params.ipAddress,
    })
  } catch (error) {
    console.error('Failed to log webhook invocation:', error)
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let webhookId: string | undefined
  let organizationId: string | undefined
  let requestBody: WebhookPayload | undefined

  try {
    // Get token from query params
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing webhook token' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Validate webhook token and get organization
    const { data: webhook, error: webhookError } = await supabase
      .from('automation_webhooks')
      .select('id, organization_id, webhook_type, config, is_active, rate_limit_per_minute')
      .eq('webhook_token', token)
      .single()

    if (webhookError || !webhook) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook token' },
        { status: 401 }
      )
    }

    webhookId = webhook.id
    organizationId = webhook.organization_id

    if (!webhook.is_active) {
      return NextResponse.json(
        { success: false, error: 'Webhook is disabled' },
        { status: 403 }
      )
    }

    // Check rate limit
    const rateLimit = checkRateLimit(webhook.id, webhook.rate_limit_per_minute || 60)
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retry_after: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      )
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)))
      return response
    }

    // Parse JSON body
    try {
      requestBody = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Apply field mapping if configured
    const config = (webhook.config || {}) as WebhookConfig
    if (config.field_mapping && requestBody) {
      const mappedBody = { ...requestBody } as WebhookPayload
      for (const [sourceField, targetField] of Object.entries(config.field_mapping)) {
        const sourceValue = (requestBody as Record<string, unknown>)[sourceField]
        if (sourceValue !== undefined && targetField) {
          (mappedBody as Record<string, unknown>)[targetField] = sourceValue
        }
      }
      requestBody = mappedBody
    }

    // Determine action from payload or webhook type
    const action = requestBody?.action || webhook.webhook_type

    // Handle the action
    let result: { success: boolean; data?: unknown; error?: string }

    switch (action) {
      case 'send_email':
        result = await handleSendEmail(webhook.organization_id, requestBody!, config, supabase)
        break

      case 'enroll_sequence':
        result = await handleEnrollSequence(webhook.organization_id, requestBody!, config, supabase)
        break

      case 'generate_custom_email':
        result = await handleGenerateEmail(webhook.organization_id, requestBody!, config)
        break

      case 'create_contact':
        result = await handleCreateContact(webhook.organization_id, requestBody!, supabase)
        break

      case 'update_contact':
        result = await handleUpdateContact(webhook.organization_id, requestBody!, supabase)
        break

      default:
        result = { success: false, error: `Unknown action: ${action}` }
    }

    // Build response
    const responseStatus = result.success ? 200 : 400
    const responseBody = result

    // Log webhook invocation
    await logWebhookInvocation({
      webhookId: webhook.id,
      organizationId: webhook.organization_id,
      method: 'POST',
      path: req.nextUrl.pathname,
      requestBody,
      responseStatus,
      responseBody,
      errorMessage: result.error,
      durationMs: Date.now() - startTime,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    })

    const response = NextResponse.json(responseBody, { status: responseStatus })
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)))
    return response
  } catch (error) {
    console.error('Automation webhook error:', error)

    // Log error if we have webhook info
    if (webhookId && organizationId) {
      await logWebhookInvocation({
        webhookId,
        organizationId,
        method: 'POST',
        path: req.nextUrl.pathname,
        requestBody,
        responseStatus: 500,
        responseBody: { success: false, error: 'Internal server error' },
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle send_email action
 * Sends an existing approved email or creates and sends a new one
 */
async function handleSendEmail(
  organizationId: string,
  payload: WebhookPayload,
  config: WebhookConfig,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Find contact
  let contactId = payload.contact_id
  let contactEmail: string | undefined

  if (!contactId && payload.contact_email) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, email')
      .eq('organization_id', organizationId)
      .eq('email', payload.contact_email)
      .single()

    if (!contact) {
      return { success: false, error: 'Contact not found with provided email' }
    }
    contactId = contact.id
    contactEmail = contact.email
  }

  if (!contactId) {
    return { success: false, error: 'contact_id or contact_email is required' }
  }

  // Get contact email if not already known
  if (!contactEmail) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('email')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (!contact?.email) {
      return { success: false, error: 'Contact has no email address' }
    }
    contactEmail = contact.email
  }

  // If subject and body provided, send directly
  if (payload.subject && payload.body) {
    const result = await sendEmail({
      to: contactEmail,
      subject: payload.subject,
      body: payload.body,
      from: process.env.RESEND_FROM_EMAIL || 'noreply@flourishnpo.com',
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send email' }
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: organizationId,
      contact_id: contactId,
      activity_type: 'email_sent',
      description: `Email sent via automation: ${payload.subject}`,
      metadata: {
        source: 'automation_webhook',
        messageId: result.messageId,
      },
    })

    return {
      success: true,
      data: {
        message_id: result.messageId,
        contact_id: contactId,
      },
    }
  }

  // Otherwise, generate and send using AI
  const emailType = payload.email_type || config.default_email_type || 'custom'

  const draftResult = await generateDraft({
    organizationId,
    contactId,
    emailType,
    context: {
      giftId: payload.gift_id,
    },
  })

  if (!draftResult.success || !draftResult.draftId) {
    return { success: false, error: draftResult.error || 'Failed to generate email' }
  }

  // If auto_approve is enabled, send immediately
  if (config.auto_approve_emails) {
    const sendResult = await sendEmail({
      to: contactEmail,
      subject: draftResult.subject!,
      body: draftResult.body!,
      from: process.env.RESEND_FROM_EMAIL || 'noreply@flourishnpo.com',
    })

    if (!sendResult.success) {
      return { success: false, error: sendResult.error || 'Failed to send email' }
    }

    // Update draft status
    await supabase
      .from('email_drafts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', draftResult.draftId)

    return {
      success: true,
      data: {
        draft_id: draftResult.draftId,
        message_id: sendResult.messageId,
        contact_id: contactId,
        sent: true,
      },
    }
  }

  // Otherwise, just return the draft
  return {
    success: true,
    data: {
      draft_id: draftResult.draftId,
      contact_id: contactId,
      subject: draftResult.subject,
      sent: false,
      message: 'Email draft created. Review and approve in dashboard.',
    },
  }
}

/**
 * Handle enroll_sequence action
 */
async function handleEnrollSequence(
  organizationId: string,
  payload: WebhookPayload,
  config: WebhookConfig,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Find contact
  let contactId = payload.contact_id

  if (!contactId && payload.contact_email) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', payload.contact_email)
      .single()

    if (!contact) {
      return { success: false, error: 'Contact not found with provided email' }
    }
    contactId = contact.id
  }

  if (!contactId) {
    return { success: false, error: 'contact_id or contact_email is required' }
  }

  // Get sequence ID
  const sequenceId = payload.sequence_id || config.default_sequence_id

  if (!sequenceId) {
    return { success: false, error: 'sequence_id is required' }
  }

  // Verify sequence exists and is active
  const { data: sequence, error: seqError } = await supabase
    .from('email_sequences')
    .select('id, name, is_active')
    .eq('id', sequenceId)
    .eq('organization_id', organizationId)
    .single()

  if (seqError || !sequence) {
    return { success: false, error: 'Sequence not found' }
  }

  if (!sequence.is_active) {
    return { success: false, error: 'Sequence is not active' }
  }

  // Get first step timing
  const { data: firstStep } = await supabase
    .from('email_sequence_steps')
    .select('delay_days, delay_hours')
    .eq('sequence_id', sequenceId)
    .eq('step_order', 1)
    .single()

  if (!firstStep) {
    return { success: false, error: 'Sequence has no steps' }
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
      organization_id: organizationId,
      sequence_id: sequenceId,
      contact_id: contactId,
      trigger_event_type: 'automation_webhook',
      trigger_event_id: payload.gift_id,
      current_step: 0,
      status: 'active',
      next_step_at: nextStepAt.toISOString(),
    })
    .select('id')
    .single()

  if (enrollError) {
    if (enrollError.code === '23505') {
      return { success: false, error: 'Contact already enrolled in this sequence' }
    }
    console.error('Error enrolling contact:', enrollError)
    return { success: false, error: 'Failed to enroll contact' }
  }

  return {
    success: true,
    data: {
      enrollment_id: enrollment.id,
      sequence_id: sequenceId,
      sequence_name: sequence.name,
      contact_id: contactId,
      next_step_at: nextStepAt.toISOString(),
    },
  }
}

/**
 * Handle generate_custom_email action
 */
async function handleGenerateEmail(
  organizationId: string,
  payload: WebhookPayload,
  config: WebhookConfig
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  let contactId = payload.contact_id

  if (!contactId && payload.contact_email) {
    const supabase = createAdminClient()
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', payload.contact_email)
      .single()

    if (!contact) {
      return { success: false, error: 'Contact not found with provided email' }
    }
    contactId = contact.id
  }

  if (!contactId) {
    return { success: false, error: 'contact_id or contact_email is required' }
  }

  const emailType = payload.email_type || config.default_email_type || 'custom'

  const draftResult = await generateDraft({
    organizationId,
    contactId,
    emailType,
    context: {
      giftId: payload.gift_id,
    },
  })

  if (!draftResult.success) {
    return { success: false, error: draftResult.error || 'Failed to generate email' }
  }

  return {
    success: true,
    data: {
      draft_id: draftResult.draftId,
      contact_id: contactId,
      subject: draftResult.subject,
      body: draftResult.body,
      used_fallback: draftResult.usedFallback,
    },
  }
}

/**
 * Handle create_contact action
 */
async function handleCreateContact(
  organizationId: string,
  payload: WebhookPayload,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  if (!payload.email && !payload.first_name) {
    return { success: false, error: 'email or first_name is required' }
  }

  // Check if contact already exists by email
  if (payload.email) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', payload.email)
      .single()

    if (existing) {
      return { success: false, error: 'Contact with this email already exists', data: { contact_id: existing.id } }
    }
  }

  // Create contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      organization_id: organizationId,
      email: payload.email || null,
      first_name: payload.first_name || 'Unknown',
      last_name: payload.last_name || '',
      phone: payload.phone || null,
      is_donor: payload.is_donor || false,
      is_volunteer: payload.is_volunteer || false,
    })
    .select('id, email, first_name, last_name')
    .single()

  if (error || !contact) {
    console.error('Error creating contact:', error)
    return { success: false, error: 'Failed to create contact' }
  }

  // Add notes if provided
  if (payload.notes) {
    await supabase.from('contact_notes').insert({
      organization_id: organizationId,
      contact_id: contact.id,
      content: payload.notes,
    })
  }

  // Log activity
  await supabase.from('activities').insert({
    organization_id: organizationId,
    contact_id: contact.id,
    activity_type: 'contact_created',
    description: 'Contact created via automation webhook',
    metadata: { source: 'automation_webhook' },
  })

  return {
    success: true,
    data: {
      contact_id: contact.id,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
    },
  }
}

/**
 * Handle update_contact action
 */
async function handleUpdateContact(
  organizationId: string,
  payload: WebhookPayload,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Find contact
  let contactId = payload.contact_id

  if (!contactId && payload.contact_email) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', payload.contact_email)
      .single()

    if (!contact) {
      return { success: false, error: 'Contact not found with provided email' }
    }
    contactId = contact.id
  }

  if (!contactId) {
    return { success: false, error: 'contact_id or contact_email is required' }
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (payload.email !== undefined) updates.email = payload.email
  if (payload.first_name !== undefined) updates.first_name = payload.first_name
  if (payload.last_name !== undefined) updates.last_name = payload.last_name
  if (payload.phone !== undefined) updates.phone = payload.phone
  if (payload.is_donor !== undefined) updates.is_donor = payload.is_donor
  if (payload.is_volunteer !== undefined) updates.is_volunteer = payload.is_volunteer

  // Update contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .select('id, email, first_name, last_name')
    .single()

  if (error || !contact) {
    console.error('Error updating contact:', error)
    return { success: false, error: 'Failed to update contact' }
  }

  // Add notes if provided
  if (payload.notes) {
    await supabase.from('contact_notes').insert({
      organization_id: organizationId,
      contact_id: contact.id,
      content: payload.notes,
    })
  }

  return {
    success: true,
    data: {
      contact_id: contact.id,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      updated: true,
    },
  }
}

// Also support GET for webhook verification (used by some platforms)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const challenge = req.nextUrl.searchParams.get('challenge')

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Missing webhook token' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: webhook, error } = await supabase
    .from('automation_webhooks')
    .select('id, name, webhook_type, is_active')
    .eq('webhook_token', token)
    .single()

  if (error || !webhook) {
    return NextResponse.json(
      { success: false, error: 'Invalid webhook token' },
      { status: 401 }
    )
  }

  // Return challenge for webhook verification
  if (challenge) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({
    success: true,
    webhook: {
      name: webhook.name,
      type: webhook.webhook_type,
      active: webhook.is_active,
    },
  })
}
