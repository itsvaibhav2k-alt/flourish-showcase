'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { CreateGiftInput } from '../schemas/gift.schema'

export type GiftImportData = CreateGiftInput & {
  contact_email?: string
}

export type GiftImportSummary = {
  total: number
  imported: number
  skipped: number
  failed: number
  errors: Array<{
    row: number
    gift: GiftImportData
    error: string
  }>
}

const BATCH_SIZE = 100

/**
 * Import gifts in bulk with contact matching
 */
export async function importGifts(
  gifts: GiftImportData[]
): Promise<{
  success: boolean
  summary: GiftImportSummary
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        summary: {
          total: gifts.length,
          imported: 0,
          skipped: 0,
          failed: gifts.length,
          errors: [],
        },
        error: 'No organization selected',
      }
    }

    const supabase = await createClient()
    const summary: GiftImportSummary = {
      total: gifts.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    }

    // Process in batches
    for (let i = 0; i < gifts.length; i += BATCH_SIZE) {
      const batch = gifts.slice(i, i + BATCH_SIZE)

      for (const [index, gift] of batch.entries()) {
        const rowNumber = i + index + 1

        try {
          // Find contact by email
          if (!gift.contact_email) {
            throw new Error('Contact email is required')
          }
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('email', gift.contact_email)
            .is('archived_at', null)
            .single()

          if (contactError || !contact) {
            throw new Error(
              `Contact not found with email: ${gift.contact_email}. Please import contacts first.`
            )
          }

          // Parse gift date if it's a string
          let giftDate = gift.gift_date
          if (typeof giftDate === 'string') {
            try {
              giftDate = new Date(giftDate).toISOString()
            } catch {
              throw new Error('Invalid gift date format')
            }
          }

          // Insert gift
          const { error: insertError } = await supabase.from('gifts').insert({
            organization_id: organizationId,
            contact_id: contact.id,
            amount: gift.amount,
            gift_date: giftDate,
            gift_type: gift.gift_type,
            campaign: gift.campaign || null,
            payment_method: gift.payment_method || null,
            notes: gift.notes || null,
            thanked_at: null,
          })

          if (insertError) {
            throw new Error(insertError.message)
          }

          // Update contact to mark as donor if not already
          await supabase
            .from('contacts')
            .update({ is_donor: true })
            .eq('id', contact.id)
            .eq('is_donor', false)

          summary.imported++
        } catch (error) {
          summary.failed++
          summary.errors.push({
            row: rowNumber,
            gift,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    // Revalidate paths
    revalidatePath('/donors')

    return {
      success: true,
      summary,
    }
  } catch (error) {
    console.error('Error in importGifts:', error)
    return {
      success: false,
      summary: {
        total: gifts.length,
        imported: 0,
        skipped: 0,
        failed: gifts.length,
        errors: [],
      },
      error: error instanceof Error ? error.message : 'Failed to import gifts',
    }
  }
}

/**
 * Validate that all contacts exist for the gift import
 */
export async function validateGiftContacts(
  emails: string[]
): Promise<{
  success: boolean
  data: {
    found: string[]
    missing: string[]
  }
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        data: { found: [], missing: [] },
        error: 'No organization selected',
      }
    }

    const supabase = await createClient()

    // Get all unique emails
    const uniqueEmails = [...new Set(emails)]

    // Find which contacts exist
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('email')
      .eq('organization_id', organizationId)
      .in('email', uniqueEmails)
      .is('archived_at', null)

    if (error) {
      return {
        success: false,
        data: { found: [], missing: [] },
        error: error.message,
      }
    }

    const foundEmails = new Set(contacts?.map((c) => c.email) || [])
    const found = uniqueEmails.filter((email) => foundEmails.has(email))
    const missing = uniqueEmails.filter((email) => !foundEmails.has(email))

    return {
      success: true,
      data: { found, missing },
    }
  } catch (error) {
    console.error('Error in validateGiftContacts:', error)
    return {
      success: false,
      data: { found: [], missing: [] },
      error: error instanceof Error ? error.message : 'Failed to validate contacts',
    }
  }
}
