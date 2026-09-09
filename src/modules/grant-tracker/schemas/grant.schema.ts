import { z } from 'zod'

// Shared ActionResult type for server actions
export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export const GrantStatus = z.enum([
  'researching',
  'writing',
  'draft',
  'submitted',
  'pending',
  'approved',
  'declined',
  'reporting',
])
export type GrantStatus = z.infer<typeof GrantStatus>

export const grantApplicationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  funderName: z.string(),
  funderContactId: z.string().uuid().nullable(),
  grantName: z.string().nullable(),
  amountRequested: z.number().nullable(),
  amountAwarded: z.number().nullable(),
  status: GrantStatus,
  deadline: z.string().nullable(),
  submittedAt: z.string().nullable(),
  decisionAt: z.string().nullable(),
  reportingDue: z.string().nullable(),
  notes: z.string().nullable(),
  attachments: z.any().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type GrantApplication = z.infer<typeof grantApplicationSchema>

// Extended type with computed fields (used by queries)
export interface GrantWithMeta extends GrantApplication {
  daysUntilDeadline: number | null
  isOverdue: boolean
  daysUntilReporting: number | null
  isReportingOverdue: boolean
}

export const createGrantSchema = z.object({
  funderName: z.string().min(1, 'Funder name is required').max(200),
  grantName: z.string().max(200).optional(),
  amountRequested: z.number().positive().optional(),
  deadline: z.string().optional(),
  notes: z.string().max(2000).optional(),
})
export type CreateGrantInput = z.infer<typeof createGrantSchema>

export const updateGrantSchema = z.object({
  id: z.string().uuid(),
  funderName: z.string().min(1).max(200).optional(),
  grantName: z.string().max(200).nullable().optional(),
  amountRequested: z.number().positive().nullable().optional(),
  amountAwarded: z.number().positive().nullable().optional(),
  status: GrantStatus.optional(),
  deadline: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  decisionAt: z.string().nullable().optional(),
  reportingDue: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})
export type UpdateGrantInput = z.infer<typeof updateGrantSchema>

export const GRANT_STATUS_METADATA: Record<
  GrantStatus,
  { label: string; color: string; description: string }
> = {
  researching: {
    label: 'Researching',
    color: 'slate',
    description: 'Researching opportunity',
  },
  writing: {
    label: 'Writing',
    color: 'indigo',
    description: 'Writing application',
  },
  draft: {
    label: 'Draft',
    color: 'neutral',
    description: 'Application in progress',
  },
  submitted: {
    label: 'Submitted',
    color: 'blue',
    description: 'Application submitted',
  },
  pending: {
    label: 'Pending',
    color: 'amber',
    description: 'Awaiting decision',
  },
  approved: {
    label: 'Approved',
    color: 'emerald',
    description: 'Grant awarded',
  },
  declined: {
    label: 'Declined',
    color: 'rose',
    description: 'Application declined',
  },
  reporting: {
    label: 'Reporting',
    color: 'purple',
    description: 'Grant active, reports due',
  },
}
