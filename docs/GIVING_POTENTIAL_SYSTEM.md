# Giving Potential Scoring System

## Overview

The Giving Potential Scoring System is a comprehensive 3D wealth screening solution for identifying major gift prospects in Flourish. It analyzes donors across three key dimensions:

1. **Capacity** - Financial ability to give (wealth indicators)
2. **Affinity** - Connection to the organization (engagement metrics)
3. **Propensity** - Likelihood to give (giving behavior patterns)

## Architecture

### Database Schema

**Table:** `giving_potential`

```sql
CREATE TABLE giving_potential (
  id UUID PRIMARY KEY,
  contact_id UUID UNIQUE REFERENCES contacts(id),
  organization_id UUID REFERENCES organizations(id),

  -- Wealth indicators
  estimated_net_worth DECIMAL,
  real_estate_value DECIMAL,
  stock_holdings DECIMAL,
  political_donations DECIMAL,
  nonprofit_board_count INTEGER,
  employer TEXT,
  job_title TEXT,

  -- Scores (0-100 scale)
  capacity_score INTEGER CHECK (capacity_score >= 0 AND capacity_score <= 100),
  affinity_score INTEGER CHECK (affinity_score >= 0 AND affinity_score <= 100),
  propensity_score INTEGER CHECK (propensity_score >= 0 AND propensity_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Analysis metrics
  giving_gap_ratio DECIMAL,
  data_sources JSONB,
  notes TEXT,

  -- Timestamps
  last_enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_giving_potential_contact_id` - Fast contact lookups
- `idx_giving_potential_organization_id` - Organization filtering
- `idx_giving_potential_overall_score` - Top prospects queries
- `idx_giving_potential_capacity_score` - High capacity filtering

### Module Structure

```
src/modules/giving-potential/
├── schemas/
│   └── giving-potential.schema.ts    # Zod validation schemas
├── services/
│   └── score-calculator.ts           # Pure scoring functions
├── queries/
│   ├── get-giving-potential.ts       # Fetch single contact data
│   └── get-top-prospects.ts          # Fetch ranked prospect lists
├── actions/
│   ├── calculate-scores.ts           # Server action for score calculation
│   └── save-giving-potential.ts      # Server action for saving data
└── components/
    ├── score-meter.tsx               # Linear and circular score meters
    ├── score-radar-chart.tsx         # 3D radar chart visualization (NEW)
    ├── giving-potential-panel.tsx    # Full detail panel for contact page
    ├── giving-potential-form.tsx     # Edit form for wealth data
    ├── giving-potential-badge.tsx    # Compact score badge
    └── prospect-list.tsx             # Sortable prospect table
```

## Scoring Algorithm

### 1. Capacity Score (0-100)

Measures financial ability to give based on wealth indicators.

**Weights:**
- Real estate value: 40%
- Stock holdings: 30%
- Job level: 20%
- Political donations: 10%

**Thresholds:**
```typescript
REAL_ESTATE_MAX: $5,000,000
STOCKS_MAX: $2,000,000
POLITICAL_MAX: $50,000
```

**Calculation:**
```typescript
capacityScore =
  (realEstate / REAL_ESTATE_MAX * 100) * 0.4 +
  (stocks / STOCKS_MAX * 100) * 0.3 +
  jobLevelScore * 0.2 +
  (politicalDonations / POLITICAL_MAX * 100) * 0.1
```

**Job Level Scores:**
- Entry: 20
- Mid: 40
- Senior: 60
- Executive: 80
- C-Suite: 100

### 2. Affinity Score (0-100)

Measures engagement and connection with the organization.

**Weights:**
- Lifetime giving relative to capacity: 40%
- Volunteer hours: 30%
- Email open rate: 20%
- Event attendance: 10%

**Thresholds:**
```typescript
VOLUNTEER_HOURS_MAX: 200
EMAIL_OPEN_RATE_MIN: 0.5 (50%)
EVENT_ATTENDANCE_MAX: 10
```

**Special Logic:**
- If capacity data exists, giving is measured as percentage of capacity
- Otherwise, absolute giving is normalized to $50k max
- Score normalizes based on available data points

### 3. Propensity Score (0-100)

Measures likelihood to give based on giving behavior patterns.

**Weights:**
- Recency of last gift: 40%
- Giving frequency: 30%
- Gift growth trend: 30%

**Thresholds:**
```typescript
RECENCY_MAX_DAYS: 365
FREQUENCY_MAX: 12 (gifts per year)
```

