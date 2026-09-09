'use server'

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'
import { trackUsage } from '@/lib/ai/cost-tracker'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { QueryResult, QueryResultData } from '@/lib/ai/query-parser'

export interface ProcessQueryResult {
  success: boolean
  result?: QueryResult
  error?: string
}

const FLORA_SYSTEM_PROMPT = `You are Flora, a friendly and helpful AI assistant for Flourish, a nonprofit CRM platform. You help nonprofit organizations manage their donors, volunteers, and fundraising efforts.

Your personality:
- Warm, supportive, and encouraging
- Knowledgeable about nonprofit best practices
- Helpful with both data questions and general advice
- Professional but personable

You have access to the organization's data and can answer questions about:
- Donors and giving history
- Volunteers and their activities
- Contacts and relationships
- Fundraising metrics and trends

When users ask data questions, you'll receive the query results and should summarize them in a helpful, conversational way.

When users ask general questions (like "what's your name?" or "how do I improve donor retention?"), respond conversationally without trying to query the database.

Important: Always be helpful and never say you can't do something. If you don't have specific data, offer general advice or guidance instead.`

const QUERY_ROUTER_PROMPT = `Analyze this user query and determine how to handle it.

User query: "{query}"

Respond with a JSON object:
{
  "intent": "data_query" | "conversation" | "advice",
  "requiresDatabase": true | false,
  "sqlQuery": "SELECT ... (only if requiresDatabase is true)",
  "conversationalResponse": "Your response (only if requiresDatabase is false)",
  "queryDescription": "Brief description of what the user wants"
}

For data queries, write a PostgreSQL query against these tables:
- contacts: id, organization_id, first_name, last_name, email, phone, tags (text[]), is_donor, is_volunteer, lifetime_giving, total_gifts, last_gift_date, last_gift_amount, lapse_risk, total_volunteer_hours, reliability_score, created_at
- gifts: id, organization_id, contact_id, amount, gift_date, gift_type, campaign_id, is_recurring, notes, created_at
- shifts: id, organization_id, title, description, shift_date, start_time, end_time, location, required_volunteers, filled_spots, created_at
- shift_signups: id, organization_id, contact_id, shift_id, signup_date, status, checked_in_at, hours_worked

Always filter by organization_id = '{orgId}' in your SQL.

For conversational queries (greetings, questions about Flora, general advice), set requiresDatabase to false and provide a warm, helpful response.

Return ONLY valid JSON, no other text.`

/**
 * Process a natural language query using Flora AI
 * This is a true conversational AI that can handle any query
 */
