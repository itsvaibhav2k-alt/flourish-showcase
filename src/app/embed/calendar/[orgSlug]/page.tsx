import { notFound } from 'next/navigation'
import { getPublicShifts } from '@/modules/volunteers/queries/get-public-shifts'
import { EmbedCalendar, type CalendarView } from '@/modules/embed/components/embed-calendar'
import { type EmbedTheme } from '@/modules/embed/utils/embed-themes'

interface EmbedCalendarPageProps {
  params: Promise<{
    orgSlug: string
  }>
  searchParams: Promise<{
    view?: string
    theme?: string
    accent?: string
    hideHeader?: string
    compact?: string
  }>
}

export default async function EmbedCalendarPage({
  params,
  searchParams,
}: EmbedCalendarPageProps) {
  const { orgSlug } = await params
  const search = await searchParams

  // Fetch public shifts for this organization
  const data = await getPublicShifts(orgSlug)

  if (!data) {
    notFound()
  }

  const { organization, shifts } = data

  // Parse URL parameters
  const view: CalendarView = search.view === 'week' ? 'week' : 'month'
  const theme: EmbedTheme = search.theme === 'dark' ? 'dark' : 'light'
  const accentColor = search.accent?.replace(/^#/, '') || undefined
  const hideHeader = search.hideHeader === 'true'
  const compact = search.compact === 'true'

  return (
    <div className="p-4">
      <EmbedCalendar
        shifts={shifts}
        orgSlug={orgSlug}
        orgName={organization.name}
        initialView={view}
        theme={theme}
        accentColor={accentColor}
        hideHeader={hideHeader}
        compact={compact}
      />
    </div>
  )
}

// Allow embedding in iframes by not setting X-Frame-Options
export async function generateMetadata() {
  return {
    title: 'Volunteer Calendar',
  }
}

// Configure headers to allow iframe embedding
export const dynamic = 'force-dynamic'
