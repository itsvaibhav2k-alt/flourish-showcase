'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Contact } from '../schemas/contact.schema'

export type ContactFilters = {
  search?: string
  is_donor?: boolean
  is_volunteer?: boolean
  tags?: string[]
}

export type ContactSort = {
  field: 'first_name' | 'last_name' | 'email' | 'created_at' | 'updated_at'
  order: 'asc' | 'desc'
}

export type GetContactsParams = {
  page?: number
  limit?: number
  filters?: ContactFilters
  sort?: ContactSort
}

export type GetContactsResult = {
  contacts: Contact[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getContacts(
  params: GetContactsParams = {}
): Promise<GetContactsResult> {
  const {
    page = 1,
    limit = 20,
    filters = {},
    sort = { field: 'created_at', order: 'desc' },
  } = params

  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('archived_at', null) // Only get non-archived contacts

    // Apply search filter
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`
      )
    }

    // Apply donor filter
    if (filters.is_donor !== undefined) {
      query = query.eq('is_donor', filters.is_donor)
    }

    // Apply volunteer filter
    if (filters.is_volunteer !== undefined) {
      query = query.eq('is_volunteer', filters.is_volunteer)
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching contacts:', error)
      throw new Error(error.message)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      contacts: (data as Contact[]) || [],
      total,
      page,
      limit,
      totalPages,
    }
  } catch (error) {
    console.error('Error in getContacts:', error)
    throw error
  }
}
