'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { findDuplicates } from '@/lib/import/duplicate-detector'
import type { CreateContactInput, Contact } from '../schemas/contact.schema'

export type BatchImportResult = {
  success: boolean
  summary: {
    total: number
    imported: number
    duplicates: number
    failed: number
    errors: Array<{
      row: number
      contact: CreateContactInput
      error: string
    }>
  }
  error?: string
}

const BATCH_SIZE = 100

/**
 * Batch import contacts with duplicate detection
 * This is an optimized version that handles large imports efficiently
 */
export async function batchImportContacts(
  contacts: CreateContactInput[]
): Promise<BatchImportResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        summary: {
          total: contacts.length,
          imported: 0,
          duplicates: 0,
          failed: contacts.length,
          errors: [],
        },
        error: 'No organization selected',
      }
    }

    const supabase = await createClient()
    const summary = {
      total: contacts.length,
      imported: 0,
      duplicates: 0,
      failed: 0,
      errors: [] as Array<{
        row: number
        contact: CreateContactInput
        error: string
      }>,
    }

    // Get all existing contacts at once for duplicate detection
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .is('archived_at', null)

    if (fetchError) {
      console.error('Error fetching existing contacts:', fetchError)
      return {
        success: false,
        summary,
        error: `Failed to fetch existing contacts: ${fetchError.message}`,
      }
    }

    // Run duplicate detection upfront
    const { unique, duplicates } = await findDuplicates(
      contacts,
      (existingContacts || []) as Contact[]
    )

    summary.duplicates = duplicates.length

    // Process unique contacts in batches
    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
      const batch = unique.slice(i, i + BATCH_SIZE)

      // Prepare batch insert data
      const contactsToInsert = batch.map((contact, index) => ({
        organization_id: organizationId,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email || null,
        phone: contact.phone || null,
        address: contact.address || null,
        tags: contact.tags || [],
        is_donor: contact.is_donor || false,
        is_volunteer: contact.is_volunteer || false,
      }))

      try {
        // Batch insert
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(contactsToInsert)

        if (insertError) {
          // If batch insert fails, try one by one to identify specific errors
          console.error('Batch insert error, falling back to individual inserts:', insertError)

          for (let j = 0; j < batch.length; j++) {
            const contact = batch[j]
            const rowNumber = i + j + 1

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
          // Batch insert succeeded
          summary.imported += batch.length
        }
      } catch (error) {
        console.error('Unexpected error during batch insert:', error)
        summary.failed += batch.length
        batch.forEach((contact, index) => {
          summary.errors.push({
            row: i + index + 1,
            contact,
            error: error instanceof Error ? error.message : 'Batch insert failed',
          })
        })
      }
    }

    // Revalidate paths
    revalidatePath('/contacts')

    return {
      success: true,
      summary,
    }
  } catch (error) {
    console.error('Error in batchImportContacts:', error)
    return {
      success: false,
      summary: {
        total: contacts.length,
        imported: 0,
        duplicates: 0,
        failed: contacts.length,
        errors: [],
      },
      error: error instanceof Error ? error.message : 'Failed to import contacts',
    }
  }
}

/**
 * Get import statistics without actually importing
 * Useful for preview and validation
 */
export async function previewImport(contacts: CreateContactInput[]): Promise<{
  success: boolean
  preview: {
    total: number
    unique: number
    duplicates: number
    duplicateDetails: Array<{
      newContact: CreateContactInput
      existingContact: Contact
      matchReason: string
      similarity: number
    }>
  }
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        preview: {
          total: contacts.length,
          unique: 0,
          duplicates: 0,
          duplicateDetails: [],
        },
        error: 'No organization selected',
      }
    }

    const supabase = await createClient()

    // Get existing contacts
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .is('archived_at', null)

    if (fetchError) {
      return {
        success: false,
        preview: {
          total: contacts.length,
          unique: 0,
          duplicates: 0,
          duplicateDetails: [],
        },
        error: `Failed to fetch existing contacts: ${fetchError.message}`,
      }
    }

    // Run duplicate detection
    const { unique, duplicates } = await findDuplicates(
      contacts,
      (existingContacts || []) as Contact[]
    )

    return {
      success: true,
      preview: {
        total: contacts.length,
        unique: unique.length,
        duplicates: duplicates.length,
        duplicateDetails: duplicates,
      },
    }
  } catch (error) {
    console.error('Error in previewImport:', error)
    return {
      success: false,
      preview: {
        total: contacts.length,
        unique: 0,
        duplicates: 0,
        duplicateDetails: [],
      },
      error: error instanceof Error ? error.message : 'Failed to preview import',
    }
  }
}
