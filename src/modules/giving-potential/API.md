# Giving Potential Module - API Reference

## Queries (Data Fetching)

### `getGivingPotential(contactId: string)`
Fetch giving potential data for a single contact.

**Returns:** `Promise<GivingPotentialData | null>`

**Example:**
```typescript
const data = await getGivingPotential('contact-uuid')
if (data) {
  console.log(data.overall_score) // 85
}
```

---

### `hasGivingPotential(contactId: string)`
Check if a contact has giving potential data.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const hasData = await hasGivingPotential('contact-uuid')
if (!hasData) {
  // Show "Calculate Scores" button
}
```

---

### `getTopProspects(options?: GetTopProspectsOptions)`
Get top prospects sorted by overall score.

**Options:**
- `limit?: number` - Maximum results (default: 20)
- `minScore?: number` - Minimum overall score (default: 0)
- `includeUnscored?: boolean` - Include contacts without scores (default: false)

**Returns:** `Promise<TopProspect[]>`

**Example:**
```typescript
const prospects = await getTopProspects({
  limit: 50,
  minScore: 70
})
```

---

### `getHighCapacityProspects(options?: GetTopProspectsOptions)`
Get prospects with high capacity scores (regardless of current giving).

**Options:**
- `limit?: number` - Maximum results (default: 20)
- `minScore?: number` - Minimum capacity score (default: 60)

**Returns:** `Promise<TopProspect[]>`

**Example:**
```typescript
const highCapacity = await getHighCapacityProspects({
  limit: 20,
  minScore: 80
})
```

---

### `getUntappedProspects(options?: GetTopProspectsOptions)`
Get prospects with high capacity but low giving gap (giving less than 10% of potential).

**Options:**
- `limit?: number` - Maximum results (default: 20)
- `minScore?: number` - Minimum capacity score (default: 60)

**Returns:** `Promise<TopProspect[]>`

**Example:**
```typescript
const untapped = await getUntappedProspects({ limit: 20 })
```

---

## Actions (Server Mutations)

### `saveGivingPotential(input: CreateGivingPotentialInput)`
Create or update a giving potential record (upsert).

**Input:**
```typescript
{
  contact_id: string
  estimated_net_worth?: number | null
  real_estate_value?: number | null
  stock_holdings?: number | null
  political_donations?: number | null
  nonprofit_board_count?: number
  employer?: string | null
  job_title?: string | null
  capacity_score?: number | null
  affinity_score?: number | null
  propensity_score?: number | null
  overall_score?: number | null
  giving_gap_ratio?: number | null
  data_sources?: Record<string, any>
  notes?: string | null
  last_enriched_at?: string | null
}
```

**Returns:** `Promise<SaveGivingPotentialResult>`

**Example:**
```typescript
const result = await saveGivingPotential({
  contact_id: 'contact-uuid',
  real_estate_value: 2_000_000,
  capacity_score: 85,
  affinity_score: 60,
  propensity_score: 72,
  overall_score: 74
})

if (result.success) {
  console.log('Saved:', result.id)
} else {
  console.error(result.error)
}
```

---

### `deleteGivingPotential(contactId: string)`
Delete giving potential record for a contact.

**Returns:** `Promise<SaveGivingPotentialResult>`

**Example:**
```typescript
const result = await deleteGivingPotential('contact-uuid')
```

---

### `calculateScores(input: CalculateScoresInput)`
Calculate all scores from raw wealth and engagement data.

**Input:**
```typescript
{
  wealthData?: {
    estimated_net_worth?: number
    real_estate_value?: number
    stock_holdings?: number
    political_donations?: number
    job_level?: 'entry' | 'mid' | 'senior' | 'executive' | 'c-suite'
  }
  contactEngagement?: {
    lifetime_giving?: number
    gift_count?: number
    total_volunteer_hours?: number
    email_open_rate?: number
    event_attendance_count?: number
    last_gift_date?: string
    first_gift_date?: string
    avg_gift_amount?: number
  }
  estimatedCapacity?: number
}
```

**Returns:** `Promise<CalculateScoresResult>`

**Example:**
```typescript
const result = await calculateScores({
  wealthData: {
    real_estate_value: 2_000_000,
    stock_holdings: 500_000,
    job_level: 'executive'
  },
  contactEngagement: {
    lifetime_giving: 50_000,
    gift_count: 12,
    total_volunteer_hours: 100
  },
  estimatedCapacity: 200_000
})

