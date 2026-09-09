# Email Sequences Module

Automated drip campaigns and email journeys powered by AI for Flourish CRM.

## Overview

The Email Sequences module enables nonprofits to create automated, multi-step email campaigns that trigger based on donor behavior, volunteer activity, or custom events. Each step in a sequence uses AI to generate personalized emails based on the organization's voice and the contact's history.

## Features

- **Visual Sequence Builder**: Create multi-step email journeys with drag-and-drop interface
- **AI-Powered Content**: Each email is generated using Claude AI with organization-specific voice
- **Smart Triggers**: Automatically enroll contacts based on:
  - First gift received
  - Lapsed donor status
  - Volunteer signup
  - Custom date-based campaigns
- **Flexible Timing**: Configure delays between steps (days/hours)
- **Conditional Logic**: Skip steps based on contact behavior (future enhancement)
- **Pre-built Templates**: Quick-start templates for common sequences

## Architecture

### Database Schema

Located in `/supabase/migrations/032_email_sequences.sql`:

#### Tables

1. **email_sequences** - Sequence definitions
   - `trigger_type`: gift, signup, lapse_risk, manual, date, volunteer_signup, volunteer_completed
   - `trigger_config`: JSONB for trigger-specific settings
   - `is_active`: Whether the sequence is currently running

2. **email_sequence_steps** - Individual emails in a sequence
   - `step_order`: Order of execution (1, 2, 3...)
   - `delay_days` / `delay_hours`: Time to wait before sending
   - `template_type`: thank_you, appeal, reengagement, welcome, follow_up, custom
   - `custom_instructions`: AI prompt customization

3. **sequence_enrollments** - Contacts enrolled in sequences
   - `current_step`: Which step they're on (0 = not started)
   - `status`: active, paused, completed, cancelled, failed
   - `next_step_at`: When to process next step
   - `trigger_event_id`: Links back to gift/shift/etc that triggered enrollment

4. **sequence_step_executions** - Audit log of step processing
   - `draft_id`: Reference to generated email draft
   - `status`: pending, generating, generated, sent, skipped, failed
   - `executed_at`: Processing timestamp

### Module Structure

```
src/modules/sequences/
├── actions/                    # Server actions
│   ├── create-sequence.ts      # Create new sequence
│   ├── update-sequence.ts      # Update sequence details
│   ├── delete-sequence.ts      # Delete sequence
│   ├── manage-steps.ts         # Add/update/delete steps
│   ├── manage-enrollments.ts   # Enroll/pause/resume/cancel
│   └── index.ts
├── queries/                    # Data fetching
│   ├── get-sequences.ts        # List all sequences
│   ├── get-sequence.ts         # Get single sequence with steps
│   ├── get-enrollments.ts      # Get enrollments for a sequence
│   ├── get-sequence-stats.ts   # Get sequence performance metrics
│   └── index.ts
├── schemas/
│   └── sequence.schema.ts      # Zod validation schemas
├── components/                 # React components
│   ├── sequences-page.tsx      # Main page UI
│   ├── sequence-builder.tsx    # Visual builder
│   ├── sequence-card.tsx       # Sequence display card
│   └── sequence-templates.tsx  # Pre-built templates
└── index.ts
```

### Inngest Functions

Located in `/src/lib/inngest/functions/`:

#### 1. `process-sequence-steps.ts`
**Cron**: Runs every 5 minutes

Processes enrollments that are due for their next step:
1. Finds active enrollments where `next_step_at <= now()`
2. Gets the next step in the sequence
3. Evaluates step conditions (skip logic)
4. Generates AI email using `generateDraft()`
5. Creates `sequence_step_executions` record
6. Updates enrollment's `current_step` and `next_step_at`
7. Marks enrollment as `completed` if no more steps

**Key Features**:
- Processes max 50 enrollments per run (prevents overload)
- Filters out inactive sequences
- Handles step completion and sequence completion
- Logs failures for debugging

#### 2. `auto-enroll-sequences.ts`
**Events**:
- `gift/created` → `autoEnrollOnGift`
- `volunteer/signup` → `autoEnrollOnVolunteerSignup`
- `donor/lapse-risk-detected` → `autoEnrollOnLapseRisk`

Automatically enrolls contacts when trigger events occur:
1. Finds active sequences matching the trigger type
2. Applies trigger config filters:
   - `first_gift_only`: Only enroll on first gift
   - `gift_amount_min/max`: Gift amount range
   - `risk_level`: Specific lapse risk level
3. Calculates first step timing
4. Creates enrollment record
5. Prevents duplicate enrollments (unique constraint)

## Usage

### Creating a Sequence

```typescript
import { createSequence } from '@/modules/sequences'

const result = await createSequence({
  name: 'New Donor Welcome',
  description: 'Welcome series for first-time donors',
  trigger_type: 'gift',
  trigger_config: { first_gift_only: true },
  is_active: true,
})
```

### Adding Steps

```typescript
import { addStep } from '@/modules/sequences'

// Step 1: Immediate thank you
await addStep({
  sequence_id: sequenceId,
  step_order: 1,
  name: 'Thank You',
  delay_days: 0,
  delay_hours: 0,
  template_type: 'thank_you',
})

// Step 2: Impact update after 7 days
await addStep({
  sequence_id: sequenceId,
  step_order: 2,
  name: 'Impact Update',
  delay_days: 7,
  delay_hours: 0,
  template_type: 'follow_up',
  custom_instructions: 'Share a specific story about how their donation helped',
})
```

