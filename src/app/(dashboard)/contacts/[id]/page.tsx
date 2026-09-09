import * as React from 'react'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Clock,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Tag,
  Bot,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getContact } from '@/modules/contacts/queries/get-contact'
import { getContactFullName, getContactInitials } from '@/modules/contacts/utils/contact-helpers'
import { getContactActivities } from '@/modules/contacts/queries/get-contact-activities'
import { ActivityTimeline } from '@/modules/contacts/components/activity-timeline'
import { AISuggestionCard } from '@/modules/contacts/components/ai-suggestion-card'
import { PortalLinkCard } from '@/modules/contacts/components/portal-link-card'
import { GenerateEmailButton } from '@/modules/contacts/components/generate-email-button'
import { getNotes, getTasks, NotesList, TasksList } from '@/modules/tasks'
import { ContactGivingPotential, getGivingPotential } from '@/modules/giving-potential'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { isContactInPipeline, getProspectByContactId } from '@/modules/pipeline'
import { AddToPipelineButton } from '@/modules/pipeline/components/add-to-pipeline-button'
import { ContactReportDialog } from '@/modules/contacts/components/contact-report-dialog'
import { CallButton } from '@/modules/voice-calls/components/call-button'
import { CallHistoryPanel } from '@/modules/voice-calls/components/call-history-panel'
import { getCallHistory } from '@/modules/voice-calls/queries/get-call-history'

