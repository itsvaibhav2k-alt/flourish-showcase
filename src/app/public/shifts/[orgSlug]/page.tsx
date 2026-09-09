import { notFound } from 'next/navigation'
import { getPublicShifts } from '@/modules/volunteers/queries/get-public-shifts'
import { PublicShiftCard } from '@/modules/volunteers/components/public-shift-card'
import { Calendar } from 'lucide-react'

interface PublicShiftsPageProps {
  params: {
    orgSlug: string
  }
}

export default async function PublicShiftsPage({ params }: PublicShiftsPageProps) {
  const data = await getPublicShifts(params.orgSlug)

  if (!data) {
    notFound()
  }

  const { organization, shifts } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-neutral-900 heading-tight">
          {organization.name}
        </h1>
        <p className="text-xl text-neutral-600">
          Join us and make a difference in your community
        </p>
      </div>

      {/* Shifts section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Available Volunteer Opportunities
          </h2>
          <p className="text-neutral-600 mt-1">
            Sign up for an upcoming shift that fits your schedule
          </p>
        </div>

        {shifts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
              <Calendar className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Shifts Available
            </h3>
            <p className="text-neutral-600 max-w-md mx-auto">
              There are no volunteer opportunities available at this time. Please check back later
              or contact the organization directly.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shifts.map((shift) => (
              <PublicShiftCard
                key={shift.id}
                shift={shift}
                orgSlug={params.orgSlug}
              />
            ))}
          </div>
        )}
      </div>

      {/* Help section */}
      <div className="border-t pt-8 mt-12">
        <div className="bg-primary-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Questions?
          </h3>
          <p className="text-neutral-600">
            If you have any questions about volunteering, please contact{' '}
            <span className="font-medium">{organization.name}</span> directly.
          </p>
        </div>
      </div>
    </div>
  )
}
