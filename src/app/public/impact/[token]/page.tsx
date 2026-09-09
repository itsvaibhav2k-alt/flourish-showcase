import { notFound } from 'next/navigation'
import { getImpactStoryByToken } from '@/modules/impact'
import { ImpactStoryCard } from '@/modules/impact/components/impact-story-card'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface PublicImpactPageProps {
  params: Promise<{ token: string }>
}

export default async function PublicImpactPage({ params }: PublicImpactPageProps) {
  const { token } = await params

  // Validate token format (should be 64-character hex string)
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    notFound()
  }

  // Fetch impact story by token
  const storyData = await getImpactStoryByToken(token)

  if (!storyData) {
    notFound()
  }

  const donorName = `${storyData.contact.first_name} ${storyData.contact.last_name}`

  // Convert impact breakdown to metrics format
  const metrics = storyData.impact_breakdown
    ? Object.entries(storyData.impact_breakdown).map(([key, value]) => ({
        type: key.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        value,
        label: key,
        icon: 'heart',
      }))
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-violet-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {storyData.organization.logo_url ? (
                <Image
                  src={storyData.organization.logo_url}
                  alt={storyData.organization.name}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500" />
              )}
              <span className="text-lg font-semibold text-neutral-900">
                {storyData.organization.name}
              </span>
            </div>
            <Button
              className="bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 text-white"
            >
              <Heart className="h-4 w-4 mr-2" />
              Donate
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-primary-200 mb-4">
            <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-sm font-medium text-primary-700">Impact Story</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            See the Difference One Person Can Make
          </h1>
          <p className="text-neutral-600">
            {donorName.split(' ')[0]}&apos;s contributions are changing lives in our community
          </p>
        </div>

        <ImpactStoryCard
          donorName={donorName}
          headline={storyData.headline || `${donorName.split(' ')[0]}, You Made a Difference`}
          narrative={storyData.narrative || ''}
          metrics={metrics}
          totalDonation={storyData.total_giving}
          organizationName={storyData.organization.name}
        />

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-neutral-200">
            <Heart className="h-12 w-12 mx-auto text-rose-500 fill-rose-500 mb-4" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">
              Want to Make an Impact Too?
            </h2>
            <p className="text-neutral-600 mb-6 max-w-xl mx-auto">
              Join {donorName.split(' ')[0]} and countless others in supporting {storyData.organization.name}.
              Every contribution makes a real difference.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 text-white shadow-lg"
            >
              <Heart className="h-5 w-5 mr-2" />
              Make a Donation
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-neutral-500">
              Powered by{' '}
              <span className="font-semibold text-neutral-700">Flourish</span>
              {' • '}
              <span className="text-neutral-400">
                Dynamic Impact Stories
              </span>
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Personalized impact reports that inspire continued giving
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: PublicImpactPageProps) {
  const { token } = await params
  const storyData = await getImpactStoryByToken(token)

  if (!storyData) {
    return {
      title: 'Impact Story Not Found',
    }
  }

  const donorName = `${storyData.contact.first_name} ${storyData.contact.last_name}`

  return {
    title: storyData.headline || `${donorName.split(' ')[0]}'s Impact Story`,
    description: storyData.narrative?.substring(0, 160) || `See the difference ${donorName.split(' ')[0]} made through their support of ${storyData.organization.name}`,
    openGraph: {
      title: storyData.headline || `${donorName.split(' ')[0]}'s Impact Story`,
      description: storyData.narrative?.substring(0, 160) || `See the difference ${donorName.split(' ')[0]} made through their support of ${storyData.organization.name}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: storyData.headline || `${donorName.split(' ')[0]}'s Impact Story`,
      description: storyData.narrative?.substring(0, 160),
    },
  }
}
