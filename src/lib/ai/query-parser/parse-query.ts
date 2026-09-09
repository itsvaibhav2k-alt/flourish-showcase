/**
 * Natural Language Query Parser
 *
 * Uses Claude AI to parse natural language questions into structured query plans
 * for querying nonprofit CRM data.
 */

import { generateWithCaching, MODELS } from '../claude'

export type QueryType =
  | 'filter_contacts'
  | 'aggregate_data'
  | 'compare_periods'
  | 'list_items'
  | 'generate_report'
  | 'unknown'

export type EntityType = 'contacts' | 'donors' | 'volunteers' | 'gifts' | 'shifts' | 'activities'

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'list'

export type TimeRange = {
  type: 'absolute' | 'relative'
  start?: string // ISO date or relative like '30 days ago'
  end?: string // ISO date or relative like 'today'
  period?: string // For relative ranges: 'last_month', 'this_year', 'Q4', etc.
}

export type FilterCondition = {
  field: string
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'not_in'
  value: string | number | boolean | string[] | number[]
}

export type Aggregation = {
  type: AggregationType
  field?: string // Field to aggregate (for sum, avg, etc.)
  groupBy?: string[] // Fields to group by
}

export type SortOption = {
  field: string
  order: 'asc' | 'desc'
}

export type QueryPlan = {
  queryType: QueryType
  entity: EntityType
  filters: FilterCondition[]
  aggregations?: Aggregation[]
  timeRange?: TimeRange
  sort?: SortOption
  limit?: number
  intent: string // Human-readable description of what the query is trying to do
  suggestedActions?: string[] // Follow-up actions user might want to take
}

const SYSTEM_PROMPT = `You are a query parser for a nonprofit CRM system called Flourish. Your job is to convert natural language questions into structured query plans.

The CRM has the following entities:
- contacts: All people (donors, volunteers, general contacts)
  Fields: id, first_name, last_name, email, phone, tags, is_donor, is_volunteer, lifetime_giving, total_gifts, last_gift_date, lapse_risk, total_volunteer_hours, reliability_score

- gifts: Donation records
  Fields: id, contact_id, amount, gift_date, gift_type, campaign_id, is_recurring

- shifts: Volunteer shift records
  Fields: id, title, shift_date, start_time, end_time, required_volunteers, filled_spots

- volunteer_signups: Volunteer participation records
  Fields: id, contact_id, shift_id, signup_date, status, checked_in_at, hours_worked

- activities: Contact activity log
  Fields: id, contact_id, activity_type, description, created_at

Common query patterns:
1. Filter contacts by attributes (donors, volunteers, tags, giving amount)
2. Aggregate giving data (total raised, average gift, donor count)
3. Compare time periods (this month vs last month, Q4 vs Q3)
4. List top/bottom items (top 10 donors, most active volunteers)
5. Identify at-risk or high-potential contacts

Time expressions:
- "this year" = current calendar year
- "last month" = previous calendar month
- "Q4" = Oct-Dec of current year
- "30 days" = last 30 days from today
- "YTD" = year to date

Lapse risk levels: 'none', 'low', 'medium', 'high'
Gift types: 'one_time', 'recurring', 'pledge', 'in_kind'

Return your analysis as JSON matching this structure:
{
  "queryType": "filter_contacts" | "aggregate_data" | "compare_periods" | "list_items" | "generate_report" | "unknown",
  "entity": "contacts" | "donors" | "volunteers" | "gifts" | "shifts" | "activities",
  "filters": [
    {
      "field": "field_name",
      "operator": "eq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "not_in",
      "value": "value"
    }
  ],
  "aggregations": [
    {
      "type": "count" | "sum" | "avg" | "min" | "max" | "list",
      "field": "field_name",
      "groupBy": ["field1", "field2"]
    }
  ],
  "timeRange": {
    "type": "absolute" | "relative",
    "start": "ISO date or relative expression",
    "end": "ISO date or relative expression",
    "period": "last_month" | "this_year" | "Q4" | etc
  },
  "sort": {
    "field": "field_name",
    "order": "asc" | "desc"
  },
  "limit": 10,
  "intent": "Clear description of what the user wants to know",
  "suggestedActions": ["Follow-up action 1", "Follow-up action 2"]
}

Be smart about interpreting queries:
- "major donors" = lifetime_giving >= 10000
- "lapsed" = lapse_risk in ['medium', 'high']
- "active" = recent activity or gifts
- "top donors" = sort by lifetime_giving DESC with limit
- "recurring donors" = gifts where is_recurring = true
- "at-risk" = lapse_risk in ['medium', 'high']
`

