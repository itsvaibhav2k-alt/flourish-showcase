import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Globe,
  Lock,
  Copy,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  CalendarPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SignupManager } from '@/modules/volunteers/components/signup-manager'
import { CheckInInterface } from '@/modules/volunteers/components/check-in-interface'
import { AddToCalendarButton } from '@/modules/volunteers/components/add-to-calendar-button'
import { CalendarSubscribeLink } from '@/modules/volunteers/components/calendar-subscribe-link'
import { getShiftById } from '@/modules/volunteers/queries/get-shifts'
import { getOrganization } from '@/modules/settings/queries/get-organization'
import { cn } from '@/lib/utils'

interface ShiftDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ShiftDetailPage({ params }: ShiftDetailPageProps) {
  const { id } = await params
  let shift
  let organization
  try {
    shift = await getShiftById(id)
    organization = await getOrganization()
  } catch (error) {
    notFound()
  }

  if (!organization) {
    notFound()
  }

  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)
  const now = new Date()

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const shortDateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const isToday = startDate.toDateString() === now.toDateString()
  const isPast = endDate < now
  const isUpcoming = startDate > now

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
    open: { label: 'Open', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    full: { label: 'Full', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: Users },
    completed: { label: 'Completed', color: 'text-neutral-600', bgColor: 'bg-neutral-100 border-neutral-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: AlertCircle },
  }

  const status = statusConfig[shift.status] || statusConfig.open
  const StatusIcon = status.icon

  const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
  const fillPercent = shift.capacity ? Math.min(100, Math.round((shift.confirmed_signups / shift.capacity) * 100)) : 0
  const availableSpots = shift.capacity ? Math.max(0, shift.capacity - (shift.confirmed_signups || 0)) : null

  const publicUrl = shift.is_public && organization.public_slug
    ? `${process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')}/public/shifts/${organization.public_slug}/${shift.id}`
    : null

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 mt-1" asChild>
            <Link href="/volunteers/shifts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-neutral-900 truncate">{shift.title}</h1>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                status.bgColor,
                status.color
              )}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </span>
            </div>
            <p className="text-neutral-500 text-sm">
              {shortDateStr} · {startTime} - {endTime}
              {shift.location && ` · ${shift.location}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddToCalendarButton shiftId={shift.id} />
            <Button asChild>
              <Link href={`/volunteers/shifts/${shift.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Shift
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-neutral-200/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">Date</p>
                      <p className="text-sm font-medium text-neutral-900">{shortDateStr}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">Time</p>
                      <p className="text-sm font-medium text-neutral-900">{startTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">Volunteers</p>
                      <p className="text-sm font-medium text-neutral-900">
                        {shift.confirmed_signups}/{shift.capacity || '∞'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">Location</p>
                      <p className="text-sm font-medium text-neutral-900 truncate max-w-[100px]">
                        {shift.location || 'TBD'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {shift.description && (
              <Card className="border-neutral-200/60 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Description</h3>
                  <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">
                    {shift.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Check-in Interface (only show on day of shift) */}
            {isToday && !isPast && (
              <CheckInInterface
                signups={signups}
                shiftStartTime={shift.start_time}
                shiftEndTime={shift.end_time}
              />
            )}

            {/* Volunteer Signups */}
            <SignupManager signups={signups} shiftId={shift.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Capacity Progress */}
            <Card className="border-neutral-200/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Capacity</h3>
                    <span className="text-2xl font-bold text-neutral-900">{fillPercent}%</span>
                  </div>

                  {/* Progress Ring Visual */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative h-32 w-32">
                      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-neutral-100"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${fillPercent * 2.51} 251`}
                          className={cn(
                            fillPercent >= 100 ? 'text-emerald-500' :
                            fillPercent >= 75 ? 'text-teal-500' :
                            fillPercent >= 50 ? 'text-amber-500' :
                            'text-violet-500'
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-neutral-900">{shift.confirmed_signups}</span>
                        <span className="text-xs text-neutral-500">of {shift.capacity || '∞'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-neutral-100 divide-y divide-neutral-100">
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-neutral-600">Confirmed</span>
                    <span className="text-sm font-semibold text-emerald-600">{shift.confirmed_signups}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-neutral-600">Waitlisted</span>
                    <span className="text-sm font-semibold text-amber-600">{shift.waitlisted_signups || 0}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-neutral-600">Available</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {availableSpots !== null ? availableSpots : 'Unlimited'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Signup */}
            <Card className="border-neutral-200/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  {shift.is_public ? (
                    <Globe className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-neutral-400" />
                  )}
                  <h3 className="text-sm font-semibold text-neutral-900">Public Signup</h3>
                </div>

                {shift.is_public && publicUrl ? (
                  <div className="space-y-3">
                    <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                      Public signup enabled
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Open
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-500">
                      Enable public signup to allow volunteers to sign up via a shareable link.
                    </p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/volunteers/shifts/${shift.id}/edit`}>
                        Enable Public Signup
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calendar Subscription */}
            <Card className="border-neutral-200/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarPlus className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-semibold text-neutral-900">Calendar Feed</h3>
                </div>
                <p className="text-sm text-neutral-500 mb-3">
                  Subscribe to get all shifts in your calendar app.
                </p>
                <CalendarSubscribeLink
                  organizationId={organization.id}
                  organizationName={organization.name}
                  compact
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