export async function processQuery(query: string): Promise<ProcessQueryResult> {
  const startTime = Date.now()

  try {
    // Get organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Step 1: Route the query - determine intent and generate response/SQL
    const routerPrompt = QUERY_ROUTER_PROMPT
      .replace('{query}', query)
      .replace('{orgId}', organizationId)

    const routingResponse = await generateWithCaching({
      systemPrompt: FLORA_SYSTEM_PROMPT,
      userPrompt: routerPrompt,
      maxTokens: 2048,
      model: MODELS.HAIKU,
      temperature: 0.3,
    })

    // Parse the routing response
    let routing: {
      intent: string
      requiresDatabase: boolean
      sqlQuery?: string
      conversationalResponse?: string
      queryDescription?: string
    }

    try {
      const jsonMatch = routingResponse.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      routing = JSON.parse(jsonMatch[0])
    } catch {
      // If routing fails, treat as conversation
      routing = {
        intent: 'conversation',
        requiresDatabase: false,
        conversationalResponse: await generateConversationalResponse(query),
      }
    }

    // Track AI usage
    await trackUsage({
      organizationId,
      inputTokens: routingResponse.usage.inputTokens,
      outputTokens: routingResponse.usage.outputTokens,
      model: 'claude-haiku-4-5-20251001',
      emailType: 'ask_flora',
    }).catch(console.error) // Don't fail if tracking fails

    // Step 2: Handle based on intent
    if (!routing.requiresDatabase && routing.conversationalResponse) {
      // Pure conversational response
      return {
        success: true,
        result: {
          success: true,
          data: {
            type: 'conversation' as const,
            summary: routing.conversationalResponse,
          },
          executionTime: Date.now() - startTime,
        },
      }
    }

    // Step 3: Execute database query if needed
    if (routing.sqlQuery) {
      const supabase = await createClient()

      // Try direct query approach first (more reliable than dynamic SQL)
      const result = await executeDirectQuery(supabase, routing.sqlQuery, organizationId)

      if (result) {
        // Generate a natural language summary of the results
        let summary: string
        try {
          summary = await generateResultSummary(query, result, routing.queryDescription)
        } catch (summaryError) {
          // If summary generation fails, create a basic summary
          console.error('Summary generation failed:', summaryError)
          if (typeof result === 'object' && 'count' in result) {
            summary = `Found ${result.count} results for your query.`
          } else if (Array.isArray(result)) {
            summary = `Found ${result.length} results for your query.`
          } else {
            summary = 'Here are your results.'
          }
        }

        return {
          success: true,
          result: {
            success: true,
            data: {
              type: determineResultType(result),
              rows: Array.isArray(result) ? result : undefined,
              aggregates: !Array.isArray(result) && typeof result === 'object' ? result : undefined,
              summary,
            },
            executionTime: Date.now() - startTime,
          },
        }
      }

      // If direct query didn't match, try RPC as fallback
      const { data, error } = await supabase.rpc('execute_readonly_query', {
        query_text: routing.sqlQuery,
      }).catch(() => {
        return { data: null, error: { message: 'RPC not available' } }
      })

      if (!error && data) {
        let summary: string
        try {
          summary = await generateResultSummary(query, data, routing.queryDescription)
        } catch (summaryError) {
          console.error('Summary generation failed:', summaryError)
          summary = Array.isArray(data)
            ? `Found ${data.length} results.`
            : 'Here are your results.'
        }

        return {
          success: true,
          result: {
            success: true,
            data: {
              type: determineResultType(data),
              rows: Array.isArray(data) ? data : undefined,
              aggregates: !Array.isArray(data) && typeof data === 'object' ? data : undefined,
              summary,
            },
            executionTime: Date.now() - startTime,
          },
        }
      }

      // If all query methods fail, provide a helpful response
      let fallbackResponse: string
      try {
        fallbackResponse = await generateConversationalResponse(
          `I tried to look up data for "${query}" but encountered an issue. Can you help me understand what they're looking for and provide general guidance?`
        )
      } catch {
        fallbackResponse = "I'm having trouble accessing the data right now. Please try again in a moment, or feel free to ask me a different question!"
      }

      return {
        success: true,
        result: {
          success: true,
          data: {
            type: 'conversation' as const,
            summary: fallbackResponse,
          },
          executionTime: Date.now() - startTime,
        },
      }
    }

    // Fallback: generate conversational response
    const fallback = await generateConversationalResponse(query)
    return {
      success: true,
      result: {
        success: true,
        data: {
          type: 'conversation' as const,
          summary: fallback,
        },
        executionTime: Date.now() - startTime,
      },
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error processing query:', {
      query,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Even on error, try to be helpful with a static message (no AI call to avoid cascade)
    return {
      success: true,
      result: {
        success: true,
        data: {
          type: 'conversation' as const,
          summary: "I'm having a moment of difficulty processing that request. Could you try rephrasing your question, or ask me something else? I'm here to help with donor information, volunteer management, and fundraising insights!",
        },
        executionTime: Date.now() - startTime,
      },
    }
  }
}

/**
 * Execute direct queries for common patterns
 */
async function executeDirectQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sqlHint: string,
  organizationId: string
): Promise<any[] | Record<string, number> | null> {
  const lowerSql = sqlHint.toLowerCase()

  try {
    // Count queries
    if (lowerSql.includes('count(') || lowerSql.includes('count (')) {
      // Determine the table
      if (lowerSql.includes('contacts') || lowerSql.includes('donor')) {
        let query = supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)

        // Apply common filters
        if (lowerSql.includes('is_donor') || lowerSql.includes('donor')) {
          query = query.eq('is_donor', true)
        }
        if (lowerSql.includes('is_volunteer') || lowerSql.includes('volunteer')) {
          query = query.eq('is_volunteer', true)
        }
        if (lowerSql.includes('this month') || lowerSql.includes('current_date')) {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)
          query = query.gte('created_at', startOfMonth.toISOString())
        }
        if (lowerSql.includes('lapse_risk')) {
          query = query.in('lapse_risk', ['medium', 'high'])
        }

        const { count, error } = await query
        if (error) throw error
        return { count: count || 0 }
      }

      if (lowerSql.includes('shift')) {
        const { count, error } = await supabase
          .from('shifts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)

        if (error) throw error
        return { count: count || 0 }
      }

      if (lowerSql.includes('gifts')) {
        let query = supabase
          .from('gifts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)

        if (lowerSql.includes('this month')) {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)
          query = query.gte('gift_date', startOfMonth.toISOString())
        }

        const { count, error } = await query
        if (error) throw error
        return { count: count || 0 }
      }
    }

    // Sum/total queries
    if (lowerSql.includes('sum(') || lowerSql.includes('total')) {
      if (lowerSql.includes('amount') || lowerSql.includes('giving') || lowerSql.includes('raised')) {
        let query = supabase
          .from('gifts')
          .select('amount')
          .eq('organization_id', organizationId)

        if (lowerSql.includes('this month')) {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)
          query = query.gte('gift_date', startOfMonth.toISOString())
        }
        if (lowerSql.includes('this year')) {
          const startOfYear = new Date()
          startOfYear.setMonth(0, 1)
          startOfYear.setHours(0, 0, 0, 0)
          query = query.gte('gift_date', startOfYear.toISOString())
        }

        const { data, error } = await query
        if (error) throw error
        const total = data?.reduce((sum, g) => sum + (g.amount || 0), 0) || 0
        return { total_amount: total }
      }
    }

    // List queries - top donors
    if (lowerSql.includes('order by') && lowerSql.includes('desc')) {
      if (lowerSql.includes('lifetime_giving') || lowerSql.includes('top donor')) {
        const limit = lowerSql.match(/limit\s+(\d+)/i)?.[1] || '10'
        const { data, error } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, lifetime_giving, total_gifts, last_gift_date')
          .eq('organization_id', organizationId)
          .eq('is_donor', true)
          .order('lifetime_giving', { ascending: false })
          .limit(parseInt(limit))

        if (error) throw error
        return data || []
      }
    }

    // Lapsed/at-risk donors
    if (lowerSql.includes('lapse_risk') && (lowerSql.includes('medium') || lowerSql.includes('high'))) {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, lifetime_giving, last_gift_date, lapse_risk')
        .eq('organization_id', organizationId)
        .eq('is_donor', true)
        .in('lapse_risk', ['medium', 'high'])
        .order('lifetime_giving', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    }

    // Recent contacts/donors
    if (lowerSql.includes('created_at') && lowerSql.includes('desc')) {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, is_donor, is_volunteer, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    }

    // Volunteers
    if (lowerSql.includes('volunteer') && !lowerSql.includes('count')) {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, total_volunteer_hours, reliability_score')
        .eq('organization_id', organizationId)
        .eq('is_volunteer', true)
        .order('total_volunteer_hours', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    }

    // Upcoming shifts
    if (lowerSql.includes('shift') && !lowerSql.includes('count')) {
      const { data, error } = await supabase
        .from('shifts')
        .select('id, title, shift_date, start_time, end_time, location, required_volunteers, filled_spots')
        .eq('organization_id', organizationId)
        .gte('shift_date', new Date().toISOString().split('T')[0])
        .order('shift_date', { ascending: true })
        .limit(20)

      if (error) throw error
      return data || []
    }

    // Default: fetch contacts with basic info
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, is_donor, is_volunteer, lifetime_giving')
      .eq('organization_id', organizationId)
      .limit(20)

    if (error) throw error
    return data || []

  } catch (error) {
    console.error('Direct query error:', error)
    return null
  }
}

