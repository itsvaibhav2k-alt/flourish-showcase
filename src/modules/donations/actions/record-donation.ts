'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

type RecordDonationResult = {
  success: boolean
  data?: { id: string }
  error?: string
}

/**
 * Server action to mark a donation as completed
 * Called after successful payment processing
 */
export async function recordDonation(
  donationId: string,
  paymentIntentId?: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<RecordDonationResult> {
  try {
    const supabase = await createClient()

    // Update donation status to completed
    const { data, error } = await supabase
      .from('donations')
      .update({
        status: 'completed',
        payment_intent_id: paymentIntentId || null,
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubscriptionId || null,
      })
      .eq('id', donationId)
      .select('id, organization_id, contact_id, amount, donor_email, donor_first_name, donor_last_name')
      .single()

    if (error || !data) {
      console.error('Error recording donation:', error)
      return {
        success: false,
        error: error?.message || 'Failed to record donation',
      }
    }

    // If we have a contact_id, also record this as a gift
    if (data.contact_id) {
      const { error: giftError } = await supabase
        .from('gifts')
        .insert({
          organization_id: data.organization_id,
          contact_id: data.contact_id,
          amount: data.amount,
          gift_date: new Date().toISOString(),
          gift_type: 'one-time',
          payment_method: 'credit_card',
          notes: `Online donation via donation form`,
        })

      if (giftError) {
        console.error('Error creating gift record:', giftError)
        // Don't fail the donation if gift creation fails
      }
    }

    // Trigger thank-you email via Inngest
    try {
      await inngest.send({
        name: 'donation/completed',
        data: {
          donationId: data.id,
          contactId: data.contact_id,
          organizationId: data.organization_id,
          amount: data.amount,
          donorEmail: data.donor_email,
          donorName: `${data.donor_first_name} ${data.donor_last_name}`,
        },
      })
    } catch (inngestError) {
      console.warn('Failed to send Inngest event for donation:', inngestError)
    }

    // Revalidate paths
    revalidatePath('/donations')
    if (data.contact_id) {
      revalidatePath(`/donors/${data.contact_id}`)
    }

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('Error in recordDonation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record donation',
    }
  }
}

/**
 * Server action to mark a donation as failed
 */
export async function markDonationFailed(
  donationId: string,
  errorMessage?: string
): Promise<RecordDonationResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('donations')
      .update({
        status: 'failed',
        notes: errorMessage || 'Payment failed',
      })
      .eq('id', donationId)
      .select('id')
      .single()

    if (error || !data) {
      console.error('Error marking donation as failed:', error)
      return {
        success: false,
        error: error?.message || 'Failed to update donation',
      }
    }

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('Error in markDonationFailed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update donation',
    }
  }
}
