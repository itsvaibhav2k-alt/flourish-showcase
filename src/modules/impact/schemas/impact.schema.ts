import { z } from 'zod'

/**
 * Zod schema for program_metrics table
 */
export const programMetricSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  program_name: z.string().min(1),
  metric_name: z.string().min(1), // e.g., "meals served", "families housed"
  metric_value: z.number().int().min(0).default(0),
  cost_per_unit: z.number().positive(), // Must be positive decimal
  time_period: z.string().min(1), // e.g., "2024", "Q4 2024"
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(), // emoji or icon name
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for creating a new program metric (omits auto-generated fields)
 */
export const createProgramMetricSchema = programMetricSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
})

/**
 * Schema for updating an existing program metric
 */
export const updateProgramMetricSchema = createProgramMetricSchema.partial()

/**
 * Zod schema for impact_stories table
 */
export const impactStorySchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  time_period: z.string().min(1), // e.g., "2024", "all-time"
  total_giving: z.number().min(0),
  headline: z.string().nullable().optional(), // e.g., "You changed 47 lives"
  narrative: z.string().nullable().optional(), // AI-generated story
  impact_breakdown: z.record(z.string(), z.number()).nullable().optional(), // e.g., {"meals": 127, "families": 2}
  card_image_url: z.string().nullable().optional(),
  share_token: z.string().nullable().optional(), // for public share links
  generated_at: z.string(),
  created_at: z.string(),
})

/**
 * Schema for creating a new impact story (omits auto-generated fields)
 */
export const createImpactStorySchema = impactStorySchema.omit({
  id: true,
  organization_id: true,
  generated_at: true,
  created_at: true,
})

/**
 * Schema for updating an existing impact story
 */
export const updateImpactStorySchema = createImpactStorySchema.partial()

/**
 * Schema for impact breakdown calculation input
 */
export const impactBreakdownInputSchema = z.object({
  totalGiving: z.number().min(0),
  metrics: z.array(
    z.object({
      program_name: z.string(),
      metric_name: z.string(),
      cost_per_unit: z.number().positive(),
      icon: z.string().optional(),
    })
  ),
})

/**
 * Schema for AI-generated impact narrative
 */
export const impactNarrativeSchema = z.object({
  headline: z.string(),
  narrative: z.string(),
})

/**
 * TypeScript types derived from schemas
 */
export type ProgramMetric = z.infer<typeof programMetricSchema>
export type CreateProgramMetricInput = z.infer<typeof createProgramMetricSchema>
export type UpdateProgramMetricInput = z.infer<typeof updateProgramMetricSchema>
export type ImpactStory = z.infer<typeof impactStorySchema>
export type CreateImpactStoryInput = z.infer<typeof createImpactStorySchema>
export type UpdateImpactStoryInput = z.infer<typeof updateImpactStorySchema>
export type ImpactBreakdownInput = z.infer<typeof impactBreakdownInputSchema>
export type ImpactNarrative = z.infer<typeof impactNarrativeSchema>
