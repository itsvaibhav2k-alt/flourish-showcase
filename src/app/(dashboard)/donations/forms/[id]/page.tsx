import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDonationForm } from '@/modules/donations/queries/get-donation-forms'
import { DonationFormBuilder } from '@/modules/donations/components/donation-form-builder'
import { ArrowLeft } from 'lucide-react'

interface DonationFormEditPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Edit donation form page
 * Shows form details and stats
 */
export default async function DonationFormEditPage({ params }: DonationFormEditPageProps) {
  const { id } = await params
  const form = await getDonationForm(id)

  if (!form) {
    notFound()
  }

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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold text-neutral-900">Edit Form: {form.name}</h1>
              <Badge variant={form.is_active ? 'default' : 'outline'} className={form.is_active ? 'bg-green-100 text-green-700 border-green-200' : ''}>
                {form.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-neutral-500 text-sm">
              Update form settings and configuration
            </p>
          </div>
        </div>

        {/* Form Builder */}
        <DonationFormBuilder existingForm={form} />
      </div>
    </div>
  )
}
