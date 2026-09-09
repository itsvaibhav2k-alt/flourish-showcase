/**
 * Query Executor
 *
 * Executes structured query plans against Supabase and returns formatted results.
 */

import { createClient } from '@/lib/supabase/server'
import type { QueryPlan, FilterCondition } from './parse-query'

export type QueryResult = {
  success: boolean
  data?: QueryResultData
  error?: string
  executionTime?: number
}

export type QueryResultData = {
  type: 'list' | 'aggregate' | 'comparison' | 'conversation'
  rows?: Array<Record<string, any>>
  total?: number
  aggregates?: Record<string, number | string>
  comparison?: {
    current: Record<string, number | string>
    previous: Record<string, number | string>
    change: Record<string, number | string>
  }
  summary?: string
}

/**
 * Execute a query plan against the database
 */
export async function executeQuery(
  queryPlan: QueryPlan,
  organizationId: string
): Promise<QueryResult> {
  const startTime = Date.now()

  try {
    if (queryPlan.queryType === 'unknown') {
      return {
        success: false,
        error: queryPlan.intent,
        executionTime: Date.now() - startTime,
      }
    }

    const supabase = await createClient()

    // Route to appropriate handler based on query type
    let resultData: QueryResultData

    switch (queryPlan.queryType) {
      case 'filter_contacts':
      case 'list_items':
        resultData = await executeListQuery(supabase, queryPlan, organizationId)
        break

      case 'aggregate_data':
        resultData = await executeAggregateQuery(supabase, queryPlan, organizationId)
        break

      case 'compare_periods':
        resultData = await executeComparisonQuery(supabase, queryPlan, organizationId)
        break

      default:
        return {
          success: false,
          error: `Query type "${queryPlan.queryType}" not yet implemented`,
          executionTime: Date.now() - startTime,
        }
    }

    return {
      success: true,
      data: resultData,
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    console.error('Error executing query:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: Date.now() - startTime,
    }
  }
}

/**
 * Execute a list/filter query
 */
async function executeListQuery(
  supabase: any,
  queryPlan: QueryPlan,
  organizationId: string
): Promise<QueryResultData> {
  const { entity, filters, sort, limit = 50 } = queryPlan

  // Build base query
  let query = supabase
    .from(getTableName(entity))
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)

  // Apply filters
  query = applyFilters(query, filters)

  // Apply time range if present
  if (queryPlan.timeRange) {
    query = applyTimeRange(query, queryPlan.timeRange, entity)
  }

  // Apply sorting
  if (sort) {
    query = query.order(sort.field, { ascending: sort.order === 'asc' })
  }

  // Apply limit
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  // Post-process data based on entity type
  const processedRows = await postProcessRows(supabase, data || [], entity, organizationId)

  return {
    type: 'list',
    rows: processedRows,
    total: count || 0,
    summary: generateListSummary(processedRows, queryPlan),
  }
}

/**
 * Execute an aggregation query
 */
