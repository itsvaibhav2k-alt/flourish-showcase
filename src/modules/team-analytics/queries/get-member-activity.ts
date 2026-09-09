'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface MemberActivityDetail {
  id: string
  type: 'contact' | 'gift' | 'email' | 'note'
  description: string
  created_at: string
  metadata?: {
    contact_name?: string
    gift_amount?: number
    email_subject?: string
    note_content?: string
  }
}

export interface MemberActivityTimeline {
  user_id: string
  email: string
  full_name: string | null
  activities: MemberActivityDetail[]
}

/**
 * Get detailed activity timeline for a specific team member
 */
export async function getMemberActivity(
  userId: string,
  limit: number = 50
): Promise<MemberActivityTimeline | null> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Get user info from team_activity_stats
    const { data: memberData, error: memberError } = await supabase
      .from('team_activity_stats')
      .select('user_id, email, full_name')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single()

    if (memberError || !memberData) {
      console.error('Error fetching member data:', memberError)
      return null
    }

    // Fetch contacts created by this user
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, created_at')
      .eq('created_by', userId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Fetch gifts recorded by this user
    const { data: gifts } = await supabase
      .from('gifts')
      .select('id, amount, created_at, contact_id, contacts(first_name, last_name)')
      .eq('recorded_by', userId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Fetch emails sent by this user
    const { data: emails } = await supabase
      .from('email_drafts')
      .select('id, subject, sent_at, contact_id, contacts(first_name, last_name)')
      .eq('created_by', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(limit)

    // Fetch notes added by this user
    const { data: notes } = await supabase
      .from('notes')
      .select('id, content, created_at, contact_id, contacts(first_name, last_name)')
      .eq('created_by', userId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Combine all activities into a single timeline
    const activities: MemberActivityDetail[] = []

    // Add contacts
    if (contacts) {
      contacts.forEach((contact: any) => {
        activities.push({
          id: contact.id,
          type: 'contact',
          description: `Added contact: ${contact.first_name} ${contact.last_name}`,
          created_at: contact.created_at,
          metadata: {
            contact_name: `${contact.first_name} ${contact.last_name}`,
          },
        })
      })
    }

    // Add gifts
    if (gifts) {
      gifts.forEach((gift: any) => {
        const contactName = gift.contacts
          ? `${gift.contacts.first_name} ${gift.contacts.last_name}`
          : 'Unknown'
        activities.push({
          id: gift.id,
          type: 'gift',
          description: `Recorded gift of $${gift.amount.toLocaleString()} from ${contactName}`,
          created_at: gift.created_at,
          metadata: {
            gift_amount: gift.amount,
            contact_name: contactName,
          },
        })
      })
    }

    // Add emails
    if (emails) {
      emails.forEach((email: any) => {
        const contactName = email.contacts
          ? `${email.contacts.first_name} ${email.contacts.last_name}`
          : 'Unknown'
        activities.push({
          id: email.id,
          type: 'email',
          description: `Sent email "${email.subject}" to ${contactName}`,
          created_at: email.sent_at,
          metadata: {
            email_subject: email.subject,
            contact_name: contactName,
          },
        })
      })
    }

    // Add notes
    if (notes) {
      notes.forEach((note: any) => {
        const contactName = note.contacts
          ? `${note.contacts.first_name} ${note.contacts.last_name}`
          : 'Unknown'
        const preview = note.content.length > 50
          ? note.content.substring(0, 50) + '...'
          : note.content
        activities.push({
          id: note.id,
          type: 'note',
          description: `Added note for ${contactName}: ${preview}`,
          created_at: note.created_at,
          metadata: {
            note_content: preview,
            contact_name: contactName,
          },
        })
      })
    }

    // Sort all activities by created_at descending
    activities.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    // Limit to the requested number of activities
    const limitedActivities = activities.slice(0, limit)

    return {
      user_id: memberData.user_id,
      email: memberData.email,
      full_name: memberData.full_name,
      activities: limitedActivities,
    }
  } catch (error) {
    console.error('Error in getMemberActivity:', error)
    throw error
  }
}
