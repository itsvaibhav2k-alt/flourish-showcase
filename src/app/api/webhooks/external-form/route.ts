import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ExternalFormPayload {
  email?: string
  first_name?: string
  last_name?: string
  amount?: number
  phone?: string
  notes?: string
  [key: string]: unknown
}

export async function POST(req: NextRequest) {
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
      .from('external_form_webhooks')
      .select('id, organization_id, field_mapping, is_active')
      .eq('webhook_token', token)
      .single()

    if (webhookError || !webhook) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook token' },
        { status: 401 }
      )
    }

    if (!webhook.is_active) {
      return NextResponse.json(
        { success: false, error: 'Webhook is disabled' },
        { status: 403 }
      )
    }

    // Parse JSON body
    let body: ExternalFormPayload
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Apply field mapping if configured
    const fieldMapping = (webhook.field_mapping as Record<string, string>) || {}
    const mappedData: ExternalFormPayload = { ...body }

    // Apply custom field mappings
    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      if (body[sourceField] !== undefined && targetField) {
        mappedData[targetField] = body[sourceField]
      }
    }

    // Extract fields
    const email = mappedData.email as string | undefined
    const firstName = (mappedData.first_name || mappedData.firstName || 'Unknown') as string
    const lastName = (mappedData.last_name || mappedData.lastName || 'Contact') as string
    const amount = mappedData.amount ? Number(mappedData.amount) : undefined
    const phone = mappedData.phone as string | undefined
    const notes = mappedData.notes as string | undefined

    // Validate required fields
    if (!email && !firstName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email or first_name' },
        { status: 400 }
      )
    }

    // Check if contact exists by email
    let contactId: string | undefined

    if (email) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', webhook.organization_id)
        .eq('email', email)
        .single()

      if (existingContact) {
        contactId = existingContact.id

        // Update existing contact
        const updates: Record<string, unknown> = {
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        }

        if (phone) {
          updates.phone = phone
        }

        if (amount && amount > 0) {
          updates.is_donor = true
        }

        await supabase
          .from('contacts')
          .update(updates)
          .eq('id', contactId)
      }
    }

    // Create new contact if not found
    if (!contactId) {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: webhook.organization_id,
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          is_donor: amount && amount > 0 ? true : false,
        })
        .select('id')
        .single()

      if (contactError || !newContact) {
        console.error('Error creating contact:', contactError)
        return NextResponse.json(
          { success: false, error: 'Failed to create contact' },
          { status: 500 }
        )
      }

      contactId = newContact.id
    }

    // Create gift record if amount provided
    let giftId: string | undefined

    if (amount && amount > 0 && contactId) {
      const { data: gift, error: giftError } = await supabase
        .from('gifts')
        .insert({
          organization_id: webhook.organization_id,
          contact_id: contactId,
          amount,
          gift_date: new Date().toISOString(),
          gift_type: 'one-time',
          payment_method: 'external_form',
          notes: notes || `Submitted via external form: ${webhook.id}`,
        })
        .select('id')
        .single()

      if (giftError) {
        console.error('Error creating gift:', giftError)
        // Don't fail the whole request if gift creation fails
      } else {
        giftId = gift?.id
      }
    }

    // Add notes if provided and no gift was created
    if (notes && !giftId && contactId) {
      await supabase
        .from('contact_notes')
        .insert({
          organization_id: webhook.organization_id,
          contact_id: contactId,
          content: notes,
        })
    }

    // Update webhook submission stats
    // First get current count to increment
    const { data: currentWebhook } = await supabase
      .from('external_form_webhooks')
      .select('submission_count')
      .eq('id', webhook.id)
      .single()

    await supabase
      .from('external_form_webhooks')
      .update({
        submission_count: (currentWebhook?.submission_count || 0) + 1,
        last_submission_at: new Date().toISOString(),
      })
      .eq('id', webhook.id)

    // Log activity
    await supabase
      .from('activities')
      .insert({
        organization_id: webhook.organization_id,
        contact_id: contactId,
        activity_type: 'external_form_submission',
        description: `Form submitted via external webhook`,
        metadata: {
          webhook_id: webhook.id,
          amount: amount || null,
          has_gift: !!giftId,
        },
      })

    return NextResponse.json({
      success: true,
      data: {
        contact_id: contactId,
        gift_id: giftId || null,
        is_new_contact: !email || !contactId,
      },
    })
  } catch (error) {
    console.error('External form webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
