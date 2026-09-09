'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { EmailDraft, EmailDraftWithContact } from '../schemas/email.schema'

export type GetDraftsParams = {
  status?: 'draft' | 'pending' | 'approved' | 'sent' | 'rejected'
  statuses?: ('draft' | 'pending' | 'approved' | 'sent' | 'rejected')[]
  type?: string
  page?: number
  limit?: number
}

export type GetDraftsResult = {
  drafts: EmailDraftWithContact[]
  total: number
}

export type DraftStats = {
  pending: number
  approved: number
  sentThisMonth: number
  rejected: number
}

/**
 * Get email drafts with optional filtering
 */
export async function getDrafts(params: GetDraftsParams = {}): Promise<GetDraftsResult> {
  const {
    status,
    statuses,
    type,
    page = 1,
    limit = 20,
  } = params

  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { drafts: [], total: 0 }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Build query with contact join to get recipient info
    let query = supabase
      .from('email_drafts')
      .select(`
        *,
        contacts:contact_id (
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)

    // Apply status filter (single status or multiple statuses)
    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses)
    } else if (status) {
      query = query.eq('status', status)
    }

    // Apply type filter
    if (type) {
      query = query.eq('email_type', type)
    }

    // Apply sorting (most recent first)
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching drafts:', error)
      throw new Error(error.message)
    }

    return {
      drafts: (data as EmailDraftWithContact[]) || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('Error in getDrafts:', error)
    throw error
  }
}

/**
 * Get a single draft by ID
 */
export async function getDraftById(id: string): Promise<EmailDraft | null> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return null
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch draft
    const { data, error } = await supabase
      .from('email_drafts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching draft:', error)
      throw new Error(error.message)
    }

    return data as EmailDraft
  } catch (error) {
    console.error('Error in getDraftById:', error)
    return null
  }
}

/**
 * Get draft statistics
 */
export async function getDraftStats(): Promise<DraftStats> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Get pending count (includes both 'draft' and 'pending' statuses)
    const { count: pendingCount } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'pending'])

    // Get approved count
    const { count: approvedCount } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'approved')

    // Get rejected count
    const { count: rejectedCount } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'rejected')

    // Get sent this month count
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const startOfMonthISO = startOfMonth.toISOString()

    const { count: sentThisMonthCount } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'sent')
      .gte('sent_at', startOfMonthISO)

    return {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      sentThisMonth: sentThisMonthCount || 0,
      rejected: rejectedCount || 0,
    }
  } catch (error) {
    console.error('Error in getDraftStats:', error)
    return {
      pending: 0,
      approved: 0,
      sentThisMonth: 0,
      rejected: 0,
    }
  }
}
