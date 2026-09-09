import Image from 'next/image'
export const dynamic = 'force-dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Mail, Sparkles, Bell, AlertCircle, Database, Plus, ArrowRight, Users, Heart, Palette, Puzzle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOrganization, getVoiceProfile, getVoiceSamplesCount, getAutomationSettings, getCustomizationSettings, getExternalWebhooks, getStripeSettings } from '@/modules/settings'
import { OrganizationForm, SettingsCard } from '@/modules/settings/components/organization-form'
import { EmailSettingsForm } from '@/modules/settings/components/email-settings-form'
import { AutomationSettingsForm } from '@/modules/settings/components/automation-settings-form'
import { VoiceProfileInfo } from '@/modules/settings/components/voice-profile-info'
import { ToneSettings } from '@/modules/settings/components/tone-settings'
import { SnippetsManager } from '@/modules/settings/components/snippets-manager'
import { TeamManagement } from '@/modules/settings/components/team-management'
import { NavigationCustomizer } from '@/modules/settings/components/navigation-customizer'
import { DashboardCustomizer } from '@/modules/settings/components/dashboard-customizer'
import { StripeSettingsForm } from '@/modules/settings/components/stripe-settings-form'
import { EmbedCodeGenerator } from '@/modules/settings/components/embed-code-generator'
import { ExternalFormsSettings } from '@/modules/settings/components/external-forms-settings'
import { PageHeader } from '@/components/layouts/page-header'
import { getCurrentUserRole, getCurrentOrganizationId } from '@/lib/auth/organization'
import { AccessRestricted } from './access-restricted'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getEnabledAddonPages } from '@/lib/addon-pages/queries'
import { getEnabledAITiles, getCustomAITiles } from '@/lib/ai-tiles/queries'
import { AddonSettingsPanel } from '@/modules/addon-pages/components/addon-settings-panel'
import { AITilesSettingsPanel } from '@/modules/ai-tiles/components/ai-tiles-settings-panel'
import { EmptyState } from '@/components/common/empty-state'
import { TaxReceiptSettings } from '@/modules/settings/components/tax-receipt-settings'
import type { ExternalWebhook, StripeSettings } from '@/modules/settings'

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams
  const activeTab = params.tab || 'organization'

  // Check user role first - settings are admin-only
  const userRole = await getCurrentUserRole()

  // If user is not an admin, show access restricted page
  if (userRole !== 'admin') {
    return <AccessRestricted userRole={userRole} />
  }

  // Graceful error handling - fetch data with fallbacks
  let organization = null
  let voiceProfile = null
  let voiceSamplesCount = 0
  let automationSettings = null
  let customizationSettings = null
  let teamMembers: Array<{
    id: string
    userId: string
    email: string
    name: string | null
    role: 'admin' | 'member' | 'viewer'
    joinedAt: string
    isCurrentUser: boolean
  }> = []
  let pendingInvites: Array<{ email: string; role: string; invitedAt: string }> = []
  let currentUserEmail = ''
  let enabledAddonPages: string[] = []
  let enabledAITiles: string[] = []
  let customAITiles: Array<{
    id: string
    organizationId: string
    name: string
    description: string
    prompt: string
    refreshSchedule: 'daily' | 'weekly' | 'manual'
    dataSources: string[]
    enabled: boolean
    createdAt: string
    updatedAt: string
  }> = []
  let externalWebhooks: ExternalWebhook[] = []
  let stripeSettings: StripeSettings | null = null
  let error: string | null = null

  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    currentUserEmail = user?.email || ''

    organization = await getOrganization()

    // Only fetch additional data if organization exists
    if (organization) {
      try {
        voiceProfile = await getVoiceProfile()
      } catch (voiceError) {
        console.error('Error fetching voice profile:', voiceError)
        // Continue without voice profile
      }

      try {
        voiceSamplesCount = await getVoiceSamplesCount()
      } catch (samplesError) {
        console.error('Error fetching voice samples count:', samplesError)
        // Continue with 0 samples
      }

      try {
        automationSettings = await getAutomationSettings()
      } catch (automationError) {
        console.error('Error fetching automation settings:', automationError)
        // Continue without automation settings
      }

      try {
        customizationSettings = await getCustomizationSettings()
      } catch (customizationError) {
        console.error('Error fetching customization settings:', customizationError)
        // Continue without customization settings
      }

      // Fetch add-on pages and AI tiles
      try {
        const organizationId = await getCurrentOrganizationId()
        if (organizationId) {
          enabledAddonPages = await getEnabledAddonPages(organizationId)
          enabledAITiles = await getEnabledAITiles(organizationId)
          customAITiles = await getCustomAITiles(organizationId)
        }
      } catch (addonError) {
        console.error('Error fetching add-on pages and AI tiles:', addonError)
        // Continue without add-on data
      }

      // Fetch external webhooks and Stripe settings for Integrations tab
      try {
        externalWebhooks = await getExternalWebhooks()
      } catch (webhookError) {
        console.error('Error fetching external webhooks:', webhookError)
        // Continue without webhook data
      }

      try {
        stripeSettings = await getStripeSettings()
      } catch (stripeError) {
        console.error('Error fetching Stripe settings:', stripeError)
        // Continue without Stripe settings
      }

      // Fetch team members
      try {
        const organizationId = await getCurrentOrganizationId()
        if (organizationId) {
          const { data: members } = await supabase
            .from('organization_members')
            .select('id, user_id, role, created_at')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: true })

          if (members) {
            teamMembers = members.map((m) => ({
              id: m.id,
              userId: m.user_id,
              email: m.user_id === user?.id ? (user?.email || m.user_id) : m.user_id,
              name: m.user_id === user?.id ? (user?.user_metadata?.full_name || user?.user_metadata?.name || null) : null,
              role: m.role as 'admin' | 'member' | 'viewer',
              joinedAt: m.created_at,
              isCurrentUser: m.user_id === user?.id,
            }))
          }

          // Get pending invites from organization settings
          const settings = (organization.settings || {}) as Record<string, unknown>
          pendingInvites = (settings.pendingInvites as typeof pendingInvites) || []
        }
      } catch (teamError) {
        console.error('Error fetching team members:', teamError)
        // Continue without team data
      }
    }
  } catch (err) {
    console.error('Error loading settings:', err)
    error = err instanceof Error ? err.message : 'Failed to load settings'
  }

  // Error state - connection issues or other problems
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50/50 p-6">
        <PageHeader
          title="Settings"
          description="Manage your organization and communication preferences"
        />

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Unable to Load Settings</h3>
              <p className="text-sm text-red-700 mb-3">
                {error.includes('organization')
                  ? 'No organization was found. Please ensure you have access to an organization.'
                  : 'There was a problem connecting to the database. Please check your connection and try again.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-red-600">
                <Database className="h-3.5 w-3.5" />
                <span>Error: {error}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not found state - show welcoming onboarding with new EmptyState component
  if (!organization) {
    return (
      <div className="min-h-screen bg-neutral-50/50 p-6">
        <PageHeader
          title="Settings"
          description="Manage your organization and communication preferences"
        />

        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8">
          <EmptyState
            icon={Building2}
            title="Welcome to Flourish"
            description="Create or join an organization to get started with managing your nonprofit's communications and volunteer coordination."
            action={{
              label: 'Create Organization',
              href: '/signup',
            }}
            secondaryAction={{
              label: 'Learn more',
              href: '/features',
            }}
            featureCards={[
              {
                icon: Mail,
                title: 'Email Communications',
                description: 'Configure email settings and AI-powered communications',
              },
              {
                icon: Sparkles,
                title: 'Voice Profile',
                description: "Train AI to match your organization's writing style",
              },
              {
                icon: Bell,
                title: 'Automation',
                description: 'Set up automated workflows and notifications',
              },
            ]}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      <PageHeader
        title="Settings"
        description="Manage your organization and communication preferences"
      />

      {/* Feature Cards - Premium CTAs */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* AI Settings Feature Card */}
        <div className="rounded-lg border border-primary-100 bg-primary-50/30 overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <Image
                src="/flora-waving.png"
                alt="Flora mascot"
                width={56}
                height={84}
                className="object-contain"
              />
              <div>
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  AI Settings
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                    Flora
                  </span>
                </h3>
                <p className="text-sm text-neutral-600">
                  AI-powered emails and suggestions
                </p>
              </div>
            </div>
            <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
              <Link href="/settings/ai" className="flex items-center gap-2">
                Configure
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Impact Settings Feature Card */}
        <div className="rounded-lg border border-rose-100 bg-rose-50/30 overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-rose-50 flex items-center justify-center">
                <Heart className="h-7 w-7 text-rose-600 fill-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  Impact Stories
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                    New
                  </span>
                </h3>
                <p className="text-sm text-neutral-600">
                  Personalized donor impact reports
                </p>
              </div>
            </div>
            <Button asChild className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm">
              <Link href="/settings/impact" className="flex items-center gap-2">
                Configure
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Tabs defaultValue={activeTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-neutral-200 p-1 rounded-lg">
            <TabsTrigger
              value="organization"
              className="rounded-md data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Organization
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="rounded-md data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="rounded-md data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              className="rounded-md data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Bell className="h-4 w-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="rounded-md data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Voice Profile
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-md data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="rounded-md data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Puzzle className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Organization Settings */}
          <TabsContent value="organization" className="space-y-6">
            <OrganizationForm organization={organization} />
            <TaxReceiptSettings
              ein={organization.ein || null}
              taxExemptStatus={organization.tax_exempt_status || null}
              taxReceiptFooter={organization.tax_receipt_footer || null}
            />
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team" className="space-y-6">
            <TeamManagement
              members={teamMembers}
              pendingInvites={pendingInvites}
              currentUserEmail={currentUserEmail}
            />
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <EmailSettingsForm emailSettings={organization.emailSettings || {}} />
          </TabsContent>

          {/* Automation Settings */}
          <TabsContent value="automation" className="space-y-6">
            {automationSettings ? (
              <AutomationSettingsForm initialSettings={automationSettings} />
            ) : (
              <SettingsCard title="Automation Settings" description="Configure automated workflows.">
                <p className="text-sm text-neutral-600 text-center py-8">
                  Unable to load automation settings. Please refresh the page.
                </p>
              </SettingsCard>
            )}
          </TabsContent>

          {/* Voice Profile */}
          <TabsContent value="voice" className="space-y-6">
            <VoiceProfileInfo
              samplesCount={voiceSamplesCount}
              voiceSummary={voiceProfile?.voice_summary || null}
            />

            {/* Tone Settings */}
            <ToneSettings currentPreset={organization.tone_preset || 'warm'} />

            {/* Snippets Manager */}
            <SnippetsManager initialSnippets={organization.snippets || []} />
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            {customizationSettings ? (
              <>
                <NavigationCustomizer initialConfig={customizationSettings.navigation} />
                <DashboardCustomizer initialConfig={customizationSettings.dashboard.tiles} />
              </>
            ) : (
              <SettingsCard title="Appearance Settings" description="Customize your dashboard layout.">
                <p className="text-sm text-neutral-600 text-center py-8">
                  Unable to load appearance settings. Please refresh the page.
                </p>
              </SettingsCard>
            )}
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <StripeSettingsForm initialSettings={stripeSettings || undefined} />
            <EmbedCodeGenerator publicSlug={organization.public_slug || null} />
            <ExternalFormsSettings webhooks={externalWebhooks} />
            <AddonSettingsPanel
              enabledPages={enabledAddonPages as any}
              isAdmin={userRole === 'admin'}
            />
            <AITilesSettingsPanel
              enabledTiles={enabledAITiles as any}
              customTiles={customAITiles as any}
              isAdmin={userRole === 'admin'}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
