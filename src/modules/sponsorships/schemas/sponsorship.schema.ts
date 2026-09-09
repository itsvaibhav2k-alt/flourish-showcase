import { z } from 'zod';

// Sponsorship statuses
export const sponsorshipStatuses = [
  'prospect',
  'pitched',
  'confirmed',
  'active',
  'lapsed',
  'declined',
] as const;

export type SponsorshipStatus = typeof sponsorshipStatuses[number];

// Zod enum
export const sponsorshipStatusEnum = z.enum(sponsorshipStatuses);

// Tier schema
export const sponsorshipTierSchema = z.object({
  name: z.string().min(1, 'Tier name is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  sort_order: z.number().int().default(0),
  default_benefits: z.array(z.string()).default([]),
  color: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type SponsorshipTierInput = z.infer<typeof sponsorshipTierSchema>;

// Sponsorship schema
export const sponsorshipSchema = z.object({
  contact_id: z.string().uuid(),
  tier_id: z.string().uuid().optional().nullable(),
  status: sponsorshipStatusEnum.default('prospect'),
  amount: z.number().min(0).optional().nullable(),
  season: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  renewal_date: z.string().optional().nullable(),
  payment_received: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  next_follow_up: z.string().optional().nullable(),
});

export type SponsorshipInput = z.infer<typeof sponsorshipSchema>;

// Benefit schema
export const sponsorshipBenefitSchema = z.object({
  sponsorship_id: z.string().uuid(),
  benefit_name: z.string().min(1, 'Benefit name is required'),
  description: z.string().optional().nullable(),
  delivered: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export type SponsorshipBenefitInput = z.infer<typeof sponsorshipBenefitSchema>;

// Update sponsorship status schema (for drag-drop)
export const updateSponsorshipStatusSchema = z.object({
  sponsorship_id: z.string().uuid(),
  new_status: sponsorshipStatusEnum,
  notes: z.string().optional(),
});

export type UpdateSponsorshipStatusInput = z.infer<typeof updateSponsorshipStatusSchema>;
