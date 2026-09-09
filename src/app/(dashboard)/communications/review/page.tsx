import { getDrafts } from '@/modules/communications/queries/get-drafts'
export const dynamic = 'force-dynamic'
import { ReviewQueue } from '@/modules/communications/components/review-queue'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { ArrowLeft, Inbox } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ReviewQueuePage() {
  // Fetch both 'draft' and 'pending' statuses for review
  const { drafts } = await getDrafts({ statuses: ['draft', 'pending'] })

  // Fetch contact info for drafts
  const organizationId = await getCurrentOrganizationId()
  const supabase = await createClient()

  const contactIds = drafts
    .map((d) => d.contact_id)
    .filter((id): id is string => id !== null)

  let contactsMap: Record<string, { name: string; email: string }> = {}

  if (contactIds.length > 0 && organizationId) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .in('id', contactIds)

    if (contacts) {
      contactsMap = contacts.reduce((acc, contact) => {
        acc[contact.id] = {
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email || '',
        }
        return acc
      }, {} as Record<string, { name: string; email: string }>)
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* Clean header */}
      <div className="mb-8">
        <Link
          href="/communications"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Communications
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Inbox className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Review Queue</h1>
            <p className="text-sm text-neutral-500">
              {drafts.length} email{drafts.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
        </div>
      </div>

      {/* Review Queue */}
      <ReviewQueue initialDrafts={drafts} contactsMap={contactsMap} />
    </div>
  )
}
