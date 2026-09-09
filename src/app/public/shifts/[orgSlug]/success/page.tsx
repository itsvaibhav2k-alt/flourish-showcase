import Link from 'next/link'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddToCalendarButton } from '@/modules/volunteers/components/add-to-calendar-button'

interface SuccessPageProps {
  params: {
    orgSlug: string
  }
  searchParams: {
    shift?: string
    status?: string
    shiftId?: string
  }
}

export default function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const shiftTitle = searchParams.shift || 'the shift'
  const status = searchParams.status || 'confirmed'
  const shiftId = searchParams.shiftId
  const isWaitlisted = status === 'waitlisted'

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">
            {isWaitlisted ? "You're on the Waitlist!" : "You're Signed Up!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            {isWaitlisted ? (
              <>
                <p className="text-lg text-neutral-700">
                  This shift has reached capacity, but you&apos;ve been added to the waitlist for:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-neutral-900">
                    {shiftTitle}
                  </p>
                  <Badge className="bg-amber-100 text-amber-800">Waitlisted</Badge>
                </div>
                <p className="text-neutral-600">
                  We&apos;ll notify you by email if a spot becomes available.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-neutral-700">
                  Thank you for signing up for:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-neutral-900">
                    {shiftTitle}
                  </p>
                  <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                </div>
                <p className="text-neutral-600">
                  You should receive a confirmation email shortly with all the details.
                </p>
              </>
            )}
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-neutral-900">What's Next?</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>Check your email for shift details and location information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>
                  {isWaitlisted
                    ? "We&apos;ll email you if a spot opens up"
                    : "You&apos;ll receive a reminder email before the shift"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>Mark your calendar so you don&apos;t forget!</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link href={`/public/shifts/${params.orgSlug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                View More Opportunities
              </Link>
            </Button>
            {shiftId && (
              <AddToCalendarButton
                shiftId={shiftId}
                className="flex-1"
              />
            )}
          </div>

          <div className="bg-primary-50 rounded-lg p-4 text-sm text-center">
            <p className="text-neutral-700">
              Questions? Contact the organization directly or check your confirmation email for
              contact information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
