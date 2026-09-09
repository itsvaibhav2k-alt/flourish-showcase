import { z } from 'zod'

/**
 * Donation Form Schema
 * Defines the structure for creating donation forms
 */
export const donationFormSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(1, 'Form name is required'),
  slug: z.string().min(1, 'Slug is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  preset_amounts: z.array(z.number().positive()).default([25, 50, 100, 250, 500]),
  allow_custom_amount: z.boolean().default(true),
  min_amount: z.number().positive().default(1),
  max_amount: z.number().positive().optional().nullable(),
  allow_recurring: z.boolean().default(true),
  default_frequency: z.enum(['one-time', 'monthly', 'quarterly', 'annually']).default('one-time'),
  campaign: z.string().optional().nullable(),
  collect_donor_info: z.boolean().default(true),
  require_email: z.boolean().default(true),
  require_phone: z.boolean().default(false),
  require_address: z.boolean().default(false),
  custom_fields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'checkbox']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).default([]),
  thank_you_message: z.string().optional().nullable(),
  redirect_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for creating a donation form
 */
export const createDonationFormSchema = donationFormSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
})

/**
 * Schema for updating a donation form
 */
export const updateDonationFormSchema = createDonationFormSchema.partial()

/**
 * Donation Record Schema
 * Represents a completed donation
 */
export const donationSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  donation_form_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  frequency: z.enum(['one-time', 'monthly', 'quarterly', 'annually']),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']),
  payment_provider: z.enum(['stripe', 'manual']).default('stripe'),
  payment_intent_id: z.string().optional().nullable(),
  stripe_customer_id: z.string().optional().nullable(),
  stripe_subscription_id: z.string().optional().nullable(),
  donor_email: z.string().email().optional().nullable(),
  donor_first_name: z.string().optional().nullable(),
  donor_last_name: z.string().optional().nullable(),
  donor_phone: z.string().optional().nullable(),
  donor_address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional().nullable(),
  campaign: z.string().optional().nullable(),
  custom_fields: z.record(z.string(), z.any()).optional().nullable(),
  thank_you_sent_at: z.string().optional().nullable(),
  refunded_at: z.string().optional().nullable(),
  refund_reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for processing a donation (creating payment intent)
 */
export const processDonationSchema = z.object({
  donation_form_slug: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  frequency: z.enum(['one-time', 'monthly', 'quarterly', 'annually']),
  donor_email: z.string().email('Valid email is required'),
  donor_first_name: z.string().min(1, 'First name is required'),
  donor_last_name: z.string().min(1, 'Last name is required'),
  donor_phone: z.string().optional().nullable(),
  donor_address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional().nullable(),
  campaign: z.string().optional().nullable(),
  custom_fields: z.record(z.string(), z.any()).optional().nullable(),
})

/**
 * Schema for recording a completed donation
 */
export const recordDonationSchema = donationSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
})

/**
 * Type exports
 */
export type DonationForm = z.infer<typeof donationFormSchema>
export type CreateDonationFormInput = z.infer<typeof createDonationFormSchema>
export type UpdateDonationFormInput = z.infer<typeof updateDonationFormSchema>
export type Donation = z.infer<typeof donationSchema>
export type ProcessDonationInput = z.infer<typeof processDonationSchema>
export type RecordDonationInput = z.infer<typeof recordDonationSchema>
