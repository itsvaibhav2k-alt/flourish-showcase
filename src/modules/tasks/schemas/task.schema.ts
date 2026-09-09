import { z } from 'zod'

/**
 * Note type enum for categorizing notes
 */
export const noteTypeEnum = z.enum([
  'meeting',
  'phone_call',
  'email',
  'personal_info',
  'follow_up',
  'donation',
  'volunteer',
  'general',
])

/**
 * Note importance enum for prioritization
 */
export const noteImportanceEnum = z.enum(['low', 'normal', 'high', 'urgent'])

/**
 * Schema for creating a new note
 */
export const createNoteSchema = z.object({
  contactId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  noteType: noteTypeEnum.default('general'),
  importance: noteImportanceEnum.default('normal'),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).default([]),
  linkedGiftId: z.string().uuid().optional().nullable(),
  linkedShiftId: z.string().uuid().optional().nullable(),
  interactionDate: z.string().optional().nullable(),
})

/**
 * Schema for updating an existing note
 */
export const updateNoteSchema = z.object({
  noteId: z.string().uuid(),
  content: z.string().min(1).max(10000).optional(),
  noteType: noteTypeEnum.optional(),
  importance: noteImportanceEnum.optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  linkedGiftId: z.string().uuid().optional().nullable(),
  linkedShiftId: z.string().uuid().optional().nullable(),
  interactionDate: z.string().optional().nullable(),
})

/**
 * Schema for toggling pin status
 */
export const togglePinNoteSchema = z.object({
  noteId: z.string().uuid(),
})

/**
 * Schema for deleting a note
 */
export const deleteNoteSchema = z.object({
  noteId: z.string().uuid(),
})

/**
 * Schema for creating a new task
 */
export const createTaskSchema = z.object({
  contactId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().optional(), // ISO date string
})

/**
 * Schema for completing a task
 */
export const completeTaskSchema = z.object({
  taskId: z.string().uuid(),
})

/**
 * TypeScript types derived from schemas
 */
export type NoteType = z.infer<typeof noteTypeEnum>
export type NoteImportance = z.infer<typeof noteImportanceEnum>
export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type TogglePinNoteInput = z.infer<typeof togglePinNoteSchema>
export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>

/**
 * Database types
 */
export type ContactNote = {
  id: string
  organization_id: string
  contact_id: string
  content: string
  note_type: NoteType
  is_pinned: boolean
  importance: NoteImportance
  tags: string[]
  linked_gift_id: string | null
  linked_shift_id: string | null
  interaction_date: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export type ContactTask = {
  id: string
  organization_id: string
  contact_id: string
  title: string
  description: string | null
  due_date: string | null
  status: 'OPEN' | 'COMPLETED'
  assigned_to: string | null
  created_by: string | null
  created_at: string | null
  completed_at: string | null
}

/**
 * Note type display configuration
 */
export const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: string; color: string }> = {
  meeting: { label: 'Meeting', icon: 'Calendar', color: 'blue' },
  phone_call: { label: 'Phone Call', icon: 'Phone', color: 'green' },
  email: { label: 'Email', icon: 'Mail', color: 'violet' },
  personal_info: { label: 'Personal Info', icon: 'User', color: 'amber' },
  follow_up: { label: 'Follow-up', icon: 'Clock', color: 'rose' },
  donation: { label: 'Donation', icon: 'Heart', color: 'pink' },
  volunteer: { label: 'Volunteer', icon: 'Users', color: 'teal' },
  general: { label: 'General', icon: 'StickyNote', color: 'neutral' },
}

/**
 * Note importance display configuration
 */
export const NOTE_IMPORTANCE_CONFIG: Record<NoteImportance, { label: string; color: string }> = {
  low: { label: 'Low', color: 'neutral' },
  normal: { label: 'Normal', color: 'blue' },
  high: { label: 'High', color: 'amber' },
  urgent: { label: 'Urgent', color: 'rose' },
}
