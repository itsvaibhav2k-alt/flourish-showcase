'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { Plus, Calendar, UserCheck, Users, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShiftsList } from '@/modules/volunteers/components/shifts-list'
import { VolunteerCard } from '@/modules/volunteers/components/volunteer-card'
import { ExportButton } from '@/modules/reports/components/export-button'
import { ShiftsFilterProvider, ShiftsFilterBar } from '@/modules/volunteers/components/shifts-filter-context'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'

interface ShiftStats {
  upcoming_shifts: number
  hours_this_month: number
  average_fill_rate: number
}

interface VolunteerStats {
  total_volunteers: number
  total_hours: number
  hours_this_month: number
}

interface Shift {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  spots_filled: number
  spots_total: number
  status: string
}

interface Volunteer {
  id: string
  contact_id: string
  total_hours: number
  total_shifts: number
  contacts: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  }
}

interface VolunteersPageClientProps {
  shiftStats: ShiftStats
  volunteerStats: VolunteerStats
  upcomingShifts: Shift[]
  volunteers: Volunteer[]
}

export function VolunteersPageClient({
  shiftStats,
  volunteerStats,
  upcomingShifts,
  volunteers,
}: VolunteersPageClientProps) {
  const statsCards = [
    {
      title: 'Total Volunteers',
      value: volunteerStats.total_volunteers.toLocaleString(),
      icon: Users,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      subtitle: 'Active volunteers',
    },
    {
      title: 'Hours This Month',
      value: `${shiftStats.hours_this_month}h`,
      icon: Clock,
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      subtitle: 'Volunteered this month',
    },
    {
      title: 'Upcoming Shifts',
      value: shiftStats.upcoming_shifts.toLocaleString(),
      icon: Calendar,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      subtitle: 'Scheduled shifts',
    },
    {
      title: 'Average Fill Rate',
      value: `${shiftStats.average_fill_rate}%`,
      icon: TrendingUp,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: 'Upcoming 30 days',
    },
  ]
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Volunteers</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Manage volunteer shifts and track volunteer engagement
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PageGuideTrigger pageKey="volunteers" />
            <ExportButton exportType="volunteers" variant="outline" />
            <Link href="/volunteers/shifts/new">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                New Shift
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="shadow-card border-neutral-200/60 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-neutral-400">{stat.subtitle}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs for Shifts and Volunteers */}
        <div>
          <ShiftsFilterProvider>
            <Tabs defaultValue="shifts" className="space-y-4">
              <TabsList className="bg-neutral-100/80">
                <TabsTrigger
                  value="shifts"
                  className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
                >
                  Shifts
                </TabsTrigger>
                <TabsTrigger
                  value="volunteers"
                  className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
                >
                  Volunteers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="shifts" className="space-y-4">
                <Card className="shadow-card border-neutral-200/60 bg-white">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-neutral-900">Shifts</h2>
                      <Button
                        variant="outline"
                        asChild
                        size="sm"
                        className="border-neutral-200 hover:bg-teal-50 hover:border-teal-200 transition-smooth"
                      >
                        <Link href="/volunteers/shifts">View All</Link>
                      </Button>
                    </div>
                    <ShiftsFilterBar />
                    <Suspense fallback={
                      <div className="p-8 text-center text-neutral-500">Loading shifts...</div>
                    }>
                      {upcomingShifts.length > 0 ? (
                        <ShiftsList
                          shifts={upcomingShifts}
                          emptyMessage="No upcoming shifts. Create one to get started!"
                        />
                      ) : (
                        <div className="py-16 text-center">
                          <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-7 w-7 text-teal-300" />
                          </div>
                          <p className="text-sm font-medium text-neutral-600">No upcoming shifts</p>
                          <p className="text-xs text-neutral-400 mt-1 mb-4">
                            Create a shift to get started with volunteer management
                          </p>
                          <Link href="/volunteers/shifts/new">
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                              <Plus className="h-4 w-4 mr-1.5" />
                              Create First Shift
                            </Button>
                          </Link>
                        </div>
                      )}
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="volunteers" className="space-y-4">
                <Card className="shadow-card border-neutral-200/60 bg-white">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-neutral-100">
                      <h2 className="text-base font-semibold text-neutral-900">Active Volunteers</h2>
                    </div>
                    <Suspense fallback={
                      <div className="p-8 text-center text-neutral-500">Loading volunteers...</div>
                    }>
                      {volunteers.length > 0 ? (
                        <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {volunteers.map((volunteer) => (
                            <VolunteerCard key={volunteer.id} volunteer={volunteer} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-16 text-center">
                          <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                            <UserCheck className="h-7 w-7 text-teal-300" />
                          </div>
                          <p className="text-sm font-medium text-neutral-600">No volunteers yet</p>
                          <p className="text-xs text-neutral-400 mt-1 mb-4">
                            Sign up contacts for shifts to start building your volunteer base
                          </p>
                          <Link href="/volunteers/shifts/new">
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                              <Plus className="h-4 w-4 mr-1.5" />
                              Create First Shift
                            </Button>
                          </Link>
                        </div>
                      )}
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ShiftsFilterProvider>
        </div>
      </div>
    </div>
  )
}
