import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DonationFormBuilder } from '@/modules/donations/components/donation-form-builder'

/**
 * Create new donation form page
 * Form builder for creating donation forms
 */
export default function NewDonationFormPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/donations/forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Create Donation Form</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Set up a new public donation form
            </p>
          </div>
        </div>

        {/* Form Builder */}
        <DonationFormBuilder />
      </div>
    </div>
  )
}
