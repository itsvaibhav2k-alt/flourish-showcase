import { ShiftForm } from '@/modules/volunteers/components/shift-form'
import { CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function NewShiftPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb navigation */}
        <Link
          href="/volunteers/shifts"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shifts
        </Link>

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <CalendarPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Create Volunteer Shift
            </h1>
            <p className="text-neutral-500 text-sm mt-0.5">
              Set up a new volunteer opportunity for your organization
            </p>
          </div>
        </div>

        <ShiftForm />
      </div>
    </div>
  )
}
