# Activity Logging Implementation Summary

## Overview

Comprehensive activity logging has been added throughout the Flourish nonprofit CRM application. All contact interactions are now tracked in the `activities` table and displayed on the contact detail page via an interactive timeline.

## What Was Implemented

### 1. Core Activity Logging System (`/src/lib/activity/`)

Created a centralized activity logging utility with:

- **Type definitions** (`types.ts`) - TypeScript types for all activity types and metadata
- **Core logging functions** (`log-activity.ts`) - Main logging utilities
- **Helper functions** - Specialized functions for common activity types:
  - `logGiftActivity()` - Gift recording, updates, deletions
  - `logVolunteerActivity()` - Volunteer signups, check-ins, no-shows
  - `logEmailActivity()` - Email sending and draft creation
  - `logContactActivity()` - Contact creation and updates
- **Documentation** (`README.md`) - Comprehensive usage guide

### 2. Activity Types Supported

The following activity types are now logged:

- `gift_recorded` - New gift/donation recorded
- `gift_updated` - Existing gift updated
- `gift_deleted` - Gift removed
- `contact_created` - New contact created
- `contact_updated` - Contact information updated
- `volunteer_signup` - Volunteer signed up for shift
- `volunteer_checkin` - Volunteer checked in for shift
- `volunteer_no_show` - Volunteer marked as no-show
- `volunteer_cancelled` - Volunteer cancelled their signup
- `shift_created` - New volunteer shift created
- `shift_updated` - Shift details updated
- `email_sent` - Email sent to contact
- `email_draft_created` - Email draft created
- `note_added` - Manual note added
- `other` - General activity

### 3. Integration with Actions

Activity logging has been added to the following server actions:

**Donor Actions:**
- `/src/modules/donors/actions/record-gift.ts` - Logs `gift_recorded`
- `/src/modules/donors/actions/update-gift.ts` - Logs `gift_updated`
- `/src/modules/donors/actions/delete-gift.ts` - Logs `gift_deleted`

**Contact Actions:**
- `/src/modules/contacts/actions/create-contact.ts` - Logs `contact_created`
- `/src/modules/contacts/actions/update-contact.ts` - Logs `contact_updated`

**Volunteer Actions:**
- `/src/modules/volunteers/actions/signup-volunteer.ts` - Logs `volunteer_signup`
- `/src/modules/volunteers/actions/check-in.ts` - Logs `volunteer_checkin` or `volunteer_no_show`

**Communication Actions:**
- `/src/modules/communications/actions/send-email.ts` - Logs `email_sent`

### 4. Query Functions

Created query functions to fetch activities:

**File:** `/src/modules/contacts/queries/get-contact-activities.ts`

Functions:
- `getContactActivities()` - Fetch paginated activities for a contact with filtering
- `getRecentActivities()` - Fetch recent activities across all contacts
- `getActivityCountsByType()` - Get activity counts grouped by type

### 5. UI Components

**Activity Timeline Component** (`/src/modules/contacts/components/activity-timeline.tsx`)

Features:
- Visual timeline with icons and colors for each activity type
- Relative time formatting ("2 hours ago", "3 days ago")
- Activity type badges
- Metadata display (amounts, hours, etc.)
- Empty state when no activities exist
- Responsive design

### 6. Contact Detail Page Integration

Updated `/src/app/(dashboard)/contacts/[id]/page.tsx` to:
- Fetch activities for the contact
- Display them in the Activity tab via the ActivityTimeline component

### 7. Database Migration

Created migration `/supabase/migrations/003_update_activity_types.sql` to:
- Update activity type constraint to support all new activity types
- Rename `occurred_at` to `created_at` for consistency with types
- Add helpful column comments
- Maintain backward compatibility with legacy activity types

## File Structure

```
src/
├── lib/
│   └── activity/
│       ├── index.ts                 # Public exports
│       ├── types.ts                 # TypeScript types
│       ├── log-activity.ts          # Core logging functions
│       └── README.md                # Documentation
├── modules/
│   ├── contacts/
│   │   ├── actions/
│   │   │   ├── create-contact.ts    # Updated with activity logging
│   │   │   └── update-contact.ts    # Updated with activity logging
│   │   ├── components/
│   │   │   └── activity-timeline.tsx # NEW: Timeline component
│   │   └── queries/
│   │       └── get-contact-activities.ts # NEW: Query functions
│   ├── donors/
│   │   └── actions/
│   │       ├── record-gift.ts       # Updated with activity logging
│   │       ├── update-gift.ts       # Updated with activity logging
│   │       └── delete-gift.ts       # Updated with activity logging
│   ├── volunteers/
│   │   └── actions/
│   │       ├── signup-volunteer.ts  # Updated with activity logging
│   │       └── check-in.ts          # Updated with activity logging
│   └── communications/
│       └── actions/
│           └── send-email.ts        # Updated with activity logging
└── app/
    └── (dashboard)/
        └── contacts/
            └── [id]/
                └── page.tsx         # Updated to show activity timeline

supabase/
└── migrations/
    └── 003_update_activity_types.sql # NEW: Database migration
```

