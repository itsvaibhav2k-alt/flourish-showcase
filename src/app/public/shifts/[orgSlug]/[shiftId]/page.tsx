import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPublicShiftById } from '@/modules/volunteers/queries/get-public-shifts'
import { PublicSignupForm } from '@/modules/volunteers/components/public-signup-form'

interface ShiftSignupPageProps {
  params: {
    orgSlug: string
    shiftId: string
  }
}

export default async function ShiftSignupPage({ params }: ShiftSignupPageProps) {
  const data = await getPublicShiftById(params.orgSlug, params.shiftId)

  if (!data) {
    notFound()
  }

  const { organization, shift } = data

  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/public/shifts/${params.orgSlug}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all shifts
        </Link>
      </Button>

      {/* Organization name */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">{organization.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shift details - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{shift.title}</CardTitle>
                {shift.is_full ? (
                  <Badge className="bg-neutral-100 text-neutral-800">Full</Badge>
                ) : shift.available_spots !== null && shift.available_spots <= 3 ? (
                  <Badge className="bg-amber-100 text-amber-800">
                    {shift.available_spots} spot{shift.available_spots !== 1 ? 's' : ''} left
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800">Open</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-neutral-600">{dateStr}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-neutral-600">
                    {startTime} - {endTime}
                  </p>
                </div>
              </div>

              {shift.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-neutral-600">{shift.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="font-medium">Volunteers</p>
                  <p className="text-neutral-600">
                    {shift.capacity
                      ? `${shift.confirmed_signups} / ${shift.capacity} signed up`
                      : `${shift.confirmed_signups} volunteer${shift.confirmed_signups !== 1 ? 's' : ''} signed up`}
                  </p>
                </div>
              </div>

              {shift.description && (
                <div className="pt-4 border-t">
                  <p className="font-medium mb-2">About This Shift</p>
                  <p className="text-neutral-600 whitespace-pre-wrap">
                    {shift.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Signup form - 1 column on large screens */}
        <div className="lg:col-span-1">
          <PublicSignupForm
            orgSlug={params.orgSlug}
            shiftId={shift.id}
            shiftTitle={shift.title}
            isFull={shift.is_full}
          />
        </div>
      </div>
    </div>
  )
}
