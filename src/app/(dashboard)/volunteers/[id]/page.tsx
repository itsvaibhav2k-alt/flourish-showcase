import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Clock, Calendar, TrendingUp, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getVolunteerById } from '@/modules/volunteers/queries/get-volunteers'
import { getReliabilityLabel, getReliabilityColor } from '@/modules/volunteers/services/reliability-scorer'

interface VolunteerDetailPageProps {
  params: {
    id: string
  }
}

export default async function VolunteerDetailPage({ params }: VolunteerDetailPageProps) {
  let volunteer
  try {
    volunteer = await getVolunteerById(params.id)
  } catch (error) {
    notFound()
  }

  const initials = `${volunteer.first_name[0] || ''}${volunteer.last_name[0] || ''}`.toUpperCase()
  const reliabilityLabel = getReliabilityLabel(volunteer.reliability_score || 50)
  const reliabilityColorClass = getReliabilityColor(volunteer.reliability_score || 50)

  const shiftHistory = Array.isArray(volunteer.shift_history) ? volunteer.shift_history : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/volunteers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {volunteer.first_name} {volunteer.last_name}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {volunteer.first_name} {volunteer.last_name}
                  </h2>
                  <div className="space-y-1 mt-2">
                    {volunteer.email && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${volunteer.email}`} className="hover:underline">
                          {volunteer.email}
                        </a>
                      </div>
                    )}
                    {volunteer.phone && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${volunteer.phone}`} className="hover:underline">
                          {volunteer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shift History</CardTitle>
            </CardHeader>
            <CardContent>
              {shiftHistory.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 py-4">
                  No shift history yet
                </p>
              ) : (
                <div className="space-y-3">
                  {shiftHistory.map((signup) => {
                    const shiftData = Array.isArray(signup.shifts)
                      ? signup.shifts[0]
                      : signup.shifts

                    if (!shiftData) return null

                    const shiftDate = new Date(shiftData.start_time)
                    const isPast = shiftDate < new Date()

                    return (
                      <div
                        key={signup.id}
                        className="flex items-start justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-neutral-400 mt-1" />
                            <div>
                              <p className="font-medium">{shiftData.title}</p>
                              <p className="text-sm text-neutral-600">
                                {shiftDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              {shiftData.location && (
                                <p className="text-sm text-neutral-500 mt-1">
                                  {shiftData.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {signup.status === 'confirmed' && signup.checked_in_at && (
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Completed</span>
                            </div>
                          )}
                          {signup.no_show && (
                            <div className="flex items-center gap-1 text-sm text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>No Show</span>
                            </div>
                          )}
                          {signup.status === 'confirmed' && !signup.checked_in_at && !signup.no_show && !isPast && (
                            <Badge variant="secondary">Upcoming</Badge>
                          )}
                          {signup.status === 'waitlisted' && (
                            <Badge variant="secondary">Waitlisted</Badge>
                          )}
                          {signup.status === 'cancelled' && (
                            <Badge variant="secondary" className="text-neutral-500">
                              Cancelled
                            </Badge>
                          )}
                          {signup.hours_logged && (
                            <span className="text-sm text-neutral-500">
                              {signup.hours_logged}h
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">Total Hours</span>
                </div>
                <p className="text-2xl font-bold">{volunteer.total_hours}h</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">Total Shifts</span>
                </div>
                <p className="text-2xl font-bold">{volunteer.total_shifts}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">Completed Shifts</span>
                </div>
                <p className="text-2xl font-bold">{volunteer.completed_shifts}</p>
              </div>

              {volunteer.no_show_count > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">No Shows</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {volunteer.no_show_count}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-neutral-400" />
                <CardTitle>Reliability Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${reliabilityColorClass}`}>
                    {volunteer.reliability_score}
                  </span>
                  <span className="text-neutral-500">/ 100</span>
                </div>
                <p className={`text-sm font-medium ${reliabilityColorClass}`}>
                  {reliabilityLabel}
                </p>
                <p className="text-sm text-neutral-500 mt-2">
                  Based on {volunteer.total_shifts} shifts with{' '}
                  {volunteer.completed_shifts} completed and{' '}
                  {volunteer.no_show_count} no-shows.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/contacts/${volunteer.id}`}>View Contact Profile</Link>
              </Button>
              {volunteer.email && (
                <Button className="w-full" variant="outline" asChild>
                  <a href={`mailto:${volunteer.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
