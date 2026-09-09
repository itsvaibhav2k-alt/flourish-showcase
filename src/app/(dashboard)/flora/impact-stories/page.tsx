/**
 * Impact Stories Dashboard Page
 *
 * Main page for managing impact metrics and viewing generated stories
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { getMetrics } from '@/modules/impact-stories/queries/get-metrics'
import { getStories } from '@/modules/impact-stories/queries/get-stories'
import { MetricsManager } from '@/modules/impact-stories/components/metrics-manager'
import { StoryCard } from '@/modules/impact-stories/components/story-card'
import { Card, CardContent } from '@/components/ui/card'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'

export const dynamic = 'force-dynamic'

export default async function ImpactStoriesPage() {
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    redirect('/login')
  }

  // Fetch metrics and stories
  const metrics = await getMetrics({ organizationId, activeOnly: false })
  const { stories, total } = await getStories({ organizationId, limit: 20 })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-semibold text-neutral-900">Impact Stories</h1>
          </div>
          <p className="text-neutral-500 text-sm">
            Create personalized AI-generated impact narratives that show donors the
            tangible difference their giving makes
          </p>
        </div>
        <PageGuideTrigger pageKey="impact-stories" />
      </div>

      {/* Metrics Manager Section */}
      <MetricsManager organizationId={organizationId} metrics={metrics} />

      {/* Stories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Generated Stories</h2>
            <p className="text-sm text-neutral-600">
              {total} {total === 1 ? 'story' : 'stories'} created
            </p>
          </div>
        </div>

        {stories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-violet-400" />
                </div>
                <h3 className="text-sm font-medium text-neutral-600 mb-2">No stories yet</h3>
                <p className="text-sm text-neutral-400 mb-4">
                  Once you've set up your impact metrics, you can generate personalized
                  stories from any contact's profile page
                </p>
                <p className="text-xs text-neutral-400">
                  Tip: Navigate to a donor's contact page and click "Generate Impact
                  Story"
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
