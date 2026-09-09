import { z } from 'zod'

/**
 * Zod schema for Smart Ask configuration
 */
export const smartAskConfigSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  stretch_multiplier: z.number().positive().default(1.5),
  target_multiplier: z.number().positive().default(1.2),
  accessible_multiplier: z.number().positive().default(1.0),
  capacity_weight: z.number().min(0).max(1).default(0.3),
  high_risk_reduction: z.number().min(0).max(1).default(0.2),
  medium_risk_reduction: z.number().min(0).max(1).default(0.1),
  min_confidence_score: z.number().min(0).max(1).default(0.6),
  segment_rules: z.array(z.any()).default([]),
  enabled: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for creating/updating Smart Ask config
 */
export const createSmartAskConfigSchema = z.object({
  stretch_multiplier: z.number().positive().optional(),
  target_multiplier: z.number().positive().optional(),
  accessible_multiplier: z.number().positive().optional(),
  capacity_weight: z.number().min(0).max(1).optional(),
  high_risk_reduction: z.number().min(0).max(1).optional(),
  medium_risk_reduction: z.number().min(0).max(1).optional(),
  min_confidence_score: z.number().min(0).max(1).optional(),
  segment_rules: z.array(z.any()).optional(),
  enabled: z.boolean().optional(),
})

/**
 * Schema for Smart Ask result
 */
export const smartAskResultSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  stretch_amount: z.number(),
  target_amount: z.number(),
  accessible_amount: z.number(),
  stretch_confidence: z.number().nullable(),
  target_confidence: z.number().nullable(),
  accessible_confidence: z.number().nullable(),
  base_amount: z.number(),
  capacity_score: z.number().nullable(),
  lapse_risk: z.string().nullable(),
  calculation_method: z.string().nullable(),
  reasoning: z.string().nullable(),
  suggested_at: z.string(),
  suggestion_type: z.string().nullable(),
  shown_amount: z.number().nullable(),
  converted: z.boolean().default(false),
  actual_gift_amount: z.number().nullable(),
  gift_id: z.string().uuid().nullable(),
  converted_at: z.string().nullable(),
  campaign: z.string().nullable(),
  appeal_type: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for recording a Smart Ask suggestion
 */
export const recordSmartAskSchema = z.object({
  contact_id: z.string().uuid(),
  stretch_amount: z.number(),
  target_amount: z.number(),
  accessible_amount: z.number(),
  stretch_confidence: z.number().optional(),
  target_confidence: z.number().optional(),
  accessible_confidence: z.number().optional(),
  base_amount: z.number(),
  capacity_score: z.number().optional(),
  lapse_risk: z.string().optional(),
  calculation_method: z.string(),
  reasoning: z.string(),
  suggestion_type: z.enum(['stretch', 'target', 'accessible', 'custom']),
  shown_amount: z.number(),
  campaign: z.string().optional(),
  appeal_type: z.string().optional(),
})

/**
 * Schema for calculating Smart Ask
 */
export const calculateSmartAskSchema = z.object({
  contact_id: z.string().uuid(),
})

/**
 * TypeScript types derived from schemas
 */
export type SmartAskConfig = z.infer<typeof smartAskConfigSchema>
export type CreateSmartAskConfigInput = z.infer<typeof createSmartAskConfigSchema>
export type SmartAskResult = z.infer<typeof smartAskResultSchema>
export type RecordSmartAskInput = z.infer<typeof recordSmartAskSchema>
export type CalculateSmartAskInput = z.infer<typeof calculateSmartAskSchema>