**Recency Calculation:**
```typescript
recencyScore = max(0, 100 - (daysSinceLastGift / 365) * 100)
```

**Frequency Calculation:**
```typescript
giftsPerYear = totalGifts / yearsBetweenFirstAndLast
frequencyScore = min(100, (giftsPerYear / 12) * 100)
```

**Growth Trend:**
- Uses gift count and average gift amount as proxies
- 10+ gifts = 100 points for count
- $500+ average = 100 points for amount

### 4. Overall Score (0-100)

Weighted composite of all three dimensions.

**Weights:**
- Capacity: 40%
- Affinity: 30%
- Propensity: 30%

```typescript
overallScore =
  (capacityScore * 0.4) +
  (affinityScore * 0.3) +
  (propensityScore * 0.3)
```

### 5. Giving Gap Analysis

Identifies untapped potential by comparing capacity to current giving.

```typescript
givingGapRatio = lifetimeGiving / estimatedCapacity
givingGap = estimatedCapacity - lifetimeGiving
```

**Lower ratio = Higher potential** (giving less than capacity suggests)

## API Reference

### Server Actions

#### Calculate Scores

```typescript
import { calculateScores, calculateScoresForContact } from '@/modules/giving-potential'

// Option 1: Calculate from raw data
const result = await calculateScores({
  wealthData: {
    real_estate_value: 2_000_000,
    stock_holdings: 500_000,
    political_donations: 10_000,
  },
  contactEngagement: {
    lifetime_giving: 25_000,
    gift_count: 15,
    total_volunteer_hours: 50,
  },
  estimatedCapacity: 150_000,
})

// Option 2: Calculate from contact ID (fetches data automatically)
const result = await calculateScoresForContact(contactId, {
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
})

if (result.success) {
  console.log(result.scores)
  // {
  //   capacity_score: 75,
  //   affinity_score: 60,
  //   propensity_score: 68,
  //   overall_score: 69,
  //   giving_gap_ratio: 0.167
  // }
}
```

#### Save Giving Potential

```typescript
import { saveGivingPotential } from '@/modules/giving-potential'

const result = await saveGivingPotential({
  contact_id: 'uuid',
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
  employer: 'Tech Corp',
  job_title: 'VP Engineering',
  capacity_score: 75,
  affinity_score: 60,
  propensity_score: 68,
  overall_score: 69,
  notes: 'Major gift prospect - tech exec',
})
```

### Queries

#### Get Top Prospects

```typescript
import { getTopProspects } from '@/modules/giving-potential'

const prospects = await getTopProspects({
  limit: 50,
  minScore: 60,
})

// Returns contacts sorted by overall_score DESC
```

#### Get Single Contact Data

```typescript
import { getGivingPotential } from '@/modules/giving-potential'

const data = await getGivingPotential(contactId)

if (data) {
  console.log(data.overall_score)
  console.log(data.capacity_score)
}
```

## Background Jobs (Inngest)

### Automatic Score Recalculation

**Function:** `recalculateGivingScores`

**Triggers:**
- **Cron:** Weekly on Sunday at 2 AM
- **Event:** `scores/recalculate.requested`

**Purpose:**
- Refresh scores based on updated contact data
- Recalculate after algorithm changes
- Periodic data maintenance

**Usage:**
```typescript
import { inngest } from '@/lib/inngest/client'

// Trigger recalculation for all contacts
await inngest.send({
  name: 'scores/recalculate.requested',
  data: {},
})

// Trigger for specific organization
await inngest.send({
  name: 'scores/recalculate.requested',
  data: { organizationId: 'uuid' },
})
```

### Single Contact Score Update

**Function:** `recalculateSingleContactScore`

**Trigger:** `contact/giving-potential.updated`

**Purpose:**
- Immediate score refresh when wealth data changes
- Real-time updates after form edits

**Usage:**
```typescript
await inngest.send({
  name: 'contact/giving-potential.updated',
  data: {
    contactId: 'uuid',
    wealthData: {
      real_estate_value: 2_000_000,
    },
  },
})
```

## Components

### Score Radar Chart (NEW)

3D visualization of Capacity, Affinity, and Propensity scores.

```typescript
import { ScoreRadarChart } from '@/modules/giving-potential'

<ScoreRadarChart
  capacityScore={75}
  affinityScore={60}
  propensityScore={68}
  size={280}
  animated={true}
/>
```

