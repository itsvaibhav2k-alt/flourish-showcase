/**
 * Public Story View Component
 *
 * Full-page shareable story view for public access
 */

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Sparkles } from 'lucide-react'
import type { PublicStory } from '../queries/get-story-by-token'

interface PublicStoryViewProps {
  story: PublicStory
}

export function PublicStoryView({ story }: PublicStoryViewProps) {
  const contactName = story.contact?.first_name || 'Friend'
  const orgName = story.organization?.name || 'Our Organization'

  // Get metric labels for display
  const getMetricLabel = (metricName: string, value: number): string => {
    const metric = story.impact_metrics?.find((m) => m.metric_name === metricName)
    if (!metric) return metricName.replace(/_/g, ' ')

    if (value === 1) {
      return metric.unit_label
    }
    return metric.unit_label_plural || `${metric.unit_label}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="border-b border-white/60 bg-white/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            {story.organization?.logo_url ? (
              <img
                src={story.organization.logo_url}
                alt={orgName}
                className="h-12 w-auto"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{orgName}</h1>
              <p className="text-sm text-neutral-600">Impact Story</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="shadow-xl border-white/80">
          <CardContent className="p-8 md:p-12">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  Your Personal Impact Story
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
                {story.title}
              </h2>
              <p className="text-neutral-600">For {contactName}</p>
            </div>

            {/* Story Content */}
            <div className="prose prose-lg max-w-none mb-8">
              {story.story_content.split('\n').map((paragraph, i) => (
                <p
                  key={i}
                  className="mb-4 text-neutral-700 leading-relaxed last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Impact Metrics */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 text-center">
                Your Impact By The Numbers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(story.metrics as Record<string, number>).map(
                  ([metricName, value]) => (
                    <div
                      key={metricName}
                      className="bg-white rounded-lg p-4 text-center shadow-sm"
                    >
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {value.toLocaleString()}
                      </div>
                      <div className="text-sm text-neutral-600 capitalize">
                        {getMetricLabel(metricName, value)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Total Giving */}
            <div className="text-center border-t border-neutral-200 pt-8">
              <div className="text-sm text-neutral-600 mb-2">
                {story.period_start && story.period_end
                  ? `${new Date(story.period_start).getFullYear()} - ${new Date(story.period_end).getFullYear()}`
                  : 'All-Time'}{' '}
                Total Contribution
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                ${Number(story.total_giving).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-sm text-neutral-600 max-w-lg mx-auto">
                Every dollar you give creates real, tangible change in people's lives.
                Thank you for being part of our mission.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-neutral-600">
          <p>
            This impact story was created on{' '}
            {new Date(story.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="mt-2">
            Powered by{' '}
            <a
              href="https://flourishnpo.com"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Flourish
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
