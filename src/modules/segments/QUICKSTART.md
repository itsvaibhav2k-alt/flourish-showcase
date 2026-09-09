# Saved Segments - Quick Start Guide

## For Users

### Creating Your First Segment

1. Navigate to the Contacts page (`/contacts`)
2. Apply filters to narrow down your view (e.g., show only donors)
3. Click the "Segments" button in the top-right
4. Select "Save Current Filters"
5. Enter a name like "Active Donors"
6. Click "Save Segment"

Your segment is now saved and will appear in the dropdown!

### Using a Saved Segment

1. Click the "Segments" button
2. Select your saved segment from the list
3. The page will reload with those filters applied

### Deleting a Segment

1. Click the "Segments" button
2. Hover over the segment you want to delete
3. Click the trash icon that appears
4. Confirm the deletion

## For Developers

### Adding Segments to a New Page

Want to add segments to the Donors or Volunteers pages? Here's how:

#### 1. Create an Integration Component

```typescript
// src/modules/segments/components/donors-segment-bar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SegmentDropdown } from './segment-dropdown'
import type { Segment, SegmentFilter } from '../schemas/segment.schema'

export function DonorsSegmentBar({ segments }: { segments: Segment[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSegmentSelect = (segment: Segment) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('segment', segment.id)
    router.push(`/donors?${params.toString()}`)
  }

  // Extract current filters from URL or state
  const currentFilters: SegmentFilter[] = []

  return (
    <SegmentDropdown
      entityType="DONOR"
      segments={segments}
      currentFilters={currentFilters}
      onSegmentSelect={handleSegmentSelect}
    />
  )
}
```

#### 2. Update the Page

```typescript
// src/app/(dashboard)/donors/page.tsx
import { getSegments } from '@/modules/segments'
import { DonorsSegmentBar } from '@/modules/segments/components/donors-segment-bar'

export default async function DonorsPage({ searchParams }) {
  // Fetch saved segments
  const savedSegments = await getSegments({ entityType: 'DONOR' })

  // ... rest of your page logic

  return (
    <div>
      {/* Add to your toolbar/filter area */}
      <DonorsSegmentBar segments={savedSegments} />

      {/* Your content */}
    </div>
  )
}
```

#### 3. Apply Segment Filters (Optional)

If you want to automatically apply segment filters:

```typescript
import { getSegmentById } from '@/modules/segments'

export default async function DonorsPage({ searchParams }) {
  const segmentId = searchParams?.segment
  let appliedFilters = {}

  // Load segment filters
  if (segmentId) {
    const segment = await getSegmentById(segmentId)
    if (segment) {
      appliedFilters = parseSegmentFilters(segment.filters)
    }
  }

  // Use filters in your data query
  const donors = await getDonors({ filters: appliedFilters })
}

function parseSegmentFilters(filters: SegmentFilter[]) {
  // Convert to your query format
  return filters.reduce((acc, filter) => {
    // Handle different operators
    switch (filter.operator) {
      case 'equals':
        acc[filter.field] = filter.value
        break
      case 'gte':
        acc[filter.field + '_gte'] = filter.value
        break
      // Add other operators as needed
    }
    return acc
  }, {})
}
```

#### 4. Export Your Component

```typescript
// src/modules/segments/index.ts
export { DonorsSegmentBar } from './components/donors-segment-bar'
```

### Working with Filters Programmatically

#### Creating a Segment Programmatically

```typescript
import { createSegment } from '@/modules/segments'

const result = await createSegment({
  name: 'Lapsed High-Value Donors',
  entityType: 'DONOR',
  filters: [
    {
      field: 'lifetime_giving',
      operator: 'gte',
      value: 5000,
    },
    {
      field: 'lapse_risk',
      operator: 'equals',
      value: 'HIGH',
    },
    {
      field: 'last_gift_date',
      operator: 'lt',
      value: '2024-01-01',
    },
  ],
})

if (result.success) {
  console.log('Segment created:', result.data.id)
} else {
  console.error('Error:', result.error)
}
```

#### Fetching Segments

```typescript
import { getSegments, getSegmentById } from '@/modules/segments'

// Get all contact segments
const contactSegments = await getSegments({ entityType: 'CONTACT' })

// Get all segments (any entity type)
const allSegments = await getSegments()

// Get specific segment
const segment = await getSegmentById('segment-uuid')
```

