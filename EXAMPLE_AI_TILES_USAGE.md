# AI Tiles Refresh - Usage Examples

This document shows how to use the new AI tiles refresh background jobs.

## Architecture Overview

The AI tiles refresh system consists of:

1. **Cache Layer** (`src/lib/ai-tiles/cache.ts`) - Manages cached tile data in organization settings
2. **Generators** (`src/lib/ai-tiles/generators/`) - Functions that generate AI insights for each tile type
3. **Inngest Jobs** (`src/lib/inngest/functions/refresh-ai-tiles.ts`) - Background jobs that refresh tiles on schedule or demand
4. **Server Actions** (`src/lib/ai-tiles/actions/trigger-refresh.ts`) - API for triggering manual refreshes

## Scheduled Refresh (Automatic)

The `refreshAITilesCron` function runs daily at 5 AM UTC and automatically refreshes all enabled tiles for all organizations.

```typescript
// This runs automatically - no code needed!
// Schedule: Daily at 5 AM UTC (cron: '0 5 * * *')
```

## Manual Refresh (User-Triggered)

### 1. Refresh All Tiles for Current Organization

```typescript
'use client'

import { triggerFullRefresh } from '@/lib/ai-tiles/actions'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function RefreshAllTilesButton() {
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    const result = await triggerFullRefresh()

    if (result.success) {
      // Show success toast
      console.log(result.message)
    } else {
      // Show error toast
      console.error(result.error)
    }

    setLoading(false)
  }

  return (
    <Button onClick={handleRefresh} disabled={loading}>
      {loading ? 'Refreshing...' : 'Refresh All Tiles'}
    </Button>
  )
}
```

### 2. Refresh Specific Tiles

```typescript
'use client'

import { triggerTilesRefresh } from '@/lib/ai-tiles/actions'
import { Button } from '@/components/ui/button'

export function RefreshDonorTilesButton() {
  const handleRefresh = async () => {
    // Refresh only donor-related tiles
    const result = await triggerTilesRefresh(['donor-health', 'weekly-priorities'])

    if (result.success) {
      console.log(result.message)
    }
  }

  return (
    <Button onClick={handleRefresh}>
      Refresh Donor Tiles
    </Button>
  )
}
```

### 3. Refresh a Single Tile

```typescript
'use client'

import { triggerTileRefresh } from '@/lib/ai-tiles/actions'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DonorHealthTile({ data }: { data: any }) {
  const handleRefresh = async () => {
    // Refresh just the donor-health tile
    await triggerTileRefresh('donor-health')
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Donor Health</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tile content */}
      <div>{data?.summary}</div>
    </div>
  )
}
```

### 4. Refresh a Custom Tile

```typescript
'use client'

import { triggerTileRefresh } from '@/lib/ai-tiles/actions'

export function CustomTile({ tileId }: { tileId: string }) {
  const handleRefresh = async () => {
    // Refresh a custom tile by ID
    await triggerTileRefresh('custom', tileId)
  }

  return (
    <button onClick={handleRefresh}>
      Refresh Custom Tile
    </button>
  )
}
```

## Getting Cached Tile Data

```typescript
import { getCachedTileData } from '@/lib/ai-tiles/cache'
import type { DonorHealthInsight } from '@/lib/ai-tiles/generators'

export async function DonorHealthPage() {
  // Get cached data (server component)
  const data = await getCachedTileData<DonorHealthInsight>(
    organizationId,
    'donor-health'
  )

  if (!data) {
    // No cached data - trigger a refresh
    return <div>Loading insights...</div>
  }

  return (
    <div>
      <h2>{data.summary}</h2>
      <ul>
        {data.atRiskDonors.map(donor => (
          <li key={donor.id}>
            {donor.name} - {donor.reason}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Programmatic Refresh with Inngest

You can also trigger refreshes programmatically by sending Inngest events:

```typescript
import { inngest } from '@/lib/inngest/client'

// Refresh all tiles for an organization
await inngest.send({
  name: 'ai-tiles/refresh',
  data: {
    organizationId: 'org_123',
  }
})

// Refresh specific tiles
await inngest.send({
  name: 'ai-tiles/refresh',
  data: {
    organizationId: 'org_123',
    tileTypes: ['donor-health', 'weekly-priorities']
  }
})

// Refresh a single tile
await inngest.send({
  name: 'ai-tiles/refresh-single',
  data: {
    organizationId: 'org_123',
    tileType: 'donor-health'
  }
})
```

## Cache Management

The cache system automatically:
- Stores tile data in organization settings (JSONB)
- Sets expiration times (TTL)
- Checks for expired data before returning cached results

### Cache TTLs
- **Donor Health**: 24 hours
- **Weekly Priorities**: 12 hours (refreshes more frequently)
- **Org Pulse**: 24 hours
- **Custom Tiles**: 24 hours (configurable)

### Manual Cache Clearing

```typescript
import { clearCachedTileData } from '@/lib/ai-tiles/cache'

// Clear a specific tile's cache
await clearCachedTileData(organizationId, 'donor-health')

// Clear all cached tiles
await clearCachedTileData(organizationId)
```

## Error Handling

All generator functions include fallback logic:

```typescript
try {
  const insights = await generateDonorHealthInsights(organizationId)
  // Use AI-generated insights
} catch (error) {
  // Falls back to rule-based insights if AI fails
  console.error('AI generation failed, using fallback')
}
```

## Monitoring with Inngest

You can monitor the refresh jobs in the Inngest dashboard:

1. Start Inngest dev server: `npx inngest-cli@latest dev`
2. Visit http://localhost:8288
3. View function runs, logs, and errors

## Cost Tracking

All AI tile generations are tracked in the `ai_usage` table:

```typescript
// Usage is automatically tracked with emailType for tiles:
// - 'tile_donor_health'
// - 'tile_weekly_priorities'
// - 'tile_org_pulse'
// - 'tile_custom'
```

## Testing

Test the refresh jobs locally:

```bash
# Start Inngest dev server
npx inngest-cli@latest dev

# Trigger a test event (in your app)
await inngest.send({
  name: 'ai-tiles/refresh',
  data: { organizationId: 'test_org' }
})
```