## Usage Examples

### Logging a Gift Activity

```typescript
import { logGiftActivity } from '@/lib/activity'

await logGiftActivity({
  organizationId: 'org-123',
  contactId: 'contact-456',
  giftId: 'gift-789',
  amount: 100,
  giftType: 'one-time',
  action: 'recorded'
})
```

### Logging a Volunteer Activity

```typescript
import { logVolunteerActivity } from '@/lib/activity'

await logVolunteerActivity({
  organizationId: 'org-123',
  contactId: 'contact-456',
  shiftId: 'shift-789',
  shiftTitle: 'Food Bank Volunteer',
  signupId: 'signup-101',
  action: 'checkin',
  hoursLogged: 4
})
```

### Fetching Activities

```typescript
import { getContactActivities } from '@/modules/contacts/queries/get-contact-activities'

const result = await getContactActivities({
  contactId: 'contact-123',
  limit: 50,
  offset: 0
})

const { activities, total } = result
```

### Displaying Timeline

```tsx
import { ActivityTimeline } from '@/modules/contacts/components/activity-timeline'

export default function ContactPage() {
  const activities = await getContactActivities({ contactId: 'contact-123' })

  return <ActivityTimeline activities={activities?.activities || []} />
}
```

## Database Schema

The `activities` table stores all activity data:

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Indexes:
- `idx_activities_org_id` - Organization lookup
- `idx_activities_contact_id` - Contact lookup
- `idx_activities_activity_type` - Type filtering
- `idx_activities_created_at` - Time-based ordering

## Key Design Decisions

1. **Centralized Logging** - All activity logging goes through `/src/lib/activity/` for consistency
2. **Helper Functions** - Domain-specific helpers make it easy to log activities correctly
3. **Non-Blocking** - Activity logging failures don't break main operations
4. **Flexible Metadata** - JSONB column allows storing arbitrary context
5. **Type Safety** - Full TypeScript support with proper types
6. **Timeline UI** - Rich visual timeline with icons, colors, and formatting

## Testing Checklist

To verify the implementation works:

1. **Database Migration**
   ```bash
   npx supabase db reset
   # Or apply specific migration:
   npx supabase migration up 003_update_activity_types
   ```

2. **Test Gift Recording**
   - Record a new gift
   - Verify activity appears in contact timeline
   - Check metadata includes gift_id and amount

3. **Test Contact Updates**
   - Edit a contact
   - Verify activity shows what changed
   - Check changes are stored in metadata

4. **Test Volunteer Actions**
   - Sign up volunteer for shift
   - Check in volunteer
   - Verify both activities appear with correct metadata

5. **Test Email Sending**
   - Send an email to a contact
   - Verify email_sent activity is logged
   - Check metadata includes email type and subject

6. **Test Timeline UI**
   - View contact detail page
   - Verify activities are sorted newest first
   - Check icons and colors match activity types
   - Verify relative time formatting works

## Next Steps

Potential enhancements to consider:

1. **Activity Filtering** - Add UI to filter activities by type
2. **Activity Search** - Search within activity descriptions
3. **Activity Export** - Export activity history to CSV
4. **Activity Analytics** - Dashboard showing activity trends
5. **Manual Notes** - UI to add custom notes/activities
6. **Activity Notifications** - Email/in-app notifications for key activities
7. **Activity Audit** - Track who viewed activities (for compliance)

## Rollback Plan

If issues arise, you can:

1. **Revert Migration**
   ```bash
   npx supabase migration down 003_update_activity_types
   ```

2. **Remove Activity Logging** - Comment out `logActivity()` calls in actions

3. **Hide Timeline** - Remove `<ActivityTimeline>` from contact page

The old `interactions` table is still in place, so existing data is preserved.

## Documentation

- Main README: `/src/lib/activity/README.md`
- This Summary: `/ACTIVITY_LOGGING_SUMMARY.md`
- Migration: `/supabase/migrations/003_update_activity_types.sql`

## Support

For questions or issues:
1. Check `/src/lib/activity/README.md` for usage examples
2. Review the activity timeline component for UI customization
3. Examine existing action implementations for logging patterns
