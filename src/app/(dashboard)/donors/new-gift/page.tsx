import Link from 'next/link'
export const dynamic = 'force-dynamic'
import { GiftForm } from '@/modules/donors/components/gift-form'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Gift, Sparkles } from 'lucide-react'

interface NewGiftPageProps {
  searchParams?: Promise<{
    contact?: string
  }>
}

/**
 * Page for recording a new gift with enhanced visual design
 */
export default async function NewGiftPage({ searchParams }: NewGiftPageProps) {
  const params = await searchParams
  const defaultContactId = params?.contact

  const supabase = await createClient()

  // Get current user and organization
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto">
            <Gift className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-neutral-600">Please log in to record a gift.</p>
        </div>
      </div>
    )
  }

  const { data: memberData } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!memberData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto">
            <Gift className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-neutral-600">Organization not found.</p>
        </div>
      </div>
    )
  }

  // Fetch all contacts for the dropdown
  const { data: contactsData } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email')
    .eq('organization_id', memberData.organization_id)
    .order('last_name', { ascending: true })
  const contacts = contactsData ?? []

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Navigation */}
        <Link
          href="/donors"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Donors
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 heading-tight">
                Record New Gift
              </h1>
            </div>
          </div>
          <p className="text-neutral-500 mt-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-400" />
            Add a new gift to your donor&apos;s giving history and track your fundraising progress.
          </p>
        </div>

        {/* Gift Form */}
        <GiftForm contacts={contacts} defaultContactId={defaultContactId} />

        {/* Footer Help Text */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 text-center">
            Need to import multiple gifts?{' '}
            <Link
              href="/donors/import"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Use the bulk import tool
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
