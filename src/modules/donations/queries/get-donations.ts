'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Donation } from '../schemas/donation.schema'

export type DonationFilters = {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  frequency?: 'one-time' | 'monthly' | 'quarterly' | 'annually'
  contact_id?: string
  donation_form_id?: string
  min_amount?: number
  max_amount?: number
  start_date?: string
  end_date?: string
  search?: string
}

export type DonationSort = {
  field: 'created_at' | 'amount' | 'donor_email'
  order: 'asc' | 'desc'
}

export type GetDonationsParams = {
  page?: number
  limit?: number
  filters?: DonationFilters
  sort?: DonationSort
}

export type GetDonationsResult = {
  donations: Donation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Get donations with filtering and pagination
 */
export async function getDonations(
  params: GetDonationsParams = {}
): Promise<GetDonationsResult> {
  const {
    page = 1,
    limit = 20,
    filters = {},
    sort = { field: 'created_at', order: 'desc' },
  } = params

  const defaultResult: GetDonationsResult = {
    donations: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  }

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return defaultResult
    }

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('donations')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.frequency) {
      query = query.eq('frequency', filters.frequency)
    }

    if (filters.contact_id) {
      query = query.eq('contact_id', filters.contact_id)
    }

    if (filters.donation_form_id) {
      query = query.eq('donation_form_id', filters.donation_form_id)
    }

    if (filters.min_amount) {
      query = query.gte('amount', filters.min_amount)
    }

    if (filters.max_amount) {
      query = query.lte('amount', filters.max_amount)
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(
        `donor_email.ilike.${searchTerm},donor_first_name.ilike.${searchTerm},donor_last_name.ilike.${searchTerm}`
      )
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
      // Return defaults silently if table doesn't exist or other DB error
      return defaultResult
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      donations: (data as Donation[]) || [],
      total,
      page,
      limit,
      totalPages,
    }
  } catch {
    // Return defaults silently on any error
    return defaultResult
  }
}

/**
 * Get a single donation by ID
 */
export async function getDonation(donationId: string): Promise<Donation | null> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching donation:', error)
      return null
    }

    return data as Donation
  } catch (error) {
    console.error('Error in getDonation:', error)
    return null
  }
}

/**
 * Get donation statistics
 */
export type DonationStats = {
  total_donations: number
  total_amount: number
  average_donation: number
  completed_donations: number
  pending_donations: number
  failed_donations: number
  monthly_recurring: number
  one_time_donations: number
}

export async function getDonationStats(): Promise<DonationStats> {
  const defaultStats: DonationStats = {
    total_donations: 0,
    total_amount: 0,
    average_donation: 0,
    completed_donations: 0,
    pending_donations: 0,
    failed_donations: 0,
    monthly_recurring: 0,
    one_time_donations: 0,
  }

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return defaultStats
    }

    const supabase = await createClient()

    // Get all donations for stats
    const { data: donations, error } = await supabase
      .from('donations')
      .select('amount, status, frequency')
      .eq('organization_id', organizationId)

    if (error) {
      // Return defaults silently if table doesn't exist or other DB error
      return defaultStats
    }

    const stats: DonationStats = { ...defaultStats }

    if (!donations || donations.length === 0) {
      return stats
    }

    stats.total_donations = donations.length

    // Calculate stats
    let totalAmount = 0
    donations.forEach((donation) => {
      if (donation.status === 'completed') {
        totalAmount += donation.amount
        stats.completed_donations++
      }
      if (donation.status === 'pending') stats.pending_donations++
      if (donation.status === 'failed') stats.failed_donations++
      if (donation.frequency === 'monthly') stats.monthly_recurring++
      if (donation.frequency === 'one-time') stats.one_time_donations++
    })

    stats.total_amount = totalAmount
    stats.average_donation = stats.completed_donations > 0
      ? totalAmount / stats.completed_donations
      : 0

    return stats
  } catch {
    // Return defaults silently on any error
    return defaultStats
  }
}
