export const dynamic = 'force-dynamic'

import { getContacts } from '@/modules/contacts/queries/get-contacts'
import { getSegments } from '@/modules/segments/queries/get-segments'
import type { Contact } from '@/modules/contacts/schemas/contact.schema'
import type { Segment } from '@/modules/segments/schemas/segment.schema'
import { ContactsPageClient } from './ContactsPageClient'

interface ContactsPageProps {
  searchParams?: Promise<{
    type?: 'all' | 'donors' | 'volunteers'
    segment?: string
  }>
}

// Default stats when data can't be fetched
const defaultStats = {
  totalContacts: 0,
  donorCount: 0,
  volunteerCount: 0,
}

/**
 * Contacts list page
 * Shows contact statistics and filterable table with error handling
 */
export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams
  const type = params?.type || 'all'

  // Fetch contacts with error handling
  let contacts: Contact[] = []
  let stats = defaultStats
  let savedSegments: Segment[] = []

  try {
    // Fetch saved segments for contacts
    savedSegments = await getSegments({ entityType: 'CONTACT' }).catch(() => [])

    // Fetch contacts based on type filter
    const filters: { is_donor?: boolean; is_volunteer?: boolean } = {}
    if (type === 'donors') {
      filters.is_donor = true
    } else if (type === 'volunteers') {
      filters.is_volunteer = true
    }

    const [contactsResult] = await Promise.all([
      getContacts({ filters, limit: 500 }).catch(() => ({ contacts: [] as Contact[], total: 0 })),
    ])

    contacts = contactsResult.contacts

    // Calculate stats — use total from DB count for accuracy
    stats = {
      totalContacts: contactsResult.total || contacts.length,
      donorCount: contacts.filter(c => c.is_donor).length,
      volunteerCount: contacts.filter(c => c.is_volunteer).length,
    }
  } catch {
    // Use defaults if all queries fail
  }

  // Extract unique tags from all contacts
  const allTags = Array.from(
    new Set(contacts.flatMap(c => c.tags || []))
  ).sort()

  return (
    <ContactsPageClient
      contacts={contacts}
      allTags={allTags}
      savedSegments={savedSegments}
      stats={stats}
      type={type}
    />
  )
}
