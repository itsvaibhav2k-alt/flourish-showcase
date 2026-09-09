import Link from 'next/link'
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDraftStats, getDrafts, type DraftStats } from '@/modules/communications/queries/get-drafts'
import { EmailHistory } from '@/modules/communications/components/email-history'
import { type EmailDraftWithContact } from '@/modules/communications/schemas/email.schema'
import { Mail, CheckCircle, Send, XCircle, MessageSquare, Mic } from 'lucide-react'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'

// Default stats when data can't be fetched
const defaultStats: DraftStats = {
  pending: 0,
  approved: 0,
  sentThisMonth: 0,
  rejected: 0,
}

/**
 * Communications page
 * Shows email draft statistics and recent sent emails
 */
export default async function CommunicationsPage() {
  // Fetch stats and drafts in parallel with error handling
  let stats: DraftStats = defaultStats
  let recentSent: EmailDraftWithContact[] = []

  try {
    const [statsResult, draftsResult] = await Promise.all([
      getDraftStats().catch(() => defaultStats),
      getDrafts({ status: 'sent', limit: 5 }).catch(() => ({ drafts: [], total: 0 })),
    ])
    stats = statsResult
    recentSent = draftsResult.drafts
  } catch {
    // Use defaults if all queries fail
  }

  const statsCards = [
    {
      title: 'Pending Review',
      value: stats.pending.toLocaleString(),
      icon: Mail,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'Awaiting approval',
      highlight: stats.pending > 0 ? 'text-violet-600' : undefined,
    },
    {
      title: 'Approved',
      value: stats.approved.toLocaleString(),
      icon: CheckCircle,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'Ready to send',
      highlight: stats.approved > 0 ? 'text-green-600' : undefined,
    },
    {
      title: 'Sent This Month',
      value: stats.sentThisMonth.toLocaleString(),
      icon: Send,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'Emails delivered',
    },
    {
      title: 'Rejected',
      value: stats.rejected.toLocaleString(),
      icon: XCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      subtitle: 'Not approved',
      highlight: stats.rejected > 0 ? 'text-red-600' : undefined,
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Communications</h1>
              <p className="text-neutral-500 text-sm mt-1">
                Manage email drafts and communications with your contacts
              </p>
            </div>
            <PageGuideTrigger pageKey="communications" />
          </div>
          <Link href="/communications/voice">
            <Button variant="outline" className="border-neutral-200 hover:bg-violet-50 hover:border-violet-200 transition-smooth shadow-sm">
              <Mic className="h-4 w-4 mr-2" />
              Train Voice
            </Button>
          </Link>
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
                      <p className={`text-2xl font-semibold tracking-tight ${stat.highlight || 'text-neutral-900'}`}>
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

        {/* Quick Actions Banner */}
        {stats.pending > 0 && (
          <Card className="bg-violet-50 border-violet-200/50 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-violet-900">
                    {stats.pending} email{stats.pending > 1 ? 's' : ''} waiting for review
                  </h3>
                  <p className="text-sm text-violet-700 mt-1">
                    Review and approve pending emails to keep your communications flowing
                  </p>
                </div>
                <Link href="/communications/review">
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
                    Review Queue
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-neutral-200">
          <Link
            href="/communications"
            className="px-4 py-2.5 font-medium text-sm border-b-2 border-violet-600 text-violet-600"
          >
            Overview
          </Link>
          <Link
            href="/communications/review"
            className="px-4 py-2.5 font-medium text-sm border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 transition-all"
          >
            Pending
          </Link>
          <Link
            href="/communications/sent"
            className="px-4 py-2.5 font-medium text-sm border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 transition-all"
          >
            Sent
          </Link>
          <Link
            href="/communications/review"
            className="px-4 py-2.5 font-medium text-sm border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 transition-all"
          >
            Review Queue
          </Link>
        </div>

        {/* Recent Sent Emails */}
        <Card className="shadow-card border-neutral-200/60 bg-white">
          <CardHeader className="border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">Recent Sent Emails</CardTitle>
                <CardDescription className="text-neutral-500 text-sm mt-1">
                  Your latest email communications
                </CardDescription>
              </div>
              <Link href="/communications/sent">
                <Button variant="outline" size="sm" className="border-neutral-200 hover:bg-violet-50 hover:border-violet-200 transition-smooth">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={
              <div className="p-8 text-center text-neutral-500">Loading sent emails...</div>
            }>
              {recentSent.length > 0 ? (
                <EmailHistory sentEmails={recentSent} />
              ) : (
                <div className="py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-7 w-7 text-violet-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">No emails sent yet</p>
                  <p className="text-xs text-neutral-400 mt-1 mb-4">
                    AI-generated emails will appear here after approval
                  </p>
                </div>
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
