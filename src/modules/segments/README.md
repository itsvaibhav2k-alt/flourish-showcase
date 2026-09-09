# Saved Segments Module

The Saved Segments module allows users to save filter combinations as reusable segments for quick access to commonly-used views of contacts, donors, and volunteers.

## Features

- **Save Filter Combinations**: Convert active filters into named segments
- **Quick Access**: Load saved segments from a dropdown menu
- **Entity-Specific**: Segments are scoped to entity types (CONTACT, DONOR, VOLUNTEER)
- **Organization-Scoped**: All segments are scoped to the current organization
- **Delete Segments**: Remove segments that are no longer needed

## Database Schema

The `saved_segments` table stores segment definitions:

```sql
CREATE TABLE saved_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('CONTACT', 'DONOR', 'VOLUNTEER')),
  filters JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

## Module Structure

```
src/modules/segments/
├── schemas/
│   └── segment.schema.ts       # Zod schemas and TypeScript types
├── queries/
│   └── get-segments.ts         # Server-side data fetching
├── actions/
│   ├── save-segment.ts         # Create/update segments
│   └── delete-segment.ts       # Delete segments
├── components/
│   ├── segment-dropdown.tsx    # Main dropdown UI component
│   ├── save-segment-dialog.tsx # Dialog for naming new segments
│   └── contacts-segment-bar.tsx # Integration for contacts page
└── index.ts                    # Public exports
```

## Usage

### In Server Components

```typescript
import { getSegments } from '@/modules/segments'

// Get all segments for an entity type
const segments = await getSegments({ entityType: 'CONTACT' })
```

### In Client Components

```typescript
import { SegmentDropdown } from '@/modules/segments'

function MyComponent() {
  const handleSegmentSelect = (segment: Segment) => {
    // Apply segment filters to your view
    console.log(segment.filters)
  }

  return (
    <SegmentDropdown
      entityType="CONTACT"
      segments={segments}
      currentFilters={activeFilters}
      onSegmentSelect={handleSegmentSelect}
    />
  )
}
```

### Creating a Segment

```typescript
import { createSegment } from '@/modules/segments'

const result = await createSegment({
  name: 'High-value donors',
  entityType: 'DONOR',
  filters: [
    { field: 'lifetime_giving', operator: 'gte', value: 1000 },
    { field: 'lapse_risk', operator: 'not_equals', value: 'HIGH' },
  ],
})
```

## Filter Schema

Each segment contains an array of filters with the following structure:

```typescript
type SegmentFilter = {
  field: string           // The field to filter on (e.g., 'lifetime_giving')
  operator: FilterOperator // 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_null' | 'is_not_null'
  value?: any             // The value to compare (optional for is_null/is_not_null)
}
```

## Supported Filter Fields

### Contacts
- `first_name` (string)
- `last_name` (string)
- `email` (string)
- `is_donor` (boolean)
- `is_volunteer` (boolean)
- `tags` (string array)
- `lapse_risk` (enum: 'LOW' | 'MEDIUM' | 'HIGH')
- `lifetime_giving` (number)

### Donors (extends Contacts)
- All contact fields
- `total_gifts` (number)
- `last_gift_date` (date)

### Volunteers (extends Contacts)
- All contact fields
- `total_volunteer_hours` (number)
- `reliability_score` (number)

## Integration Example

### Contacts Page Integration

```typescript
import { getSegments } from '@/modules/segments/queries/get-segments'
import { ContactsSegmentBar } from '@/modules/segments/components/contacts-segment-bar'

export default async function ContactsPage() {
  // Fetch saved segments
  const savedSegments = await getSegments({ entityType: 'CONTACT' })

  return (
    <div>
      {/* Add segment dropdown to your toolbar */}
      <ContactsSegmentBar segments={savedSegments} />

      {/* Your contacts table */}
    </div>
  )
}
```

## Future Enhancements

1. **Advanced Filter UI**: Build a visual filter builder instead of relying on URL params
2. **Segment Analytics**: Track usage metrics for segments
3. **Shared Segments**: Allow segments to be shared across team members
4. **Smart Segments**: AI-suggested segments based on common patterns
5. **Filter Templates**: Pre-built segment templates for common use cases
6. **Export Segments**: Export filtered data based on segments

## API Reference

### Queries

#### `getSegments(params?)`
Fetch all saved segments for the current organization.

**Parameters:**
- `params.entityType?`: Filter segments by entity type

**Returns:** `Promise<Segment[]>`

#### `getSegmentById(id)`
Fetch a single segment by ID.

**Parameters:**
- `id`: Segment UUID

**Returns:** `Promise<Segment | null>`

### Actions

#### `createSegment(input)`
Create a new segment.

**Parameters:**
- `input.name`: Segment name (1-100 characters)
- `input.entityType`: 'CONTACT' | 'DONOR' | 'VOLUNTEER'
- `input.filters`: Array of SegmentFilter objects

**Returns:** `Promise<ActionResult>`

#### `updateSegment(id, input)`
Update an existing segment.

**Parameters:**
- `id`: Segment UUID
- `input.name?`: New segment name
- `input.filters?`: New filters array

**Returns:** `Promise<ActionResult>`

#### `deleteSegment(id)`
Delete a segment by ID.

**Parameters:**
- `id`: Segment UUID

**Returns:** `Promise<ActionResult>`

## Security

- All segments are scoped to the current organization via RLS policies
- Users can only access segments for organizations they belong to
- Segment names must be unique within an entity type per organization
