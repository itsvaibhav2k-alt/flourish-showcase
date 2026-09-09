/**
 * Preview Custom Tile Action
 *
 * Server action to generate a preview of a custom AI tile's output
 * without saving it to the database.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { generateWithCaching, MODELS } from '@/lib/ai/claude'

export interface PreviewCustomTileResult {
  success: boolean
  data?: Record<string, unknown>
  error?: string
}

/**
 * Build context based on selected data sources
 */
async function buildDataContext(
  organizationId: string,
  dataSources: string[]
): Promise<string> {
  const supabase = await createClient()
  const contextParts: string[] = []

  // Donors data
  if (dataSources.includes('donors')) {
    const { data: donors, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, lifetime_giving, total_gifts, last_gift_date, donor_segment, engagement_score')
      .eq('organization_id', organizationId)
      .order('lifetime_giving', { ascending: false })
      .limit(50)

    if (!error && donors && donors.length > 0) {
      const donorSummary = {
        totalDonors: donors.length,
        topDonors: donors.slice(0, 10).map(d => ({
          name: `${d.first_name} ${d.last_name}`,
          lifetimeGiving: d.lifetime_giving,
          totalGifts: d.total_gifts,
          segment: d.donor_segment,
        })),
        averageLifetimeGiving: donors.reduce((sum, d) => sum + (d.lifetime_giving || 0), 0) / donors.length,
      }
      contextParts.push(`DONOR DATA:\n${JSON.stringify(donorSummary, null, 2)}`)
    }
  }

  // Gifts data
  if (dataSources.includes('gifts')) {
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select('amount, gift_date, campaign, gift_type')
      .eq('organization_id', organizationId)
      .order('gift_date', { ascending: false })
      .limit(100)

    if (!error && gifts && gifts.length > 0) {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const recentGifts = gifts.filter(g => new Date(g.gift_date) >= thirtyDaysAgo)
      const previousGifts = gifts.filter(g => {
        const date = new Date(g.gift_date)
        return date >= sixtyDaysAgo && date < thirtyDaysAgo
      })

      const giftSummary = {
        totalGifts: gifts.length,
        recentGifts: {
          count: recentGifts.length,
          total: recentGifts.reduce((sum, g) => sum + g.amount, 0),
          average: recentGifts.length > 0 ? recentGifts.reduce((sum, g) => sum + g.amount, 0) / recentGifts.length : 0,
        },
        previousPeriod: {
          count: previousGifts.length,
          total: previousGifts.reduce((sum, g) => sum + g.amount, 0),
        },
        largestGifts: gifts.sort((a, b) => b.amount - a.amount).slice(0, 5).map(g => ({
          amount: g.amount,
          date: g.gift_date,
          campaign: g.campaign,
        })),
      }
      contextParts.push(`GIFT DATA:\n${JSON.stringify(giftSummary, null, 2)}`)
    }
  }

  // Volunteers data
  if (dataSources.includes('volunteers')) {
    const { data: volunteers, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, total_volunteer_hours, total_shifts, last_shift_date')
      .eq('organization_id', organizationId)
      .gt('total_shifts', 0)
      .order('total_volunteer_hours', { ascending: false })
      .limit(50)

    if (!error && volunteers && volunteers.length > 0) {
      const volunteerSummary = {
        totalVolunteers: volunteers.length,
        topVolunteers: volunteers.slice(0, 10).map(v => ({
          name: `${v.first_name} ${v.last_name}`,
          totalHours: v.total_volunteer_hours,
          totalShifts: v.total_shifts,
          lastShift: v.last_shift_date,
        })),
        totalHours: volunteers.reduce((sum, v) => sum + (v.total_volunteer_hours || 0), 0),
      }
      contextParts.push(`VOLUNTEER DATA:\n${JSON.stringify(volunteerSummary, null, 2)}`)
    }
  }

  // Contacts data
  if (dataSources.includes('contacts')) {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, contact_type, tags, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && contacts && contacts.length > 0) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const contactSummary = {
        totalContacts: contacts.length,
        newContactsLast30Days: contacts.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length,
        byType: contacts.reduce((acc, c) => {
          acc[c.contact_type] = (acc[c.contact_type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        commonTags: contacts.flatMap(c => c.tags || [])
          .reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1
            return acc
          }, {} as Record<string, number>),
      }
      contextParts.push(`CONTACT DATA:\n${JSON.stringify(contactSummary, null, 2)}`)
    }
  }

  // Communications data
  if (dataSources.includes('communications')) {
    const { data: drafts, error } = await supabase
      .from('email_drafts')
      .select('status, email_type, created_at, sent_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && drafts && drafts.length > 0) {
      const commSummary = {
        totalDrafts: drafts.length,
        byStatus: drafts.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byType: drafts.reduce((acc, d) => {
          acc[d.email_type] = (acc[d.email_type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        sentLast30Days: drafts.filter(d => {
          if (!d.sent_at) return false
          const sentDate = new Date(d.sent_at)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          return sentDate >= thirtyDaysAgo
        }).length,
      }
      contextParts.push(`COMMUNICATION DATA:\n${JSON.stringify(commSummary, null, 2)}`)
    }
  }

  if (contextParts.length === 0) {
    return 'No data available for the selected data sources.'
  }

  return contextParts.join('\n\n')
}

/**
 * Preview a custom AI tile
 */
export async function previewCustomTile(
  prompt: string,
  dataSources: string[]
): Promise<PreviewCustomTileResult> {
  try {
    // Validate input
    if (!prompt || !prompt.trim()) {
      return { success: false, error: 'Prompt is required' }
    }

    if (!dataSources || dataSources.length === 0) {
      return { success: false, error: 'At least one data source is required' }
    }

    // Get organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    // Build context from selected data sources
    const dataContext = await buildDataContext(organizationId, dataSources)

    // System prompt for custom tiles
    const systemPrompt = `You are an AI assistant helping nonprofit organizations analyze their data.

You will receive:
1. A user's question about their organization data
2. Relevant data from their selected sources (donors, gifts, volunteers, contacts, communications)

Your task:
- Answer the user's question using the provided data
- Be specific and data-driven in your response
- Highlight key insights, trends, and actionable recommendations
- Use clear, concise language
- Format your response as a structured insight with a title and content
- If possible, include 2-4 key metrics in your response

Return your response as a JSON object with this structure:
{
  "title": "Brief title for the insight",
  "content": "Main analysis and recommendations",
  "metrics": [
    { "label": "Metric name", "value": "Metric value" }
  ]
}

If you cannot answer the question with the provided data, explain what data would be needed.`

    const userPrompt = `USER QUESTION:
${prompt}

ORGANIZATION DATA:
${dataContext}

Please analyze this data and provide insights to answer the user's question.`

    // Generate with Claude
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: MODELS.HAIKU,
      maxTokens: 2048,
      temperature: 0.7,
    })

    // Try to parse JSON response
    let parsedData: Record<string, unknown>
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]) as Record<string, unknown>
      } else {
        // If no JSON, return raw content
        parsedData = {
          title: 'AI Insight',
          content: response.content,
        }
      }
    } catch {
      // If JSON parsing fails, return raw content
      parsedData = {
        title: 'AI Insight',
        content: response.content,
      }
    }

    return {
      success: true,
      data: parsedData,
    }
  } catch (error) {
    console.error('Preview custom tile error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    }
  }
}