/**
 * Parse a natural language query into a structured query plan
 */
export async function parseQuery(query: string): Promise<QueryPlan> {
  const userPrompt = `Parse this query into a structured query plan:

Query: "${query}"

Return ONLY the JSON query plan, no other text.`

  try {
    const response = await generateWithCaching({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 2048,
      model: MODELS.HAIKU, // Use Haiku for cost efficiency
      temperature: 0.3, // Lower temperature for more consistent parsing
    })

    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse query plan from response:', response.content)
      return createFallbackPlan(query)
    }

    const queryPlan = JSON.parse(jsonMatch[0]) as QueryPlan

    // Validate required fields
    if (!queryPlan.queryType || !queryPlan.entity) {
      console.error('Invalid query plan structure:', queryPlan)
      return createFallbackPlan(query)
    }

    // Ensure filters is always an array
    queryPlan.filters = queryPlan.filters || []

    return queryPlan
  } catch (error) {
    console.error('Error parsing query:', error)
    return createFallbackPlan(query)
  }
}

/**
 * Create a fallback query plan when parsing fails
 */
function createFallbackPlan(query: string): QueryPlan {
  return {
    queryType: 'unknown',
    entity: 'contacts',
    filters: [],
    intent: `Could not parse query: "${query}". Please try rephrasing or be more specific.`,
    suggestedActions: [
      'Try asking "Show me my top 10 donors"',
      'Try asking "How much did we raise last month?"',
      'Try asking "Who are my at-risk donors?"',
    ],
  }
}

/**
 * Extract suggested queries based on organization data
 */
export function getSuggestedQueries(): Array<{ question: string; category: string }> {
  return [
    // Donor queries
    {
      question: 'Who are my top 10 donors this year?',
      category: 'Donors',
    },
    {
      question: 'Show me lapsed major donors',
      category: 'Donors',
    },
    {
      question: 'How many new donors did we get this month?',
      category: 'Donors',
    },
    {
      question: 'What is the average gift amount for recurring donors?',
      category: 'Donors',
    },
    {
      question: 'Show me at-risk donors with lifetime giving over $1000',
      category: 'Donors',
    },

    // Giving queries
    {
      question: 'How much did we raise last month vs this month?',
      category: 'Giving',
    },
    {
      question: 'What was our total revenue in Q4?',
      category: 'Giving',
    },
    {
      question: 'Show me all gifts over $500 this year',
      category: 'Giving',
    },
    {
      question: 'How many recurring donors do we have?',
      category: 'Giving',
    },

    // Volunteer queries
    {
      question: 'Show me volunteers who haven\'t signed up in 30 days',
      category: 'Volunteers',
    },
    {
      question: 'Who are my most reliable volunteers?',
      category: 'Volunteers',
    },
    {
      question: 'How many volunteer hours were logged this month?',
      category: 'Volunteers',
    },
    {
      question: 'Which shifts need more volunteers?',
      category: 'Volunteers',
    },

    // General queries
    {
      question: 'Show me contacts tagged with "board member"',
      category: 'Contacts',
    },
    {
      question: 'Who did we add to the database this week?',
      category: 'Contacts',
    },
  ]
}
