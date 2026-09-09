import Link from 'next/link'
import { Plus, Calendar, Users, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShiftsList } from '@/modules/volunteers/components/shifts-list'
import { getShifts } from '@/modules/volunteers/queries/get-shifts'

export const dynamic = 'force-dynamic'

export default async function ShiftsPage() {
  const [upcomingShifts, pastShifts] = await Promise.all([
    getShifts({ status: 'upcoming', limit: 50 }),
    getShifts({ status: 'past', limit: 50 }),
  ])

  // Calculate stats
  const totalUpcoming = upcomingShifts.total
  const totalVolunteersNeeded = upcomingShifts.shifts.reduce((sum, shift) => {
    const needed = (shift.capacity || 0) - (shift.confirmed_signups || 0)
    return sum + Math.max(0, needed)
  }, 0)
  const totalSignedUp = upcomingShifts.shifts.reduce(
    (sum, shift) => sum + (shift.confirmed_signups || 0),
    0
  )
  const completedThisMonth = pastShifts.shifts.filter((shift) => {
    const shiftDate = new Date(shift.start_time)
    const now = new Date()
    return (
      shiftDate.getMonth() === now.getMonth() &&
      shiftDate.getFullYear() === now.getFullYear()
    )
  }).length

  const statsCards = [
    {
      title: 'Upcoming Shifts',
      value: totalUpcoming.toString(),
      icon: Calendar,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
      subtitle: 'Scheduled events',
    },
    {
      title: 'Volunteers Needed',
      value: totalVolunteersNeeded.toString(),
      icon: Users,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      subtitle: 'Open spots',
      highlight: totalVolunteersNeeded > 0 ? 'text-amber-600' : undefined,
    },
    {
      title: 'Signed Up',
      value: totalSignedUp.toString(),
      icon: CheckCircle,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: 'Confirmed volunteers',
    },
    {
      title: 'Completed',
      value: completedThisMonth.toString(),
      icon: Clock,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      subtitle: 'This month',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Volunteer Shifts
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Create and manage volunteer opportunities
            </p>
          </div>
          <Button
            asChild
            className="bg-violet-500 hover:bg-violet-600 text-white shadow-sm"
          >
            <Link href="/volunteers/shifts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Shift
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="shadow-card border-neutral-200/60 bg-white"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p
                        className={`text-2xl font-semibold tracking-tight ${stat.highlight || 'text-neutral-900'}`}
                      >
                        {stat.value}
                      </p>
                      <p className="text-xs text-neutral-400">{stat.subtitle}</p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Shifts List */}
        <Card className="shadow-card border-neutral-200/60 bg-white">
          <CardContent className="p-0">
            <Tabs defaultValue="upcoming" className="w-full">
              <div className="border-b border-neutral-200/60 px-4 pt-4">
                <TabsList className="bg-neutral-100/50 p-1">
                  <TabsTrigger
                    value="upcoming"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Upcoming ({upcomingShifts.total})
                  </TabsTrigger>
                  <TabsTrigger
                    value="past"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Past ({pastShifts.total})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upcoming" className="p-4 pt-6 m-0">
                <ShiftsList
                  shifts={upcomingShifts.shifts}
                  emptyMessage="No upcoming shifts. Create one to get started!"
                />
              </TabsContent>

              <TabsContent value="past" className="p-4 pt-6 m-0">
                <ShiftsList
                  shifts={pastShifts.shifts}
                  emptyMessage="No past shifts yet."
                  isPast
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
