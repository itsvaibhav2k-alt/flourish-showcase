# AI Fundraising Copilot Engine

Revolutionary AI-powered fundraising assistant that analyzes donors and generates personalized action suggestions to maximize fundraising effectiveness.

## Overview

The AI Fundraising Copilot is the flagship feature of Flourish CRM. It combines algorithmic donor scoring with Claude AI's advanced reasoning to provide daily, prioritized action recommendations for fundraising professionals.

## Architecture

### Core Components

1. **Donor Scorer** (`src/lib/ai/copilot/donor-scorer.ts`)
   - Scores donors 0-100 on giving likelihood
   - Analyzes: giving history, recency, frequency, trends
   - Predicts optimal ask timing and amount
   - Calculates lapse risk
   - AI-enhanced predictions with reasoning

2. **Action Generator** (`src/lib/ai/copilot/action-generator.ts`)
   - Generates personalized fundraising actions
   - Action types: reach_out, send_ask, re_engage, thank, follow_up
   - Combines scoring data with AI reasoning
   - Provides detailed explanations for each suggestion

3. **Prompts** (`src/lib/ai/copilot/prompts.ts`)
   - Expert fundraising system prompts
   - Context-aware user prompts
   - Action examples and guidelines
   - Seasonal timing considerations

### Background Processing

4. **Inngest Function** (`src/lib/inngest/functions/generate-copilot-actions.ts`)
   - Runs daily at 6 AM
   - Processes all organizations
   - Selects top 20 priority donors per org:
     - High lapse risk donors (urgent)
     - Major donors ($1000+ lifetime)
     - Recent givers (last 30 days)
     - Emerging multi-gift donors
     - Active mid-level donors
   - Clears old pending actions (7+ days)
   - Generates fresh AI-powered suggestions

### Data Layer

5. **Database Migration** (`supabase/migrations/015_copilot_actions.sql`)
   - `copilot_actions` table with full action metadata
   - Stores predictions, scores, and reasoning
   - RLS policies for organization isolation
   - Optimized indexes for dashboard queries

6. **Queries** (`src/modules/copilot/queries/get-copilot-actions.ts`)
   - Get pending actions for current org
   - Filter by type, priority, status
   - Join with contact details
   - Statistics and analytics

7. **Server Actions** (`src/modules/copilot/actions/`)
   - `complete-action.ts` - Mark actions as completed
   - `dismiss-action.ts` - Dismiss actions with reason
   - Update contact timestamps
   - Log activities

### User Interface

8. **Copilot Widget** (`src/modules/dashboard/components/copilot-widget.tsx`)
   - Beautiful gradient card design
   - Priority-sorted action list
   - Color-coded by action type
   - Expandable AI reasoning sections
   - Complete/Dismiss quick actions
   - Success rate and predicted amount display
   - Channel and timing recommendations
   - Inbox zero celebration state
   - CSS animations (no framer-motion dependency)

## Features

### Donor Scoring Algorithm

The system calculates a 0-100 score based on four factors (25 points each):

1. **Giving History** (0-25 points)
   - Major Donor ($10K+): 25 points
   - Leadership ($5K+): 22 points
   - Sustaining ($1K+): 18 points
   - Regular ($500+): 14 points
   - Emerging ($100+): 10 points
   - Small (<$100): 5 points

2. **Recency** (0-25 points)
   - Last 30 days: 25 points
   - Last quarter: 22 points
   - Last 6 months: 18 points
   - Last year: 14 points
   - Last 2 years: 8 points
   - Over 2 years: 3 points

3. **Frequency** (0-25 points)
   - Monthly+ (12+ gifts/year): 25 points
   - Quarterly (4+ gifts/year): 22 points
   - Bi-annual (2+ gifts/year): 18 points
   - Annual (1+ gift/year): 14 points
   - Occasional (2+ total): 10 points
   - One-time: 5 points

4. **Trend** (0-25 points)
   - Strong increase (50%+): 25 points
   - Moderate increase (20%+): 22 points
   - Stable: 18 points
   - Slight decline: 12 points
   - Declining: 6 points

### AI-Powered Predictions

Claude AI enhances the algorithmic score with:

- **Predicted Gift Amount**: Based on history and capacity signals
- **Success Rate**: Likelihood (0-100%) of positive response
- **Optimal Timing**: "This week", "Before year-end", etc.
- **Preferred Channel**: email, phone, mail, or in-person
- **Strategic Reasoning**: 3-4 sentence explanation of recommendations

### Action Types

1. **reach_out** - Relationship-building (no ask)
   - For cultivation and staying connected
   - Building trust before solicitation

2. **send_ask** - Gift solicitation
   - When timing and readiness align
   - Specific amount recommendation
   - Year-end urgency considered

3. **re_engage** - Lapsed donor recovery
   - High lapse risk donors
   - Focus on reconnection first
   - Acknowledge gap in giving

4. **thank** - Stewardship and gratitude
   - Recent givers (last 30 days)
   - Impact reporting
   - Pure gratitude, no ask

5. **follow_up** - Continue conversation
   - After previous interaction
   - Maintain momentum
   - Move relationship forward

### Priority System

Actions are prioritized 1-100 based on:

- **Urgency**: Lapse risk, time-sensitive opportunities
- **Impact**: Predicted gift size, donor importance
- **Readiness**: Donor score, timing alignment
- **Strategic Value**: Major donor cultivation, re-engagement potential

High priority (90-100): Immediate action required
Medium priority (60-89): Act within the week
Lower priority (1-59): Less urgent, longer timeframe

## Daily Workflow