### Manual Enrollment

```typescript
import { enrollContact } from '@/modules/sequences'

await enrollContact({
  sequence_id: sequenceId,
  contact_id: contactId,
  trigger_event_id: giftId,
  trigger_event_type: 'gift',
})
```

### Managing Enrollments

```typescript
import { pauseEnrollment, resumeEnrollment, cancelEnrollment } from '@/modules/sequences'

// Pause temporarily
await pauseEnrollment(enrollmentId)

// Resume
await resumeEnrollment(enrollmentId)

// Cancel permanently
await cancelEnrollment(enrollmentId, 'Contact requested to stop')
```

## Pre-built Templates

The migration includes 4 template sequences:

1. **New Donor Welcome** - 3 emails over 2 weeks for first-time donors
2. **Lapsed Donor Re-engagement** - 4 emails over 1 month for high-risk lapsed donors
3. **Volunteer Onboarding** - 2 emails over 1 week for new volunteers
4. **Year-End Appeal** - 5 emails over 6 weeks starting November 1st

Templates are marked with `is_template: true` and organization_id of all zeros. To use a template, copy it to your organization and customize.

## AI Email Generation

Each sequence step uses the existing `generateDraft()` action from the communications module:

- **Voice Profile**: Uses organization's trained voice or default nonprofit tone
- **Context Building**: Pulls donor history, giving patterns, engagement scores
- **Template Mapping**: Maps sequence template types to email generation types
- **Caching**: Uses Claude prompt caching for cost efficiency
- **Fallback**: If AI fails, uses template-based fallback

### Email Type Mapping

| Sequence Template Type | Email Generation Type | Context Required |
|----------------------|----------------------|------------------|
| `thank_you` | `thank_you` | Gift ID |
| `reengagement` | `reengagement` | Donor history |
| `welcome` (donor) | `general_thanks` | Giving history |
| `welcome` (volunteer) | `volunteer_confirmation` | Shift ID |
| `follow_up` | `custom` | - |
| `appeal` | `custom` | - |

## Trigger Configuration

### Gift Trigger

```typescript
{
  first_gift_only: boolean,      // Only first-time donors
  gift_amount_min: number,       // Minimum gift amount
  gift_amount_max: number,       // Maximum gift amount
}
```

### Lapse Risk Trigger

```typescript
{
  risk_level: 'low' | 'medium' | 'high'  // Specific risk level
}
```

### Volunteer Signup Trigger

```typescript
{
  first_shift_only: boolean  // Only first-time volunteers
}
```

### Date Trigger

```typescript
{
  start_date: string,        // MM-DD format
  recurring: boolean         // Repeat annually
}
```

## Step Conditions (Future)

The `conditions` JSONB field supports skip logic:

```typescript
{
  skip_if_replied: boolean,      // Skip if contact replied to previous email
  skip_if_donated: boolean,      // Skip if new gift received
  skip_if_unsubscribed: boolean, // Skip if contact unsubscribed
}
```

Currently, all conditions evaluate to `false` (no skipping). This is a placeholder for future implementation.

## Performance Considerations

1. **Batch Processing**: Cron job processes max 50 enrollments per run
2. **Indexes**: Optimized indexes on `next_step_at`, `status`, and foreign keys
3. **RLS Policies**: Row-level security ensures data isolation
4. **AI Caching**: Prompt caching reduces API costs by ~90%

## Monitoring

### Sequence Stats

```typescript
import { getSequenceStats } from '@/modules/sequences'

const stats = await getSequenceStats()
// Returns: total_enrolled, active_enrolled, completed, total_sent, avg_open_rate
```

### Step Executions

Query `sequence_step_executions` to see:
- Which steps are failing
- Average generation time
- Skip reasons
- Error messages

## API Routes

The page is accessible at:
```
/flora/sequences
```

Already created in `/src/app/(dashboard)/flora/sequences/page.tsx`

## Events Integration

The module listens for these Inngest events:

- `gift/created` - Auto-enroll in gift-triggered sequences
- `volunteer/signup` - Auto-enroll in volunteer-triggered sequences
- `donor/lapse-risk-detected` - Auto-enroll in re-engagement sequences

And processes them every 5 minutes via cron.

## Testing

To test the sequences module:

1. **Create a sequence**:
   - Go to `/flora/sequences`
   - Click "Create Sequence"
   - Choose a template or build custom

2. **Add steps**:
   - Configure timing and email types
   - Test with different delay configurations

3. **Trigger enrollment**:
   - Record a gift (for gift sequences)
   - Sign up volunteer (for volunteer sequences)
   - Manually enroll via API

4. **Monitor processing**:
   - Check `sequence_step_executions` table
   - View generated drafts in `/communications`
   - Watch Inngest dashboard for job runs

## Future Enhancements

- [ ] A/B testing for subject lines
- [ ] Dynamic send time optimization
- [ ] Advanced condition evaluation
- [ ] Sequence branching based on engagement
- [ ] Email performance analytics
- [ ] Automatic re-enrollment prevention
- [ ] Sequence cloning/copying
- [ ] Bulk enrollment via CSV
- [ ] Integration with email service provider (ESP) webhooks
- [ ] Unsubscribe handling

## Related Modules

- **communications** - Email draft generation and sending
- **donors** - Gift tracking and lapse risk calculation
- **volunteers** - Shift management and signups
- **ai** - Voice training and prompt building
