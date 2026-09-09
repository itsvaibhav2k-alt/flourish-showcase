'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface PendingDraftsSummary {
  totalPending: number
  totalApproved: number
  needsReview: number
  pendingByType: {
    thankYou: number
    confirmation: number
    reminder: number
    followUp: number
    welcome: number
    custom: number
  }
}

export interface PendingDraft {
  id: string
  contactName: string
  emailType: string
  subject: string
  bodyPreview: string
  body: string
  createdAt: string
  contactId: string | null
}

/**
 * Get summary of pending email drafts for the dashboard
 * Returns counts of drafts by status and type
 */
export async function getPendingDraftsSummary(): Promise<PendingDraftsSummary> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    // Get count of pending drafts (draft status)
    const { count: pendingCount } = await supabase
      .from('email_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'draft')

    // Get count of approved drafts (reviewed and ready to send)
    const { count: approvedCount } = await supabase
      .from('email_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'reviewed')

    // Get all pending drafts to count by type
    const { data: pendingDrafts } = await supabase
      .from('email_drafts')
      .select('email_type')
      .eq('organization_id', organizationId)
      .eq('status', 'draft')

    // Count drafts by type
    const pendingByType = {
      thankYou: 0,
      confirmation: 0,
      reminder: 0,
      followUp: 0,
      welcome: 0,
      custom: 0,
    }

    if (pendingDrafts) {
      pendingDrafts.forEach((draft) => {
        switch (draft.email_type) {
          case 'thank_you':
            pendingByType.thankYou++
            break
          case 'confirmation':
            pendingByType.confirmation++
            break
          case 'reminder':
            pendingByType.reminder++
            break
          case 'follow_up':
            pendingByType.followUp++
            break
          case 'welcome':
            pendingByType.welcome++
            break
          case 'custom':
            pendingByType.custom++
            break
        }
      })
    }

    return {
      totalPending: pendingCount || 0,
      totalApproved: approvedCount || 0,
      needsReview: pendingCount || 0,
      pendingByType,
    }
  } catch (error) {
    console.error('Error in getPendingDraftsSummary:', error)
    throw error
  }
}

/**
 * Get top pending email drafts for dashboard panel
 */
export async function getPendingDrafts(limit: number = 3): Promise<PendingDraft[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_drafts')
      .select(`
        id,
        email_type,
        subject,
        body,
        created_at,
        contact_id,
        contacts (
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching pending drafts:', error)
      throw error
    }

    return (data || []).map(draft => ({
      id: draft.id,
      contactName: draft.contacts
        ? `${draft.contacts.first_name} ${draft.contacts.last_name}`
        : 'Unknown Contact',
      emailType: draft.email_type,
      subject: draft.subject,
      bodyPreview: draft.body.substring(0, 150),
      body: draft.body,
      createdAt: draft.created_at,
      contactId: draft.contact_id,
    }))
  } catch (error) {
    console.error('Error in getPendingDrafts:', error)
    return []
  }
}
