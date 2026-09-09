# Giving Potential - Quick Start Guide

## 5-Minute Overview

The Giving Potential system scores donors across 3 dimensions to identify major gift prospects:

1. **Capacity** (40% weight) - Financial ability to give
2. **Affinity** (30% weight) - Connection to organization
3. **Propensity** (30% weight) - Likelihood to give

**Overall Score** = Weighted average of all three (0-100 scale)

## Quick Usage Examples

### 1. Calculate Scores for a Contact

```typescript
import { calculateScoresForContact } from '@/modules/giving-potential'

const result = await calculateScoresForContact(contactId, {
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
  job_level: 'executive',
})

if (result.success) {
  const { capacity_score, affinity_score, propensity_score, overall_score } = result.scores
}
```

### 2. Save Giving Potential Data

```typescript
import { saveGivingPotential } from '@/modules/giving-potential'

await saveGivingPotential({
  contact_id: contactId,
  real_estate_value: 2_000_000,
  employer: 'Tech Corp',
  capacity_score: 85,
  affinity_score: 60,
  propensity_score: 72,
  overall_score: 74,
})
```

### 3. Get Top Prospects

```typescript
import { getTopProspects } from '@/modules/giving-potential'

const prospects = await getTopProspects({ limit: 20, minScore: 60 })
```

### 4. Display on Contact Page

```typescript
import { GivingPotentialPanel } from '@/modules/giving-potential'

const data = await getGivingPotential(contactId)

<GivingPotentialPanel contactId={contactId} data={data} />
```

### 5. Show Radar Chart Visualization

```typescript
import { ScoreRadarChart } from '@/modules/giving-potential'

<ScoreRadarChart
  capacityScore={75}
  affinityScore={60}
  propensityScore={68}
/>
```

## Where to Find Things

### Components
- **Full Panel:** `src/modules/giving-potential/components/giving-potential-panel.tsx`
- **Radar Chart:** `src/modules/giving-potential/components/score-radar-chart.tsx`
- **Score Meters:** `src/modules/giving-potential/components/score-meter.tsx`
- **Prospect List:** `src/modules/giving-potential/components/prospect-list.tsx`

### Business Logic
- **Score Calculator:** `src/modules/giving-potential/services/score-calculator.ts`
- **Actions:** `src/modules/giving-potential/actions/`
- **Queries:** `src/modules/giving-potential/queries/`

### Database
- **Migration:** `supabase/migrations/019_giving_potential.sql`
- **Types:** `src/lib/supabase/types.ts` (giving_potential table)

### Background Jobs
- **Recalculation:** `src/lib/inngest/functions/recalculate-giving-scores.ts`

### Pages
- **Top Prospects:** `/src/app/(dashboard)/prospects/page.tsx`
- **Contact Detail:** Shows GivingPotentialPanel in sidebar

## Key Concepts

### Score Ranges

| Overall Score | Category | Action |
|--------------|----------|--------|
| 80-100 | Top Prospect | Immediate cultivation |
| 60-79 | Strong Prospect | Active engagement |
| 40-59 | Moderate Prospect | Long-term cultivation |
| 20-39 | Emerging Prospect | Build relationship |
| 0-19 | Low Priority | Monitor only |

### Giving Gap

**Giving Gap** = Estimated Capacity - Current Giving

**Lower giving gap ratio = Higher untapped potential**

```typescript
givingGapRatio = lifetimeGiving / estimatedCapacity
// 0.10 = Only giving 10% of capacity (HIGH POTENTIAL)
// 0.50 = Giving 50% of capacity (MODERATE)
// 1.00 = Giving 100% of capacity (MAXED OUT)
```

## Common Tasks

### Trigger Score Recalculation

```typescript
import { inngest } from '@/lib/inngest/client'

// All contacts in organization
await inngest.send({
  name: 'scores/recalculate.requested',
  data: { organizationId: 'uuid' },
})

// Single contact
await inngest.send({
  name: 'contact/giving-potential.updated',
  data: {
    contactId: 'uuid',
    wealthData: { real_estate_value: 2_000_000 },
  },
})
```

### Filter Prospects by Score

```typescript
const topTier = await getTopProspects({ minScore: 80, limit: 10 })
const secondTier = await getTopProspects({ minScore: 60, limit: 20 })
```

### Update Wealth Data

```typescript
// Via form component
<GivingPotentialForm
  contactId={contactId}
  initialData={data}
  onSuccess={() => console.log('Saved!')}
/>

// Via action
await saveGivingPotential({
  contact_id: contactId,
  real_estate_value: 3_000_000,
  employer: 'Updated Corp',
})
```

## Integration Points

### 1. Smart Ask
Uses capacity score to suggest donation amounts:
```typescript
import { calculateSmartAsk } from '@/lib/ai/smart-ask/calculate-amounts'

const amounts = await calculateSmartAsk({ contact_id: contactId })
// { stretch: $10k, target: $7.5k, accessible: $5k }
```

### 2. Major Gift Pipeline
Filters contacts by score for pipeline entry:
```typescript
// Prospects with 60+ score qualify for pipeline
const qualified = prospects.filter(p => p.overall_score >= 60)
```

### 3. Copilot Actions
Generates next steps based on scores:
```typescript
// High capacity + low affinity = cultivation opportunity
// High capacity + high affinity = ask opportunity
```

## Customization

### Adjust Thresholds

Edit `src/modules/giving-potential/services/score-calculator.ts`:

```typescript
const CAPACITY_THRESHOLDS = {
  REAL_ESTATE_MAX: 5_000_000,  // Max real estate for 100 score
  STOCKS_MAX: 2_000_000,        // Max stocks for 100 score
  POLITICAL_MAX: 50_000,        // Max political donations for 100 score
}
```

### Adjust Weights

```typescript
// Overall score calculation
const score =
  capacity * 0.4 +   // 40% weight (default)
  affinity * 0.3 +   // 30% weight (default)
  propensity * 0.3   // 30% weight (default)
```

## Troubleshooting

### No scores showing
1. Check if `giving_potential` record exists
2. Run score calculation manually
3. Verify Inngest is running: `npx inngest-cli dev`

### Scores seem wrong
1. Review threshold calibration for your donor base
2. Check if engagement data is accurate
3. Verify wealth data is entered correctly

### Slow performance
1. Ensure database indexes exist (check migration 019)
2. Add caching for top prospects queries
3. Use pagination for large prospect lists

## Testing

```bash
# Unit tests
npm test src/modules/giving-potential/services/score-calculator.test.ts

# E2E tests
npm run test:e2e tests/e2e/giving-potential.spec.ts
```

## Next Steps

1. Read full documentation: `/docs/GIVING_POTENTIAL_SYSTEM.md`
2. Review scoring algorithm details in `/src/modules/giving-potential/README.md`
3. Check component examples in `/src/modules/giving-potential/components/README.md`
4. Explore integration with Smart Ask and Major Gift Pipeline

## Quick Tips

✅ **DO:**
- Calibrate thresholds for your donor base
- Use radar charts for executive presentations
- Filter by multiple score dimensions
- Track giving gap for cultivation priorities
- Recalculate scores after algorithm changes

❌ **DON'T:**
- Rely solely on capacity scores (use all 3 dimensions)
- Ignore data quality issues (garbage in, garbage out)
- Hardcode score thresholds in queries
- Skip RLS policy checks in custom queries
- Expose raw wealth data in public-facing features

## Support

- **Documentation:** `/docs/GIVING_POTENTIAL_SYSTEM.md`
- **API Reference:** `/src/modules/giving-potential/API.md`
- **Component Docs:** `/src/modules/giving-potential/components/README.md`
