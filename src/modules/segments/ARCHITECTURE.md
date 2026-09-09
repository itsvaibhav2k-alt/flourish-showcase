# Saved Segments Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Contacts Page (Server)                    │
│  - Fetches saved segments via getSegments()                 │
│  - Passes segments to ContactsSegmentBar                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ContactsSegmentBar (Client)                     │
│  - Manages URL params for segment selection                 │
│  - Handles segment selection callback                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                SegmentDropdown (Client)                      │
│  - Displays segment list in dropdown                        │
│  - "Save Current Filters" button                            │
│  - Delete segment buttons (on hover)                        │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│ SaveSegmentDialog       │    │  Delete Confirmation        │
│ (Client)                │    │  (built-in confirm)         │
│                         │    │                             │
│ - Name input            │    │ - Calls deleteSegment()     │
│ - Filter preview        │    │ - Refreshes page            │
│ - Calls createSegment() │    └─────────────────────────────┘
│ - Refreshes page        │
└─────────────────────────┘
```

## Data Flow

### Creating a Segment

```
User Action               Client Component         Server Action           Database
───────────              ─────────────────        ──────────────          ────────

1. Apply filters    →    ContactsPage
   to view

2. Click "Save      →    SegmentDropdown
   Current Filters"

3. Opens dialog     →    SaveSegmentDialog

4. Enter name       →    SaveSegmentDialog
   and submit

5. Validation       →    SaveSegmentDialog
                         (Zod client-side)

6. Call action      →                         →   createSegment()
                                                   - Validate input
                                                   - Get org ID
                                                   - Get user ID
                                                   - Check duplicates

7. Insert record    →                         →                      →   INSERT into
                                                                         saved_segments

8. Revalidate       →                         →   revalidatePath()
   paths

9. Success          →    SaveSegmentDialog
   response              - Close dialog
                         - router.refresh()

10. Updated UI      →    SegmentDropdown
                         shows new segment
```

### Loading a Segment

```
User Action               Client Component         Server Query            URL/State
───────────              ─────────────────        ────────────            ─────────

1. Click segment    →    SegmentDropdown
   in dropdown           - onSegmentSelect()

2. Update URL       →    ContactsSegmentBar  →                       →   ?segment=<id>
                         - router.push()

3. Page reload      →    ContactsPage        →    getSegmentById(id)

4. Apply filters    →    ContactsPage
   from segment          - Parse segment.filters
                         - Apply to query
```

### Deleting a Segment

```
User Action               Client Component         Server Action           Database
───────────              ─────────────────        ──────────────          ────────

1. Hover over       →    SegmentDropdown
   segment               - Show delete icon

2. Click delete     →    SegmentDropdown
                         - Show confirm()

3. Confirm          →    SegmentDropdown

4. Call action      →                         →   deleteSegment(id)
                                                   - Get org ID
                                                   - Validate access

5. Delete record    →                         →                      →   DELETE from
                                                                         saved_segments
                                                                         WHERE id = ?

6. Revalidate       →                         →   revalidatePath()
   paths

7. Success          →    SegmentDropdown
   response              - router.refresh()

8. Updated UI       →    SegmentDropdown
                         segment removed
```

## File Dependencies

```
segment.schema.ts
    ↓
    ├─→ get-segments.ts (queries)
    ├─→ save-segment.ts (actions)
    ├─→ delete-segment.ts (actions)
    └─→ segment-dropdown.tsx
         ├─→ save-segment-dialog.tsx
         └─→ contacts-segment-bar.tsx
              └─→ contacts/page.tsx
```

## Database Interactions

### RLS Policies Required

```sql
-- Allow users to read segments from their organizations
CREATE POLICY "Users can view org segments"
  ON saved_segments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to create segments in their organizations
CREATE POLICY "Users can create org segments"
  ON saved_segments
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update segments in their organizations
CREATE POLICY "Users can update org segments"
  ON saved_segments
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete segments in their organizations
CREATE POLICY "Users can delete org segments"
  ON saved_segments
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Indexes for Performance

```sql
-- Lookup segments by organization and entity type
CREATE INDEX idx_saved_segments_org_entity
  ON saved_segments(organization_id, entity_type);

-- Lookup segments by ID and organization (for security checks)
CREATE INDEX idx_saved_segments_id_org
  ON saved_segments(id, organization_id);

-- Order segments by creation date
CREATE INDEX idx_saved_segments_created
  ON saved_segments(created_at DESC);
```

## Filter Application

When a segment is loaded, the filters need to be applied to the data query. This is currently left to the implementation of each page, but here's the recommended pattern:

```typescript
// In contacts/page.tsx (or similar)
import { getSegmentById } from '@/modules/segments'

export default async function ContactsPage({ searchParams }) {
  const segmentId = searchParams?.segment

  let filters = {}

  // Load segment if provided
  if (segmentId) {
    const segment = await getSegmentById(segmentId)
    if (segment) {
      // Convert segment filters to Supabase query filters
      filters = convertSegmentFiltersToQueryFilters(segment.filters)
    }
  }

  // Apply filters to contacts query
  const contacts = await getContacts({ filters })

  // ...
}

function convertSegmentFiltersToQueryFilters(segmentFilters) {
  // Implementation depends on your query structure
  // Example:
  return segmentFilters.reduce((acc, filter) => {
    switch (filter.operator) {
      case 'equals':
        acc[filter.field] = filter.value
        break
      case 'gte':
        acc[`${filter.field}_gte`] = filter.value
        break
      // ... handle other operators
    }
    return acc
  }, {})
}
```

## State Management

The feature uses minimal client-side state:

1. **SegmentDropdown**:
   - `showSaveDialog` (boolean) - Controls dialog visibility
   - `isDeleting` (string | null) - Tracks which segment is being deleted

2. **SaveSegmentDialog**:
   - `name` (string) - Segment name input
   - `isLoading` (boolean) - Save operation status
   - `error` (string | null) - Validation/server errors

3. **ContactsSegmentBar**:
   - No local state, uses URL params via Next.js router

## Error Handling

All actions return a consistent result shape:

```typescript
type ActionResult = {
  success: boolean
  data?: { id: string }
  error?: string
}
```

Errors are handled at multiple levels:

1. **Client-side validation** (Zod in forms)
2. **Server-side validation** (Zod in actions)
3. **Database constraints** (unique names, foreign keys)
4. **UI feedback** (error messages, loading states)

## Performance Considerations

1. **Server-side fetching**: Segments loaded on initial page render
2. **Optimistic UI**: Could be added for delete operations
3. **Caching**: Next.js automatically caches server component data
4. **Revalidation**: Triggered after mutations via `revalidatePath()`

## Extension Points

To add segments to other pages (donors, volunteers):

1. Create similar integration components:
   - `DonorsSegmentBar`
   - `VolunteersSegmentBar`

2. Update respective pages:
   ```typescript
   const segments = await getSegments({ entityType: 'DONOR' })
   ```

3. Implement filter application logic for entity-specific fields

4. No changes needed to core segments module
