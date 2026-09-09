import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layouts/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getImpactStory } from '@/modules/impact'
import { ImpactStoryCard } from '@/modules/impact/components/impact-story-card'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { GenerateImpactButton } from './generate-impact-button'

export const dynamic = 'force-dynamic'

interface DonorImpactPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DonorImpactPage({ params }: DonorImpactPageProps) {
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

  // Fetch organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', memberData.organization_id)
    .single()

  const organizationName = org?.name || 'Our Organization'

  // Fetch impact story (if exists)
  let impactStory = null
  try {
    impactStory = await getImpactStory(id, 'all-time')
  } catch (error) {
    console.error('Error fetching impact story:', error)
  }

  const donorName = `${donor.first_name} ${donor.last_name}`

  // Calculate total giving
  const { data: gifts } = await supabase
    .from('gifts')
    .select('amount')
    .eq('contact_id', id)

  const totalGiving = gifts?.reduce((sum, gift) => sum + parseFloat(gift.amount.toString()), 0) || 0

  // Convert impact breakdown to metrics format
  const metrics = impactStory?.impactBreakdown
    ? Object.entries(impactStory.impactBreakdown).map(([key, value]) => ({
        type: key.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        value,
        label: key,
        icon: 'heart',
      }))
    : []

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Link href={`/donors/${id}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Donor Profile
        </Button>
      </Link>

      {/* Header */}
      <PageHeader
        title="Impact Story"
        description={`Personalized impact report for ${donorName}`}
      />

      {impactStory && impactStory.headline && impactStory.narrative ? (
        <div className="space-y-4">
          {/* Impact Story Card */}
          <ImpactStoryCard
            donorName={donorName}
            headline={impactStory.headline}
            narrative={impactStory.narrative}
            metrics={metrics}
            totalDonation={totalGiving}
            organizationName={organizationName}
          />

          {/* Regenerate Button */}
          <div className="flex justify-center">
            <GenerateImpactButton contactId={id} isRegenerate={true} />
          </div>

          {/* Share Instructions */}
          {impactStory.shareToken && (
            <Card className="border-primary-100 bg-primary-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Public Share Link
                    </h3>
                    <p className="text-sm text-neutral-600 mb-3">
                      This impact story has a unique shareable link. Donors can share it on social media
                      to inspire others and celebrate their contribution.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white px-3 py-1.5 rounded border border-primary-200 flex-1 font-mono">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/public/impact/${impactStory.shareToken}`}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${typeof window !== 'undefined' ? window.location.origin : ''}/public/impact/${impactStory.shareToken}`
                          )
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              No Impact Story Yet
            </h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
              Generate a personalized impact story showing {donor.first_name} the tangible difference
              their {totalGiving > 0 ? `$${totalGiving.toFixed(0)}` : ''} contribution has made.
            </p>
            <GenerateImpactButton contactId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
