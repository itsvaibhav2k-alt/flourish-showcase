import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
export const dynamic = 'force-dynamic'
import {
  Users,
  Heart,
  UserPlus,
  Calendar,
  ArrowRight,
  Clock,
  Mail,
  Sparkles,
  FileText,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDashboardStats, DashboardStats } from '@/modules/dashboard/queries/get-dashboard-stats'
import { getRecentActivity, ActivityItem } from '@/modules/dashboard/queries/get-recent-activity'
import { getUpcomingShifts, UpcomingShift } from '@/modules/dashboard/queries/get-upcoming-shifts'
import { getPendingDraftsSummary, PendingDraftsSummary } from '@/modules/dashboard/queries/get-pending-drafts'
import { getDonorAlerts, DonorAlert } from '@/modules/dashboard/queries/get-donor-alerts'
import { formatTimeAgo } from '@/modules/dashboard/utils/format-time'
import { redirect } from 'next/navigation'
import { TodaysActionsWrapper } from '@/modules/dashboard/components/todays-actions-wrapper'
import { getTasks, MyTasksWidget } from '@/modules/tasks'
import { DemoBannerWrapper } from '@/modules/dashboard/components/demo-banner-wrapper'
import { PendingDraftsPanel } from '@/modules/dashboard/components/pending-drafts-panel'
import { getPendingDrafts } from '@/modules/dashboard/queries/get-pending-drafts'
import { hasDemoDataLoaded } from '@/modules/dashboard/queries/check-demo-data'
import { AnimatedGreeting } from '@/modules/dashboard/components/animated-greeting'
import { createClient } from '@/lib/supabase/server'
import { getCopilotActions } from '@/modules/copilot'
import { CopilotWidget } from '@/modules/dashboard/components/copilot-widget'
// getDonations removed - donations table doesn't exist, using gifts table instead
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'
import { getVisibleDashboardTiles, getCustomizationSettings } from '@/modules/settings'
import type { DashboardTileId, DashboardTileConfig } from '@/modules/settings'
import { CustomizeDashboardButton } from '@/modules/dashboard/components/customize-dashboard-button'
import { getCurrentUserRole, getCurrentOrganizationId } from '@/lib/auth/organization'
import { DashboardAITiles, type CachedTileContent, type CustomTileData } from '@/modules/ai-tiles'
import { getAllAITilesData, type AllAITilesData } from '@/lib/ai-tiles/queries'
import { DashboardStatsGrid, type StatCardData } from '@/modules/dashboard/components/dashboard-stats-grid'

// Default values when data can't be fetched
const defaultStats: DashboardStats = {
  totalContacts: 0,
  activeDonors: 0,
  totalVolunteers: 0,
  emailsSentThisMonth: 0,
  contactsChangePercent: null,
  donorsChangePercent: null,
  volunteersChangePercent: null,
  totalDonations: 0,
  totalRaised: 0,
  monthlyRecurring: 0,
  sparklineData: {
    totalRaised: [0, 0, 0, 0, 0, 0, 0],
    contacts: [0, 0, 0, 0, 0, 0, 0],
    volunteers: [0, 0, 0, 0, 0, 0, 0],
    emails: [0, 0, 0, 0, 0, 0, 0],
  },
}

const defaultDraftsSummary: PendingDraftsSummary = {
  totalPending: 0,
  totalApproved: 0,
  needsReview: 0,
  pendingByType: {
    thankYou: 0,
    confirmation: 0,
    reminder: 0,
    followUp: 0,
    welcome: 0,
    custom: 0,
  },
}

