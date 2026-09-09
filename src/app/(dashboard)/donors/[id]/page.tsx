import Link from 'next/link'
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GivingHistory } from '@/modules/donors/components/giving-history'
import { LapseRiskBadge } from '@/modules/donors/components/lapse-risk-badge'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'
import { calculateLapseRisk } from '@/modules/donors/services/lapse-risk-calculator'
import { createClient } from '@/lib/supabase/server'
import { TaxReceiptButton } from '@/modules/donors/components/tax-receipt-button'
import {
  ArrowLeft,
  DollarSign,
  Mail,
  Phone,
  Sparkles,
  Heart,
  Calendar,
  Clock,
  Edit,
  MapPin,
  TrendingUp,
  Activity,
  FileText,
} from 'lucide-react'

interface DonorDetailPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Donor detail page
 * Shows donor information, giving history, and related activities
 */
export default async function DonorDetailPage({ params }: DonorDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user and organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const { data: memberData } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!memberData) {
    notFound()
  }

  // Fetch donor details
  const { data: donor, error: donorError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', memberData.organization_id)
    .single()

  if (donorError || !donor) {
    notFound()
  }

  // Fetch gifts
  const { data: giftsData } = await supabase
    .from('gifts')
    .select('*')
    .eq('contact_id', id)
    .order('gift_date', { ascending: false })
  const gifts = giftsData ?? []

  // Fetch recent activities
  const { data: activitiesData } = await supabase
    .from('activities')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(5)
  const activities = activitiesData ?? []

  // Calculate statistics
  const lifetimeGiving = gifts.reduce((sum, gift) => sum + gift.amount, 0)
  const lastGiftDate = gifts.length > 0 ? gifts[0].gift_date : null

  // Calculate average gift gap for lapse risk
  let avgGiftGap: number | null = null
  if (gifts.length > 1) {
    const sortedGifts = [...gifts].sort(
      (a, b) => new Date(a.gift_date).getTime() - new Date(b.gift_date).getTime()
    )
    const gaps = []
    for (let i = 1; i < sortedGifts.length; i++) {
      const prevDate = new Date(sortedGifts[i - 1].gift_date)
      const currDate = new Date(sortedGifts[i].gift_date)
      const gapDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      gaps.push(gapDays)
    }
    avgGiftGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  }

  const lapseRisk = calculateLapseRisk({
    giftCount: gifts.length,
    lastGiftDate: lastGiftDate ? new Date(lastGiftDate) : null,
    avgGiftGap,
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  const fullName = `${donor.first_name} ${donor.last_name}`
  const initials = `${donor.first_name[0]}${donor.last_name[0]}`.toUpperCase()
  const isMajorDonor = lifetimeGiving >= 1000

  // Calculate average gift amount
  const avgGiftAmount = gifts.length > 0 ? lifetimeGiving / gifts.length : 0

  // Calculate years with gifts for tax receipt button
  const giftYears = [...new Set(gifts.map(g => new Date(g.gift_date).getFullYear()))].sort((a, b) => b - a)

  // Get avatar gradient based on donor status
  const getAvatarGradient = () => {
    if (isMajorDonor) return 'bg-gradient-to-br from-amber-400 to-amber-600'
    if (lapseRisk === 'high') return 'bg-gradient-to-br from-orange-400 to-orange-600'
    if (lapseRisk === 'low') return 'bg-gradient-to-br from-green-400 to-green-600'
    return 'bg-gradient-to-br from-rose-400 to-rose-600'
  }

  // Format address
  const formatAddress = () => {
    if (!donor.address) return null
    if (typeof donor.address === 'string') return donor.address
    const { street, city, state, zip } = donor.address as { street?: string; city?: string; state?: string; zip?: string }
    const parts = []
    if (street) parts.push(street)
    if (city || state || zip) {
      const cityStateZip = [city, state, zip].filter(Boolean).join(', ')
      parts.push(cityStateZip)
    }
    return parts.join(', ') || null
  }

  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return formatDate(dateString)
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/donors"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Donors
        </Link>

        {/* Header Card */}
        <Card className="shadow-card border-neutral-200/60 bg-white overflow-hidden">
          <div className="relative">
            {/* Gradient header background */}
            <div className="h-24 bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100" />

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="-mt-12 mb-4">
                <div
                  className={`h-24 w-24 rounded-2xl ${getAvatarGradient()} flex items-center justify-center text-white text-3xl font-semibold shadow-lg ring-4 ring-white`}
                >
                  {initials}
                </div>
              </div>

              {/* Name and Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900">{fullName}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Donor
                    </span>
                    {isMajorDonor && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Major Donor
                      </span>
                    )}
                    <LapseRiskBadge risk={lapseRisk} />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {giftYears.length > 0 && (
                    <TaxReceiptButton contactId={id} availableYears={giftYears} />
                  )}
                  <Link href={`/donors/${id}/impact`}>
                    <Button variant="outline" size="sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      View Impact
                    </Button>
                  </Link>
                  <Link href={`/donors/new-gift?contact=${id}`}>
                    <Button size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record Gift
                    </Button>
                  </Link>
                  <Link href={`/contacts/${id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-6 border-t border-neutral-100">
                {donor.email && (
                  <a
                    href={`mailto:${donor.email}`}
                    className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-neutral-400" />
                    {donor.email}
                  </a>
                )}
                {donor.phone && (
                  <a
                    href={`tel:${donor.phone}`}
                    className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {donor.phone}
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
          <Card className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                      Lifetime Giving
                    </p>
                    <ScoreInfoButton
                      scoreKey="lifetimeGiving"
                      size="sm"
                      scoreDefinitions={scoreDefinitions}
                    />
                  </div>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatCurrency(lifetimeGiving)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Total Gifts
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {gifts.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Average Gift
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatCurrency(avgGiftAmount)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Last Gift
                  </p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {lastGiftDate ? formatRelativeDate(lastGiftDate) : 'No gifts'}
                  </p>
                  {lastGiftDate && gifts[0] && (
                    <p className="text-xs text-neutral-500">
                      {formatCurrency(gifts[0].amount)}
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Two Column Layout with Tabs */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="space-y-6">
            {/* Lapse Risk Card */}
            <Card className="shadow-card border-neutral-200/60 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-neutral-700">Lapse Risk</h3>
                    <ScoreInfoButton
                      scoreKey="lapseRisk"
                      size="sm"
                      scoreDefinitions={scoreDefinitions}
                    />
                  </div>
                  <LapseRiskBadge risk={lapseRisk} />
                </div>
                <p className="text-sm text-neutral-600">
                  {lapseRisk === 'high' && 'This donor needs immediate attention. Consider reaching out with a personalized message.'}
                  {lapseRisk === 'medium' && 'This donor may need engagement soon. A check-in could help maintain the relationship.'}
                  {lapseRisk === 'low' && 'This donor is actively engaged. Continue the great relationship!'}
                  {lapseRisk === 'unknown' && 'Not enough data to calculate risk. More giving history needed.'}
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-card border-neutral-200/60 bg-white">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-3">Giving Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">First Gift</span>
                    <span className="text-neutral-900 font-medium">
                      {gifts.length > 0
                        ? formatDate(gifts[gifts.length - 1].gift_date)
                        : 'No gifts'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Largest Gift</span>
                    <span className="text-neutral-900 font-medium">
                      {gifts.length > 0
                        ? formatCurrency(Math.max(...gifts.map(g => g.amount)))
                        : '$0'}
                    </span>
                  </div>
                  {avgGiftGap && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Avg. Gift Frequency</span>
                      <span className="text-neutral-900 font-medium">
                        Every {Math.round(avgGiftGap)} days
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Card className="shadow-card border-neutral-200/60 bg-white h-full">
              <CardContent className="p-0">
                <Tabs defaultValue="giving" className="w-full">
                  <div className="border-b border-neutral-200/60">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none">
                      <TabsTrigger
                        value="giving"
                        className="relative px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Giving History
                      </TabsTrigger>
                      <TabsTrigger
                        value="activity"
                        className="relative px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Activity
                      </TabsTrigger>
                      <TabsTrigger
                        value="notes"
                        className="relative px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Notes
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="giving" className="p-4 m-0">
                    <GivingHistory gifts={gifts} />
                  </TabsContent>

                  <TabsContent value="activity" className="p-4 m-0">
                    {activities.length > 0 ? (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" />

                        <div className="space-y-0">
                          {activities.map((activity, index) => (
                            <div
                              key={activity.id}
                              className="relative flex gap-4 py-4 group hover:bg-neutral-50/50 -mx-2 px-2 rounded-lg transition-colors"
                            >
                              {/* Timeline dot */}
                              <div className="relative z-10 flex items-center justify-center shrink-0">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-6 w-6 bg-white rounded-full" />
                                </div>
                                <div className="relative h-4 w-4 rounded-full border-2 bg-white border-neutral-300 flex items-center justify-center">
                                  {activity.activity_type.includes('gift') && (
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                  )}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 -mt-0.5">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-sm font-medium text-neutral-900 capitalize">
                                    {activity.activity_type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs text-neutral-400">
                                    {formatRelativeDate(activity.created_at)}
                                  </span>
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-neutral-600">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                          <Clock className="h-6 w-6 text-neutral-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-600">No activity yet</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Activities will appear here as they happen
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="p-4 m-0">
                    <div className="text-center py-12">
                      <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-neutral-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-600">No notes yet</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Add notes to track important information about this donor
                      </p>
                    </div>
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
