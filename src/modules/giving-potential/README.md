# Giving Potential Module

A comprehensive wealth screening and major gift prospect identification system for Flourish.

## Overview

This module provides tools to:
- Calculate giving capacity based on wealth indicators
- Measure donor affinity (engagement with organization)
- Assess giving propensity (likelihood to give)
- Identify top prospects for major gifts
- Track untapped potential (high capacity, low current giving)

## Architecture

```
giving-potential/
├── schemas/           # Zod validation schemas
├── services/          # Pure scoring functions
├── queries/           # Data fetching functions
├── actions/           # Server actions (mutations)
└── components/        # React components
```

## Scoring Algorithm

### Capacity Score (0-100)
Measures financial ability to give based on:
- Real estate value (40% weight)
- Stock holdings (30% weight)
- Job level (20% weight)
- Political donations (10% weight)

### Affinity Score (0-100)
Measures engagement with organization based on:
- Lifetime giving relative to capacity (40% weight)
- Volunteer hours (30% weight)
- Email open rate (20% weight)
- Event attendance (10% weight)

### Propensity Score (0-100)
Measures likelihood to give based on:
- Recency of last gift (40% weight)
- Giving frequency (30% weight)
- Gift growth trend (30% weight)

### Overall Score (0-100)
Weighted composite of all three:
- Capacity (40%)
- Affinity (30%)
- Propensity (30%)

## Usage Examples

### Calculate scores for a contact

```typescript
import { calculateScoresForContact } from '@/modules/giving-potential'

const result = await calculateScoresForContact(contactId, {
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
  job_level: 'executive',
})

if (result.success) {
  console.log(result.scores)
  // {
  //   capacity_score: 85,
  //   affinity_score: 60,
  //   propensity_score: 72,
  //   overall_score: 74
  // }
}
```

### Save giving potential data

```typescript
import { saveGivingPotential } from '@/modules/giving-potential'

const result = await saveGivingPotential({
  contact_id: '...',
  real_estate_value: 2_000_000,
  capacity_score: 85,
  affinity_score: 60,
  propensity_score: 72,
  overall_score: 74,
})
```

### Get top prospects

```typescript
import { getTopProspects } from '@/modules/giving-potential'

const prospects = await getTopProspects({
  limit: 20,
  minScore: 60,
})
```

### Get high capacity prospects

```typescript
import { getHighCapacityProspects } from '@/modules/giving-potential'

// Find contacts with high wealth but potentially low giving
const prospects = await getHighCapacityProspects({
  limit: 20,
  minScore: 70,
})
```

### Get untapped potential

```typescript
import { getUntappedProspects } from '@/modules/giving-potential'

// Find high capacity contacts giving less than 10% of potential
const prospects = await getUntappedProspects({
  limit: 20,
  minScore: 60,
})
```

## Database Schema

The module uses the `giving_potential` table:

```sql
CREATE TABLE giving_potential (
  id UUID PRIMARY KEY,
  contact_id UUID UNIQUE,
  organization_id UUID,

  -- Wealth indicators
  estimated_net_worth DECIMAL,
  real_estate_value DECIMAL,
  stock_holdings DECIMAL,
  political_donations DECIMAL,
  nonprofit_board_count INTEGER,
  employer TEXT,
  job_title TEXT,

  -- Scores (0-100)
  capacity_score INTEGER,
  affinity_score INTEGER,
  propensity_score INTEGER,
  overall_score INTEGER,

  -- Analysis
  giving_gap_ratio DECIMAL,
  data_sources JSONB,
  notes TEXT,

  -- Timestamps
  last_enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Customization

Adjust scoring thresholds in `services/score-calculator.ts`:

```typescript
const CAPACITY_THRESHOLDS = {
  REAL_ESTATE_MAX: 5_000_000,
  STOCKS_MAX: 2_000_000,
  POLITICAL_MAX: 50_000,
}

const AFFINITY_THRESHOLDS = {
  VOLUNTEER_HOURS_MAX: 200,
  EMAIL_OPEN_RATE_MIN: 0.5,
  EVENT_ATTENDANCE_MAX: 10,
}

const PROPENSITY_THRESHOLDS = {
  RECENCY_MAX_DAYS: 365,
  FREQUENCY_MAX: 12,
}
```

## Integration

This module integrates with:
- Contacts module for donor data
- Donors module for gift history
- Volunteers module for engagement metrics
- Communications module for email tracking

## Future Enhancements

- Integration with wealth screening APIs (WealthEngine, iWave)
- Machine learning for predictive scoring
- Campaign-specific propensity modeling
- Peer comparison analysis
- Gift range recommendations
