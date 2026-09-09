# Communications Module

The Communications module handles all email-related functionality in Flourish, including AI-generated email drafts, approval workflows, and sending emails via Resend.

## Architecture Overview

```
Email Generation → Approval → Sending → Delivery Tracking
     (AI)        (Human Review)  (Resend)   (Status Check)
```

## Directory Structure

```
src/modules/communications/
├── actions/
│   ├── send-email.ts          # Email sending logic with Resend
│   └── approve-draft.ts       # Draft approval/rejection workflow
├── queries/
│   └── get-drafts.ts          # Fetch drafts and statistics
├── schemas/
│   └── email.schema.ts        # Zod validation schemas
├── components/                 # React components for UI
└── index.ts                   # Public module exports
```

## Email Templates

Professional HTML email templates are located at `src/lib/email/templates/`:

- **Thank You Email** (`thank-you.tsx`) - For donor gift acknowledgments
- **Volunteer Confirmation** (`volunteer-confirmation.tsx`) - Confirms volunteer shift signups
- **Volunteer Reminder** (`volunteer-reminder.tsx`) - Reminds volunteers of upcoming shifts
- **Volunteer Thank You** (`volunteer-thank-you.tsx`) - Thanks volunteers after completing shifts
- **Re-engagement** (`reengagement.tsx`) - Re-engages lapsed donors/volunteers

All templates use `@react-email/components` for consistent, responsive design.

## Email Sending Pipeline

### 1. Draft Creation

Email drafts are created by:
- AI generation (Claude API) triggered by events (new gifts, volunteer signups)
- Manual creation by users
- Background jobs (Inngest functions)

Drafts are stored in the `email_drafts` table with status `pending`.

### 2. Approval Workflow

**Action**: `approveDraft()`

Users can:
- Approve drafts (status → `approved`)
- Reject drafts with a reason (status → `rejected`)
- Edit subject/body before approval
- **Auto-send after approval** using `autoSend: true` parameter

```typescript
import { approveDraft } from '@/modules/communications'

// Approve and send immediately
const result = await approveDraft({
  draftId: 'draft-123',
  approved: true,
  autoSend: true,
  sendParams: {
    fromEmail: 'hello@yourorg.com',
    fromName: 'Your Organization',
    replyTo: 'contact@yourorg.com',
  },
})
```

**Batch Approval**: Use `approveBatchDrafts()` to approve multiple drafts at once.

### 3. Sending Emails

**Action**: `sendEmail()`

The send pipeline:

1. **Fetch Draft** - Retrieves draft with contact and organization info
2. **Validate** - Checks draft is approved and contact has email
3. **Render Template** - Uses React email templates based on email type
   - Falls back to simple HTML if template unavailable
4. **Send via Resend** - Calls Resend API with HTML content
5. **Update Status** - Marks draft as `sent` with timestamp and Resend ID
6. **Log Activity** - Creates interaction record for contact history
7. **Update Related Records**:
   - Sets `thanked_at` on gifts (thank-you emails)
   - Sets `confirmation_sent` on volunteer signups

```typescript
import { sendEmail } from '@/modules/communications'

const result = await sendEmail({
  draftId: 'draft-123',
  fromEmail: 'hello@yourorg.com',
  fromName: 'Your Organization',
  replyTo: 'contact@yourorg.com',
})

if (result.success) {
  console.log('Email sent!', result.emailId)
} else {
  console.error('Failed:', result.error)
}
```

**Batch Sending**: Use `sendBatchEmails()` to send multiple approved drafts.

### 4. Delivery Tracking

**Action**: `checkEmailDeliveryStatus(resendId)`

Check the delivery status of sent emails using the Resend email ID:

```typescript
import { checkEmailDeliveryStatus } from '@/modules/communications'

const status = await checkEmailDeliveryStatus('resend-email-id')
console.log(status.status) // 'delivered', 'bounced', 'opened', etc.
```

### 5. Retry Failed Sends

**Action**: `retrySendEmail(draftId)`

