'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { GrantStatus, GrantWithMeta } from '../schemas/grant.schema'

/**
 * Get all grant applications for the current organization
 */
export async function getGrantApplications(options?: {
  status?: GrantStatus
  limit?: number
}): Promise<GrantWithMeta[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  let query = supabase
    .from('grant_applications')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching grant applications:', error)
    return []
  }

  return (data || []).map(mapGrantRow)
}

/**
 * Get a single grant application by ID
 */
export async function getGrantById(id: string): Promise<GrantWithMeta | null> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('grant_applications')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching grant:', error)
    throw new Error('Failed to fetch grant')
  }

  return mapGrantRow(data)
}

/**
 * Get grant statistics summary
 */
export async function getGrantStats(): Promise<{
  total: number
  pending: number
  approved: number
  totalRequested: number
  totalAwarded: number
  upcomingDeadlines: number
}> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return { total: 0, pending: 0, approved: 0, totalRequested: 0, totalAwarded: 0, upcomingDeadlines: 0 }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('grant_applications')
    .select('status, amount_requested, amount_awarded, deadline')
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching grant stats:', error)
    return { total: 0, pending: 0, approved: 0, totalRequested: 0, totalAwarded: 0, upcomingDeadlines: 0 }
  }

  const grants = data || []
  const now = new Date()
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  return {
    total: grants.length,
    pending: grants.filter((g) => g.status === 'pending' || g.status === 'submitted').length,
    approved: grants.filter((g) => g.status === 'approved' || g.status === 'reporting').length,
    totalRequested: grants.reduce((sum, g) => sum + (g.amount_requested || 0), 0),
    totalAwarded: grants.reduce((sum, g) => sum + (g.amount_awarded || 0), 0),
    upcomingDeadlines: grants.filter((g) => {
      if (!g.deadline) return false
      const deadline = new Date(g.deadline)
      return deadline >= now && deadline <= twoWeeksFromNow && g.status === 'draft'
    }).length,
  }
}

/**
 * Get grants with upcoming deadlines
 */
export async function getUpcomingDeadlines(days: number = 14): Promise<GrantWithMeta[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()
  const now = new Date().toISOString().split('T')[0]
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('grant_applications')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'draft')
    .gte('deadline', now)
    .lte('deadline', futureDate)
    .order('deadline', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming deadlines:', error)
    return []
  }

  return (data || []).map(mapGrantRow)
}

// Helper function to map database row to Grant type with computed fields
function mapGrantRow(row: any): GrantWithMeta {
  const now = new Date()
  const deadline = row.deadline ? new Date(row.deadline) : null
  const reportingDue = row.reporting_due ? new Date(row.reporting_due) : null

  let daysUntilDeadline: number | null = null
  let isOverdue = false
  if (deadline && (row.status === 'draft')) {
    const diffTime = deadline.getTime() - now.getTime()
    daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isOverdue = daysUntilDeadline < 0
  }

  let daysUntilReporting: number | null = null
  let isReportingOverdue = false
  if (reportingDue && row.status === 'reporting') {
    const diffTime = reportingDue.getTime() - now.getTime()
    daysUntilReporting = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isReportingOverdue = daysUntilReporting < 0
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    funderName: row.funder_name,
    funderContactId: row.funder_contact_id,
    grantName: row.grant_name,
    amountRequested: row.amount_requested,
    amountAwarded: row.amount_awarded,
    status: row.status,
    deadline: row.deadline,
    submittedAt: row.submitted_at,
    decisionAt: row.decision_at,
    reportingDue: row.reporting_due,
    notes: row.notes,
    attachments: row.attachments,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    daysUntilDeadline,
    isOverdue,
    daysUntilReporting,
    isReportingOverdue,
  }
}