async function executeAggregateQuery(
  supabase: any,
  queryPlan: QueryPlan,
  organizationId: string
): Promise<QueryResultData> {
  const { entity, filters, aggregations, timeRange } = queryPlan

  if (!aggregations || aggregations.length === 0) {
    throw new Error('No aggregations specified')
  }

  const tableName = getTableName(entity)
  let query = supabase
    .from(tableName)
    .select('*')
    .eq('organization_id', organizationId)

  // Apply filters
  query = applyFilters(query, filters)

  // Apply time range
  if (timeRange) {
    query = applyTimeRange(query, timeRange, entity)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  // Calculate aggregations in memory
  const aggregates: Record<string, number | string> = {}

  for (const agg of aggregations) {
    const value = calculateAggregation(data || [], agg.type, agg.field)
    aggregates[agg.field || agg.type] = value
  }

  return {
    type: 'aggregate',
    aggregates,
    summary: generateAggregateSummary(aggregates, queryPlan),
  }
}

/**
 * Execute a comparison query (comparing two time periods)
 */
async function executeComparisonQuery(
  supabase: any,
  queryPlan: QueryPlan,
  organizationId: string
): Promise<QueryResultData> {
  const { entity, filters, aggregations, timeRange } = queryPlan

  if (!timeRange || !aggregations) {
    throw new Error('Comparison queries require time range and aggregations')
  }

  // Parse the time range into current and previous periods
  const { current, previous } = parseComparisonPeriods(timeRange)

  // Execute query for current period
  const currentData = await executeAggregationForPeriod(
    supabase,
    entity,
    filters,
    aggregations,
    current,
    organizationId
  )

  // Execute query for previous period
  const previousData = await executeAggregationForPeriod(
    supabase,
    entity,
    filters,
    aggregations,
    previous,
    organizationId
  )

  // Calculate changes
  const change: Record<string, number | string> = {}
  for (const key in currentData) {
    const curr = Number(currentData[key]) || 0
    const prev = Number(previousData[key]) || 0
    const diff = curr - prev
    const percentChange = prev !== 0 ? ((diff / prev) * 100).toFixed(1) : 'N/A'
    change[key] = `${diff >= 0 ? '+' : ''}${percentChange}%`
  }

  return {
    type: 'comparison',
    comparison: {
      current: currentData,
      previous: previousData,
      change,
    },
    summary: generateComparisonSummary(currentData, previousData, change, queryPlan),
  }
}

/**
 * Helper: Get table name from entity type
 */
function getTableName(entity: string): string {
  switch (entity) {
    case 'contacts':
    case 'donors':
    case 'volunteers':
      return 'contacts'
    case 'gifts':
      return 'gifts'
    case 'shifts':
      return 'shifts'
    case 'activities':
      return 'activities'
    default:
      return 'contacts'
  }
}

/**
 * Helper: Apply filters to query
 */
function applyFilters(query: any, filters: FilterCondition[]): any {
  for (const filter of filters) {
    const { field, operator, value } = filter

    switch (operator) {
      case 'eq':
        query = query.eq(field, value)
        break
      case 'gt':
        query = query.gt(field, value)
        break
      case 'gte':
        query = query.gte(field, value)
        break
      case 'lt':
        query = query.lt(field, value)
        break
      case 'lte':
        query = query.lte(field, value)
        break
      case 'contains':
        query = query.ilike(field, `%${value}%`)
        break
      case 'in':
        query = query.in(field, value as any[])
        break
      case 'not_in':
        query = query.not(field, 'in', `(${(value as any[]).join(',')})`)
        break
    }
  }

  return query
}

/**
 * Helper: Apply time range to query
 */
function applyTimeRange(query: any, timeRange: any, entity: string): any {
  const dateField = getDateField(entity)

  if (timeRange.start) {
    const startDate = parseTimeExpression(timeRange.start)
    query = query.gte(dateField, startDate)
  }

  if (timeRange.end) {
    const endDate = parseTimeExpression(timeRange.end)
    query = query.lte(dateField, endDate)
  }

  return query
}

/**
 * Helper: Get the appropriate date field for an entity
 */
function getDateField(entity: string): string {
  switch (entity) {
    case 'gifts':
      return 'gift_date'
    case 'shifts':
      return 'shift_date'
    case 'activities':
      return 'created_at'
    default:
      return 'created_at'
  }
}

/**
 * Helper: Parse time expressions into ISO dates
 */
function parseTimeExpression(expression: string): string {
  const now = new Date()
  const lowerExpr = expression.toLowerCase()

  // Handle relative expressions with "days ago"
  if (lowerExpr.includes('days ago') || lowerExpr.includes('days')) {
    const days = parseInt(expression)
    if (!isNaN(days)) {
      const date = new Date(now)
      date.setDate(date.getDate() - days)
      return date.toISOString()
    }
  }

  // Handle "today"
  if (lowerExpr === 'today' || lowerExpr === 'now') {
    return now.toISOString()
  }

  // Handle "yesterday"
  if (lowerExpr === 'yesterday') {
    const date = new Date(now)
    date.setDate(date.getDate() - 1)
    return date.toISOString()
  }

  // Handle this month start/end
  if (lowerExpr.includes('this_month') || lowerExpr.includes('this month')) {
    if (lowerExpr.includes('start') || lowerExpr.includes('begin')) {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    }
    if (lowerExpr.includes('end')) {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
    }
    // Default to start of this month
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }

  // Handle last month start/end
  if (lowerExpr.includes('last_month') || lowerExpr.includes('last month')) {
    if (lowerExpr.includes('start') || lowerExpr.includes('begin')) {
      return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    }
    if (lowerExpr.includes('end')) {
      return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
    }
    // Default to start of last month
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  }

  // Handle "start_of_month" / "end_of_month" (generic current month)
  if (lowerExpr === 'start_of_month' || lowerExpr === 'beginning_of_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }
  if (lowerExpr === 'end_of_month') {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  }

  // Handle this year start/end
  if (lowerExpr.includes('this_year') || lowerExpr.includes('this year')) {
    if (lowerExpr.includes('start') || lowerExpr.includes('begin')) {
      return new Date(now.getFullYear(), 0, 1).toISOString()
    }
    if (lowerExpr.includes('end')) {
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString()
    }
    return new Date(now.getFullYear(), 0, 1).toISOString()
  }

  // Handle last year start/end
  if (lowerExpr.includes('last_year') || lowerExpr.includes('last year')) {
    if (lowerExpr.includes('start') || lowerExpr.includes('begin')) {
      return new Date(now.getFullYear() - 1, 0, 1).toISOString()
    }
    if (lowerExpr.includes('end')) {
      return new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString()
    }
    return new Date(now.getFullYear() - 1, 0, 1).toISOString()
  }

  // Handle quarters (Q1, Q2, Q3, Q4)
  const quarterMatch = lowerExpr.match(/q([1-4])/)
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1])
    const startMonth = (quarter - 1) * 3
    if (lowerExpr.includes('start') || lowerExpr.includes('begin')) {
      return new Date(now.getFullYear(), startMonth, 1).toISOString()
    }
    if (lowerExpr.includes('end')) {
      return new Date(now.getFullYear(), startMonth + 3, 0, 23, 59, 59).toISOString()
    }
    // Default to start of quarter
    return new Date(now.getFullYear(), startMonth, 1).toISOString()
  }

  // Handle "X weeks ago"
  if (lowerExpr.includes('weeks ago') || lowerExpr.includes('week ago')) {
    const weeks = parseInt(expression)
    if (!isNaN(weeks)) {
      const date = new Date(now)
      date.setDate(date.getDate() - weeks * 7)
      return date.toISOString()
    }
  }

  // Handle "X months ago"
  if (lowerExpr.includes('months ago') || lowerExpr.includes('month ago')) {
    const months = parseInt(expression)
    if (!isNaN(months)) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - months)
      return date.toISOString()
    }
  }

  // Check if it's already a valid ISO date
  const isoDate = new Date(expression)
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString()
  }

  // Fallback: return current date (to avoid query errors)
  console.warn(`Could not parse time expression: "${expression}", using current date`)
  return now.toISOString()
}

