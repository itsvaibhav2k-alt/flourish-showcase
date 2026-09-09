import { z } from 'zod'

/**
 * Zod schema for gift validation
 */
export const giftSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  amount: z.number().positive(),
  gift_date: z.string(),
  gift_type: z.enum(['one-time', 'recurring', 'pledge', 'in-kind']),
  campaign: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  thanked_at: z.string().nullable(),
  created_at: z.string(),
  // Tribute fields
  tribute_type: z.enum(['honor', 'memory']).optional().nullable(),
  tribute_name: z.string().optional().nullable(),
  tribute_notify_email: z.string().email().optional().nullable(),
  tribute_notify_name: z.string().optional().nullable(),
  tribute_message: z.string().optional().nullable(),
  tribute_notification_sent_at: z.string().optional().nullable(),
})

/**
 * Schema for creating a new gift (omits auto-generated fields)
 */
export const createGiftSchema = giftSchema.omit({
  id: true,
  organization_id: true,
  thanked_at: true,
  created_at: true,
})

/**
 * Schema for updating an existing gift
 */
export const updateGiftSchema = createGiftSchema.partial()

/**
 * TypeScript types derived from schemas
 */
export type Gift = z.infer<typeof giftSchema>
export type CreateGiftInput = z.infer<typeof createGiftSchema>
export type UpdateGiftInput = z.infer<typeof updateGiftSchema>