interface ContactDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = await params
  const contact = await getContact(id)

  if (!contact) {
    notFound()
  }

  // Fetch activities, notes, tasks, and related data for the contact
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  const [activitiesResult, notes, tasks, inPipeline, prospectId, givingPotentialData, callHistory] = await Promise.all([
    getContactActivities({ contactId: id, limit: 50 }),
    getNotes(id),
    getTasks({ contactId: id }),
    isContactInPipeline(id),
    getProspectByContactId(id),
    getGivingPotential(id),
    getCallHistory(id),
  ])
  const activities = activitiesResult?.activities || []

  // Get latest gift and shift for email generation
  let latestGiftId: string | null = null
  let latestShiftId: string | null = null

  if (contact.is_donor && organizationId) {
    const { data: latestGift } = await supabase
      .from('gifts')
      .select('id')
      .eq('contact_id', id)
      .eq('organization_id', organizationId)
      .order('gift_date', { ascending: false })
      .limit(1)
      .single()
    latestGiftId = latestGift?.id || null
  }

  if (contact.is_volunteer && organizationId) {
    const { data: latestSignup } = await supabase
      .from('shift_signups')
      .select('shift_id')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    latestShiftId = latestSignup?.shift_id || null
  }

  const fullName = getContactFullName(contact)
  const initials = getContactInitials(contact)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAddress = () => {
    if (!contact.address) return null
    const { street, city, state, zip } = contact.address
    const parts = []
    if (street) parts.push(street)
    if (city || state || zip) {
      const cityStateZip = [city, state, zip].filter(Boolean).join(', ')
      parts.push(cityStateZip)
    }
    return parts.join(', ')
  }

  // Determine avatar gradient based on role
  const getAvatarBg = () => {
    return 'bg-neutral-800'
  }

  // Get score color for giving potential display
  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-200' }
    if (score >= 80) return { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' }
    if (score >= 70) return { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' }
    return { bg: 'bg-neutral-100', text: 'text-neutral-700', ring: 'ring-neutral-200' }
  }

  const overallScore = givingPotentialData?.overall_score || 0
  const scoreColors = getScoreColor(overallScore)

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>

        {/* Header Card */}
        <Card className="shadow-sm border-neutral-200/60 bg-white overflow-hidden">
          <div className="relative">
            {/* Header background */}
            <div className="h-24 bg-neutral-100" />

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="-mt-12 mb-4">
                <div
                  className={`h-24 w-24 rounded-lg ${getAvatarBg()} flex items-center justify-center text-white text-3xl font-semibold shadow-sm ring-2 ring-white`}
                >
                  {initials}
                </div>
              </div>

              {/* Name and Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900">{fullName}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    {contact.is_donor && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                        <Heart className="h-3 w-3" />
                        Donor
                      </span>
                    )}
                    {contact.is_volunteer && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                        <Clock className="h-3 w-3" />
                        Volunteer
                      </span>
                    )}
                    {(contact.lifetime_giving || 0) >= 1000 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <DollarSign className="h-3 w-3" />
                        Major Donor
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {organizationId && (contact.is_donor || contact.is_volunteer) && (
                    <GenerateEmailButton
                      contactId={contact.id}
                      organizationId={organizationId}
                      isDonor={contact.is_donor || false}
                      isVolunteer={contact.is_volunteer || false}
                      latestGiftId={latestGiftId}
                      latestShiftId={latestShiftId}
                    />
                  )}
                  {organizationId && (
                    <CallButton
                      contactId={contact.id}
                      contactPhone={contact.phone || null}
                      contactName={fullName}
                    />
                  )}
                  <AddToPipelineButton
                    contactId={contact.id}
                    contactName={fullName}
                    isInPipeline={inPipeline}
                    prospectId={prospectId}
                  />
                  <ContactReportDialog
                    contactId={contact.id}
                    contactName={fullName}
                  />
                  <Button asChild variant="outline">
                    <Link href={`/contacts/${contact.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-6 border-t border-neutral-100">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-neutral-400" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {contact.phone}
                  </a>
                )}
                {formatAddress() && (
                  <span className="flex items-center gap-2 text-sm text-neutral-600">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {formatAddress()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Total Gifts
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {contact.donation_count || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Lifetime Giving
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    ${(contact.total_donated || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Volunteer Hours
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {contact.volunteer_hours || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Member Since
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatDate(contact.created_at)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Giving Potential Featured + AI Suggestion */}
          <div className="space-y-6">
            {/* Giving Potential - Featured Prominent Card */}
            {givingPotentialData ? (
              <Card className="shadow-sm border-neutral-200/60 bg-white overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      Giving Potential Analysis
                    </CardTitle>
                    <Link href="/prospects">
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* Score Grid - Prominent Display */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {/* Overall Score - Larger */}
                    <div className={`col-span-1 flex flex-col items-center justify-center p-4 rounded-lg ${scoreColors.bg} border border-neutral-200`}>
                      <Target className={`h-5 w-5 ${scoreColors.text} mb-1`} />
                      <span className={`text-3xl font-bold ${scoreColors.text}`}>{overallScore}</span>
                      <span className="text-xs text-neutral-600 mt-0.5">Overall</span>
                    </div>

                    {/* Sub-Scores */}
                    <div className="col-span-3 grid grid-cols-3 gap-3">
                      {givingPotentialData.capacity_score !== null && (
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-neutral-100 shadow-sm">
                          <span className="text-2xl font-semibold text-neutral-900">{givingPotentialData.capacity_score}</span>
                          <span className="text-xs text-neutral-500">Capacity</span>
                        </div>
                      )}
                      {givingPotentialData.affinity_score !== null && (
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-neutral-100 shadow-sm">
                          <span className="text-2xl font-semibold text-neutral-900">{givingPotentialData.affinity_score}</span>
                          <span className="text-xs text-neutral-500">Affinity</span>
                        </div>
                      )}
                      {givingPotentialData.propensity_score !== null && (
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-neutral-100 shadow-sm">
                          <span className="text-2xl font-semibold text-neutral-900">{givingPotentialData.propensity_score}</span>
                          <span className="text-xs text-neutral-500">Propensity</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Giving Gap Progress Bar */}
                  {givingPotentialData.giving_gap_ratio !== null && givingPotentialData.giving_gap_ratio > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-white border border-neutral-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">Untapped Potential</span>
                        <span className="text-sm font-semibold text-amber-600">
                          {Math.round(givingPotentialData.giving_gap_ratio * 100)}% gap
                        </span>
                      </div>
                      <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${Math.min(givingPotentialData.giving_gap_ratio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Wealth Indicators - Horizontal Grid */}
                  {(givingPotentialData.estimated_net_worth || givingPotentialData.real_estate_value || givingPotentialData.stock_holdings || givingPotentialData.employer) && (
                    <div className="grid grid-cols-2 gap-3">
                      {givingPotentialData.estimated_net_worth && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-100">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-neutral-500">Est. Net Worth</p>
                            <p className="text-sm font-semibold text-neutral-900">
                              ${(givingPotentialData.estimated_net_worth / 1000000).toFixed(1)}M
                            </p>
                          </div>
                        </div>
                      )}
                      {givingPotentialData.real_estate_value && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-100">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-neutral-500">Real Estate</p>
                            <p className="text-sm font-semibold text-neutral-900">
                              ${(givingPotentialData.real_estate_value / 1000).toFixed(0)}K
                            </p>
                          </div>
                        </div>
                      )}
                      {givingPotentialData.stock_holdings && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-100">
                          <TrendingUp className="h-4 w-4 text-violet-600" />
                          <div>
                            <p className="text-xs text-neutral-500">Stock Holdings</p>
                            <p className="text-sm font-semibold text-neutral-900">
                              ${(givingPotentialData.stock_holdings / 1000).toFixed(0)}K
                            </p>
                          </div>
                        </div>
                      )}
                      {givingPotentialData.employer && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-100">
                          <Tag className="h-4 w-4 text-neutral-600" />
                          <div>
                            <p className="text-xs text-neutral-500">Employer</p>
                            <p className="text-sm font-semibold text-neutral-900 truncate">
                              {givingPotentialData.employer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Attribution */}
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Bot className="h-3.5 w-3.5 text-neutral-400" />
                      <span>AI-powered analysis from giving history and wealth indicators</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ContactGivingPotential
                contactId={contact.id}
                givingPotential={givingPotentialData}
                showAddButton={true}
              />
            )}

            {/* AI Suggestion Card */}
            <AISuggestionCard contactId={contact.id} />

            {/* Donor Portal Link (if donor) */}
            {contact.is_donor && (
              <PortalLinkCard
                contactId={contact.id}
                existingToken={contact.portal_token ?? null}
              />
            )}

            {/* Tags Card */}
            {contact.tags && contact.tags.length > 0 && (
              <Card className="shadow-sm border-neutral-200/60 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-neutral-500" />
                    <h3 className="text-sm font-medium text-neutral-700">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Info Card */}
            <Card className="shadow-sm border-neutral-200/60 bg-white">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-neutral-700">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Added</span>
                    <span className="text-neutral-900">{formatDate(contact.created_at)}</span>
                  </div>
                  {contact.last_activity && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Last Activity</span>
                      <span className="text-neutral-900">{formatDate(contact.last_activity)}</span>
                    </div>
                  )}
                  {contact.last_gift_date && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Last Gift</span>
                      <span className="text-neutral-900">{formatDate(contact.last_gift_date)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Tabs */}
          <div>
            <Card className="shadow-sm border-neutral-200/60 bg-white h-full">
              <CardContent className="p-0">
                <Tabs defaultValue="activity" className="w-full">
                  <div className="border-b border-neutral-200/60 px-4 pt-4">
                    <TabsList className="bg-neutral-100/50 p-1">
                      <TabsTrigger
                        value="activity"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Activity
                      </TabsTrigger>
                      <TabsTrigger
                        value="notes"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Notes
                      </TabsTrigger>
                      <TabsTrigger
                        value="tasks"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Tasks
                      </TabsTrigger>
                      {contact.is_donor && (
                        <TabsTrigger
                          value="donations"
                          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          Donations
                        </TabsTrigger>
                      )}
                      {contact.is_volunteer && (
                        <TabsTrigger
                          value="volunteer"
                          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          Shifts
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="calls"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Calls
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="activity" className="p-4 m-0">
                    <ActivityTimeline activities={activities} />
                  </TabsContent>

                  <TabsContent value="notes" className="p-4 m-0">
                    <NotesList notes={notes} contactId={contact.id} />
                  </TabsContent>

                  <TabsContent value="tasks" className="p-4 m-0">
                    <TasksList tasks={tasks} contactId={contact.id} />
                  </TabsContent>

                  {contact.is_donor && (
                    <TabsContent value="donations" className="p-4 m-0">
                      {contact.gifts && contact.gifts.length > 0 ? (
                        <div className="space-y-3">
                          {contact.gifts.map((gift) => (
                            <div
                              key={gift.id}
                              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                                  <DollarSign className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-neutral-900">
                                    ${gift.amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {gift.gift_type} • {formatDate(gift.gift_date)}
                                  </p>
                                </div>
                              </div>
                              {gift.notes && (
                                <p className="text-xs text-neutral-500 max-w-[200px] truncate">
                                  {gift.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="h-12 w-12 rounded-lg bg-rose-50 flex items-center justify-center mx-auto mb-3">
                            <DollarSign className="h-6 w-6 text-rose-400" />
                          </div>
                          <p className="text-sm text-neutral-500">
                            No donations recorded yet
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  )}

                  {contact.is_volunteer && (
                    <TabsContent value="volunteer" className="p-4 m-0">
                      <div className="text-center py-12">
                        <div className="h-12 w-12 rounded-lg bg-violet-50 flex items-center justify-center mx-auto mb-3">
                          <Calendar className="h-6 w-6 text-violet-400" />
                        </div>
                        <p className="text-sm text-neutral-500">
                          Volunteer shifts coming soon
                        </p>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="calls" className="p-4 m-0">
                    <CallHistoryPanel calls={callHistory} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