/**
 * Helper: Calculate aggregation value
 */
function calculateAggregation(
  data: any[],
  type: string,
  field?: string
): number | string {
  if (data.length === 0) return 0

  switch (type) {
    case 'count':
      return data.length

    case 'sum':
      if (!field) return 0
      return data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0)

    case 'avg':
      if (!field) return 0
      const sum = data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0)
      return sum / data.length

    case 'min':
      if (!field) return 0
      return Math.min(...data.map((row) => Number(row[field]) || 0))

    case 'max':
      if (!field) return 0
      return Math.max(...data.map((row) => Number(row[field]) || 0))

    default:
      return 0
  }
}

/**
 * Helper: Post-process rows to add computed fields
 */
async function postProcessRows(
  supabase: any,
  rows: any[],
  entity: string,
  organizationId: string
): Promise<any[]> {
  // For donors, enrich with gift statistics
  if (entity === 'donors' || (rows.length > 0 && rows[0].is_donor)) {
    return Promise.all(
      rows.map(async (row) => {
        const { data: gifts } = await supabase
          .from('gifts')
          .select('amount, gift_date')
          .eq('contact_id', row.id)
          .eq('organization_id', organizationId)

        return {
          ...row,
          gift_count: gifts?.length || 0,
          total_giving: gifts?.reduce((sum: number, g: any) => sum + g.amount, 0) || 0,
        }
      })
    )
  }

  return rows
}

