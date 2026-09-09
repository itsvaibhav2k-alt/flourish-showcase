import { getDrafts } from '@/modules/communications/queries/get-drafts'
export const dynamic = 'force-dynamic'
import { EmailHistory } from '@/modules/communications/components/email-history'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SentEmailsPage() {
  const { drafts: sentEmails, total } = await getDrafts({ status: 'sent', limit: 100 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/communications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Sent Emails</h1>
          <p className="text-neutral-600 mt-1">
            History of all sent email communications ({total} total)
          </p>
        </div>
      </div>

      {/* Email History */}
      <EmailHistory sentEmails={sentEmails} />
    </div>
  )
}