### 6:00 AM - Automated Generation

1. Inngest function wakes up
2. Fetches all organizations
3. For each organization:
   - Clears stale pending actions (7+ days old)
   - Selects top 20 priority donors
   - Generates AI-powered action for each
   - Saves to database with full metadata

### Throughout the Day - User Interaction

1. User opens dashboard
2. Sees prioritized action list
3. Can expand to read AI reasoning
4. Clicks "Complete" when action taken
5. Or "Dismiss" if not relevant
6. System logs activity and updates contact

### End of Day

- Completed actions archived
- Dismissed actions recorded with reason
- Progress tracked for analytics

## Database Schema

```sql
copilot_actions
├── id (uuid, primary key)
├── organization_id (uuid, foreign key)
├── contact_id (uuid, foreign key)
├── action_type (text: reach_out|send_ask|re_engage|thank|follow_up)
├── priority (integer 1-100)
├── title (text)
├── description (text)
├── reasoning (text)
├── predicted_gift_amount (decimal)
├── predicted_success_rate (integer 0-100)
├── optimal_timing (text)
├── preferred_channel (text: email|phone|mail|in_person)
├── donor_score (integer 0-100)
├── donor_score_reasoning (text)
├── status (text: pending|completed|dismissed)
├── completed_at (timestamp)
├── dismissed_at (timestamp)
├── outcome (text, optional)
├── dismiss_reason (text, optional)
├── context_snapshot (jsonb)
├── generated_at (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## API Usage

### Generate Action for Single Donor

```typescript
import { generateCopilotAction } from '@/lib/ai/copilot'

const action = await generateCopilotAction(contactId)
// Returns full CopilotAction with score and predictions
```

### Batch Generate Actions

```typescript
import { batchGenerateCopilotActions } from '@/lib/ai/copilot'

const actions = await batchGenerateCopilotActions([id1, id2, id3])
// Returns Map<contactId, CopilotAction>
```

### Calculate Donor Score

```typescript
import { calculateDonorScore } from '@/lib/ai/copilot'

const score = await calculateDonorScore(contactId)
// Returns DonorScore with predictions and reasoning
```

### Fetch Pending Actions

```typescript
import { getCopilotActions } from '@/modules/copilot'

const actions = await getCopilotActions({
  status: 'pending',
  actionType: 'send_ask',
  minPriority: 80
})
```

### Complete an Action

```typescript
import { completeAction } from '@/modules/copilot'

await completeAction({
  actionId: 'uuid',
  outcome: 'Called donor, set up meeting for next week'
})
```

## Configuration

### Inngest Schedule

Default: Daily at 6:00 AM
To change: Edit cron expression in `generate-copilot-actions.ts`

```typescript
{ cron: '0 6 * * *' }  // 6 AM daily
```

### Selection Limits

Default: 20 donors per organization
To change: Modify `limit` parameter in `selectTopPriorityDonors()`

### Action Expiry

Default: 7 days
To change: Adjust `sevenDaysAgo` calculation in Inngest function

## Cost Tracking

All Claude API calls are tracked via the existing cost tracking system:

- Model: Claude Haiku 4.5 (cost-effective)
- Average tokens per action: ~500-800
- Estimated cost: $0.001-0.002 per action
- 20 actions/day/org = ~$0.03/day/org

## Future Enhancements

1. **Email Integration**: One-click draft generation from actions
2. **Calendar Integration**: Schedule calls/meetings directly
3. **Success Tracking**: Learn from completed actions
4. **Custom Rules**: Let orgs define priority criteria
5. **Team Assignment**: Route actions to specific team members
6. **Mobile Notifications**: Push notifications for high-priority actions
7. **A/B Testing**: Test different prompts and strategies
8. **Feedback Loop**: Improve predictions based on outcomes

## Files Created

### Core AI Engine
- `/src/lib/ai/copilot/donor-scorer.ts`
- `/src/lib/ai/copilot/action-generator.ts`
- `/src/lib/ai/copilot/prompts.ts`
- `/src/lib/ai/copilot/index.ts`

### Background Jobs
- `/src/lib/inngest/functions/generate-copilot-actions.ts`
- Updated `/src/lib/inngest/functions/index.ts`

### Data Layer
- `/supabase/migrations/015_copilot_actions.sql`
- `/src/modules/copilot/queries/get-copilot-actions.ts`
- `/src/modules/copilot/actions/complete-action.ts`
- `/src/modules/copilot/actions/dismiss-action.ts`
- `/src/modules/copilot/index.ts`

### User Interface
- `/src/modules/dashboard/components/copilot-widget.tsx`
- Updated `/src/app/(dashboard)/dashboard/page.tsx`

### Library Exports
- Updated `/src/lib/ai/index.ts`

## Testing

### Manual Testing

1. **Run Inngest function manually**:
   ```bash
   npx inngest-cli@latest dev
   ```
   Then trigger via Inngest dev UI

2. **Check generated actions**:
   ```sql
   SELECT * FROM copilot_actions
   WHERE organization_id = 'your-org-id'
   ORDER BY priority DESC;
   ```

3. **Test dashboard widget**:
   - Navigate to `/dashboard`
   - Verify actions display
   - Test expand/collapse
   - Test complete/dismiss

### Database Setup

```bash
# Run migration
npx supabase db reset

# Or apply specific migration
npx supabase migration up 015_copilot_actions
```

## Support

For issues or questions:
1. Check Inngest logs for function errors
2. Verify database migration ran successfully
3. Check Claude API key is set
4. Review RLS policies if actions don't appear

---

Built with Claude AI, Inngest, and Supabase
