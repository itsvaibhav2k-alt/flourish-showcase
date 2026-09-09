# Demo Mode Usage Guide

## For End Users

### Loading Demo Data

1. **Sign up or log in** to Flourish
2. **Create a new organization** (or use an empty one with 0 contacts)
3. **Visit the Dashboard** - You'll see a prominent banner at the top:
   - Gradient blue/violet card with sparkles icon
   - Title: "Want to see Flourish in action?"
   - Description explaining what will be loaded
4. **Click "Load Sample Data"** button
5. **Wait 2-5 seconds** while data loads (button shows spinner)
6. **See success notification** with summary of created data
7. **Dashboard refreshes** automatically showing:
   - 30 contacts in the contacts list
   - Gift history and donor statistics
   - Upcoming volunteer shifts
   - AI-generated email drafts
   - Activity timeline

### What Gets Created

The demo data includes:

- **30 Contacts** with realistic names, emails, phone numbers
  - Mix of donors, volunteers, or both
  - Some are active, some are lapsed

- **100+ Gifts** spanning 12 months
  - Monthly recurring donations ($25-$100)
  - One-time gifts ($25-$5000)
  - Major gifts ($1000+)
  - Various payment methods and campaigns

- **6 Upcoming Shifts** over the next 2 weeks
  - Food bank, tutoring, events, etc.
  - Different capacities and durations
  - 50-90% filled with volunteers

- **10 Email Drafts** in various states
  - Thank you notes
  - Shift confirmations
  - Volunteer reminders
  - 60% pending review, 30% approved, 10% sent

- **Activity Timeline** showing recent interactions
  - Gift notifications
  - Email sends
  - Notes and updates

### Clearing Demo Data (Admin Only)

To remove all demo data and start fresh:

1. Use the `clearDemoData()` action from settings
2. Only works if data was created with the demo feature
3. Removes everything safely in correct order
4. Requires admin role

## For Developers

### Importing Functions

```typescript
// Import seed action
import { seedDemoData } from '@/modules/settings/actions/seed-demo-data'

// Import clear action
import { clearDemoData } from '@/modules/settings/actions/clear-demo-data'

// Import UI components
import { DemoBanner } from '@/modules/dashboard/components/demo-banner'
import { DemoBannerWrapper } from '@/modules/dashboard/components/demo-banner-wrapper'

// Import data generators directly (advanced)
import {
  generateContacts,
  generateGifts,
  generateShifts,
  generateSignups,
  generateEmailDrafts,
  generateActivities,
} from '@/lib/demo/generate-data'
```

### Using the Seed Action

```typescript
'use client'

import { seedDemoData } from '@/modules/settings'
import { toast } from 'sonner'

async function handleLoadDemo() {
  const result = await seedDemoData()

  if (result.success && result.summary) {
    toast.success('Demo data loaded!', {
      description: `Created ${result.summary.contacts} contacts, ${result.summary.gifts} gifts`
    })
  } else {
    toast.error('Failed to load demo data', {
      description: result.error
    })
  }
}
```

### Using the Clear Action

```typescript
import { clearDemoData } from '@/modules/settings'

async function handleClearDemo() {
  const result = await clearDemoData()

  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.error)
  }
}
```

### Custom Data Generation

```typescript
import { generateContacts, generateGifts } from '@/lib/demo/generate-data'

// Generate custom number of contacts
const contacts = generateContacts(50, organizationId)

// Generate 6 months of gifts instead of 12
const gifts = generateGifts(contacts, organizationId, 6)
```

### Conditional Rendering

```typescript
export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const showDemoBanner = stats.totalContacts === 0

  return (
    <div>
      <DemoBannerWrapper showBanner={showDemoBanner} />
      {/* Rest of dashboard */}
    </div>
  )
}
```

## API Reference

### `seedDemoData()`

Seeds comprehensive demo data for the current organization.

**Returns:**
```typescript
{
  success: boolean
  error?: string
  summary?: {
    contacts: number
    gifts: number
    shifts: number
    signups: number
    drafts: number
    activities: number
  }
}
```

**Behavior:**
- Only works if organization has 0 contacts
- Creates data in correct order to respect foreign keys
- Updates calculated stats (lapse risk, reliability, etc.)
- Tags all contacts with 'demo-data' for identification
- Handles partial failures gracefully

**Example:**
```typescript
const result = await seedDemoData()
if (result.success) {
  console.log(`Created ${result.summary.contacts} contacts`)
}
```

### `clearDemoData()`

Removes all demo data from the current organization.

**Returns:**
```typescript
{
  success: boolean
  error?: string
  message?: string
}
```

**Behavior:**
- Requires admin role
- Only works if organization has demo data
- Deletes all data in correct order
- Cannot be undone

**Example:**
```typescript
const result = await clearDemoData()
if (result.success) {
  console.log(result.message)
}
```

## Troubleshooting

### Banner Doesn't Appear

**Issue:** Demo banner not showing on dashboard

**Solutions:**
- Verify organization has exactly 0 contacts
- Check that `DemoBannerWrapper` is imported and rendered
- Ensure `showBanner` prop is correctly calculated

### Seed Fails with "Organization already has contacts"

**Issue:** Can't load demo data

**Cause:** Organization already has data

**Solutions:**
- Use clear action first (if existing data is demo data)
- Create a new organization
- Manually delete existing contacts

### Partial Data Created

**Issue:** Some data created but not all

**Cause:** Database constraint or permission issue

**Solutions:**
- Check Supabase logs for errors
- Verify RLS policies allow inserts
- Check foreign key constraints
- Use clear action to remove partial data

### Stats Not Updating

**Issue:** Donor/volunteer stats show as 0

**Cause:** Stats calculation logic may have failed

**Solutions:**
- Check console for errors during seed
- Manually trigger stats recalculation
- Verify gifts and signups were created

## Best Practices

### For Product Demos

1. Start with fresh organization
2. Load demo data
3. Walk through features showing realistic data
4. Clear demo data after demo (if needed)
5. Never use in production

### For Development

1. Use demo data for UI/UX testing
2. Test features with realistic data volumes
3. Verify calculated fields work correctly
4. Test edge cases (lapsed donors, full shifts, etc.)

### For Testing

1. Clear demo data between test runs
2. Use consistent seed for reproducible tests
3. Verify all relationships created correctly
4. Test with various data volumes

## Security Notes

- Demo data is clearly tagged for identification
- Clear action requires admin role
- Seed only works on empty organizations
- All operations respect RLS policies
- No sensitive real data used

## Performance Notes

- Seeding takes 2-5 seconds for standard dataset
- Uses batch inserts where possible
- Stats calculated after bulk operations
- Consider pagination for large datasets
- Clear operation respects foreign key order
