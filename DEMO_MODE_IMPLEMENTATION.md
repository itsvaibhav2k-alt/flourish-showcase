# Demo Mode / Seed Data Implementation

## Overview

This document describes the Demo Mode feature implementation for Flourish CRM, which allows users to load realistic sample data to explore the application's features.

## Components

### 1. Data Generator (`src/lib/demo/generate-data.ts`)

A comprehensive data generation library that creates realistic demo data:

**Functions:**
- `generateContacts(count, orgId)` - Creates 30 contacts with varied roles (donors, volunteers, or both)
- `generateGifts(contacts, orgId, months)` - Generates 12 months of gift history with realistic patterns:
  - Monthly recurring donors (30% of donors)
  - One-time and major gift donors
  - Some lapsed donors (haven't given in 6+ months)
  - Varied gift amounts: $25, $50, $100, $250, $500, $1000, $2500, $5000
- `generateShifts(orgId, count)` - Creates 6 upcoming volunteer shifts (1-14 days ahead)
- `generateSignups(shifts, volunteers)` - Fills shifts to 50-90% capacity with volunteers
- `generateEmailDrafts(contacts, orgId, count)` - Creates 10 AI-generated email drafts in various states (pending, approved, sent)
- `generateActivities(contacts, gifts, orgId)` - Creates activity timeline entries

**Data Quality:**
- Realistic names from curated lists of common first/last names
- Unique email addresses (firstName.lastName@example.com)
- Phone numbers in standard US format
- Gift patterns that reflect real donor behavior
- Lapse risk calculations (low/medium/high based on last gift date)
- Volunteer reliability scores (70-100%)
- All demo data tagged with 'demo-data' for easy identification

### 2. Seed Action (`src/modules/settings/actions/seed-demo-data.ts`)

Server action that orchestrates the data seeding process:

**Features:**
- **Safety Check:** Only works if organization has zero contacts (prevents duplicate data)
- **Comprehensive Seeding:** Creates contacts, gifts, shifts, signups, drafts, and activities
- **Stats Updates:** Automatically calculates and updates:
  - Donor stats (total_gifts, lifetime_giving, last_gift_date, lapse_risk)
  - Volunteer stats (total_volunteer_hours, reliability_score)
- **Error Handling:** Gracefully handles partial failures, continuing with remaining operations
- **Summary Response:** Returns detailed count of created records

**Return Type:**
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

### 3. Clear Action (`src/modules/settings/actions/clear-demo-data.ts`)

Server action to remove all demo data:

**Features:**
- **Safety Check:** Only works if organization has demo data (contacts with 'demo-data' tag)
- **Complete Cleanup:** Deletes all data in correct order to respect foreign key constraints:
  1. Activities
  2. Email drafts
  3. Shift signups
  4. Shifts
  5. Gifts
  6. Contact notes
  7. Contact tasks
  8. Contacts
- **Error Handling:** Returns clear error messages if operation fails

### 4. Demo Banner (`src/modules/dashboard/components/demo-banner.tsx`)

Client component that displays an invitation to load sample data:

**Design:**
- Eye-catching gradient card with primary/violet colors
- Sparkles icon for visual appeal
- Clear call-to-action button
- Loading state with spinner animation
- Informative text explaining what will be loaded

### 5. Demo Banner Wrapper (`src/modules/dashboard/components/demo-banner-wrapper.tsx`)

Client wrapper that handles the loading logic:

**Features:**
- Manages loading state
- Calls `seedDemoData()` server action
- Displays toast notifications:
  - Success: Shows summary of created records
  - Error: Shows error message
- Refreshes page on success to display new data
- Conditionally renders based on `showBanner` prop

### 6. Dashboard Integration (`src/app/(dashboard)/dashboard/page.tsx`)

The dashboard automatically detects when an organization has no contacts and displays the demo banner:

**Implementation:**
```typescript
const showDemoBanner = stats.totalContacts === 0

<DemoBannerWrapper showBanner={showDemoBanner} />
```

The banner appears prominently below the header and above the stats cards.

## Usage Flow

1. **New Organization:** User signs up and creates a new organization
2. **Empty Dashboard:** Dashboard loads with 0 contacts, showing stats cards with zeros
3. **Demo Banner Appears:** Prominent banner invites user to load sample data
4. **User Clicks Button:** "Load Sample Data" button is clicked
5. **Loading State:** Button shows spinner and "Loading Sample Data..." text
6. **Data Seeded:** Server action creates all demo data with realistic patterns
7. **Success Toast:** Shows summary (e.g., "Added 30 contacts, 150 gifts, 6 shifts, 10 drafts")
8. **Page Refreshes:** Dashboard reloads showing populated stats and activity
9. **Banner Disappears:** Once contacts exist, banner no longer shows

## Demo Data Characteristics

### Contacts (30 total)
- Mix of roles: ~60% donors, ~50% volunteers (some overlap)
- Realistic names and email addresses
- ~70% have phone numbers
- All tagged with 'demo-data'

### Gifts (varies, typically 100-200)
- 12 months of history
- Monthly donors: Consistent $25-$100 donations every month
- One-time donors: 1-4 gifts over the period
- Major gifts: $1000+ amounts categorized as 'major_gift'
- Lapsed donors: ~30% haven't given in 6+ months
- Various payment methods: credit card, check, bank transfer, PayPal
- Multiple campaigns: Annual Fund, Spring Campaign, etc.

### Shifts (6 upcoming)
- Spread across next 14 days
- Various types: Food Bank, Community Garden, Tutoring, etc.
- Different capacities: 5-12 spots
- Different durations: 2-4 hours
- Multiple locations

### Shift Signups (varies based on capacity)
- Each shift 50-90% full
- Mostly confirmed (~90%), some waitlisted (~10%)
- Realistic volunteer distribution

### Email Drafts (10 total)
- Various types: thank-you, confirmation, reminder, follow-up, welcome
- Status distribution: 60% pending, 30% approved, 10% sent
- Created over past 7 days
- Realistic subject lines and body content

### Activities (100+)
- Gift activities for all donations
- Note activities for some contacts
- Email activities for sent communications
- Properly timestamped to match source events

## Technical Notes

### Database Constraints
The clear action respects foreign key constraints by deleting in the correct order.

### RLS (Row Level Security)
All operations respect Supabase RLS policies using `organization_id` scoping.

### Performance
- Seeding typically completes in 2-5 seconds
- Uses batch inserts where possible
- Updates stats after bulk operations rather than per-record

### Error Recovery
Partial failures are handled gracefully - if gifts fail to insert but contacts succeed, the function continues rather than rolling back.

## Future Enhancements

Potential improvements:
1. **Customizable Data Volume:** Allow users to choose how much data to generate
2. **Industry Templates:** Different data patterns for different nonprofit types
3. **Export/Import:** Save demo scenarios for testing
4. **Reset Button:** UI to clear demo data without going to settings
5. **Guided Tour:** Interactive walkthrough highlighting features using demo data
6. **Custom Scenarios:** Pre-defined scenarios (e.g., "Major Donors Campaign", "Volunteer Appreciation")

## Module Exports

All functionality is properly exported through module index files:

```typescript
// From src/modules/settings/index.ts
export { seedDemoData, type SeedDemoDataResult } from './actions/seed-demo-data'
export { clearDemoData, type ClearDemoDataResult } from './actions/clear-demo-data'

// From src/modules/dashboard/index.ts
export * from './components/demo-banner'
export * from './components/demo-banner-wrapper'
```

## Testing Recommendations

1. **Fresh Organization:** Test with a completely new organization
2. **Existing Data:** Verify banner doesn't appear when contacts exist
3. **Error Cases:** Test with database permissions issues
4. **Clear Functionality:** Verify complete cleanup of demo data
5. **Performance:** Monitor seed time with various data volumes
6. **Stats Accuracy:** Verify calculated stats match actual data
