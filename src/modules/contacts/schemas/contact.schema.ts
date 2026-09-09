import { z } from 'zod'

// Address schema
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
})

// Full contact schema
export const contactSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  address: addressSchema.optional().nullable(),
  tags: z.array(z.string()).nullable().default([]),
  is_donor: z.boolean().nullable().default(false),
  is_volunteer: z.boolean().nullable().default(false),
  lifetime_giving: z.number().nullable().optional(),
  total_gifts: z.number().nullable().optional(),
  last_gift_date: z.string().nullable().optional(),
  total_volunteer_hours: z.number().nullable().optional(),
  portal_token: z.string().nullable().optional(),
  archived_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Schema for creating a new contact
export const createContactSchema = contactSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
})

// Schema for updating a contact
export const updateContactSchema = createContactSchema.partial()

// Type exports
export type Contact = z.infer<typeof contactSchema>
export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type Address = z.infer<typeof addressSchema>
