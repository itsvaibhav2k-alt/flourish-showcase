'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { CreateContactInput } from '../schemas/contact.schema'

export type ImportOptions = {
  skipDuplicates?: boolean
  updateExisting?: boolean
}

export type ImportSummary = {
  total: number
  imported: number
  skipped: number
  updated: number
  failed: number
  errors: Array<{
    row: number
    contact: CreateContactInput
    error: string
  }>
}

const BATCH_SIZE = 100

/**
 * Import contacts in bulk with batch processing
 * Supports skip duplicates or update existing options
 */
export async function importContacts(
  contacts: CreateContactInput[],
  options: ImportOptions = {}
): Promise<{
  success: boolean
  summary: ImportSummary
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        summary: {
          total: contacts.length,
          imported: 0,
          skipped: 0,
          updated: 0,
          failed: contacts.length,
          errors: [],
        },
        error: 'No organization selected',
      }
    }

    const supabase = await createClient()
    const summary: ImportSummary = {
      total: contacts.length,
      imported: 0,
      skipped: 0,
      updated: 0,
      failed: 0,
      errors: [],
    }

    // Fetch all existing contacts upfront for efficient duplicate checking
    let existingContactsMap: Map<string, { id: string }> | null = null

    if (options.skipDuplicates || options.updateExisting) {
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('organization_id', organizationId)
        .is('archived_at', null)

      if (existingContacts) {
        existingContactsMap = new Map()
        existingContacts.forEach((contact) => {
          // Create lookup keys for email and name
          if (contact.email) {
            existingContactsMap!.set(`email:${contact.email.toLowerCase()}`, {
              id: contact.id,
            })
          }
          const nameKey = `${contact.first_name}:${contact.last_name}`.toLowerCase()
          existingContactsMap!.set(`name:${nameKey}`, { id: contact.id })
        })
      }
    }

    // Process in batches
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      const contactsToInsert: Array<{
        organization_id: string
        first_name: string
        last_name: string
        email: string | null
        phone: string | null
        address: any
        tags: string[]
        is_donor: boolean
        is_volunteer: boolean
      }> = []

      for (const [index, contact] of batch.entries()) {
        const rowNumber = i + index + 1

        try {
          // Check for existing contact if needed
          if (existingContactsMap && (options.skipDuplicates || options.updateExisting)) {
            let existingContact = null

            // Try to find by email first
            if (contact.email) {
              const emailKey = `email:${contact.email.toLowerCase()}`
              existingContact = existingContactsMap.get(emailKey)
            }

            // If no email match, try by name
            if (!existingContact) {
              const nameKey = `name:${contact.first_name}:${contact.last_name}`.toLowerCase()
              existingContact = existingContactsMap.get(nameKey)
            }

            if (existingContact) {
              if (options.updateExisting) {
                // Update existing contact
                const { error: updateError } = await supabase
                  .from('contacts')
                  .update({
                    first_name: contact.first_name,
                    last_name: contact.last_name,
                    email: contact.email || null,
                    phone: contact.phone || null,
                    address: contact.address || null,
                    tags: contact.tags || [],
                    is_donor: contact.is_donor || false,
                    is_volunteer: contact.is_volunteer || false,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingContact.id)

                if (updateError) {
                  throw new Error(updateError.message)
                }

                summary.updated++
              } else {
                // Skip duplicate
                summary.skipped++
              }
              continue
            }
          }

          // Add to batch insert array
          contactsToInsert.push({
            organization_id: organizationId,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email || null,
            phone: contact.phone || null,
            address: contact.address || null,
            tags: contact.tags || [],
            is_donor: contact.is_donor || false,
            is_volunteer: contact.is_volunteer || false,
          })
        } catch (error) {
          summary.failed++
          summary.errors.push({
            row: rowNumber,
            contact,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Batch insert new contacts
      if (contactsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('contacts').insert(contactsToInsert)

        if (insertError) {
          // If batch insert fails, try one by one
          console.error('Batch insert failed, trying individual inserts:', insertError)

          for (let j = 0; j < contactsToInsert.length; j++) {
            const rowNumber = i + j + 1
            const contact = batch[j]

            try {
              const { error: singleInsertError } = await supabase
                .from('contacts')
                .insert(contactsToInsert[j])

              if (singleInsertError) {
                throw new Error(singleInsertError.message)
              }

              summary.imported++
            } catch (error) {
              summary.failed++
              summary.errors.push({
                row: rowNumber,
                contact,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        } else {
          summary.imported += contactsToInsert.length
        }
      }
    }

    // Revalidate paths
    revalidatePath('/contacts')

    return {
      success: true,
      summary,
    }
  } catch (error) {
    console.error('Error in importContacts:', error)
    return {
      success: false,
      summary: {
        total: contacts.length,
        imported: 0,
        skipped: 0,
        updated: 0,
        failed: contacts.length,
        errors: [],
      },
      error: error instanceof Error ? error.message : 'Failed to import contacts',
    }
  }
}

/**
 * Get existing contacts for duplicate detection
 */
export async function getExistingContacts() {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, data: [], error: 'No organization selected' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [], error: null }
  } catch (error) {
    console.error('Error in getExistingContacts:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to get existing contacts',
    }
  }
}
