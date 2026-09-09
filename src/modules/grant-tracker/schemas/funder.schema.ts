import { z } from 'zod'

export const FunderType = z.enum([
  'foundation',
  'corporate',
  'government',
  'individual',
  'other',
])
export type FunderType = z.infer<typeof FunderType>

export const RelationshipStatus = z.enum([
  'prospect',
  'applied',
  'active',
  'past',
  'declined',
])
export type RelationshipStatus = z.infer<typeof RelationshipStatus>

export const funderSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  type: FunderType.nullable(),
  website: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  notes: z.string().nullable(),
  focusAreas: z.array(z.string()).nullable(),
  geographicFocus: z.array(z.string()).nullable(),
  averageGrantSize: z.number().nullable(),
  totalAwarded: z.number().nullable(),
  relationshipStatus: RelationshipStatus,
  lastContactDate: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Funder = z.infer<typeof funderSchema>

export const createFunderSchema = z.object({
  name: z.string().min(1, 'Funder name is required').max(200),
  type: FunderType.optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
  focusAreas: z.array(z.string()).optional(),
  geographicFocus: z.array(z.string()).optional(),
  averageGrantSize: z.number().positive().optional(),
  relationshipStatus: RelationshipStatus.optional(),
  lastContactDate: z.string().optional(),
})
export type CreateFunderInput = z.infer<typeof createFunderSchema>

export const updateFunderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  type: FunderType.nullable().optional(),
  website: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  contactName: z.string().max(100).nullable().optional(),
  contactEmail: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  contactPhone: z.string().max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  focusAreas: z.array(z.string()).nullable().optional(),
  geographicFocus: z.array(z.string()).nullable().optional(),
  averageGrantSize: z.number().positive().nullable().optional(),
  relationshipStatus: RelationshipStatus.optional(),
  lastContactDate: z.string().nullable().optional(),
})
export type UpdateFunderInput = z.infer<typeof updateFunderSchema>

export const FUNDER_TYPE_METADATA: Record<
  FunderType,
  { label: string; description: string }
> = {
  foundation: {
    label: 'Foundation',
    description: 'Private or community foundation',
  },
  corporate: {
    label: 'Corporate',
    description: 'Corporate giving program',
  },
  government: {
    label: 'Government',
    description: 'Government grant program',
  },
  individual: {
    label: 'Individual',
    description: 'Individual philanthropist',
  },
  other: {
    label: 'Other',
    description: 'Other funder type',
  },
}

export const RELATIONSHIP_STATUS_METADATA: Record<
  RelationshipStatus,
  { label: string; color: string; description: string }
> = {
  prospect: {
    label: 'Prospect',
    color: 'neutral',
    description: 'Potential funder to research',
  },
  applied: {
    label: 'Applied',
    color: 'blue',
    description: 'Application submitted',
  },
  active: {
    label: 'Active',
    color: 'emerald',
    description: 'Active funding relationship',
  },
  past: {
    label: 'Past Funder',
    color: 'purple',
    description: 'Previously funded, no active grants',
  },
  declined: {
    label: 'Declined',
    color: 'rose',
    description: 'Previously declined our application',
  },
}
