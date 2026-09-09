import { z } from 'zod'

export const CampaignType = z.enum([
  'fundraising',
  'awareness',
  'event',
  'annual',
  'capital',
])
export type CampaignType = z.infer<typeof CampaignType>

export const CampaignStatus = z.enum([
  'planning',
  'active',
  'paused',
  'completed',
  'cancelled',
])
export type CampaignStatus = z.infer<typeof CampaignStatus>

export const campaignSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Campaign name is required').max(100),
  description: z.string().max(1000).nullable(),
  campaignType: CampaignType,
  goalAmount: z.number().positive().nullable(),
  raisedAmount: z.number().default(0),
  donorCount: z.number().int().default(0),
  status: CampaignStatus,
  startDate: z.string().nullable(), // ISO date string
  endDate: z.string().nullable(),
  targetAudience: z.any().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Campaign = z.infer<typeof campaignSchema>

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  description: z.string().max(1000).optional(),
  campaignType: CampaignType.default('fundraising'),
  goalAmount: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>

export const updateCampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  campaignType: CampaignType.optional(),
  goalAmount: z.number().positive().nullable().optional(),
  status: CampaignStatus.optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
})
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>

// Campaign type metadata for UI
export const CAMPAIGN_TYPE_METADATA: Record<
  CampaignType,
  { label: string; description: string; color: string }
> = {
  fundraising: {
    label: 'Fundraising',
    description: 'General fundraising campaign',
    color: 'emerald',
  },
  awareness: {
    label: 'Awareness',
    description: 'Mission awareness and outreach',
    color: 'blue',
  },
  event: {
    label: 'Event',
    description: 'Fundraising event or gala',
    color: 'purple',
  },
  annual: {
    label: 'Annual Fund',
    description: 'Annual giving campaign',
    color: 'amber',
  },
  capital: {
    label: 'Capital',
    description: 'Capital campaign for major projects',
    color: 'rose',
  },
}

export const CAMPAIGN_STATUS_METADATA: Record<
  CampaignStatus,
  { label: string; color: string }
> = {
  planning: { label: 'Planning', color: 'neutral' },
  active: { label: 'Active', color: 'emerald' },
  paused: { label: 'Paused', color: 'amber' },
  completed: { label: 'Completed', color: 'blue' },
  cancelled: { label: 'Cancelled', color: 'rose' },
}