**Features:**
- Triangular radar chart with 3 axes
- Color-coded by score ranges
- Animated on mount
- Interactive labels showing individual scores

### Giving Potential Panel

Full detail panel for contact detail pages.

```typescript
import { GivingPotentialPanel } from '@/modules/giving-potential'

<GivingPotentialPanel
  contactId={contactId}
  data={givingPotentialData}
/>
```

**Features:**
- Overall score with circular meter
- Individual score breakdowns
- Giving gap analysis
- Wealth indicators display
- Edit functionality

### Prospect List

Sortable table of top prospects.

```typescript
import { ProspectList } from '@/modules/giving-potential'

<ProspectList
  prospects={prospects}
/>
```

**Features:**
- Sortable columns (name, scores, capacity, gap)
- Color-coded scores
- Click to view contact details
- Summary footer with totals

## Integration Points

### 1. Contact Detail Page

**Location:** `/src/app/(dashboard)/contacts/[id]/page.tsx`

```typescript
const givingPotentialData = await getGivingPotential(id)

// Display in sidebar or tab
<ContactGivingPotential data={givingPotentialData} />
```

### 2. Top Prospects Page

**Location:** `/src/app/(dashboard)/prospects/page.tsx`

Shows ranked list of contacts by giving potential.

**Features:**
- Stats dashboard (total prospects, average score, high potential count)
- Filterable prospect list
- Direct links to contact details

### 3. Smart Ask Integration

**Location:** `/src/modules/smart-ask/`

Uses capacity scores to suggest donation amounts.

```typescript
import { calculateSmartAsk } from '@/lib/ai/smart-ask/calculate-amounts'

const result = await calculateSmartAsk({
  contact_id: contactId,
})

// Returns:
// {
//   stretch: $10,000  (capacity * 1.5)
//   target: $7,500    (capacity * 1.2)
//   accessible: $5,000 (capacity * 1.0)
// }
```

### 4. Major Gift Pipeline

**Location:** `/src/modules/pipeline/`

Filters prospects by score thresholds for pipeline entry.

## Score Interpretation

### Overall Score Ranges

| Score | Category | Description |
|-------|----------|-------------|
| 80-100 | Top Prospect | High capacity, affinity, and propensity |
| 60-79 | Strong Prospect | Good potential for major gift |
| 40-59 | Moderate Prospect | Worth cultivation |
| 20-39 | Emerging Prospect | Build relationship |
| 0-19 | Low Priority | Focus on higher-scoring prospects |

### Capacity Score Ranges

| Score | Category | Description |
|-------|----------|-------------|
| 80-100 | Very High | Major gift prospect ($1M+ capacity) |
| 60-79 | High | Significant capacity ($250k-$1M) |
| 40-59 | Medium | Moderate capacity ($50k-$250k) |
| 20-39 | Low | Limited capacity ($10k-$50k) |
| 0-19 | Minimal | Unknown or very limited capacity |

### Affinity Score Ranges

| Score | Category | Description |
|-------|----------|-------------|
| 80-100 | Very High | Deeply engaged with mission |
| 60-79 | High | Strong connection |
| 40-59 | Medium | Moderate engagement |
| 20-39 | Low | Limited engagement |
| 0-19 | Minimal | Little to no engagement |

### Propensity Score Ranges

| Score | Category | Description |
|-------|----------|-------------|
| 80-100 | Very High | Active and growing giving pattern |
| 60-79 | High | Regular giving pattern |
| 40-59 | Medium | Occasional giving |
| 20-39 | Low | Infrequent giving |
| 0-19 | Minimal | Lapsed or one-time donor |

## Customization

### Adjust Score Thresholds

Edit `/src/modules/giving-potential/services/score-calculator.ts`:

```typescript
const CAPACITY_THRESHOLDS = {
  REAL_ESTATE_MAX: 5_000_000,  // Adjust for your market
  STOCKS_MAX: 2_000_000,        // Adjust for donor base
  POLITICAL_MAX: 50_000,        // Adjust for region
}

const AFFINITY_THRESHOLDS = {
  VOLUNTEER_HOURS_MAX: 200,     // Adjust for program intensity
  EMAIL_OPEN_RATE_MIN: 0.5,     // Adjust for email strategy
  EVENT_ATTENDANCE_MAX: 10,      // Adjust for event frequency
}

const PROPENSITY_THRESHOLDS = {
  RECENCY_MAX_DAYS: 365,        // Adjust for giving cycle
  FREQUENCY_MAX: 12,            // Adjust for desired frequency
}
```

