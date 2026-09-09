/**
 * Get Recent Flora Drafts Query
 *
 * Fetch recent email drafts created through Flora Emails Hub
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface FloraEmailDraft {
  id: string
  contactId: string
  contactName: string
  contactEmail: string | null
  subject: string
  body: string
  status: 'draft' | 'pending' | 'approved' | 'sent' | 'rejected'
  emailType: string
  createdAt: string
}

export interface FloraEmailStats {
  totalDrafts: number
  pendingReview: number
  approved: number
  sent: number
}

/**
 * Get recent Flora email drafts
 */
export async function getRecentFloraDrafts(limit = 10): Promise<FloraEmailDraft[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return []
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_drafts')
      .select(`
        id,
        contact_id,
        subject,
        body,
        status,
        email_type,
        created_at,
        contacts (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('trigger_event', 'manual')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching Flora drafts:', error)
      return []
    }

    return (data || []).map((draft) => ({
      id: draft.id,
      contactId: draft.contact_id,
      contactName: draft.contacts
        ? `${draft.contacts.first_name} ${draft.contacts.last_name}`
        : 'Unknown',
      contactEmail: draft.contacts?.email || null,
      subject: draft.subject,
      body: draft.body,
      status: draft.status as FloraEmailDraft['status'],
      emailType: draft.email_type,
      createdAt: draft.created_at,
    }))
  } catch (error) {
    console.error('Error in getRecentFloraDrafts:', error)
    return []
  }
}

/**
 * Get Flora email statistics
 */
export async function getFloraEmailStats(): Promise<FloraEmailStats> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        totalDrafts: 0,
        pendingReview: 0,
        approved: 0,
        sent: 0,
      }
    }

    const supabase = await createClient()

    // Get all manual drafts (Flora-generated)
    const { data, error } = await supabase
      .from('email_drafts')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('trigger_event', 'manual')

    if (error) {
      console.error('Error fetching Flora stats:', error)
      return {
        totalDrafts: 0,
        pendingReview: 0,
        approved: 0,
        sent: 0,
      }
    }

    const drafts = data || []

    return {
      totalDrafts: drafts.length,
      pendingReview: drafts.filter((d) => d.status === 'pending' || d.status === 'draft').length,
      approved: drafts.filter((d) => d.status === 'approved').length,
      sent: drafts.filter((d) => d.status === 'sent').length,
    }
  } catch (error) {
    console.error('Error in getFloraEmailStats:', error)
    return {
      totalDrafts: 0,
      pendingReview: 0,
      approved: 0,
      sent: 0,
    }
  }
}
