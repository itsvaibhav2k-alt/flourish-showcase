import { z } from 'zod'

export const filterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'gt',
  'lt',
  'gte',
  'lte',
  'is_null',
  'is_not_null',
])

export const segmentFilterSchema = z.object({
  field: z.string(),
  operator: filterOperatorSchema,
  value: z.any().optional(),
})

export const entityTypeSchema = z.enum(['CONTACT', 'DONOR', 'VOLUNTEER'])

export const createSegmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  entityType: entityTypeSchema,
  filters: z.array(segmentFilterSchema),
})

export const updateSegmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  filters: z.array(segmentFilterSchema).optional(),
})

export const segmentSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string(),
  entity_type: entityTypeSchema,
  filters: z.array(segmentFilterSchema),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export type FilterOperator = z.infer<typeof filterOperatorSchema>
export type SegmentFilter = z.infer<typeof segmentFilterSchema>
export type EntityType = z.infer<typeof entityTypeSchema>
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>
export type Segment = z.infer<typeof segmentSchema>
