# AI Tiles System

AI-powered dashboard tiles that provide insights and recommendations based on organizational data.

## Overview

The AI Tiles system uses Claude AI to generate intelligent insights from your organization's donor, volunteer, and activity data. Tiles are cached for performance and can be refreshed on-demand or on a schedule.

## Architecture

```
src/lib/ai-tiles/
├── context-builder.ts      # Aggregates data from Supabase
├── cache.ts                # Caching layer using org settings
├── registry.ts             # Built-in tile definitions
├── queries.ts              # Get enabled tiles and cache
├── actions.ts              # Enable/disable, create custom tiles
├── generators/
│   ├── donor-health.ts     # Donor health insights
│   ├── weekly-priorities.ts# Weekly action priorities
│   ├── org-pulse.ts        # Overall org health
│   └── custom.ts           # Custom user-defined tiles
└── index.ts                # Public exports
```

## Built-in Tiles

### 1. Donor Health Scores
- **ID**: `donor-health`
- **Refresh**: Daily
- **Data Sources**: donors, gifts, contacts
- **Insights**:
  - At-risk donors with recommended actions
  - Giving trends (up, down, stable)
  - Actionable retention recommendations

### 2. Weekly Priorities
- **ID**: `weekly-priorities`
- **Refresh**: Weekly
- **Data Sources**: donors, volunteers, tasks, communications
- **Insights**:
  - Top 5-7 priority contacts to engage
  - Quick wins (achievable in 1-2 hours)
  - Strategic focus areas for the week

### 3. Organization Pulse
- **ID**: `org-pulse`
- **Refresh**: Daily
- **Data Sources**: donors, volunteers, gifts, contacts, communications, shifts
- **Insights**:
  - Overall health score (0-100)
  - Key metrics with trends
  - Alerts and opportunities

## Usage

### Generating Insights

```typescript
import {
  generateDonorHealthInsights,
  generateWeeklyPrioritiesInsights,
  generateOrgPulseInsights,
  generateCustomTileInsights,
} from '@/lib/ai-tiles'

// Generate donor health insights
const donorHealth = await generateDonorHealthInsights(organizationId)

// Generate weekly priorities
const priorities = await generateWeeklyPrioritiesInsights(organizationId)

// Generate org pulse
const pulse = await generateOrgPulseInsights(organizationId)

// Generate custom tile
const custom = await generateCustomTileInsights(
  organizationId,
  'What is our donor retention rate?',
  ['donors', 'activity'],
  'tile-id-123'
)
```

### Working with Cache

```typescript
import {
  getCachedTileData,
  setCachedTileData,
  invalidateTileCache,
} from '@/lib/ai-tiles'

// Get cached data
const cached = await getCachedTileData<DonorHealthInsight>(
  organizationId,
  'donor-health'
)

// Set cache (expires in 24 hours by default)
await setCachedTileData(
  organizationId,
  'donor-health',
  insights,
  undefined,
  24
)

// Invalidate cache
await invalidateTileCache(organizationId, 'donor-health')
```

### Building Context

```typescript
import { buildTileContext, serializeTileContext } from '@/lib/ai-tiles'

// Build context for specific data sources
const context = await buildTileContext(organizationId, [
  'donors',
  'volunteers',
  'activity',
])

// Serialize for AI prompts
const contextStr = serializeTileContext(context)
```

## Custom Tiles

Users can create custom tiles with their own prompts:

```typescript
import {
  generateCustomTileInsights,
  validateCustomPrompt,
  getSuggestedCustomPrompts,
} from '@/lib/ai-tiles'

// Validate prompt
const validation = validateCustomPrompt('What is our donor retention rate?')
if (!validation.valid) {
  console.error(validation.error)
}

// Generate custom insights
const insights = await generateCustomTileInsights(
  organizationId,
  'Which volunteers are most engaged and should we recognize?',
  ['volunteers'],
  'custom-tile-uuid'
)

// Get suggested prompts
const suggestions = getSuggestedCustomPrompts()
```

## Response Types

### DonorHealthInsight
```typescript
interface DonorHealthInsight {
  summary: string
  atRiskDonors: Array<{
    id: string
    name: string
    riskLevel: 'high' | 'medium' | 'low'
    reason: string
    suggestedAction: string
    optimalAskAmount?: number
  }>
  givingTrends: {
    direction: 'up' | 'down' | 'stable'
    percentChange: number
    insight: string
  }
  recommendations: string[]
}
```

