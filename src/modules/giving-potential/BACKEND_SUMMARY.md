# Giving Potential Backend Module - Summary

## Created Files

### Schemas (`schemas/`)
- **giving-potential.schema.ts** - Zod validation schemas
  - `givingPotentialSchema` - Full database schema
  - `createGivingPotentialSchema` - For creating new records
  - `updateGivingPotentialSchema` - For updating records
  - `wealthDataSchema` - Wealth indicators input
  - `contactEngagementSchema` - Contact engagement data
  - `calculatedScoresSchema` - Score calculation output

### Services (`services/`)
- **score-calculator.ts** - Pure scoring functions
  - `calculateCapacityScore()` - Wealth-based capacity (0-100)
  - `calculateAffinityScore()` - Engagement-based affinity (0-100)
  - `calculatePropensityScore()` - Giving behavior propensity (0-100)
  - `calculateOverallScore()` - Weighted composite score
  - `calculateGivingGapRatio()` - Potential vs current giving
  - Helper functions for score descriptions

### Queries (`queries/`)
- **get-giving-potential.ts** - Fetch single contact data
  - `getGivingPotential()` - Get giving potential for one contact
  - `hasGivingPotential()` - Check if contact has data

- **get-top-prospects.ts** - Fetch prospect lists
  - `getTopProspects()` - Top prospects by overall score
  - `getHighCapacityProspects()` - High capacity contacts
  - `getUntappedProspects()` - High capacity + low giving gap

### Actions (`actions/`)
- **save-giving-potential.ts** - Persist data
  - `saveGivingPotential()` - Upsert giving potential record
  - `deleteGivingPotential()` - Remove record
  - Validates organization membership
  - Uses admin client for upsert
  - Revalidates paths

- **calculate-scores.ts** - Score calculation
  - `calculateScores()` - Calculate from raw data
  - `calculateScoresForContact()` - Fetch contact data and calculate
  - `recalculateAllScores()` - Batch recalculation utility

### Module Exports (`index.ts`)
- All public types, queries, actions, and services
- Clean API surface for other modules

## Scoring Algorithm

### Capacity Score (Financial Ability)
```
Real Estate (40%) + Stocks (30%) + Job Level (20%) + Political Donations (10%) = 100%
```

### Affinity Score (Engagement Level)
```
Lifetime Giving/Capacity (40%) + Volunteer Hours (30%) + Email Opens (20%) + Events (10%) = 100%
```

### Propensity Score (Giving Likelihood)
```
Recency (40%) + Frequency (30%) + Growth Trend (30%) = 100%
```

### Overall Score (Composite)
```
Capacity (40%) + Affinity (30%) + Propensity (30%) = 100%
```

## Key Features

1. **Flexible Scoring**: All fields are optional, scores normalize based on available data
2. **Type Safety**: Full Zod validation with TypeScript types
3. **Multi-tenant**: Organization-scoped with RLS policies
4. **Upsert Logic**: Creates or updates based on contact_id uniqueness
5. **Batch Operations**: Recalculate all scores when algorithm changes
6. **Rich Queries**: Multiple filtering options (by score, capacity, giving gap)

## Integration Points

- **Contacts Module**: Fetches lifetime_giving, volunteer_hours, etc.
- **Donors Module**: Uses gift history for propensity scoring
- **Database**: `giving_potential` table with RLS policies
- **Auth**: Uses `getCurrentOrganizationId()` for multi-tenancy

## Usage Example

```typescript
import {
  calculateScoresForContact,
  saveGivingPotential,
  getTopProspects
} from '@/modules/giving-potential'

// Calculate scores
const result = await calculateScoresForContact(contactId, {
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
  job_level: 'executive'
})

// Save to database
if (result.success) {
  await saveGivingPotential({
    contact_id: contactId,
    real_estate_value: 2_000_000,
    stock_holdings: 500_000,
    ...result.scores
  })
}

// Get top 20 prospects
const prospects = await getTopProspects({ limit: 20 })
```

## Database Schema

Uses existing `giving_potential` table from migration `019_giving_potential.sql`:
- Wealth indicators (net worth, real estate, stocks, etc.)
- Calculated scores (capacity, affinity, propensity, overall)
- Metadata (data sources, notes, enrichment timestamp)
- RLS policies for organization isolation
- Unique constraint on contact_id

## Testing Checklist

- [ ] Create giving potential record for contact
- [ ] Update existing record (upsert)
- [ ] Calculate scores with partial data
- [ ] Fetch top prospects
- [ ] Filter by capacity score
- [ ] Find untapped prospects (high capacity, low giving)
- [ ] Verify organization isolation (RLS)
- [ ] Test with missing/null values
- [ ] Batch recalculation
- [ ] Score descriptions

## Future Enhancements

1. API integration for wealth screening services
2. Machine learning for predictive scores
3. Historical score tracking
4. Gift ask amount recommendations
5. Peer comparison analysis
