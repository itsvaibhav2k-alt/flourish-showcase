'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

interface RecordDonationParams {
  organizationId: string
  formId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  amount: number
  isRecurring: boolean
  stripePaymentIntentId?: string
  stripeSubscriptionId?: string
}

export async function recordDonation(params: RecordDonationParams) {
  try {
    const supabase = createAdminClient()

    // First, check if a contact with this email already exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', params.organizationId)
      .eq('email', params.email)
      .single()

    let contactId: string

    if (existingContact) {
      // Update existing contact
      contactId = existingContact.id

      const updates: Record<string, any> = {
        first_name: params.firstName,
        last_name: params.lastName,
        is_donor: true,
      }

      if (params.phone) {
        updates.phone = params.phone
      }

      await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: params.organizationId,
          first_name: params.firstName,
          last_name: params.lastName,
          email: params.email,
          phone: params.phone || null,
          is_donor: true,
        })
        .select('id')
        .single()

      if (contactError || !newContact) {
        throw new Error('Failed to create contact')
      }

      contactId = newContact.id
    }

    // Record the gift
    const { error: giftError } = await supabase
      .from('gifts')
      .insert({
        organization_id: params.organizationId,
        contact_id: contactId,
        amount: params.amount,
        gift_date: new Date().toISOString(),
        gift_type: params.isRecurring ? 'recurring' : 'one-time',
        payment_method: 'credit_card',
        notes: params.stripePaymentIntentId
          ? `Stripe Payment Intent: ${params.stripePaymentIntentId}`
          : params.stripeSubscriptionId
          ? `Stripe Subscription: ${params.stripeSubscriptionId}`
          : undefined,
      })

    if (giftError) {
      console.error('Error recording gift:', giftError)
      throw new Error('Failed to record gift')
    }

    // Revalidate relevant paths
    revalidatePath(`/dashboard/donors`)
    revalidatePath(`/dashboard/contacts`)

    return {
      success: true,
      contactId,
    }
  } catch (error) {
    console.error('Error recording donation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record donation',
    }
  }
}
