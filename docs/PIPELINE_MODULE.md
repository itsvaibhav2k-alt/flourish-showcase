# Major Gift Pipeline Module

## Overview

The Major Gift Pipeline module is a comprehensive system for tracking and managing major gift prospects through the 5-stage cultivation cycle: Identification → Qualification → Cultivation → Solicitation → Stewardship.

## Architecture

### Database Schema

#### Tables

1. **major_gift_prospects**
   - Tracks prospects through pipeline stages
   - Links to contacts table
   - Stores readiness scores, target amounts, and AI predictions
   - Includes assignment, notes, and outcome tracking

2. **cultivation_moves**
   - Logs all touchpoints with prospects
   - 9 move types: call, meeting, email, event, tour, lunch, gift, proposal, other
   - Tracks outcomes and next steps
   - Links to users for audit trail

3. **pipeline_stage_history**
   - Automatically tracks all stage transitions
   - Provides audit trail and analytics
   - Links to users who made changes
   - Stores transition notes

### Key Features

#### 1. Drag-and-Drop Kanban Board

**Location:** `/src/modules/pipeline/components/pipeline-kanban.tsx`

- Built with @dnd-kit for smooth drag-and-drop
- 5 columns representing pipeline stages
- Optimistic UI updates for instant feedback
- Automatic server sync with error handling
- Visual feedback during drag operations

**Usage:**
```tsx
<PipelineKanban prospectsByStage={prospectsByStage} />
```

#### 2. Advanced Filtering System

**Location:** `/src/modules/pipeline/components/pipeline-filters.tsx`

Filters include:
- Stage filter
- Assigned staff filter
- Readiness score range
- Next move date range
- Search by name or email
- Quick filters (High Readiness 80+, In Cultivation, Next 7 Days, Unassigned)

**Features:**
- Collapsible filter panel
- Active filter indicators
- One-click clear all filters
- Quick filter shortcuts

#### 3. Readiness Scoring System

**Location:** `/src/modules/pipeline/services/readiness-calculator.ts`

**Algorithm Factors (0-100 scale):**
- Move count (30%): Number of cultivation touchpoints relative to stage
- Recency (25%): Time since last touchpoint
- Stage duration (20%): Time in current stage vs. optimal duration
- Move quality (15%): Diversity and quality of interaction types
- Response indicators (10%): Positive vs. negative outcomes

**Stage-Specific Recommendations:**
- Score ≥80: Ready to advance stage
- Score 60-79: Schedule 1-2 more touchpoints
- Score 40-59: Increase engagement frequency
- Score <40: Re-assess fit for pipeline

#### 4. Next Action Recommendations

**Location:** Embedded in `sortable-prospect-card.tsx`

Each prospect card displays contextual recommendations based on readiness score:
- Visual indicators with color coding
- Actionable next steps
- Lightbulb icon for quick identification

#### 5. Stage Transition History

**Location:** `/src/modules/pipeline/components/stage-history.tsx`

**Features:**
- Complete audit trail of all stage movements
- Visual timeline with stage badges
- User attribution for each change
- Timestamps and "time ago" formatting
- Notes captured during transitions

**Auto-Tracking:**
- Trigger function automatically logs all stage changes
- Captures user who made the change
- Preserves transition notes
- Handles both updates and initial entries

#### 6. Cultivation Move Tracking

**Location:** `/src/modules/pipeline/components/move-timeline.tsx`

**Move Types:**
- Call
- Meeting
- Email
- Event
- Tour
- Lunch
- Gift
- Proposal
- Other

**Features:**
- Color-coded icons for each move type
- Timeline visualization
- Outcome and next step tracking
- User attribution

## File Structure

```
src/modules/pipeline/
├── actions/
│   ├── add-prospect.ts
│   ├── add-to-pipeline.ts
│   ├── log-cultivation-move.ts
│   ├── log-move.ts
│   ├── move-stage.ts
│   ├── update-prospect.ts
│   └── update-stage.ts
├── components/
│   ├── add-to-pipeline-button.tsx
│   ├── index.ts
│   ├── log-move-form.tsx
│   ├── move-logger.tsx
│   ├── move-timeline.tsx
│   ├── pipeline-board.tsx (legacy)
│   ├── pipeline-filters.tsx (NEW)
│   ├── pipeline-kanban.tsx (NEW - with drag-drop)
│   ├── prospect-card.tsx
│   ├── prospect-detail-panel.tsx
│   ├── readiness-meter.tsx
│   ├── sortable-prospect-card.tsx (NEW - draggable)
│   ├── stage-history.tsx (NEW)
│   └── update-stage-form.tsx
├── queries/
│   ├── get-moves.ts
│   ├── get-pipeline.ts
│   ├── get-prospect.ts
│   ├── get-prospects-by-stage.ts
│   └── get-stage-history.ts (NEW)
├── schemas/
│   └── pipeline.schema.ts
├── services/
│   ├── readiness-calculator.ts
│   └── stage-helpers.ts
└── index.ts
```

## Database Migrations

### Migration 020: Core Pipeline Tables
**File:** `supabase/migrations/020_major_gift_pipeline.sql`

Creates:
- major_gift_prospects table
- cultivation_moves table
- RLS policies
- Indexes for performance