// Helper function to format date nicely
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default async function DashboardPage() {
  // Get user info for personalized greeting
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  // Fetch all dashboard data in parallel with error handling
  let stats: DashboardStats = defaultStats
  let recentActivity: ActivityItem[] = []
  let upcomingShifts: UpcomingShift[] = []
  let draftsSummary: PendingDraftsSummary = defaultDraftsSummary
  let donorAlerts: DonorAlert[] = []
  let myTasks: Awaited<ReturnType<typeof getTasks>> = []
  let pendingDrafts: Awaited<ReturnType<typeof getPendingDrafts>> = []
  let hasDemoData = false
  let copilotActions: Awaited<ReturnType<typeof getCopilotActions>> = []
  // recentDonations removed - donations table doesn't exist
  let visibleTiles: DashboardTileId[] = []
  let dashboardTilesConfig: DashboardTileConfig[] = []
  let isAdmin = false
  let organizationId: string | null = null
  let enabledAITiles: string[] = []
  let customAITiles: CustomTileData[] = []
  let cachedAITilesData: Record<string, CachedTileContent> = {}

  try {
    // Fetch organization ID first (needed for AI tiles query)
    organizationId = await getCurrentOrganizationId()

    // Fetch ALL dashboard data in parallel, including AI tiles
    const [userRole, results, aiTilesData] = await Promise.all([
      getCurrentUserRole().catch(() => null),
      Promise.all([
        getDashboardStats().catch(() => defaultStats),
        getRecentActivity({ limit: 5 }).catch(() => []),
        getUpcomingShifts({ limit: 5 }).catch(() => []),
        getPendingDraftsSummary().catch(() => defaultDraftsSummary),
        getDonorAlerts({ limit: 5 }).catch(() => []),
        getTasks({ assignedToCurrentUser: true, dueTodayOrOverdue: true }).catch(() => []),
        getPendingDrafts(3).catch(() => []),
        hasDemoDataLoaded().catch(() => false),
        getCopilotActions({ status: 'pending' }).catch(() => []),
        getVisibleDashboardTiles().catch(() => []),
        getCustomizationSettings().catch(() => null),
      ]),
      // Fetch AI tiles data in parallel with main dashboard data
      organizationId
        ? getAllAITilesData(organizationId).catch(() => ({ enabledBuiltIn: [], customTiles: [], cachedData: {} }))
        : Promise.resolve({ enabledBuiltIn: [], customTiles: [], cachedData: {} }),
    ])
    isAdmin = userRole === 'admin'
    stats = results[0]
    recentActivity = results[1]
    upcomingShifts = results[2]
    draftsSummary = results[3]
    donorAlerts = results[4]
    myTasks = results[5]
    pendingDrafts = results[6]
    hasDemoData = results[7]
    copilotActions = results[8]
    visibleTiles = results[9]
    dashboardTilesConfig = results[10]?.dashboard.tiles || []

    // Extract AI tiles data from optimized query result
    enabledAITiles = aiTilesData.enabledBuiltIn
    customAITiles = aiTilesData.customTiles.map(t => ({ id: t.id, name: t.name, description: t.description }))
    cachedAITilesData = aiTilesData.cachedData
  } catch (error) {
    // If all queries fail (no organization), redirect to login
    if (error instanceof Error && error.message.includes('No organization')) {
      redirect('/login')
    }
    // Otherwise just use defaults
  }

  // Helper to check if a tile is visible
  const isTileVisible = (tileId: DashboardTileId) => visibleTiles.length === 0 || visibleTiles.includes(tileId)

  // Hero stat cards with sparklines (Stripe-style)
  // Using string icon names for serialization across server/client boundary
  // Sparkline data comes from real database queries - shows cumulative growth over 7 weeks
  const statsCardsConfig: Array<{ tileId: DashboardTileId } & StatCardData> = [
    {
      tileId: 'stat-total-raised' as DashboardTileId,
      title: 'Total Raised',
      value: `$${stats.totalRaised.toLocaleString()}`,
      iconName: 'dollar-sign',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      change: null,
      changeLabel: 'All time',
      changeDirection: null,
      href: '/donors',
      sparklineData: stats.sparklineData.totalRaised,
      sparklineColor: '#16a34a',
    },
    {
      tileId: 'stat-total-contacts' as DashboardTileId,
      title: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      iconName: 'users',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      change: stats.contactsChangePercent !== null
        ? `${stats.contactsChangePercent > 0 ? '+' : ''}${stats.contactsChangePercent}%`
        : null,
      changeLabel: 'vs last month',
      changeDirection: stats.contactsChangePercent !== null && stats.contactsChangePercent > 0 ? 'up' : 'down',
      href: '/contacts',
      sparklineData: stats.sparklineData.contacts,
      sparklineColor: '#16804d',
    },
    {
      tileId: 'stat-volunteers' as DashboardTileId,
      title: 'Volunteers',
      value: stats.totalVolunteers.toLocaleString(),
      iconName: 'user-plus',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      change: stats.volunteersChangePercent !== null
        ? `${stats.volunteersChangePercent > 0 ? '+' : ''}${stats.volunteersChangePercent}%`
        : null,
      changeLabel: 'vs last month',
      changeDirection: stats.volunteersChangePercent !== null && stats.volunteersChangePercent > 0 ? 'up' : 'down',
      href: '/volunteers',
      sparklineData: stats.sparklineData.volunteers,
      sparklineColor: '#0d9488',
    },
    {
      tileId: 'stat-emails-sent' as DashboardTileId,
      title: 'Emails Sent',
      value: stats.emailsSentThisMonth.toLocaleString(),
      iconName: 'mail',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      change: null,
      changeLabel: 'This month',
      changeDirection: null,
      href: '/communications',
      sparklineData: stats.sparklineData.emails,
      sparklineColor: '#16804d',
    },
  ]

  // Always show all 4 hero stats (not filtered by customizer to avoid dead space)
  const visibleStats = statsCardsConfig
    .map(({ tileId, ...rest }) => rest) as StatCardData[]

  const quickActions = [
    {
      tileId: 'action-add-contact' as DashboardTileId,
      label: 'Add Contact',
      icon: Users,
      href: '/contacts/new',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      tileId: 'action-record-gift' as DashboardTileId,
      label: 'Record Gift',
      icon: Heart,
      href: '/donors/new-gift',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      tileId: 'action-donation-forms' as DashboardTileId,
      label: 'Donation Forms',
      icon: CreditCard,
      href: '/donations/forms',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      tileId: 'action-create-shift' as DashboardTileId,
      label: 'Create Shift',
      icon: Calendar,
      href: '/volunteers/shifts/new',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
  ].filter((action) => isTileVisible(action.tileId))

  // Check if we should show the demo banner
  // Show if: no contacts (load mode) OR demo data exists (delete mode)
  const showDemoBanner = stats.totalContacts === 0 || hasDemoData

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50/50">
      <div className="px-6 py-5 space-y-5">
        {/* Header with greeting */}
        <div className="flex items-center justify-between">
          <AnimatedGreeting userName={userName} date={formatDate()} />
          <div className="flex items-center gap-2">
            {draftsSummary.needsReview > 0 && (
              <Link href="/communications">
                <Button
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {draftsSummary.needsReview} drafts to review
                </Button>
              </Link>
            )}
            <CustomizeDashboardButton
              initialTiles={dashboardTilesConfig}
              isAdmin={isAdmin}
            />
            <PageGuideTrigger pageKey="dashboard" />
          </div>
        </div>

        {/* Demo Banner - Shows when no contacts exist or demo data is loaded */}
        <DemoBannerWrapper showBanner={showDemoBanner} hasDemoData={hasDemoData} />

        {/* Hero Stats Row - Stripe-style with sparklines */}
        <DashboardStatsGrid stats={visibleStats} />

        {/* Quick Actions Bar */}
        {(quickActions.length > 0 || isTileVisible('action-ask-flora')) && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-[16px] border border-neutral-200 shadow-card">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mr-2 hidden sm:inline">
              Quick Actions
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 font-medium"
                    >
                      <Icon className="h-4 w-4 mr-1.5" />
                      {action.label}
                    </Button>
                  </Link>
                )
              })}
              {isTileVisible('action-ask-flora') && (
                <Link href="/flora">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-medium"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Ask Flora
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Status Bar - Compact horizontal alerts */}
        {(draftsSummary.needsReview > 0 || myTasks.length > 0 || donorAlerts.length > 0) && (
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-[16px] border border-neutral-100">
            {draftsSummary.needsReview > 0 && (
              <Link href="/communications" className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm font-medium hover:bg-violet-100 transition-colors">
                <FileText className="h-3.5 w-3.5" />
                {draftsSummary.needsReview} drafts to review
              </Link>
            )}
            {myTasks.length > 0 && (
              <Link href="/tasks" className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium hover:bg-teal-100 transition-colors">
                <CheckCircle className="h-3.5 w-3.5" />
                {myTasks.length} tasks due
              </Link>
            )}
            {donorAlerts.length > 0 && (
              <Link href="/donors?filter=at-risk" className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-100 transition-colors">
                <AlertTriangle className="h-3.5 w-3.5" />
                {donorAlerts.length} donor alerts
              </Link>
            )}
          </div>
        )}

        {/* Copilot Widget - Hero Feature */}
        {isTileVisible('widget-copilot') && copilotActions.length > 0 && (
          <CopilotWidget initialActions={copilotActions} />
        )}

        {/* AI Insights Tiles */}
        {(() => {
          // Check visibility of AI tiles using the dashboard customizer settings
          const showOrgPulse = isTileVisible('ai-org-pulse')
          const showDonorHealth = isTileVisible('ai-donor-health')
          const showWeeklyPriorities = isTileVisible('ai-weekly-priorities')
          const showAIInsights = showOrgPulse || showDonorHealth || showWeeklyPriorities

          if (!organizationId || !showAIInsights) return null

          // Filter enabled tiles based on visibility settings
          const visibleBuiltInTiles = enabledAITiles.filter(tileId => {
            if (tileId === 'org-pulse') return showOrgPulse
            if (tileId === 'donor-health') return showDonorHealth
            if (tileId === 'weekly-priorities') return showWeeklyPriorities
            return true
          })

          // Only render if there are visible tiles or custom tiles
          if (visibleBuiltInTiles.length === 0 && customAITiles.length === 0) return null

          return (
            <>
              <div className="border-t border-neutral-100 -mx-6 px-6 pt-5" />
              <DashboardAITiles
                organizationId={organizationId}
                enabledBuiltInTiles={visibleBuiltInTiles}
                customTiles={customAITiles}
                cachedTilesData={cachedAITilesData}
              />
            </>
          )
        })()}

        {/* Main Content - Two Column Layout (60/40 split) */}
        {(() => {
          const showRecentActivity = isTileVisible('widget-recent-activity')
          const hasAITiles = enabledAITiles.length > 0 || customAITiles.length > 0
          const showUpcomingShifts = isTileVisible('widget-upcoming-shifts')
          const visibleMainWidgets = [showRecentActivity, showUpcomingShifts].filter(Boolean).length

          if (visibleMainWidgets === 0) return null

          return (
            <>
              {hasAITiles && <div className="border-t border-neutral-100 -mx-6 px-6 pt-5" />}
              <div className={`grid gap-6 ${
                visibleMainWidgets === 1 ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.5fr_1fr]'
              }`}>
              {/* Left Column (60%): Recent Activity */}
              {showRecentActivity && (
                <Card className="shadow-sm border-neutral-200/60 bg-white flex flex-col min-h-[400px]">
                  <CardHeader className="py-4 px-5 border-b border-neutral-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-neutral-900">Recent Activity</CardTitle>
                      <Link href="/contacts" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                        View all
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 overflow-auto">
                    {recentActivity.length > 0 ? (
                      <div className="relative pl-6">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-200" />

                        {recentActivity.slice(0, 8).map((activity, index) => {
                          // Determine icon and colors based on activity type
                          const getActivityStyle = (type: string) => {
                            switch (type) {
                              case 'gift':
                                return {
                                  icon: Heart,
                                  bgColor: 'bg-primary-50',
                                  iconColor: 'text-primary-600',
                                }
                              case 'shift_signup':
                                return {
                                  icon: Calendar,
                                  bgColor: 'bg-primary-50',
                                  iconColor: 'text-primary-600',
                                }
                              case 'contact_created':
                                return {
                                  icon: UserPlus,
                                  bgColor: 'bg-primary-50',
                                  iconColor: 'text-primary-600',
                                }
                              case 'email_sent':
                                return {
                                  icon: Mail,
                                  bgColor: 'bg-primary-50',
                                  iconColor: 'text-primary-600',
                                }
                              default:
                                return {
                                  icon: Clock,
                                  bgColor: 'bg-primary-50',
                                  iconColor: 'text-primary-600',
                                }
                            }
                          }

                          const style = getActivityStyle(activity.activityType)
                          const IconComponent = style.icon
                          const isLast = index === Math.min(recentActivity.length - 1, 7)

                          return (
                            <div key={activity.id} className={`relative ${!isLast ? 'pb-4' : ''} group`}>
                              {/* Timeline dot with icon */}
                              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full ${style.bgColor} border-2 border-white shadow-sm flex items-center justify-center ring-2 ring-white`}>
                                <IconComponent className={`h-2 w-2 ${style.iconColor}`} />
                              </div>

                              {/* Content */}
                              <Link
                                href={`/contacts/${activity.contactId}`}
                                className="block ml-2 p-3 -my-1 rounded-lg hover:bg-neutral-50 transition-all duration-150 group-hover:translate-x-0.5"
                              >
                                <p className="text-sm leading-relaxed">
                                  <span className="font-semibold text-neutral-900">{activity.contactFirstName}</span>
                                  <span className="text-neutral-500"> {activity.description}</span>
                                </p>
                                <p className="text-xs text-neutral-400 font-mono mt-1.5 tracking-tight" suppressHydrationWarning>
                                  {formatTimeAgo(activity.occurredAt)}
                                </p>
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-12">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center mb-4 shadow-inner">
                          <Clock className="h-7 w-7 text-neutral-400" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-700">No recent activity</p>
                        <p className="text-xs text-neutral-400 mt-1.5 max-w-[200px] text-center">
                          Activity from your contacts will appear here as it happens
                        </p>
                      </div>
                    )}
                  </CardContent>
                  {/* View all link at bottom */}
                  {recentActivity.length > 0 && (
                    <div className="px-5 py-3 border-t border-neutral-100 flex-shrink-0">
                      <Link
                        href="/contacts"
                        className="group flex items-center justify-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View all activity
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  )}
                </Card>
              )}

              {/* Right Column (40%): Upcoming Shifts */}
              {showUpcomingShifts && (
                <Card className="shadow-sm border-neutral-200/60 bg-white flex flex-col min-h-[400px]">
                  <CardHeader className="py-4 px-5 border-b border-neutral-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-neutral-900">Upcoming</CardTitle>
                      <Link href="/volunteers/shifts" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                        View all
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 overflow-auto">
                    {upcomingShifts.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingShifts.slice(0, 6).map((shift) => {
                          const shiftDate = new Date(shift.startTime)
                          const formattedTime = shiftDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                          const fillPercent = Math.min(100, shift.fillRate)
                          return (
                            <Link
                              key={shift.id}
                              href={`/volunteers/shifts/${shift.id}`}
                              className="flex items-start gap-4 p-4 rounded-[12px] border border-neutral-100 hover:border-neutral-200 hover:shadow-card-hover transition-all duration-150"
                            >
                              {/* Calendar date box */}
                              <div className="flex flex-col items-center justify-center h-14 w-14 rounded-[12px] bg-primary-50 flex-shrink-0">
                                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wide" suppressHydrationWarning>
                                  {shiftDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-xl font-bold text-primary-900 leading-tight" suppressHydrationWarning>
                                  {shiftDate.getDate()}
                                </span>
                              </div>

                              {/* Shift details */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-neutral-900 truncate">{shift.title}</p>
                                <p className="text-xs text-neutral-500 mt-0.5" suppressHydrationWarning>{formattedTime}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        fillPercent >= 100 ? 'bg-green-500' :
                                        fillPercent >= 75 ? 'bg-teal-500' :
                                        fillPercent >= 50 ? 'bg-amber-500' :
                                        'bg-neutral-400'
                                      }`}
                                      style={{ width: `${fillPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-neutral-600">{shift.confirmedSignups}/{shift.capacity ?? '∞'}</span>
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-12">
                        <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                          <Calendar className="h-6 w-6 text-neutral-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-600">No upcoming shifts</p>
                        <p className="text-xs text-neutral-400 mt-1 mb-3">Create a shift to get started</p>
                        <Link href="/volunteers/shifts/new">
                          <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
                            Create Shift
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
