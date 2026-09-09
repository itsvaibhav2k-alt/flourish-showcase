import { z } from 'zod'

/**
 * Sequence Schemas
 *
 * Validation schemas for email sequences, steps, and enrollments
 */

// Trigger types for sequences
export const TriggerType = z.enum([
  'gift',
  'signup',
  'lapse_risk',
  'manual',
  'date',
  'volunteer_signup',
  'volunteer_completed',
])

export type TriggerType = z.infer<typeof TriggerType>

// Template types for sequence steps
export const TemplateType = z.enum([
  'thank_you',
  'appeal',
  'reengagement',
  'welcome',
  'follow_up',
  'custom',
])

export type TemplateType = z.infer<typeof TemplateType>

// Sequence status
export const SequenceStatus = z.enum(['active', 'paused', 'archived'])

export type SequenceStatus = z.infer<typeof SequenceStatus>

// Enrollment status
export const EnrollmentStatus = z.enum([
  'active',
  'paused',
  'completed',
  'cancelled',
  'failed',
])

export type EnrollmentStatus = z.infer<typeof EnrollmentStatus>

// Step execution status
export const ExecutionStatus = z.enum([
  'pending',
  'generating',
  'generated',
  'sent',
  'skipped',
  'failed',
])

export type ExecutionStatus = z.infer<typeof ExecutionStatus>

// Create sequence schema
export const CreateSequenceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  trigger_type: TriggerType,
  trigger_config: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().default(false),
})

export type CreateSequenceInput = z.infer<typeof CreateSequenceSchema>

// Update sequence schema
export const UpdateSequenceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  trigger_config: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().optional(),
})

export type UpdateSequenceInput = z.infer<typeof UpdateSequenceSchema>

// Create sequence step schema
export const CreateStepSchema = z.object({
  sequence_id: z.string().uuid(),
  step_order: z.number().int().min(1),
  name: z.string().min(1).max(200),
  delay_days: z.number().int().min(0).default(0),
  delay_hours: z.number().int().min(0).max(23).default(0),
  template_type: TemplateType,
  subject_template: z.string().optional(),
  custom_instructions: z.string().optional(),
  conditions: z.record(z.string(), z.any()).optional(),
})

export type CreateStepInput = z.infer<typeof CreateStepSchema>

// Update sequence step schema
export const UpdateStepSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  delay_days: z.number().int().min(0).optional(),
  delay_hours: z.number().int().min(0).max(23).optional(),
  template_type: TemplateType.optional(),
  subject_template: z.string().optional(),
  custom_instructions: z.string().optional(),
  conditions: z.record(z.string(), z.any()).optional(),
})

export type UpdateStepInput = z.infer<typeof UpdateStepSchema>

// Enroll contact schema
export const EnrollContactSchema = z.object({
  sequence_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  trigger_event_id: z.string().uuid().optional(),
  trigger_event_type: z.string().optional(),
})

export type EnrollContactInput = z.infer<typeof EnrollContactSchema>

// Sequence type (from database)
export type Sequence = {
  id: string
  organization_id: string
  name: string
  description: string | null
  trigger_type: TriggerType
  trigger_config: Record<string, any>
  is_active: boolean
  is_template: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Sequence step type (from database)
export type SequenceStep = {
  id: string
  sequence_id: string
  step_order: number
  name: string
  delay_days: number
  delay_hours: number
  template_type: TemplateType
  subject_template: string | null
  custom_instructions: string | null
  conditions: Record<string, any>
  created_at: string
  updated_at: string
}

// Sequence enrollment type (from database)
export type SequenceEnrollment = {
  id: string
  organization_id: string
  sequence_id: string
  contact_id: string
  current_step: number
  status: EnrollmentStatus
  trigger_event_id: string | null
  trigger_event_type: string | null
  next_step_at: string | null
  enrolled_at: string
  completed_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  created_at: string
  updated_at: string
}

// Sequence step execution type (from database)
export type StepExecution = {
  id: string
  enrollment_id: string
  step_id: string
  draft_id: string | null
  status: ExecutionStatus
  skip_reason: string | null
  error_message: string | null
  scheduled_at: string
  executed_at: string | null
  created_at: string
}

// Sequence with steps (joined)
export type SequenceWithSteps = Sequence & {
  steps: SequenceStep[]
}

// Enrollment with contact info
export type EnrollmentWithContact = SequenceEnrollment & {
  contact: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

// Sequence stats
export type SequenceStats = {
  sequence_id: string
  total_enrolled: number
  active_enrolled: number
  completed: number
  total_sent: number
  avg_open_rate: number
}

// Save sequence with steps schema (for sequence builder UI)
export const SaveSequenceStepSchema = z.object({
  id: z.string().optional(), // Undefined for new steps, existing ID for updates
  name: z.string().min(1, 'Step name is required').max(200),
  delay_days: z.number().int().min(0).default(0),
  delay_hours: z.number().int().min(0).max(23).default(0),
  template_type: TemplateType,
  subject_template: z.string().optional(),
  custom_instructions: z.string().optional(),
  conditions: z.record(z.string(), z.any()).optional(),
})

export type SaveSequenceStepInput = z.infer<typeof SaveSequenceStepSchema>

export const SaveSequenceSchema = z.object({
  id: z.string().uuid().optional(), // Undefined for new sequences, existing ID for updates
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  trigger_type: TriggerType,
  trigger_config: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().default(false),
  steps: z.array(SaveSequenceStepSchema).min(1, 'At least one step is required'),
})

export type SaveSequenceInput = z.infer<typeof SaveSequenceSchema>
