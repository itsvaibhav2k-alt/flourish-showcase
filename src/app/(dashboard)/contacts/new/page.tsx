import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layouts/page-header'
import { ContactForm } from '@/modules/contacts/components/contact-form'

export const dynamic = 'force-dynamic'

export default function NewContactPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb navigation */}
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>

        <PageHeader
          title="Add Contact"
          description="Create a new contact to track donors, volunteers, and supporters in your organization"
        />

        <ContactForm mode="create" />
      </div>
    </div>
  )
}
