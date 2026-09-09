# Activity Logging System

Centralized activity logging for tracking all contact interactions throughout the Flourish CRM.

## Overview

The activity logging system provides a unified way to track and display all interactions with contacts, including:

- Gift recording, updates, and deletions
- Contact creation and updates
- Volunteer signups and check-ins
- Email sending
- Shift creation and management

All activities are stored in the `activities` table and displayed on contact detail pages via the Activity Timeline component.

## Architecture

```
src/lib/activity/
├── index.ts              # Public exports
├── types.ts              # TypeScript type definitions
├── log-activity.ts       # Core logging utilities
└── README.md            # This file
```

## Usage

### Basic Activity Logging

```typescript
import { logActivity } from '@/lib/activity'

await logActivity({
  organizationId: 'org-123',
  contactId: 'contact-456',
  activityType: 'gift_recorded',
  description: 'Donation of $100 received',
  metadata: {
    amount: 100,
    gift_id: 'gift-789',
    gift_type: 'one-time'
  }
})
```

### Helper Functions

The library includes specialized helper functions for common activity types:

#### Gift Activities

```typescript
import { logGiftActivity } from '@/lib/activity'

await logGiftActivity({
  organizationId,
  contactId,
  giftId: 'gift-123',
  amount: 100,
  giftType: 'one-time',
  action: 'recorded' // or 'updated' | 'deleted'
})
```

#### Volunteer Activities

```typescript
import { logVolunteerActivity } from '@/lib/activity'

await logVolunteerActivity({
  organizationId,
  contactId,
  shiftId: 'shift-123',
  shiftTitle: 'Food Bank Shift',
  signupId: 'signup-456',
  action: 'signup', // or 'checkin' | 'no_show' | 'cancelled'
  hoursLogged: 4
})
```

#### Email Activities

```typescript
import { logEmailActivity } from '@/lib/activity'

await logEmailActivity({
  organizationId,
  contactId,
  draftId: 'draft-123',
  emailType: 'thank_you',
  subject: 'Thank you for your donation',
  action: 'sent' // or 'draft_created'
})
```

#### Contact Activities

```typescript
import { logContactActivity } from '@/lib/activity'

await logContactActivity({
  organizationId,
  contactId,
  action: 'updated', // or 'created'
  changes: {
    first_name: 'John',
    email: 'john@example.com'
  }
})
```

## Activity Types

The following activity types are supported:

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

## Metadata

Activities support flexible metadata storage via JSONB. Common metadata fields include:

- `amount` - Monetary amount (for gifts)
- `gift_id` - Related gift ID
- `shift_id` - Related shift ID
- `signup_id` - Related signup ID
- `draft_id` - Related email draft ID
- `email_type` - Type of email
- `hours_logged` - Volunteer hours
- `changes` - Object describing what changed

## Querying Activities

### Get Activities for a Contact

```typescript
import { getContactActivities } from '@/modules/contacts/queries/get-contact-activities'

const result = await getContactActivities({
  contactId: 'contact-123',
  limit: 50,
  offset: 0,
  activityType: 'gift_recorded' // optional filter
})

const { activities, total } = result
```

### Get Recent Activities Across Organization

```typescript
import { getRecentActivities } from '@/modules/contacts/queries/get-contact-activities'

const activities = await getRecentActivities(20)
```

### Get Activity Counts by Type

```typescript
import { getActivityCountsByType } from '@/modules/contacts/queries/get-contact-activities'

const counts = await getActivityCountsByType('contact-123')
// { gift_recorded: 5, email_sent: 12, volunteer_signup: 3 }
```

## UI Components

### Activity Timeline

Display a visual timeline of activities on contact detail pages:

```tsx
import { ActivityTimeline } from '@/modules/contacts/components/activity-timeline'
import { getContactActivities } from '@/modules/contacts/queries/get-contact-activities'

export default async function ContactPage({ params }) {
  const { id } = params
  const result = await getContactActivities({ contactId: id })

  return <ActivityTimeline activities={result?.activities || []} />
}
```

The `ActivityTimeline` component automatically:
- Groups activities by type with appropriate icons and colors
- Formats dates as relative time ("2 hours ago")
- Displays metadata in a readable format
- Shows empty state when no activities exist

## Integration Points

Activities are automatically logged by the following actions:

### Donor Actions
- `/src/modules/donors/actions/record-gift.ts` - Logs gift_recorded
- `/src/modules/donors/actions/update-gift.ts` - Logs gift_updated
- `/src/modules/donors/actions/delete-gift.ts` - Logs gift_deleted

### Contact Actions
- `/src/modules/contacts/actions/create-contact.ts` - Logs contact_created
- `/src/modules/contacts/actions/update-contact.ts` - Logs contact_updated

### Volunteer Actions
- `/src/modules/volunteers/actions/signup-volunteer.ts` - Logs volunteer_signup
- `/src/modules/volunteers/actions/check-in.ts` - Logs volunteer_checkin or volunteer_no_show

### Communication Actions
- `/src/modules/communications/actions/send-email.ts` - Logs email_sent

## Database Schema

Activities are stored in the `activities` table:

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Row-level security (RLS) ensures users can only access activities within their organization.

## Best Practices

1. **Always use helper functions** when available for consistency
2. **Include relevant metadata** to provide context
3. **Write clear descriptions** that make sense in the timeline
4. **Don't over-log** - log meaningful interactions, not every database operation
5. **Handle errors gracefully** - activity logging should never break core functionality

## Error Handling

Activity logging is designed to be non-blocking. If logging fails:

```typescript
const success = await logActivity({...})
if (!success) {
  // Logging failed, but this shouldn't stop the main operation
  console.error('Failed to log activity')
}
```

All logging functions return a boolean indicating success, but failures are logged and don't throw errors.

## Future Enhancements

Potential improvements to consider:

- Activity filtering and search in the UI
- Activity export functionality
- Custom activity types via settings
- Activity templates for common operations
- Bulk activity operations
- Activity analytics and reporting
