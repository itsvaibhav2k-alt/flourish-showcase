import { z } from 'zod'

/**
 * Schema for program metrics
 */
export const programMetricSchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  programName: z.string().min(1, 'Program name is required'),
  metricName: z.string().min(1, 'Metric name is required'),
  metricValue: z.number().int().min(0, 'Metric value must be non-negative'),
  costPerUnit: z.number().min(0, 'Cost per unit must be non-negative'),
  timePeriod: z.string().min(1, 'Time period is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
})

export type ProgramMetric = z.infer<typeof programMetricSchema>

/**
 * Schema for creating program metrics
 */
export const createProgramMetricSchema = programMetricSchema.omit({
  id: true,
  organizationId: true,
})

export type CreateProgramMetricInput = z.infer<typeof createProgramMetricSchema>

/**
 * Schema for updating program metrics
 */
export const updateProgramMetricSchema = programMetricSchema.partial().required({ id: true })

export type UpdateProgramMetricInput = z.infer<typeof updateProgramMetricSchema>

/**
 * Schema for impact story
 */
export const impactStorySchema = z.object({
  id: z.string().uuid(),
  contactId: z.string().uuid(),
  organizationId: z.string().uuid(),
  timePeriod: z.string(),
  totalGiving: z.number(),
  headline: z.string().nullable(),
  narrative: z.string().nullable(),
  impactBreakdown: z.record(z.number()).nullable(),
  cardImageUrl: z.string().nullable(),
  shareToken: z.string().nullable(),
  generatedAt: z.string(),
  createdAt: z.string(),
})

export type ImpactStory = z.infer<typeof impactStorySchema>

/**
 * Schema for generating an impact story
 */
export const generateImpactStorySchema = z.object({
  contactId: z.string().uuid(),
  timePeriod: z.string().default('all-time'),
})

export type GenerateImpactStoryInput = z.infer<typeof generateImpactStorySchema>
