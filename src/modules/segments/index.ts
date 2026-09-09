// Schemas
export {
  filterOperatorSchema,
  segmentFilterSchema,
  entityTypeSchema,
  createSegmentSchema,
  updateSegmentSchema,
  segmentSchema,
  type FilterOperator,
  type SegmentFilter,
  type EntityType,
  type CreateSegmentInput,
  type UpdateSegmentInput,
  type Segment,
} from './schemas/segment.schema'

// Queries
export { getSegments, getSegmentById, type GetSegmentsParams } from './queries/get-segments'

// Actions
export { createSegment, updateSegment } from './actions/save-segment'
export { deleteSegment } from './actions/delete-segment'

// Components
export { SegmentDropdown } from './components/segment-dropdown'
export { SaveSegmentDialog } from './components/save-segment-dialog'
export { ContactsSegmentBar } from './components/contacts-segment-bar'