/**
 * Generate a conversational response
 */
async function generateConversationalResponse(prompt: string): Promise<string> {
  const response = await generateWithCaching({
    systemPrompt: FLORA_SYSTEM_PROMPT,
    userPrompt: prompt,
    maxTokens: 1024,
    model: MODELS.HAIKU,
    temperature: 0.7,
  })

  return response.content
}

/**
 * Generate a natural language summary of query results
 */
async function generateResultSummary(
  originalQuery: string,
  data: any,
  queryDescription?: string
): Promise<string> {
  const dataStr = JSON.stringify(data, null, 2).slice(0, 2000) // Limit data size

  const response = await generateWithCaching({
    systemPrompt: FLORA_SYSTEM_PROMPT,
    userPrompt: `The user asked: "${originalQuery}"
${queryDescription ? `Query intent: ${queryDescription}` : ''}

Here are the results:
${dataStr}

Please provide a helpful, conversational summary of these results. Be specific with numbers and insights. If there are no results or the count is 0, acknowledge that and offer suggestions.`,
    maxTokens: 512,
    model: MODELS.HAIKU,
    temperature: 0.5,
  })

  return response.content
}

/**
 * Determine result type from data structure
 */
function determineResultType(data: any): 'list' | 'aggregate' | 'comparison' | 'conversation' {
  if (!data) return 'conversation'
  if (Array.isArray(data)) return 'list'
  if (typeof data === 'object' && ('count' in data || 'total_amount' in data || 'sum' in data)) {
    return 'aggregate'
  }
  return 'conversation'
}
