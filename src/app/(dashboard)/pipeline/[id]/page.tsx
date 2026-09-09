import * as React from 'react'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  Target,
  Calendar,
  UserCircle,
  TrendingUp,
  Mail,
  Phone,
  Heart,
  CheckCircle,
  Clock,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getProspect } from '@/modules/pipeline'
import { UpdateStageForm } from '@/modules/pipeline/components/update-stage-form'
import { LogMoveForm } from '@/modules/pipeline/components/log-move-form'
import { MoveTimeline } from '@/modules/pipeline/components/move-timeline'
import { StageHistory } from '@/modules/pipeline/components/stage-history'
import { getStageHistory } from '@/modules/pipeline/queries/get-stage-history'

interface ProspectDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectDetailPage({
  params,
}: ProspectDetailPageProps) {
  const { id } = await params
  const [prospect, stageHistory] = await Promise.all([
    getProspect(id),
    getStageHistory(id),
  ])

  if (!prospect) {
    notFound()
  }

  const fullName = `${prospect.contact.first_name} ${prospect.contact.last_name}`
  const initials = `${prospect.contact.first_name[0]}${prospect.contact.last_name[0]}`

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Stage badge colors
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      identification: 'bg-blue-100 text-blue-700 border-blue-200',
      qualification: 'bg-violet-100 text-violet-700 border-violet-200',
      cultivation: 'bg-amber-100 text-amber-700 border-amber-200',
      solicitation: 'bg-green-100 text-green-700 border-green-200',
      stewardship: 'bg-rose-100 text-rose-700 border-rose-200',
    }
    return colors[stage] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
  }

  // Outcome badge colors
  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      won: 'bg-green-100 text-green-700',
      lost: 'bg-red-100 text-red-700',
      deferred: 'bg-neutral-100 text-neutral-700',
    }
    return colors[outcome] || 'bg-neutral-100 text-neutral-700'
  }

  // Capitalize first letter
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
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
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-3xl font-semibold shadow-lg ring-4 ring-white">
                  {initials}
                </div>
              </div>

              {/* Name and Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900">
                    {fullName}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className={getStageColor(prospect.stage)}>
                      {capitalize(prospect.stage)}
                    </Badge>
                    <Badge variant="secondary" className={getOutcomeColor(prospect.outcome)}>
                      {capitalize(prospect.outcome)}
                    </Badge>
                    {prospect.readiness_score !== null && (
                      <Badge
                        variant="secondary"
                        className={
                          prospect.readiness_score >= 80
                            ? 'bg-green-100 text-green-700'
                            : prospect.readiness_score >= 60
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }
                      >
                        <Target className="h-3 w-3 mr-1" />
                        {prospect.readiness_score}/100 Ready
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/contacts/${prospect.contact_id}`}>
                      View Contact
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-6 border-t border-neutral-100">
                {prospect.contact.email && (
                  <a
                    href={`mailto:${prospect.contact.email}`}
                    className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-neutral-400" />
                    {prospect.contact.email}
                  </a>
                )}
                {prospect.contact.phone && (
                  <a
                    href={`tel:${prospect.contact.phone}`}
                    className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {prospect.contact.phone}
                  </a>
                )}
                {prospect.assigned_user && (
                  <span className="flex items-center gap-2 text-sm text-neutral-600">
                    <UserCircle className="h-4 w-4 text-neutral-400" />
                    Assigned to {prospect.assigned_user.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Target Ask Amount
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatCurrency(prospect.target_ask_amount)}
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
                    Lifetime Giving
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatCurrency(prospect.contact.lifetime_giving)}
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
                    Target Ask Date
                  </p>
                  <p className="text-base font-semibold text-neutral-900">
                    {formatDate(prospect.target_ask_date)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Stage Entered
                  </p>
                  <p className="text-base font-semibold text-neutral-900">
                    {new Date(prospect.stage_entered_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-card border-neutral-200/60 bg-white">
              <CardContent className="p-0">
                <Tabs defaultValue="moves" className="w-full">
                  <div className="border-b border-neutral-200/60 px-4 pt-4">
                    <TabsList className="bg-neutral-100/50 p-1">
                      <TabsTrigger
                        value="moves"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Cultivation Moves
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Stage History
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Details
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="moves" className="p-4 m-0">
                    <MoveTimeline moves={prospect.cultivation_moves} />
                  </TabsContent>

                  <TabsContent value="history" className="p-4 m-0">
                    <StageHistory history={stageHistory} />
                  </TabsContent>

                  <TabsContent value="details" className="p-4 m-0">
                    <div className="space-y-4">
                      {/* AI Predictions */}
                      {(prospect.predicted_gift_amount ||
                        prospect.recommended_ask_amount ||
                        prospect.optimal_ask_timing) && (
                        <div className="p-4 rounded-lg bg-primary-50 border border-primary-200/60">
                          <h3 className="text-sm font-medium text-neutral-900 mb-3">
                            AI Predictions
                          </h3>
                          <div className="space-y-2 text-sm">
                            {prospect.predicted_gift_amount && (
                              <div className="flex justify-between">
                                <span className="text-neutral-600">
                                  Predicted Gift Amount
                                </span>
                                <span className="font-semibold text-neutral-900">
                                  {formatCurrency(prospect.predicted_gift_amount)}
                                </span>
                              </div>
                            )}
                            {prospect.recommended_ask_amount && (
                              <div className="flex justify-between">
                                <span className="text-neutral-600">
                                  Recommended Ask
                                </span>
                                <span className="font-semibold text-neutral-900">
                                  {formatCurrency(prospect.recommended_ask_amount)}
                                </span>
                              </div>
                            )}
                            {prospect.optimal_ask_timing && (
                              <div className="flex justify-between">
                                <span className="text-neutral-600">
                                  Optimal Timing
                                </span>
                                <span className="font-semibold text-neutral-900">
                                  {prospect.optimal_ask_timing}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {prospect.notes && (
                        <div>
                          <h3 className="text-sm font-medium text-neutral-700 mb-2">
                            Notes
                          </h3>
                          <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                            {prospect.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Update Stage Form */}
            <UpdateStageForm prospectId={prospect.id} currentStage={prospect.stage} />

            {/* Log Move Form */}
            <LogMoveForm prospectId={prospect.id} />

            {/* Next Move Card */}
            {prospect.next_move && (
              <Card className="shadow-card border-neutral-200/60 bg-white">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary-600" />
                    <h3 className="text-sm font-medium text-neutral-700">
                      Next Move
                    </h3>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-neutral-600 mb-2">
                    {prospect.next_move}
                  </p>
                  {prospect.next_move_date && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(prospect.next_move_date)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
