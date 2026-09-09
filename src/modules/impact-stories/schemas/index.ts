/**
 * Impact Stories Schemas
 *
 * Zod validation schemas for impact metrics and stories
 */

import { z } from 'zod'

// Impact Metric Schema
export const impactMetricSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  metric_name: z.string().min(1, 'Metric name is required'),
  description: z.string().optional().nullable(),
  cost_per_unit: z.number().positive('Cost per unit must be positive'),
  unit_label: z.string().min(1, 'Unit label is required'),
  unit_label_plural: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
})

export const createMetricSchema = impactMetricSchema.omit({
  id: true,
  organization_id: true,
})

export const updateMetricSchema = createMetricSchema.partial()

// Impact Story Schema
export const impactStorySchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  story_content: z.string().min(1, 'Story content is required'),
  metrics: z.record(z.number()), // { "meals_served": 500, "families_helped": 25 }
  total_giving: z.number().nonnegative(),
  period_start: z.string().optional().nullable(), // Date string
  period_end: z.string().optional().nullable(), // Date string
  share_token: z.string().optional().nullable(),
  is_public: z.boolean().default(true),
})

export const generateStorySchema = z.object({
  contact_id: z.string().uuid(),
  period_start: z.string().optional(), // ISO date string
  period_end: z.string().optional(), // ISO date string
})

export const sendStorySchema = z.object({
  story_id: z.string().uuid(),
  recipient_email: z.string().email().optional(), // If not provided, use contact email
})

// Type exports
export type ImpactMetric = z.infer<typeof impactMetricSchema>
export type CreateMetricInput = z.infer<typeof createMetricSchema>
export type UpdateMetricInput = z.infer<typeof updateMetricSchema>
export type ImpactStory = z.infer<typeof impactStorySchema>
export type GenerateStoryInput = z.infer<typeof generateStorySchema>
export type SendStoryInput = z.infer<typeof sendStorySchema>
