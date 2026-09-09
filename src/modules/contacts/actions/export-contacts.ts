'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Contact } from '../schemas/contact.schema'
import { DEFAULT_EXPORT_FIELDS, type ExportField, type ExportContactsResult } from '../types/bulk-actions'

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // If value contains special characters, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Format a contact field for export
 */
function formatFieldValue(contact: Contact, field: ExportField['key']): string {
  switch (field) {
    case 'full_name':
      return `${contact.first_name} ${contact.last_name}`
    case 'address_full':
      if (!contact.address) return ''
      const addr = contact.address
      return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')
    case 'tags':
      return (contact.tags || []).join(', ')
    case 'is_donor':
      return contact.is_donor ? 'Yes' : 'No'
    case 'is_volunteer':
      return contact.is_volunteer ? 'Yes' : 'No'
    case 'lifetime_giving':
      return contact.lifetime_giving ? `$${Number(contact.lifetime_giving).toFixed(2)}` : '$0.00'
    case 'last_gift_date':
      return contact.last_gift_date
        ? new Date(contact.last_gift_date).toLocaleDateString('en-US')
        : ''
    case 'created_at':
      return new Date(contact.created_at).toLocaleDateString('en-US')
    case 'updated_at':
      return new Date(contact.updated_at).toLocaleDateString('en-US')
    default:
      const value = contact[field as keyof Contact]
      if (value === null || value === undefined) return ''
      return String(value)
  }
}

/**
 * Export contacts to CSV
 */
export async function exportContacts(
  contactIds: string[] | 'all',
  selectedFields: string[]
): Promise<ExportContactsResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .is('archived_at', null)

    // Filter by specific IDs if not exporting all
    if (contactIds !== 'all' && contactIds.length > 0) {
      query = query.in('id', contactIds)
    }

    query = query.order('last_name', { ascending: true })

    const { data: contacts, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    if (!contacts || contacts.length === 0) {
      return { success: false, error: 'No contacts to export' }
    }

    // Get field definitions for selected fields
    const fields = DEFAULT_EXPORT_FIELDS.filter(f => selectedFields.includes(f.key))

    // Generate CSV header
    const headers = fields.map(f => escapeCsvValue(f.label))
    const csvLines: string[] = [headers.join(',')]

    // Generate CSV rows
    for (const contact of contacts as Contact[]) {
      const row = fields.map(f => escapeCsvValue(formatFieldValue(contact, f.key)))
      csvLines.push(row.join(','))
    }

    const csv = csvLines.join('\n')
    const date = new Date().toISOString().split('T')[0]
    const filename = `contacts-export-${date}.csv`

    return { success: true, csv, filename }
  } catch (error) {
    console.error('Error in exportContacts:', error)
    return { success: false, error: 'Failed to export contacts' }
  }
}
