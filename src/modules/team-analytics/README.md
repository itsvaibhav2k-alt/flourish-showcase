# Team Analytics Module

Track team member activity and performance across your organization.

## Overview

The Team Analytics module provides insights into team member productivity and activity patterns. It tracks:
- Contacts added
- Gifts recorded
- Emails sent
- Notes created

## Database Schema

### Migration: `036_team_analytics.sql`

Adds tracking fields to existing tables:
- `contacts.created_by` - UUID reference to auth.users
- `gifts.recorded_by` - UUID reference to auth.users
- `email_drafts.created_by` - UUID reference to auth.users
- `notes.created_by` - Already exists

### Materialized View: `team_activity_stats`

A high-performance materialized view that aggregates team member activity across multiple time periods:
- Last 7 days
- Last 30 days
- Last 90 days
- All time

**Important:** The materialized view should be refreshed periodically for up-to-date data:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY team_activity_stats;
```

Or use the helper function:

```sql
SELECT refresh_team_activity_stats();
```

Recommended refresh schedule: Hourly via cron job or scheduled task.

## API Reference

### Queries

#### `getTeamStats(dateRange)`

Get aggregated team statistics for a specific date range.

**Parameters:**
- `dateRange`: `'7d' | '30d' | '90d' | 'all'` - Time period to analyze

**Returns:**
```typescript
{
  overview: TeamOverviewStats,
  members: TeamMemberStats[]
}
```

**Example:**
```typescript
import { getTeamStats } from '@/modules/team-analytics'

const { overview, members } = await getTeamStats('30d')
console.log(`Total activities: ${overview.total_activities}`)
```

#### `getMemberActivity(userId, limit)`

Get detailed activity timeline for a specific team member.

**Parameters:**
- `userId`: string - User ID to fetch activity for
- `limit`: number - Maximum number of activities to return (default: 50)

**Returns:**
```typescript
{
  user_id: string,
  email: string,
  full_name: string | null,
  activities: MemberActivityDetail[]
}
```

**Example:**
```typescript
import { getMemberActivity } from '@/modules/team-analytics'

const timeline = await getMemberActivity(userId, 100)
timeline.activities.forEach(activity => {
  console.log(`${activity.type}: ${activity.description}`)
})
```

## Components

### `TeamOverviewCards`

Displays key metrics in card format.

**Props:**
- `stats: TeamOverviewStatsNew` - Overview statistics
- `dateRange: DateRangeType` - Current date range filter

### `ActivityLeaderboard`

Shows ranked list of team members by activity count.

**Props:**
- `members: TeamMemberStatsNew[]` - Array of team member stats
- `dateRange: DateRangeType` - Current date range filter

### `MemberStatsGrid`

Displays individual member cards in a grid layout.

**Props:**
- `members: TeamMemberStatsNew[]` - Array of team member stats

### `ActivityChart`

Bar chart showing activity breakdown for top 10 members.

**Props:**
- `members: TeamMemberStatsNew[]` - Array of team member stats
- `dateRange: DateRangeType` - Current date range filter

### `DateRangeSelector`

Toggle buttons for selecting time period.

**Props:**
- `selected: DateRangeType` - Currently selected range
- `onChange: (range: DateRangeType) => void` - Change handler

## Usage Example

```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  TeamOverviewCards,
  ActivityLeaderboard,
  DateRangeSelector,
  getTeamStats,
  type DateRangeType
} from '@/modules/team-analytics'

export default function TeamPage() {
  const [dateRange, setDateRange] = useState<DateRangeType>('30d')
  const [data, setData] = useState(null)

  useEffect(() => {
    async function load() {
      const stats = await getTeamStats(dateRange)
      setData(stats)
    }
    load()
  }, [dateRange])

  if (!data) return <div>Loading...</div>

  return (
    <div>
      <DateRangeSelector selected={dateRange} onChange={setDateRange} />
      <TeamOverviewCards stats={data.overview} dateRange={dateRange} />
      <ActivityLeaderboard members={data.members} dateRange={dateRange} />
    </div>
  )
}
```

## Navigation

The Team Analytics page is available at `/team-analytics` and is visible to admin users only.

## Performance Considerations

1. **Materialized View Refresh**: Schedule regular refreshes of `team_activity_stats` to keep data current
2. **Indexes**: All `created_by` fields have indexes for fast lookups
3. **Query Optimization**: The materialized view pre-aggregates data to avoid expensive joins at query time

## Future Enhancements

Potential improvements:
- Activity heatmap showing when team members are most active
- Trend analysis comparing periods
- Export functionality for team reports
- Individual member detail pages
- Activity goals and benchmarks
- Team collaboration metrics (shared contacts, tag usage, etc.)