### WeeklyPrioritiesInsight
```typescript
interface WeeklyPrioritiesInsight {
  summary: string
  priorityContacts: Array<{
    id: string
    name: string
    type: 'donor' | 'volunteer' | 'prospect'
    priority: 'urgent' | 'high' | 'medium'
    reason: string
    suggestedAction: string
    successProbability: number // 0-100
  }>
  quickWins: string[]
  focusAreas: string[]
}
```

### OrgPulseInsight
```typescript
interface OrgPulseInsight {
  overallHealth: 'excellent' | 'good' | 'fair' | 'needs-attention'
  healthScore: number // 0-100
  summary: string
  metrics: Array<{
    name: string
    value: string
    trend: 'up' | 'down' | 'stable'
    insight: string
  }>
  alerts: Array<{
    type: 'warning' | 'info' | 'success'
    message: string
  }>
  opportunities: string[]
}
```

### CustomTileInsight
```typescript
interface CustomTileInsight {
  summary: string
  insights: string[]
  data: Record<string, unknown>
}
```

## AI Model and Cost

All tiles use **Claude Haiku 4.5** for cost efficiency:
- Fast response times (typically < 2 seconds)
- Low cost (~$0.001 - $0.005 per tile generation)
- Excellent quality for analytical tasks

Token usage is tracked in the `ai_usage` table:
```typescript
await trackUsage({
  organizationId,
  inputTokens: response.usage.inputTokens,
  outputTokens: response.usage.outputTokens,
  cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
  cacheReadInputTokens: response.usage.cacheReadInputTokens,
  model: response.model,
  emailType: 'tile_donor_health', // or tile_weekly_priorities, tile_org_pulse, tile_custom
})
```

## Caching Strategy

- **Storage**: Organization settings JSONB column
- **Default TTL**: 24 hours for most tiles, 12 hours for priorities
- **Cache Keys**: `{tileType}` or `{tileType}:{customTileId}`
- **Invalidation**: On-demand or automatic on data changes

### Cache Flow
1. Check cache on tile generation
2. If cached and not expired, return immediately
3. If expired or missing, generate new insights
4. Store in cache with TTL
5. Return to user

## Error Handling

All generators include fallback logic:
```typescript
try {
  // AI generation
  const response = await generateWithCaching(...)
  return parseAndValidate(response)
} catch (error) {
  console.error('Error generating insights:', error)
  // Return rule-based fallback
  return generateFallback(context)
}
```

Fallbacks provide:
- Basic metrics from raw data
- Generic recommendations
- Error information for debugging

## Performance

- **Average generation time**: 1-2 seconds
- **Cache hit rate**: ~80% (with daily refresh)
- **Cost per generation**: $0.001 - $0.005
- **Concurrent limit**: 5 tiles per batch

## Refresh Schedule

Configure via Inngest or manual refresh:

```typescript
// Daily refresh (runs at 6 AM)
await Promise.all([
  generateDonorHealthInsights(orgId),
  generateOrgPulseInsights(orgId),
])

// Weekly refresh (runs Monday 6 AM)
await generateWeeklyPrioritiesInsights(orgId)
```

## Best Practices

1. **Cache Management**
   - Invalidate cache when underlying data changes significantly
   - Use appropriate TTL based on data volatility
   - Monitor cache hit rates

2. **Cost Optimization**
   - Use caching to reduce API calls
   - Batch tile generations when possible
   - Set reasonable refresh schedules

3. **User Experience**
   - Show loading states during generation
   - Display cached timestamp
   - Provide manual refresh option

4. **Custom Tiles**
   - Validate prompts before generation
   - Limit prompt length to 500 characters
   - Select appropriate data sources
   - Provide example prompts to users

## Testing

```typescript
// Test insight generation
const insights = await generateDonorHealthInsights('org-123')
expect(insights.summary).toBeDefined()
expect(insights.recommendations.length).toBeGreaterThan(0)

// Test caching
await setCachedTileData('org-123', 'donor-health', insights)
const cached = await getCachedTileData('org-123', 'donor-health')
expect(cached).toEqual(insights)

// Test context builder
const context = await buildTileContext('org-123', ['donors'])
expect(context.donorSummary).toBeDefined()
```

## Monitoring

Track AI tile usage in your dashboard:
- Total generations per day/week
- Cache hit rates
- Average generation time
- Cost per tile type
- Popular custom prompts

## Future Enhancements

- [ ] Predictive analytics (donor churn, volunteer retention)
- [ ] Comparative analysis (month-over-month, year-over-year)
- [ ] A/B testing for recommendations
- [ ] Multi-language support
- [ ] Export insights to PDF/CSV
