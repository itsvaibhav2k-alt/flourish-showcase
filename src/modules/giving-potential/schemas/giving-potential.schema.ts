import { z } from 'zod'

/**
 * Zod schema for giving_potential table
 */
export const givingPotentialSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Wealth indicators
  estimated_net_worth: z.number().nullable().optional(),
  real_estate_value: z.number().nullable().optional(),
  stock_holdings: z.number().nullable().optional(),
  political_donations: z.number().nullable().optional(),
  nonprofit_board_count: z.number().int().min(0).default(0),
  employer: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),

  // Scoring metrics (0-100)
  capacity_score: z.number().int().min(0).max(100).nullable().optional(),
  affinity_score: z.number().int().min(0).max(100).nullable().optional(),
  propensity_score: z.number().int().min(0).max(100).nullable().optional(),
  overall_score: z.number().int().min(0).max(100).nullable().optional(),

  // Analysis metrics
  giving_gap_ratio: z.number().nullable().optional(),
  data_sources: z.record(z.string(), z.any()).default({}),
  notes: z.string().nullable().optional(),

  // Timestamps
  last_enriched_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for creating a new giving potential record (omits auto-generated fields)
 */
export const createGivingPotentialSchema = givingPotentialSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
})

/**
 * Schema for updating an existing giving potential record
 */
export const updateGivingPotentialSchema = createGivingPotentialSchema.partial()

/**
 * Schema for raw wealth data input (used for score calculation)
 */
export const wealthDataSchema = z.object({
  // Wealth indicators
  estimated_net_worth: z.number().min(0).optional(),
  real_estate_value: z.number().min(0).optional(),
  stock_holdings: z.number().min(0).optional(),
  political_donations: z.number().min(0).optional(),
  job_level: z.enum(['entry', 'mid', 'senior', 'executive', 'c-suite']).optional(),
})

/**
 * Schema for contact engagement data (used for score calculation)
 */
export const contactEngagementSchema = z.object({
  lifetime_giving: z.number().min(0).optional(),
  gift_count: z.number().int().min(0).optional(),
  total_volunteer_hours: z.number().min(0).optional(),
  email_open_rate: z.number().min(0).max(1).optional(), // 0-1 ratio
  event_attendance_count: z.number().int().min(0).optional(),
  last_gift_date: z.string().nullable().optional(),
  first_gift_date: z.string().nullable().optional(),
  avg_gift_amount: z.number().min(0).optional(),
})

/**
 * Schema for calculated scores
 */
export const calculatedScoresSchema = z.object({
  capacity_score: z.number().int().min(0).max(100),
  affinity_score: z.number().int().min(0).max(100),
  propensity_score: z.number().int().min(0).max(100),
  overall_score: z.number().int().min(0).max(100),
  giving_gap_ratio: z.number().min(0).nullable().optional(),
})

/**
 * TypeScript types derived from schemas
 */
export type GivingPotential = z.infer<typeof givingPotentialSchema>
export type CreateGivingPotentialInput = z.infer<typeof createGivingPotentialSchema>
export type UpdateGivingPotentialInput = z.infer<typeof updateGivingPotentialSchema>
export type WealthData = z.infer<typeof wealthDataSchema>
export type ContactEngagement = z.infer<typeof contactEngagementSchema>
export type CalculatedScores = z.infer<typeof calculatedScoresSchema>
