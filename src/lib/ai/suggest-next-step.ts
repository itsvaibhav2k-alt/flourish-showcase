'use server'

/**
 * AI-Powered Next Step Suggestion
 *
 * Analyzes contact engagement history and suggests the most relevant next action
 * for relationship management.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { MODELS } from './claude'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface NextStepSuggestion {
  action: string        // e.g., "Send thank you email", "Schedule check-in call"
  reason: string        // Why this action is recommended
  priority: 'high' | 'medium' | 'low'
  actionType: 'email' | 'call' | 'meeting' | 'gift_follow_up' | 'general'
  suggestedDate?: string // Optional suggested date
}

export async function suggestNextStep(contactId: string): Promise<NextStepSuggestion | null> {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not configured - AI suggestions disabled')
      return null
    }

    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      console.error('No organization ID found')
      return null
    }

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        is_donor,
        is_volunteer,
        lapse_risk,
        created_at,
        lifetime_giving,
        total_gifts,
        last_gift_date,
        total_volunteer_hours
      `)
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      console.error('Failed to fetch contact:', contactError)
      return null
    }

    // Fetch recent activities (last 5)
    const { data: activities } = await supabase
      .from('activities')
      .select('activity_type, description, created_at, metadata')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch recent gifts if donor (last 3)
    let gifts = null
    if (contact.is_donor) {
      const { data: giftData } = await supabase
        .from('gifts')
        .select('amount, gift_date, gift_type, thanked_at')
        .eq('contact_id', contactId)
        .eq('organization_id', organizationId)
        .order('gift_date', { ascending: false })
        .limit(3)
      gifts = giftData
    }

    // Fetch recent shift signups if volunteer (last 3)
    let shifts = null
    if (contact.is_volunteer) {
      const { data: shiftData } = await supabase
        .from('shift_signups')
        .select(`
          id,
          status,
          checked_in_at,
          hours_logged,
          no_show,
          created_at,
          shifts (
            title,
            start_time,
            end_time
          )
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(3)
      shifts = shiftData
    }

    // Build context for Claude
    const contactContext = buildContactContext(contact, activities || [], gifts, shifts)

    // System prompt for next step suggestions
    const systemPrompt = `You are an AI assistant for a nonprofit CRM helping relationship managers engage effectively with their contacts.

Your task is to analyze a contact's engagement history and suggest ONE specific, actionable next step that would be most valuable for maintaining and deepening the relationship.

Consider:
- Recency and frequency of engagement
- Type of relationship (donor, volunteer, or both)
- Risk factors (lapse risk for donors, no-shows for volunteers)
- Outstanding actions (unthanked gifts, upcoming shifts)
- Relationship lifecycle stage

Return your suggestion as a JSON object with this exact structure:
{
  "action": "Brief, actionable title (e.g., 'Send thank you email for recent gift')",
  "reason": "1-2 sentence explanation of why this action is important",
  "priority": "high|medium|low",
  "actionType": "email|call|meeting|gift_follow_up|general",
  "suggestedDate": "YYYY-MM-DD (optional, only if time-sensitive)"
}

Guidelines:
- Be specific and actionable
- Prioritize time-sensitive actions (unthanked gifts, upcoming shifts)
- Consider relationship health indicators (lapse risk, recent activity)
- Keep suggestions realistic and achievable`

    const userPrompt = `Suggest the next best step for this contact:\n\n${contactContext}`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: MODELS.HAIKU, // Use cost-effective model for quick suggestions
      max_tokens: 300,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract and parse response
    const content = message.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse suggestion response')
      return null
    }

    const suggestion = JSON.parse(jsonMatch[0]) as NextStepSuggestion

    // Validate structure
    if (!suggestion.action || !suggestion.reason || !suggestion.priority || !suggestion.actionType) {
      console.error('Invalid suggestion structure')
      return null
    }

    return suggestion
  } catch (error) {
    console.error('Error generating next step suggestion:', error)
    return null
  }
}

/**
 * Build a concise context summary for Claude
 */
function buildContactContext(
  contact: Record<string, unknown>,
  activities: Array<Record<string, unknown>>,
  gifts: Array<Record<string, unknown>> | null,
  shifts: Array<Record<string, unknown>> | null
): string {
  const parts: string[] = []

  // Basic info
  parts.push(`CONTACT: ${contact.first_name} ${contact.last_name}`)
  parts.push(`EMAIL: ${contact.email || 'None'}`)
  parts.push(`ROLES: ${[
    contact.is_donor ? 'Donor' : null,
    contact.is_volunteer ? 'Volunteer' : null
  ].filter(Boolean).join(', ') || 'Contact'}`)

  const createdDate = new Date(contact.created_at as string)
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
  parts.push(`MEMBER SINCE: ${createdDate.toLocaleDateString()} (${daysSinceCreated} days ago)`)

  // Donor info
  if (contact.is_donor) {
    parts.push(`\nDONOR INFO:`)
    const lifetimeGiving = contact.lifetime_giving as number | undefined
    parts.push(`- Lifetime Giving: $${lifetimeGiving?.toFixed(2) || '0.00'}`)
    parts.push(`- Total Gifts: ${contact.total_gifts || 0}`)
    if (contact.last_gift_date) {
      const lastGiftDate = new Date(contact.last_gift_date as string)
      const daysSinceGift = Math.floor((Date.now() - lastGiftDate.getTime()) / (1000 * 60 * 60 * 24))
      parts.push(`- Last Gift: ${lastGiftDate.toLocaleDateString()} (${daysSinceGift} days ago)`)
    }
    if (contact.lapse_risk) {
      parts.push(`- Lapse Risk: ${(contact.lapse_risk as string).toUpperCase()}`)
    }
  }

  // Volunteer info
  if (contact.is_volunteer) {
    parts.push(`\nVOLUNTEER INFO:`)
    parts.push(`- Total Hours: ${contact.total_volunteer_hours || 0}`)
  }

  // Recent gifts
  if (gifts && gifts.length > 0) {
    parts.push(`\nRECENT GIFTS:`)
    gifts.forEach((gift, i) => {
      const giftDate = new Date(gift.gift_date as string)
      const thanked = gift.thanked_at ? 'Thanked' : 'NOT THANKED'
      parts.push(`${i + 1}. $${gift.amount} on ${giftDate.toLocaleDateString()} - ${thanked}`)
    })
  }

  // Recent shifts
  if (shifts && shifts.length > 0) {
    parts.push(`\nRECENT VOLUNTEER SHIFTS:`)
    shifts.forEach((signup, i) => {
      const shift = signup.shifts as Record<string, unknown> | undefined
      if (shift) {
        const startDate = new Date(shift.start_time as string)
        const status = signup.no_show ? 'No-show' : signup.checked_in_at ? 'Completed' : signup.status
        parts.push(`${i + 1}. ${shift.title} on ${startDate.toLocaleDateString()} - ${status}`)
      }
    })
  }

  // Recent activities
  if (activities.length > 0) {
    parts.push(`\nRECENT ACTIVITY:`)
    activities.forEach((activity, i) => {
      const activityDate = new Date(activity.created_at as string)
      const daysAgo = Math.floor((Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      parts.push(`${i + 1}. ${activity.description} (${daysAgo} days ago)`)
    })
  } else {
    parts.push(`\nRECENT ACTIVITY: None`)
  }

  return parts.join('\n')
}
