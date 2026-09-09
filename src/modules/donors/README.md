# Donors Module

The Donors Module provides comprehensive donor relationship management for Flourish, a nonprofit CRM application. This module handles gift tracking, lapse risk calculation, donor segmentation, and thank-you automation.

## Features

- **Gift Tracking**: Record and manage donations with detailed metadata
- **Lapse Risk Analysis**: Automatic calculation of donor engagement risk
- **Donor Segmentation**: Categorize donors (New, Active, Lapsed, Major)
- **Giving History**: Complete view of donor contributions over time
- **Thank-you Automation**: Hooks for automated thank-you generation
- **Dashboard Statistics**: Real-time donor and giving metrics

## Module Structure

```
src/modules/donors/
├── actions/              # Server actions for mutations
│   ├── record-gift.ts    # Record new gifts
│   ├── update-gift.ts    # Update existing gifts
│   └── delete-gift.ts    # Delete gifts
├── queries/              # Server functions for data fetching
│   ├── get-donors.ts     # Fetch donors with filtering/sorting
│   └── get-donor-stats.ts # Get dashboard statistics
├── services/             # Business logic services
│   └── lapse-risk-calculator.ts # Calculate donor lapse risk
├── components/           # React components
│   ├── gift-form.tsx           # Form for recording gifts
│   ├── giving-history.tsx      # Display gift history
│   ├── donor-card.tsx          # Donor summary card
│   ├── lapse-risk-badge.tsx    # Visual lapse risk indicator
│   └── donors-table.tsx        # Sortable donors table
├── schemas/              # Zod validation schemas
│   └── gift.schema.ts    # Gift data validation
└── index.ts             # Module exports

Pages:
src/app/(dashboard)/donors/
├── page.tsx              # Donors list with stats
├── [id]/page.tsx         # Individual donor detail
└── new-gift/page.tsx     # Record new gift form
```

## Database Schema

### Gifts Table

```sql
CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  gift_date DATE NOT NULL,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('one_time', 'recurring', 'pledge', 'in_kind')),
  campaign TEXT,
  payment_method TEXT,
  notes TEXT,
  thanked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Contacts Table Updates

The `contacts` table should include:

```sql
ALTER TABLE contacts ADD COLUMN is_donor BOOLEAN DEFAULT FALSE;
```

## Usage Examples

### Recording a Gift

```typescript
import { recordGift } from '@/modules/donors'

const result = await recordGift({
  contact_id: 'uuid',
  amount: 100.00,
  gift_date: '2024-01-15',
  gift_type: 'one_time',
  campaign: 'Annual Fund 2024',
  payment_method: 'credit_card',
  notes: 'Online donation'
})

if (result.success) {
  console.log('Gift recorded:', result.giftId)
}
```

### Fetching Donors

```typescript
import { getDonors } from '@/modules/donors'

const { donors, total } = await getDonors({
  segment: 'active',
  page: 1,
  limit: 50,
  sortBy: 'lifetime_giving',
  sortOrder: 'desc'
})
```

### Calculating Lapse Risk

```typescript
import { calculateLapseRisk } from '@/modules/donors'

const risk = calculateLapseRisk({
  giftCount: 5,
  lastGiftDate: new Date('2024-01-01'),
  avgGiftGap: 90 // days
})
// Returns: 'low' | 'medium' | 'high' | 'unknown'
```

## Lapse Risk Logic

The lapse risk calculator uses different strategies based on donor history:

### New Donors (1 gift)
- **High Risk**: >90 days since first gift
- **Medium Risk**: >30 days since first gift
- **Low Risk**: ≤30 days since first gift

### Repeat Donors (2+ gifts)
- **High Risk**: >2× average gift gap
- **Medium Risk**: >1.5× average gift gap
- **Low Risk**: ≤1.5× average gift gap

## Donor Segments

- **All**: All donors in the system
- **New**: Donors with only 1 gift
- **Active**: Regular donors giving within expected timeframe
- **Lapsed**: Donors at medium/high lapse risk
- **Major**: Donors with lifetime giving ≥$10,000

## Components

### GiftForm

Form component for recording new gifts with validation.

```tsx
<GiftForm
  contacts={contacts}
  defaultContactId={contactId}
/>
```

### GivingHistory

Displays complete giving history for a donor.

```tsx
<GivingHistory gifts={gifts} />
```

### DonorsTable

Sortable, filterable table of donors.

```tsx
<DonorsTable donors={donors} />
```

### LapseRiskBadge

Visual indicator of donor lapse risk.

```tsx
<LapseRiskBadge risk="high" />
```

## Integration Points

### Thank-you Automation

The `recordGift` action includes a hook for triggering automated thank-you generation:

```typescript
// TODO: Uncomment when Inngest is configured
// await inngest.send({
//   name: 'gift/thank-you.requested',
//   data: { giftId, contactId, organizationId }
// })
```

### Activity Logging

All gift actions automatically log activities to the `interactions` table for audit trails.

## Future Enhancements

1. **Recurring Gift Management**: Track and predict recurring donation schedules
2. **Pledge Tracking**: Monitor pledge fulfillment and send reminders
3. **Gift Acknowledgment**: Automated thank-you letter generation with AI
4. **Tax Receipts**: Generate year-end tax receipts
5. **Donor Trends**: Analytics dashboard with giving trends
6. **Gift Import**: Bulk import gifts from CSV/Excel
7. **Matching Gifts**: Track employer matching programs
8. **Memorial Gifts**: Honor/memorial gift tracking

## Testing

Before deploying, ensure:

1. Database tables are created with proper constraints
2. RLS policies are configured for organization-level access
3. All server actions validate organization membership
4. Gift amounts are properly formatted as currency
5. Date handling works across timezones

## Notes

- All currency values are stored as numbers and formatted with `Intl.NumberFormat`
- Dates are stored as ISO strings and converted to Date objects as needed
- Lapse risk is calculated on-demand, not stored in the database
- The module assumes proper authentication middleware is in place
