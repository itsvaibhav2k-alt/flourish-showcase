import { z } from 'zod'

export const recurrenceRuleSchema = z.object({
  freq: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endDate: z.string().optional(),
  occurrences: z.number().positive().optional(),
});

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;

export const shiftSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  capacity: z.number().int().positive('Capacity must be at least 1'),
  status: z.enum(['open', 'full', 'completed', 'cancelled']),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid(),
})

export const createShiftSchema = shiftSchema.omit({
  id: true,
  organization_id: true,
  status: true,
  created_at: true,
  updated_at: true,
  created_by: true,
}).extend({
  recurrence_rule: recurrenceRuleSchema.optional(),
})

export const updateShiftSchema = createShiftSchema.partial()

export const signupSchema = z.object({
  id: z.string().uuid(),
  shift_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  status: z.enum(['confirmed', 'waitlisted', 'cancelled', 'pending', 'completed']),
  checked_in_at: z.string().nullable(),
  hours_logged: z.number().nullable(),
  no_show: z.boolean().nullable(),
  confirmation_sent: z.boolean(),
  reminder_1_sent: z.boolean(),
  reminder_2_sent: z.boolean(),
  thank_you_sent: z.boolean(),
  created_at: z.string(),
})

export const createSignupSchema = signupSchema.omit({
  id: true,
  status: true,
  checked_in_at: true,
  hours_logged: true,
  no_show: true,
  confirmation_sent: true,
  reminder_1_sent: true,
  reminder_2_sent: true,
  thank_you_sent: true,
  created_at: true,
})

export const checkInSchema = z.object({
  signup_id: z.string().uuid(),
  checked_in_at: z.string().optional(),
  hours_logged: z.number().optional(),
  no_show: z.boolean().optional(),
})

export type Shift = z.infer<typeof shiftSchema>
export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>
export type Signup = z.infer<typeof signupSchema>
export type CreateSignupInput = z.infer<typeof createSignupSchema>
export type CheckInInput = z.infer<typeof checkInSchema>
