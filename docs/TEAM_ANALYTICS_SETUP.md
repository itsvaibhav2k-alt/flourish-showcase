# Team Analytics Module - Setup Guide

This guide walks through setting up and using the new Team Analytics module in Flourish.

## What is Team Analytics?

Team Analytics provides insights into team member productivity and activity across your organization. It tracks:
- Contacts added by each team member
- Gifts recorded by each team member
- Emails sent by each team member
- Notes created by each team member

The module includes:
- Overview dashboard with key metrics
- Activity leaderboard showing top performers
- Individual member cards with detailed breakdowns
- Interactive charts showing activity distribution
- Flexible date range filtering (7d, 30d, 90d, all time)

## Installation Steps

### 1. Apply Database Migration

Run the migration to add tracking fields and create the analytics view:

```bash
# Using Supabase CLI (recommended)
npx supabase db push

# Or manually apply the migration
psql $DATABASE_URL < supabase/migrations/036_team_analytics.sql
```

This migration:
- Adds `created_by` field to `contacts` table
- Adds `recorded_by` field to `gifts` table
- Adds `created_by` field to `email_drafts` table
- Creates a materialized view `team_activity_stats` for fast analytics queries
- Creates indexes for performance
- Adds a refresh function `refresh_team_activity_stats()`

### 2. Set Up Periodic Refresh (Important!)

The materialized view needs to be refreshed periodically to show current data. Set up a cron job or scheduled task:

**Option A: Using Supabase Edge Functions (Recommended)**

Create a scheduled Edge Function:

```typescript
// supabase/functions/refresh-team-stats/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { error } = await supabase.rpc('refresh_team_activity_stats')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Schedule it to run hourly in Supabase Dashboard.

**Option B: Using pg_cron (Self-hosted)**

```sql
-- Run every hour
SELECT cron.schedule(
  'refresh-team-stats',
  '0 * * * *',
  $$SELECT refresh_team_activity_stats()$$
);
```

**Option C: External Cron Job**

```bash
# Add to crontab (runs every hour)
0 * * * * psql $DATABASE_URL -c "SELECT refresh_team_activity_stats();"
```

### 3. Regenerate TypeScript Types

After applying the migration, regenerate Supabase types:

```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

### 4. Access the Module

The Team Analytics page is now available at:
```
https://your-app.com/team-analytics
```

**Note:** This page is only visible to admin users.

## Usage

### Accessing Team Analytics

1. Log in as an admin user
2. Navigate to "Team Analytics" in the sidebar
3. Select a date range (7d, 30d, 90d, or all time)
4. View overview metrics, charts, and leaderboards
5. Toggle between leaderboard and grid views

### Understanding the Metrics

**Overview Cards:**
- **Team Members** - Total number of team members in your organization
- **Total Activities** - Sum of all tracked activities for the selected period
- **Emails Sent** - Number of emails sent by all team members
- **Gifts Recorded** - Number of gifts recorded, with total amount

**Activity Leaderboard:**
- Ranks team members by total activities
- Shows breakdown by activity type (emails, gifts, contacts, notes)
- Displays top 10 members

**Activity Chart:**
- Stacked bar chart showing activity distribution
- Color-coded by activity type
- Hover for detailed tooltips

**Member Cards (Grid View):**
- Individual cards for each team member
- Shows role badge (admin, member, viewer)
- Displays activity breakdown
- Shows total gift amount if applicable

## Important Notes

### User Tracking

Starting from when the migration is applied, all new activities will be tracked with the user who performed them:

- When a user adds a contact, their ID is stored in `contacts.created_by`
- When a user records a gift, their ID is stored in `gifts.recorded_by`
- When a user creates an email, their ID is stored in `email_drafts.created_by`
- When a user creates a note, their ID is stored in `notes.created_by`

**Historical Data:** Activities created before the migration will have NULL values for these fields and won't be attributed to specific users.

### Performance Considerations

1. **Materialized View**: The `team_activity_stats` view is materialized for performance. It pre-aggregates data so queries are fast.

2. **Refresh Frequency**: Refresh hourly for most organizations. High-volume organizations may want to refresh more frequently.

3. **Concurrent Refresh**: The refresh function uses `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid blocking reads during refresh.

4. **Indexes**: All tracking fields have indexes for fast lookups.

### Security

- Only admin users can access the Team Analytics page
- All queries respect RLS policies
- User data is filtered by organization_id

## Troubleshooting

### "No data available"

**Cause**: The materialized view hasn't been refreshed yet or there's no tracked activity.

**Solution**:
1. Manually refresh the view: `SELECT refresh_team_activity_stats();`
2. Ensure the periodic refresh is set up correctly
3. Create some test activities (add contacts, record gifts, etc.)

### User activities not showing up

**Cause**: Activities were created before the migration, or the created_by field wasn't populated.

**Solution**: Only new activities (after migration) will be tracked. Historical data won't show user attribution.

### Performance is slow

**Cause**: The materialized view needs refreshing, or there's a large amount of data.

**Solution**:
1. Ensure periodic refresh is running
2. Check query performance with EXPLAIN ANALYZE
3. Consider adjusting refresh frequency for your data volume

### TypeScript errors

**Cause**: Types haven't been regenerated after migration.

**Solution**: Run `npx supabase gen types typescript --local > src/lib/supabase/types.ts`

## Future Enhancements

Potential improvements for future versions:

1. **Activity Heatmap**: Visual heatmap showing when team members are most active
2. **Trend Analysis**: Compare current period to previous periods
3. **Export Reports**: Download team analytics as CSV/PDF
4. **Member Detail Pages**: Drill down into individual member activity timelines
5. **Goals & Benchmarks**: Set and track team/individual goals
6. **Collaboration Metrics**: Track shared contacts, tag usage, etc.
7. **Real-time Updates**: WebSocket-based live activity feed
8. **Custom Date Ranges**: Allow selecting specific date ranges beyond presets

## Support

For issues or questions:
1. Check the module README at `src/modules/team-analytics/README.md`
2. Review the migration file at `supabase/migrations/036_team_analytics.sql`
3. Consult the code in `src/modules/team-analytics/`

## Summary

The Team Analytics module provides powerful insights into team productivity. With proper setup and periodic refresh, it will help you:
- Identify top performers
- Track team-wide activity trends
- Monitor individual contributions
- Optimize team workflows
- Celebrate achievements

Remember to set up the periodic refresh for accurate, up-to-date metrics!