Retry sending an approved draft that failed:

```typescript
import { retrySendEmail } from '@/modules/communications'

const result = await retrySendEmail('draft-123')
```

## Email Template Rendering

The system uses a three-tier fallback approach:

1. **React Email Templates** (preferred) - Full-featured HTML emails
2. **Default Template** - Simple formatted HTML with organization branding
3. **Basic Fallback** - Plain text converted to paragraphs

### Template Data Building

Each email type requires specific data:

```typescript
// Thank You Email
{
  donorName: string
  amount: number
  orgName: string
  body: string
  giftDate?: string
}

// Volunteer Confirmation
{
  volunteerName: string
  orgName: string
  shiftTitle: string
  shiftDate: string
  shiftTime: string
  location?: string
  body: string
}

// Re-engagement
{
  contactName: string
  orgName: string
  body: string
  lastInteractionDate?: string
}
```

The `buildTemplateData()` function automatically fetches related records (gifts, shifts) from the database.

## Error Handling

All actions return a consistent result structure:

```typescript
{
  success: boolean
  error?: string
  // ... additional fields
}
```

**Error Scenarios Handled**:
- Missing/invalid Resend API key
- Draft not found or inaccessible
- Draft not in correct status for operation
- Contact missing email address
- Resend API failures
- Template rendering errors (with fallback)
- Database update failures (non-critical operations logged)

## Statistics and Reporting

**Functions**:
- `getEmailStats(organizationId)` - Last 30 days send statistics
- `getDraftStats()` - Current draft counts by status
- `getDrafts()` - Query drafts with filtering and pagination

```typescript
import { getEmailStats, getDraftStats } from '@/modules/communications'

// Organization-level stats
const stats = await getEmailStats('org-123')
// { totalSent, byType: { thank_you, reengagement, ... }, last7Days, last30Days }

// Draft pipeline stats
const draftStats = await getDraftStats()
// { pending, approved, sentToday, rejected }
```

## Database Schema

**email_drafts** table:

```sql
- id (UUID)
- organization_id (UUID) - Multi-tenant scoping
- contact_id (UUID) - Recipient
- email_type (enum) - thank_you, reengagement, volunteer_*, etc.
- subject (TEXT)
- body (TEXT)
- status (enum) - pending, approved, rejected, sent
- reviewed_by, reviewed_at - Approval tracking
- sent_at, sent_by, resend_id - Sending tracking
- gift_id, shift_id - Related records
- generated_by (enum) - claude, fallback
- was_edited (BOOLEAN) - If edited before approval
```

**RLS Policies**: All queries are scoped to user's organization via Row Level Security.

## Environment Variables

Required:

```bash
RESEND_API_KEY=re_xxx           # Resend API key
RESEND_FROM_EMAIL=noreply@...   # Default sender (optional)
RESEND_DOMAIN=yourdomain.com    # Domain for email addresses (optional)
```

## Integration with Inngest

Background jobs in `src/lib/inngest/functions/`:

- `generateThankYou` - Creates thank-you drafts for new gifts
- `sendApprovedEmails` - Batch sends approved drafts (scheduled)
- `sendVolunteerReminders` - Auto-generates and sends shift reminders

## Best Practices

1. **Always approve before sending** - Use the approval workflow for human review
2. **Use autoSend for workflows** - Combine approval + send in one step when appropriate
3. **Handle errors gracefully** - Check `result.success` and display user-friendly errors
4. **Track deliverability** - Store `resend_id` for status checks and troubleshooting
5. **Validate email addresses** - Check contacts have valid emails before drafting
6. **Rate limiting** - Be mindful of Resend API limits when batch sending
7. **Test templates** - Preview emails before approving to ensure formatting is correct

## Future Enhancements

Potential improvements:

- Email bounce handling webhooks
- Unsubscribe management
- Email open/click tracking
- A/B testing for subject lines
- Scheduled sending (future date/time)
- Email templates editor UI
- Attachment support
- CC/BCC support
