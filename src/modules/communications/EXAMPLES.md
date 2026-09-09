# Communications Module - Usage Examples

## Table of Contents

1. [Approving and Sending a Single Draft](#approving-and-sending-a-single-draft)
2. [Batch Approval and Sending](#batch-approval-and-sending)
3. [Checking Delivery Status](#checking-delivery-status)
4. [Retrying Failed Emails](#retrying-failed-emails)
5. [Querying Drafts](#querying-drafts)
6. [Getting Statistics](#getting-statistics)
7. [Manual Email Sending](#manual-email-sending)

---

## Approving and Sending a Single Draft

### Approve Only (Manual Send Later)

```typescript
'use server'

import { approveDraft } from '@/modules/communications'

export async function handleApproveDraft(draftId: string) {
  const result = await approveDraft({
    draftId,
    approved: true,
  })

  if (result.success) {
    console.log(`Draft approved: ${result.status}`)
  } else {
    console.error(`Error: ${result.error}`)
  }

  return result
}
```

### Approve and Send Immediately

```typescript
'use server'

import { approveDraft } from '@/modules/communications'

export async function handleApproveAndSend(draftId: string) {
  const result = await approveDraft({
    draftId,
    approved: true,
    autoSend: true, // Send immediately after approval
    sendParams: {
      fromEmail: 'hello@nonprofit.org',
      fromName: 'Hope Foundation',
      replyTo: 'contact@nonprofit.org',
    },
  })

  if (result.success && result.emailSent) {
    console.log(`Email sent! ID: ${result.emailId}`)
    return { success: true, message: 'Email sent successfully!' }
  } else if (result.success && !result.emailSent) {
    console.warn(`Draft approved but email failed: ${result.error}`)
    return { success: true, message: 'Draft approved, but email failed to send' }
  } else {
    return { success: false, message: result.error }
  }
}
```

### Approve with Edits

```typescript
'use server'

import { approveDraft } from '@/modules/communications'

export async function handleApproveWithEdits(
  draftId: string,
  subject: string,
  body: string
) {
  const result = await approveDraft({
    draftId,
    approved: true,
    editedSubject: subject,
    editedBody: body,
    autoSend: true,
  })

  return result
}
```

### Reject Draft

```typescript
'use server'

import { approveDraft } from '@/modules/communications'

export async function handleRejectDraft(
  draftId: string,
  reason: string
) {
  const result = await approveDraft({
    draftId,
    approved: false,
    rejectionReason: reason,
  })

  return result
}
```

---

## Batch Approval and Sending

### Approve Multiple Drafts

```typescript
'use server'

import { approveBatchDrafts } from '@/modules/communications'

export async function handleBatchApprove(draftIds: string[]) {
  const result = await approveBatchDrafts({
    draftIds,
    autoSend: false, // Just approve, don't send yet
  })

  console.log(`Approved: ${result.successCount}, Failed: ${result.failureCount}`)

  // Show details for failures
  result.results.forEach(r => {
    if (!r.success) {
      console.error(`Draft ${r.draftId} failed: ${r.error}`)
    }
  })

  return result
}
```

### Approve and Send Multiple Drafts

```typescript
'use server'

import { approveBatchDrafts } from '@/modules/communications'

export async function handleBatchApproveAndSend(draftIds: string[]) {
  const result = await approveBatchDrafts({
    draftIds,
    autoSend: true, // Approve and send in one step
    sendParams: {
      fromEmail: 'hello@nonprofit.org',
      fromName: 'Hope Foundation',
      replyTo: 'contact@nonprofit.org',
    },
  })

  return {
    success: result.success,
    message: `Sent ${result.successCount} emails. ${result.failureCount} failed.`,
    results: result.results,
  }
}
```

---

## Checking Delivery Status

```typescript
'use server'

import { checkEmailDeliveryStatus } from '@/modules/communications'

export async function checkEmailStatus(resendId: string) {
  const result = await checkEmailDeliveryStatus(resendId)

  if (result.success) {
    console.log(`Email status: ${result.status}`)
    // Possible statuses: delivered, bounced, opened, clicked, etc.
  } else {
    console.error(`Failed to check status: ${result.error}`)
  }

  return result
}
```

---

## Retrying Failed Emails

```typescript
'use server'

import { retrySendEmail } from '@/modules/communications'

export async function handleRetry(draftId: string) {
  const result = await retrySendEmail(draftId)

  if (result.success) {
    return { success: true, message: 'Email resent successfully!' }
  } else {
    return { success: false, message: result.error }
  }
}
```

---

## Querying Drafts

### Get Pending Drafts

```typescript
'use server'

import { getDrafts } from '@/modules/communications'

export async function getPendingDrafts() {
  const result = await getDrafts({
    status: 'pending',
    page: 1,
    limit: 20,
  })

  console.log(`Found ${result.total} pending drafts`)
  return result.drafts
}
```

### Get Drafts by Type

```typescript
'use server'

import { getDrafts } from '@/modules/communications'

export async function getThankYouDrafts() {
  const result = await getDrafts({
    type: 'thank_you',
    status: 'sent',
    page: 1,
    limit: 50,
  })

  return result
}
```

### Get Single Draft

```typescript
'use server'

import { getDraftById } from '@/modules/communications'

export async function getDraftDetails(draftId: string) {
  const draft = await getDraftById(draftId)

  if (!draft) {
    throw new Error('Draft not found')
  }

  return draft
}
```

### Paginated Drafts List

```typescript
'use server'

import { getDrafts } from '@/modules/communications'

export async function getDraftsList(page: number = 1) {
  const result = await getDrafts({
    page,
    limit: 20,
  })

  return {
    drafts: result.drafts,
    total: result.total,
    currentPage: page,
    totalPages: Math.ceil(result.total / 20),
  }
}
```

---

## Getting Statistics

### Email Stats (Last 30 Days)

```typescript
'use server'

import { getEmailStats } from '@/modules/communications'

export async function getOrganizationEmailStats(orgId: string) {
  const stats = await getEmailStats(orgId)

  if (!stats) {
    throw new Error('Unable to fetch stats')
  }

  return {
    totalSent: stats.totalSent,
    last7Days: stats.last7Days,
    last30Days: stats.last30Days,
    byType: stats.byType,
  }
}
```

### Draft Pipeline Stats

```typescript
'use server'

import { getDraftStats } from '@/modules/communications'

export async function getDraftPipelineStats() {
  const stats = await getDraftStats()

  return {
    pending: stats.pending,
    approved: stats.approved,
    sentToday: stats.sentToday,
    rejected: stats.rejected,
  }
}
```

---

## Manual Email Sending

### Send Approved Draft

```typescript
'use server'

import { sendEmail } from '@/modules/communications'

export async function sendApprovedDraft(draftId: string) {
  const result = await sendEmail({
    draftId,
    fromEmail: 'hello@nonprofit.org',
    fromName: 'Hope Foundation',
    replyTo: 'contact@nonprofit.org',
  })

  if (result.success) {
    return {
      success: true,
      message: 'Email sent!',
      emailId: result.emailId,
    }
  } else {
    return {
      success: false,
      message: result.error,
    }
  }
}
```

### Batch Send Approved Drafts

```typescript
'use server'

import { sendBatchEmails } from '@/modules/communications'

export async function sendMultipleEmails(draftIds: string[]) {
  const result = await sendBatchEmails({
    draftIds,
    fromEmail: 'hello@nonprofit.org',
    fromName: 'Hope Foundation',
    replyTo: 'contact@nonprofit.org',
  })

  return {
    success: result.success,
    sent: result.successCount,
    failed: result.failureCount,
    details: result.results,
  }
}
```

---

## React Component Examples

### Draft Approval UI

```typescript
'use client'

import { useState } from 'react'
import { approveDraft } from '@/modules/communications/actions/approve-draft'

export function DraftApprovalCard({ draft }: { draft: any }) {
  const [loading, setLoading] = useState(false)

  async function handleApprove(autoSend: boolean) {
    setLoading(true)
    try {
      const result = await approveDraft({
        draftId: draft.id,
        approved: true,
        autoSend,
      })

      if (result.success) {
        alert(autoSend ? 'Email sent!' : 'Draft approved!')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to approve draft')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border p-4 rounded">
      <h3>{draft.subject}</h3>
      <p>{draft.body}</p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleApprove(false)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Approve Only
        </button>
        <button
          onClick={() => handleApprove(true)}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Approve & Send
        </button>
      </div>
    </div>
  )
}
```

### Email Stats Dashboard

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getEmailStats } from '@/modules/communications/actions/send-email'

export function EmailStatsDashboard({ orgId }: { orgId: string }) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    async function loadStats() {
      const data = await getEmailStats(orgId)
      setStats(data)
    }
    loadStats()
  }, [orgId])

  if (!stats) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border p-4 rounded">
        <h3>Last 7 Days</h3>
        <p className="text-3xl font-bold">{stats.last7Days}</p>
      </div>
      <div className="border p-4 rounded">
        <h3>Last 30 Days</h3>
        <p className="text-3xl font-bold">{stats.last30Days}</p>
      </div>
      <div className="border p-4 rounded">
        <h3>Total Sent</h3>
        <p className="text-3xl font-bold">{stats.totalSent}</p>
      </div>
    </div>
  )
}
```

---

## Advanced Patterns

### Workflow: Generate → Approve → Send

```typescript
'use server'

import { approveDraft, sendEmail } from '@/modules/communications'

export async function completeEmailWorkflow(draftId: string) {
  // Step 1: Approve draft
  const approvalResult = await approveDraft({
    draftId,
    approved: true,
  })

  if (!approvalResult.success) {
    return { success: false, error: approvalResult.error }
  }

  // Step 2: Send email
  const sendResult = await sendEmail({
    draftId,
    fromEmail: 'hello@nonprofit.org',
  })

  if (!sendResult.success) {
    return { success: false, error: sendResult.error }
  }

  // Step 3: Check delivery after a delay
  if (sendResult.emailId) {
    // You might want to schedule this check instead
    setTimeout(async () => {
      const { checkEmailDeliveryStatus } = await import(
        '@/modules/communications'
      )
      const statusResult = await checkEmailDeliveryStatus(sendResult.emailId!)
      console.log('Delivery status:', statusResult.status)
    }, 60000) // Check after 1 minute
  }

  return { success: true, emailId: sendResult.emailId }
}
```

### Error Recovery Pattern

```typescript
'use server'

import { sendEmail, retrySendEmail } from '@/modules/communications'

export async function sendWithRetry(
  draftId: string,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
  let attempts = 0

  while (attempts < maxRetries) {
    const result =
      attempts === 0
        ? await sendEmail({ draftId })
        : await retrySendEmail(draftId)

    if (result.success) {
      return { success: true }
    }

    attempts++
    console.log(`Attempt ${attempts} failed: ${result.error}`)

    if (attempts < maxRetries) {
      // Wait before retrying (exponential backoff)
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempts) * 1000)
      )
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts`,
  }
}
```