if (result.success) {
  console.log(result.scores)
  // {
  //   capacity_score: 85,
  //   affinity_score: 60,
  //   propensity_score: 72,
  //   overall_score: 74,
  //   giving_gap_ratio: 0.25
  // }
}
```

---

### `calculateScoresForContact(contactId: string, wealthData?: WealthData)`
Fetch contact data and calculate scores automatically.

**Returns:** `Promise<CalculateScoresResult>`

**Example:**
```typescript
const result = await calculateScoresForContact('contact-uuid', {
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
  job_level: 'executive'
})

if (result.success) {
  // Automatically includes giving history, volunteer hours, etc.
  await saveGivingPotential({
    contact_id: 'contact-uuid',
    ...result.scores
  })
}
```

---

### `recalculateAllScores()`
Batch recalculate scores for all contacts with giving potential.

**Returns:** `Promise<{ success: boolean; updated: number; errors: number }>`

**Example:**
```typescript
const result = await recalculateAllScores()
console.log(`Updated ${result.updated} contacts, ${result.errors} errors`)
```

---

## Services (Pure Functions)

### `calculateCapacityScore(data: WealthData): number`
Calculate capacity score (0-100) from wealth indicators.

**Example:**
```typescript
const score = calculateCapacityScore({
  real_estate_value: 2_000_000,
  stock_holdings: 500_000,
  job_level: 'executive'
})
// Returns: 75
```

---

### `calculateAffinityScore(contactData: ContactEngagement, estimatedCapacity?: number): number`
Calculate affinity score (0-100) from engagement data.

**Example:**
```typescript
const score = calculateAffinityScore({
  lifetime_giving: 50_000,
  total_volunteer_hours: 100,
  email_open_rate: 0.65
}, 200_000)
// Returns: 68
```

---

### `calculatePropensityScore(contactData: ContactEngagement): number`
Calculate propensity score (0-100) from giving behavior.

**Example:**
```typescript
const score = calculatePropensityScore({
  last_gift_date: '2024-11-01',
  gift_count: 12,
  avg_gift_amount: 500
})
// Returns: 82
```

---

### `calculateOverallScore(capacity: number, affinity: number, propensity: number): number`
Calculate weighted overall score.

**Example:**
```typescript
const overall = calculateOverallScore(75, 68, 82)
// Returns: 74 (capacity 40% + affinity 30% + propensity 30%)
```

---

### `calculateGivingGapRatio(lifetimeGiving: number, estimatedCapacity: number): number | null`
Calculate ratio of current giving to estimated capacity.

**Example:**
```typescript
const ratio = calculateGivingGapRatio(50_000, 200_000)
// Returns: 0.25 (giving 25% of capacity)
```

---

### Score Description Helpers

#### `getCapacityDescription(score: number): string`
Get human-readable capacity description.

#### `getAffinityDescription(score: number): string`
Get human-readable affinity description.

#### `getPropensityDescription(score: number): string`
Get human-readable propensity description.

#### `getOverallDescription(score: number): string`
Get human-readable overall description.

**Example:**
```typescript
console.log(getOverallDescription(85))
// "Top Prospect - High capacity, affinity, and propensity"
```

---

## Types

### `GivingPotentialData`
Complete giving potential record from database.

### `TopProspect`
Prospect record with contact info and scores.

### `WealthData`
Wealth indicators for score calculation.

### `ContactEngagement`
Engagement metrics for score calculation.

### `CalculatedScores`
Result of score calculation (all four scores + giving gap ratio).

### `CreateGivingPotentialInput`
Input for creating/updating giving potential record.

### `SaveGivingPotentialResult`
Result type for save/delete operations.

### `CalculateScoresResult`
Result type for score calculation.
