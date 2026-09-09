'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createGiftSchema, type CreateGiftInput } from '../schemas/gift.schema'
import { inngest } from '@/lib/inngest/client'
import { logGiftActivity } from '@/lib/activity'

export type RecordGiftResult =
  | { success: true; giftId: string }
  | { success: false; error: string }

/**
 * Server action to record a new gift
 * - Validates input
 * - Inserts gift into Supabase
 * - Updates contact's is_donor flag if needed
 * - Triggers thank-you generation (emit Inngest event)
 * - Logs activity
 * - Revalidates paths
 */
export async function recordGift(input: CreateGiftInput): Promise<RecordGiftResult> {
  try {
    // Validate input
    const validatedData = createGiftSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization from organization_members
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Verify contact belongs to this organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, is_donor')
      .eq('id', validatedData.contact_id)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Format gift_date as ISO timestamp if it's just a date
    let giftDate = validatedData.gift_date
    if (giftDate && !giftDate.includes('T')) {
      giftDate = `${giftDate}T12:00:00.000Z`
    }

    // Insert gift
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        organization_id: organizationId,
        contact_id: validatedData.contact_id,
        amount: validatedData.amount,
        gift_date: giftDate,
        gift_type: validatedData.gift_type,
        campaign: validatedData.campaign || null,
        payment_method: validatedData.payment_method || null,
        notes: validatedData.notes || null,
      })
      .select('id')
      .single()

    if (giftError || !gift) {
      console.error('Supabase gift insert error:', giftError)
      return { success: false, error: giftError?.message || 'Failed to record gift' }
    }

    // Update contact's is_donor flag if this is their first gift
    if (!contact.is_donor) {
      await supabase
        .from('contacts')
        .update({ is_donor: true })
        .eq('id', validatedData.contact_id)
    }

    // Log activity
    await logGiftActivity({
      organizationId,
      contactId: validatedData.contact_id,
      giftId: gift.id,
      amount: validatedData.amount,
      giftType: validatedData.gift_type,
      action: 'recorded',
    })

    // Trigger thank-you generation via Inngest (non-blocking)
    // Don't let Inngest failures prevent gift recording
    try {
      await inngest.send({
        name: 'gift/created',
        data: {
          giftId: gift.id,
          contactId: validatedData.contact_id,
          organizationId,
          amount: validatedData.amount,
        },
      })
    } catch (inngestError) {
      // Log but don't fail - gift was already recorded successfully
      console.warn('Failed to send Inngest event for gift:', inngestError)
    }

    // Revalidate relevant paths
    revalidatePath('/donors')
    revalidatePath(`/donors/${validatedData.contact_id}`)
    revalidatePath('/')

    return { success: true, giftId: gift.id }
  } catch (error) {
    console.error('Error recording gift:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