#### Deleting a Segment

```typescript
import { deleteSegment } from '@/modules/segments'

const result = await deleteSegment('segment-uuid')

if (result.success) {
  console.log('Segment deleted')
} else {
  console.error('Error:', result.error)
}
```

### Available Filter Fields

#### Contacts & Base Fields
```typescript
{
  field: 'first_name' | 'last_name' | 'email',
  operator: 'equals' | 'not_equals' | 'contains',
  value: string
}

{
  field: 'is_donor' | 'is_volunteer',
  operator: 'equals',
  value: boolean
}

{
  field: 'tags',
  operator: 'contains',
  value: string
}
```

#### Donor-Specific Fields
```typescript
{
  field: 'lifetime_giving' | 'total_gifts',
  operator: 'equals' | 'gt' | 'lt' | 'gte' | 'lte',
  value: number
}

{
  field: 'last_gift_date',
  operator: 'equals' | 'gt' | 'lt' | 'gte' | 'lte',
  value: string // ISO date
}

{
  field: 'lapse_risk',
  operator: 'equals' | 'not_equals',
  value: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

#### Volunteer-Specific Fields
```typescript
{
  field: 'total_volunteer_hours' | 'reliability_score',
  operator: 'equals' | 'gt' | 'lt' | 'gte' | 'lte',
  value: number
}
```

### Validation

All inputs are validated with Zod. Invalid data will throw validation errors:

```typescript
import { createSegmentSchema } from '@/modules/segments'

try {
  createSegmentSchema.parse({
    name: '', // Too short!
    entityType: 'INVALID', // Invalid type!
    filters: [],
  })
} catch (error) {
  console.error(error.errors)
}
```

### TypeScript Types

```typescript
import type {
  Segment,
  SegmentFilter,
  CreateSegmentInput,
  UpdateSegmentInput,
  EntityType,
  FilterOperator,
} from '@/modules/segments'

const segment: Segment = {
  id: '...',
  organization_id: '...',
  name: 'My Segment',
  entity_type: 'CONTACT',
  filters: [],
  created_by: '...',
  created_at: '...',
  updated_at: null,
}
```

### Testing Your Implementation

#### 1. Unit Tests (Example with Jest)

```typescript
import { createSegmentSchema } from '@/modules/segments'

describe('Segment Schema', () => {
  it('validates correct input', () => {
    const result = createSegmentSchema.safeParse({
      name: 'Test Segment',
      entityType: 'CONTACT',
      filters: [{ field: 'email', operator: 'contains', value: '@gmail.com' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid entity type', () => {
    const result = createSegmentSchema.safeParse({
      name: 'Test',
      entityType: 'INVALID',
      filters: [],
    })
    expect(result.success).toBe(false)
  })
})
```

#### 2. Integration Tests (Example with Playwright)

```typescript
test('can save and load a segment', async ({ page }) => {
  // Navigate to contacts
  await page.goto('/contacts')

  // Open segments dropdown
  await page.click('button:has-text("Segments")')

  // Click save current filters
  await page.click('text=Save Current Filters')

  // Enter segment name
  await page.fill('input#segment-name', 'Test Segment')

  // Submit
  await page.click('button:has-text("Save Segment")')

  // Verify segment appears in list
  await page.click('button:has-text("Segments")')
  await expect(page.locator('text=Test Segment')).toBeVisible()
})
```

## Common Issues

### Issue: Segments not appearing
**Solution**: Ensure you're fetching segments with the correct entity type:
```typescript
await getSegments({ entityType: 'CONTACT' })
```

### Issue: "No organization selected" error
**Solution**: The user must be authenticated and have an organization selected. Check middleware and auth flow.

### Issue: TypeScript errors on import
**Solution**: Import types separately from values:
```typescript
import { getSegments } from '@/modules/segments' // function
import type { Segment } from '@/modules/segments' // type
```

## Need Help?

- Check the [README](./README.md) for detailed documentation
- Review the [ARCHITECTURE](./ARCHITECTURE.md) for system design
- Look at existing implementations in `src/modules/segments/components/`
