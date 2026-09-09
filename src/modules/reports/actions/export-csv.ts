'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Export contacts to CSV format
 */
export async function exportContacts(): Promise<string> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      throw new Error('Organization not found')
    }

    const organizationId = memberData.organization_id

    // Fetch all contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (contactsError) {
      throw new Error('Failed to fetch contacts')
    }

    // Build CSV
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Type',
      'Tags',
      'Total Gifts',
      'Last Gift Date',
      'Created At',
    ]

    const rows = contacts?.map((contact) => [
      `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
      contact.email || '',
      contact.phone || '',
      [
        contact.is_donor ? 'Donor' : '',
        contact.is_volunteer ? 'Volunteer' : '',
      ]
        .filter(Boolean)
        .join(', ') || 'Contact',
      Array.isArray(contact.tags) ? contact.tags.join('; ') : '',
      String(contact.total_gifts || 0),
      contact.last_gift_date || '',
      contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '',
    ])

    return convertToCSV([headers, ...(rows || [])])
  } catch (error) {
    console.error('Error exporting contacts:', error)
    throw error
  }
}

/**
 * Export donors to CSV format
 */
export async function exportDonors(): Promise<string> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      throw new Error('Organization not found')
    }

    const organizationId = memberData.organization_id

    // Fetch all donors
    const { data: donors, error: donorsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .order('total_gifts', { ascending: false })

    if (donorsError) {
      throw new Error('Failed to fetch donors')
    }

    // Build CSV
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Total Gifts',
      'Last Gift Date',
      'First Gift Date',
      'Gift Count',
      'Largest Gift',
      'Lapse Risk',
    ]

    const rows = donors?.map((donor) => [
      `${donor.first_name || ''} ${donor.last_name || ''}`.trim(),
      donor.email || '',
      donor.phone || '',
      String(donor.total_gifts || 0),
      donor.last_gift_date || '',
      '', // first_gift_date doesn't exist in schema
      String(donor.total_gifts || 0), // gift_count
      String(donor.lifetime_giving || 0), // largest_gift approximation
      donor.lapse_risk || 'low',
    ])

    return convertToCSV([headers, ...(rows || [])])
  } catch (error) {
    console.error('Error exporting donors:', error)
    throw error
  }
}

/**
 * Export gifts to CSV format
 */
export async function exportGifts(options?: {
  startDate?: string
  endDate?: string
}): Promise<string> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      throw new Error('Organization not found')
    }

    const organizationId = memberData.organization_id

    // Build query
    let query = supabase
      .from('gifts')
      .select(`
        *,
        contact:contacts (
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)

    if (options?.startDate) {
      query = query.gte('gift_date', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('gift_date', options.endDate)
    }

    query = query.order('gift_date', { ascending: false })

    const { data: gifts, error: giftsError } = await query

    if (giftsError) {
      throw new Error('Failed to fetch gifts')
    }

    // Build CSV
    const headers = [
      'Date',
      'Donor Name',
      'Donor Email',
      'Amount',
      'Campaign',
      'Payment Method',
      'Notes',
    ]

    const rows = gifts?.map((gift: any) => [
      gift.gift_date || '',
      gift.contact
        ? `${gift.contact.first_name || ''} ${gift.contact.last_name || ''}`.trim()
        : '',
      gift.contact?.email || '',
      gift.amount || '0',
      gift.campaign || '',
      gift.payment_method || '',
      gift.notes || '',
    ])

    return convertToCSV([headers, ...(rows || [])])
  } catch (error) {
    console.error('Error exporting gifts:', error)
    throw error
  }
}

/**
 * Export volunteers to CSV format
 */
export async function exportVolunteers(): Promise<string> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      throw new Error('Organization not found')
    }

    const organizationId = memberData.organization_id

    // Fetch all volunteers
    const { data: volunteers, error: volunteersError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_volunteer', true)
      .order('created_at', { ascending: false })

    if (volunteersError) {
      throw new Error('Failed to fetch volunteers')
    }

    // Build CSV
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Skills',
      'Total Hours',
      'Last Shift Date',
      'Shift Count',
    ]

    const rows = volunteers?.map((volunteer) => [
      `${volunteer.first_name || ''} ${volunteer.last_name || ''}`.trim(),
      volunteer.email || '',
      volunteer.phone || '',
      '', // skills doesn't exist in schema
      String(volunteer.total_volunteer_hours || 0),
      '', // last_volunteer_date doesn't exist in schema
      '', // volunteer_shift_count doesn't exist in schema
    ])

    return convertToCSV([headers, ...(rows || [])])
  } catch (error) {
    console.error('Error exporting volunteers:', error)
    throw error
  }
}

/**
 * Helper function to convert array of arrays to CSV string
 */
function convertToCSV(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell || '')
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(',')
    )
    .join('\n')
}
