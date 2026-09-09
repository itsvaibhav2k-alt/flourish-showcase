import { z } from 'zod'

// Pipeline stages enum
export const pipelineStages = [
  'identification',
  'qualification',
  'cultivation',
  'solicitation',
  'stewardship',
] as const

export type PipelineStage = typeof pipelineStages[number]
export type Stage = PipelineStage // Alias for consistency

// Move types for cultivation tracking
export const moveTypes = [
  'call',
  'meeting',
  'email',
  'event',
  'tour',
  'lunch',
  'gift',
  'proposal',
  'other',
] as const

export type MoveType = typeof moveTypes[number]

// Outcomes
export const outcomes = ['pending', 'won', 'lost', 'deferred'] as const
export type Outcome = typeof outcomes[number]

// Zod enum schemas for validation
export const stageEnum = z.enum(pipelineStages)
export const moveTypeEnum = z.enum(moveTypes)
export const outcomeEnum = z.enum(outcomes)

// Schema for creating/updating a prospect
export const prospectSchema = z.object({
  contact_id: z.string().uuid(),
  stage: z.enum(pipelineStages),
  target_ask_amount: z.number().positive().optional(),
  target_ask_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  readiness_score: z.number().min(0).max(100).optional(),
  predicted_gift_amount: z.number().positive().optional(),
  recommended_ask_amount: z.number().positive().optional(),
  optimal_ask_timing: z.string().optional(),
  next_move: z.string().optional(),
  next_move_date: z.string().optional(),
  actual_gift_amount: z.number().positive().optional(),
  outcome: z.enum(outcomes).default('pending'),
  notes: z.string().optional(),
})

export type ProspectInput = z.infer<typeof prospectSchema>

// Schema for updating prospect stage
export const updateStageSchema = z.object({
  prospect_id: z.string().uuid(),
  new_stage: z.enum(pipelineStages),
  notes: z.string().optional(),
})

export type UpdateStageInput = z.infer<typeof updateStageSchema>

// Schema for logging a cultivation move
export const cultivationMoveSchema = z.object({
  prospect_id: z.string().uuid(),
  move_type: z.enum(moveTypes),
  move_date: z.string(),
  description: z.string(),
  outcome: z.string().optional(),
  next_step: z.string().optional(),
})

export type CultivationMoveInput = z.infer<typeof cultivationMoveSchema>

// Alias for logMove action
export const logMoveSchema = cultivationMoveSchema
export type LogMoveInput = CultivationMoveInput

// Schema for adding a prospect (server action input)
export const addProspectSchema = z.object({
  contact_id: z.string().uuid(),
  stage: z.enum(pipelineStages).default('identification'),
  target_ask_amount: z.number().positive().optional(),
  target_ask_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export type AddProspectInput = z.infer<typeof addProspectSchema>

// Schema for updating prospect outcome
export const updateOutcomeSchema = z.object({
  prospect_id: z.string().uuid(),
  outcome: z.enum(outcomes),
  actual_gift_amount: z.number().positive().optional(),
  notes: z.string().optional(),
})

export type UpdateOutcomeInput = z.infer<typeof updateOutcomeSchema>