### Migration 021: Stage History Tracking
**File:** `supabase/migrations/021_pipeline_stage_history.sql`

Creates:
- pipeline_stage_history table
- Automatic trigger for logging stage changes
- RLS policies
- Analytics-friendly indexes

## Usage Examples

### Adding a Prospect to Pipeline

```tsx
import { addProspect } from '@/modules/pipeline'

const result = await addProspect({
  contact_id: 'uuid',
  stage: 'identification',
  target_ask_amount: 50000,
  assigned_to: 'user-uuid',
})
```

### Logging a Cultivation Move

```tsx
import { logMove } from '@/modules/pipeline'

await logMove({
  prospect_id: 'uuid',
  move_type: 'meeting',
  move_date: '2025-01-15',
  description: 'Lunch meeting at The Capital Grille',
  outcome: 'Very positive - interested in learning more',
  next_step: 'Send proposal by end of week',
})
```

### Moving Between Stages

```tsx
import { moveStage } from '@/modules/pipeline'

await moveStage({
  prospect_id: 'uuid',
  new_stage: 'cultivation',
  notes: 'Qualified after discovery call - strong interest in education programs',
})
```

### Calculating Readiness Score

```tsx
import { calculateReadinessScore } from '@/modules/pipeline'

const { score, recommendation, factors } = calculateReadinessScore(
  prospectData,
  cultivationMoves
)

console.log(`Readiness: ${score}/100`)
console.log(`Recommendation: ${recommendation}`)
```

## Integration Points

### Contacts Module
- Pipeline prospects link to contacts table
- "Add to Pipeline" button on contact detail pages
- Shared contact data (name, email, lifetime giving)

### Smart Ask (Prospects Module)
- Displays recommended ask amounts
- Shows giving potential scores
- Integrates readiness with capacity

### Communications Module
- Email drafts for cultivation touchpoints
- Automated reminders for next moves
- Thank-you emails after gifts

## Performance Considerations

### Indexes
All critical queries are covered by indexes:
- `major_gift_prospects`: organization_id, contact_id, stage, assigned_to, readiness_score
- `cultivation_moves`: prospect_id, organization_id, move_date
- `pipeline_stage_history`: prospect_id, organization_id, created_at

### Query Optimization
- Stage grouping done in-memory after single query
- Prospect cards use minimal joins
- Stage history limited to relevant prospect

### Caching Strategy
- Pipeline stats cached for 5 minutes
- Prospect list revalidated on mutations
- Stage history lazy-loaded on detail page

## Security

### Row Level Security (RLS)
All tables enforce organization-scoped access:
- Users can only view prospects in their organization
- Mutations require organization membership
- Stage history respects organization boundaries

### Audit Trail
- All stage changes logged with user attribution
- Cultivation moves track who logged them
- Timestamps on all records

## Testing

### Manual Testing Checklist
- [ ] Drag prospect between stages
- [ ] Verify stage history records transition
- [ ] Apply filters and verify results
- [ ] Check readiness score calculations
- [ ] Test next action recommendations display
- [ ] Verify cultivation move logging
- [ ] Test search functionality
- [ ] Confirm mobile responsiveness

### Key Scenarios
1. **New Prospect Flow**: Add contact → Add to pipeline → Log first move → Check readiness
2. **Stage Progression**: Identify → Qualify → Cultivate → Solicit → Steward
3. **Collaboration**: Assign staff → Log moves → Review history → Move stages
4. **Analytics**: Filter high-readiness → Review recommendations → Take action

## Future Enhancements

### Planned Features
- [ ] Email integration for automatic move logging
- [ ] Calendar sync for next move reminders
- [ ] Bulk stage movements
- [ ] Pipeline analytics dashboard
- [ ] AI-powered next move suggestions
- [ ] Export to CSV/Excel
- [ ] Mobile app support
- [ ] Webhook notifications for stage changes

### API Endpoints to Add
- [ ] GET /api/pipeline/stats - Pipeline-wide statistics
- [ ] POST /api/pipeline/bulk-update - Batch stage updates
- [ ] GET /api/pipeline/forecast - Projected revenue by stage
- [ ] POST /api/pipeline/ai-recommend - AI move recommendations

## Troubleshooting

### Common Issues

**Drag-and-drop not working:**
- Check @dnd-kit libraries are installed
- Verify sensors are configured correctly
- Ensure prospect IDs are unique

**Stage history not showing:**
- Run migration 021
- Check trigger function is active
- Verify RLS policies allow access

**Readiness scores showing as null:**
- Ensure cultivation moves are logged
- Check stage_entered_at is set
- Verify calculator function is imported

**Filters not applying:**
- Check filter state management
- Verify query parameters are passed
- Ensure data refetching after filter changes

## Contributing

When adding features to the pipeline module:
1. Follow the existing file structure
2. Add proper TypeScript types
3. Include server actions for mutations
4. Update this documentation
5. Add RLS policies for new tables
6. Create migrations for schema changes
7. Test with multiple organizations

## Related Documentation

- [Prospects Module](./PROSPECTS_MODULE.md)
- [Smart Ask System](./SMART_ASK.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Supabase RLS Policies](./RLS_POLICIES.md)