/**
 * Helper: Execute aggregation for a specific time period
 */
async function executeAggregationForPeriod(
  supabase: any,
  entity: string,
  filters: FilterCondition[],
  aggregations: any[],
  period: { start: string; end: string },
  organizationId: string
): Promise<Record<string, number | string>> {
  const tableName = getTableName(entity)
  let query = supabase
    .from(tableName)
    .select('*')
    .eq('organization_id', organizationId)

  query = applyFilters(query, filters)
  query = applyTimeRange(query, period, entity)

  const { data, error } = await query

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  const aggregates: Record<string, number | string> = {}
  for (const agg of aggregations) {
    aggregates[agg.field || agg.type] = calculateAggregation(
      data || [],
      agg.type,
      agg.field
    )
  }

  return aggregates
}

/**
 * Helper: Parse time range into current and previous periods
 */
function parseComparisonPeriods(timeRange: any): {
  current: { start: string; end: string }
  previous: { start: string; end: string }
} {
  const now = new Date()

  // Handle common period types
  if (timeRange.period === 'last_month') {
    const currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const previousEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)

    return {
      current: {
        start: currentStart.toISOString(),
        end: currentEnd.toISOString(),
      },
      previous: {
        start: previousStart.toISOString(),
        end: previousEnd.toISOString(),
      },
    }
  }

  // Default: compare this month vs last month
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentEnd = now
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  return {
    current: {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
    },
    previous: {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
    },
  }
}

/**
 * Helper: Generate summary for list results
 */
function generateListSummary(rows: any[], queryPlan: QueryPlan): string {
  const count = rows.length
  const entity = queryPlan.entity

  if (count === 0) {
    return `No ${entity} found matching your criteria.`
  }

  return `Found ${count} ${entity}${count !== 1 ? 's' : ''}.`
}

/**
 * Helper: Generate summary for aggregate results
 */
function generateAggregateSummary(
  aggregates: Record<string, number | string>,
  queryPlan: QueryPlan
): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(aggregates)) {
    if (typeof value === 'number') {
      if (key.includes('amount') || key.includes('giving')) {
        parts.push(`${key}: $${value.toLocaleString()}`)
      } else {
        parts.push(`${key}: ${value.toLocaleString()}`)
      }
    } else {
      parts.push(`${key}: ${value}`)
    }
  }

  return parts.join(', ')
}

/**
 * Helper: Generate summary for comparison results
 */
function generateComparisonSummary(
  current: Record<string, number | string>,
  previous: Record<string, number | string>,
  change: Record<string, number | string>,
  queryPlan: QueryPlan
): string {
  const parts: string[] = []

  for (const key in current) {
    const curr = current[key]
    const prev = previous[key]
    const chg = change[key]

    if (typeof curr === 'number' && typeof prev === 'number') {
      const formatted = key.includes('amount') || key.includes('giving')
        ? `$${curr.toLocaleString()}`
        : curr.toLocaleString()

      parts.push(`${key}: ${formatted} (${chg})`)
    }
  }

  return parts.join(', ')
}