### Adjust Score Weights

Edit scoring functions in `score-calculator.ts`:

```typescript
// Overall score weights
export function calculateOverallScore(
  capacity: number,
  affinity: number,
  propensity: number
): number {
  // Default: Capacity 40%, Affinity 30%, Propensity 30%
  const score = capacity * 0.4 + affinity * 0.3 + propensity * 0.3
  return Math.round(Math.min(100, score))
}
```

## Future Enhancements

### Phase 2: External Data Integration
- [ ] WealthEngine API integration
- [ ] iWave prospect research
- [ ] Public records screening
- [ ] LinkedIn profile enrichment

### Phase 3: Machine Learning
- [ ] Predictive modeling for gift likelihood
- [ ] Campaign-specific propensity scores
- [ ] Optimal ask amount predictions
- [ ] Lapse risk integration

### Phase 4: Advanced Analytics
- [ ] Peer comparison analysis
- [ ] Gift range recommendations
- [ ] Cultivation strategy suggestions
- [ ] ROI tracking for prospect outreach

### Phase 5: Automation
- [ ] Auto-assign prospects to gift officers
- [ ] Smart prospect pool creation
- [ ] Automated cultivation tracking
- [ ] Pipeline stage recommendations

## Security & Privacy

### Row Level Security (RLS)

All giving potential data is protected by Supabase RLS policies:

```sql
-- Users can only view/edit giving potential for contacts in their organization
CREATE POLICY "Users can view giving potential in their organization"
  ON giving_potential FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));
```

### Data Sensitivity

Wealth screening data is highly sensitive:
- ✅ Encrypted at rest (Supabase default)
- ✅ Organization-scoped access
- ✅ Audit logging via updated_at timestamps
- ⚠️ Consider additional encryption for estimated_net_worth
- ⚠️ Regular data retention reviews

### Compliance Considerations

- **GDPR:** Right to erasure applies to wealth data
- **CCPA:** Personal financial information requires disclosure
- **Ethical Fundraising:** Transparent data sources
- **AFP Code of Ethics:** Donor privacy protection

## Testing

### Unit Tests

```typescript
// services/score-calculator.test.ts
describe('calculateCapacityScore', () => {
  it('should calculate score based on wealth indicators', () => {
    const score = calculateCapacityScore({
      real_estate_value: 2_000_000,
      stock_holdings: 500_000,
      job_level: 'executive',
    })
    expect(score).toBeGreaterThan(60)
  })
})
```

### E2E Tests

```typescript
// tests/e2e/giving-potential.spec.ts
test('should display giving potential on contact page', async ({ page }) => {
  await page.goto('/contacts/abc123')
  await expect(page.getByText('Giving Potential')).toBeVisible()
  await expect(page.getByText(/Capacity: \d+/)).toBeVisible()
})
```

## Performance Optimization

### Database Indexes

All critical queries use indexes:
```sql
-- Fast prospect queries
EXPLAIN ANALYZE
SELECT * FROM giving_potential
WHERE organization_id = 'uuid'
  AND overall_score >= 60
ORDER BY overall_score DESC
LIMIT 50;
-- Uses: idx_giving_potential_overall_score
```

### Caching Strategy

Consider implementing caching for:
- Top prospects list (5 min TTL)
- Organization-wide stats (15 min TTL)
- Individual contact scores (cache until update)

### Batch Processing

Inngest job processes scores in batches of 10 to avoid memory issues:

```typescript
const BATCH_SIZE = 10
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  await step.run(`batch-${i}`, async () => {
    // Process batch
  })
}
```

## Troubleshooting

### Scores not updating

1. Check if Inngest is running: `npx inngest-cli dev`
2. Verify contact has giving history
3. Check for calculation errors in logs
4. Manually trigger recalculation:
```typescript
await inngest.send({
  name: 'scores/recalculate.requested',
  data: { organizationId: 'uuid' },
})
```

### Missing wealth data

1. Check if `giving_potential` record exists
2. Verify RLS policies allow access
3. Use form to add wealth data manually
4. Consider external data enrichment

### Poor score quality

1. Review threshold calibration for your donor base
2. Adjust weights based on fundraising strategy
3. Ensure engagement data is accurate
4. Consider industry/regional adjustments

## Support

For questions or issues:
- Internal: Review module README and API docs
- External: Contact Flourish support team
- Technical: Check GitHub issues and discussions
