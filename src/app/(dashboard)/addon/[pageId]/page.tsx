import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEnabledAddonPages, getAddonPageTemplate } from '@/lib/addon-pages'

// Import add-on page components
import { FloraEmailsPage } from '@/modules/flora-emails'
import { GrantTrackerEnhancedPage } from '@/modules/grant-tracker'
import { CampaignCentralPage } from '@/modules/campaign-central'

const PAGE_COMPONENTS = {
  'flora-emails': FloraEmailsPage,
  'grant-tracker': GrantTrackerEnhancedPage,
  'campaign-central': CampaignCentralPage,
} as const

interface AddonPageProps {
  params: Promise<{ pageId: string }>
}

export default async function AddonPage({ params }: AddonPageProps) {
  const { pageId } = await params

  // Validate pageId is a valid add-on
  const template = getAddonPageTemplate(pageId as any)
  if (!template) {
    notFound()
  }

  // Check if this add-on is enabled for the organization
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/onboarding')
  }

  // Check if add-on is enabled
  const enabledPages = await getEnabledAddonPages(membership.organization_id)
  if (!enabledPages.includes(pageId as any)) {
    // Redirect to settings with message to enable
    redirect('/settings?tab=addons&enable=' + pageId)
  }

  // Render the appropriate page component
  const PageComponent = PAGE_COMPONENTS[pageId as keyof typeof PAGE_COMPONENTS]

  return <PageComponent organizationId={membership.organization_id} />
}

// Generate metadata
export async function generateMetadata({ params }: AddonPageProps) {
  const { pageId } = await params
  const template = getAddonPageTemplate(pageId as any)

  return {
    title: template?.name || 'Add-on',
    description: template?.description,
  }
}
