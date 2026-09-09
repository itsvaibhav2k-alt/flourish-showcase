import { Zap } from 'lucide-react'
import { PageHeader } from '@/components/layouts/page-header'
import { getCurrentUserRole, getCurrentOrganizationId } from '@/lib/auth/organization'
import { AccessRestricted } from '../access-restricted'
import { createClient } from '@/lib/supabase/server'
import { AutomationWebhooksPanel } from '@/modules/automation/components/automation-webhooks-panel'
import { ApiKeysPanel } from '@/modules/automation/components/api-keys-panel'
import { ScheduledEmailsPanel } from '@/modules/automation/components/scheduled-emails-panel'
import { AutomationUsageStats } from '@/modules/automation/components/automation-usage-stats'

export const dynamic = 'force-dynamic'

interface AutomationWebhook {
  id: string
  name: string
  description: string | null
  webhook_token: string
  webhook_type: string
  config: Record<string, unknown>
  is_active: boolean
  rate_limit_per_minute: number
  last_used_at: string | null
  usage_count: number
  created_at: string
  updated_at: string
}

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  permissions: string[]
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  usage_count: number
  rate_limit_per_minute: number
  created_at: string
}

interface ScheduledEmail {
  id: string
  name: string
  description: string | null
  email_type: string
  recipient_filter: Record<string, unknown>
  schedule_type: string
  cron_expression: string | null
  next_run_at: string | null
  last_run_at: string | null
  last_run_result: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

export default async function AutomationSettingsPage() {
  // Check user role first - settings are admin-only
  const userRole = await getCurrentUserRole()

  // If user is not an admin, show access restricted page
  if (userRole !== 'admin') {
    return <AccessRestricted userRole={userRole} />
  }

  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return (
      <div className="min-h-screen bg-neutral-50/50 p-6">
        <PageHeader
          title="Automation & Integrations"
          description="Configure webhooks, API keys, and scheduled emails"
        />
        <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-6 text-center">
          <p className="text-yellow-800">No organization found. Please contact support.</p>
        </div>
      </div>
    )
  }

  // Fetch all automation data
  let webhooks: AutomationWebhook[] = []
  let apiKeys: ApiKey[] = []
  let scheduledEmails: ScheduledEmail[] = []
  const usageStats = {
    totalWebhookCalls: 0,
    totalApiCalls: 0,
    emailsGenerated: 0,
    emailsSent: 0,
  }

  try {
    const supabase = await createClient()

    // Fetch automation webhooks
    const { data: webhooksData } = await supabase
      .from('automation_webhooks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (webhooksData) {
      webhooks = webhooksData as AutomationWebhook[]
    }

    // Fetch API keys (exclude hash for security)
    const { data: apiKeysData } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, permissions, is_active, expires_at, last_used_at, usage_count, rate_limit_per_minute, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (apiKeysData) {
      apiKeys = apiKeysData as ApiKey[]
    }

    // Fetch scheduled emails
    const { data: scheduledData } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (scheduledData) {
      scheduledEmails = scheduledData as ScheduledEmail[]
    }

    // Calculate usage stats
    usageStats.totalWebhookCalls = webhooks.reduce((sum, w) => sum + (w.usage_count || 0), 0)
    usageStats.totalApiCalls = apiKeys.reduce((sum, k) => sum + (k.usage_count || 0), 0)

    // Get email stats from drafts
    const { count: draftsCount } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const { count: sentCount } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'sent')

    usageStats.emailsGenerated = draftsCount || 0
    usageStats.emailsSent = sentCount || 0
  } catch (error) {
    console.error('Error fetching automation data:', error)
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      <PageHeader
        title="Automation & Integrations"
        description="Connect Flourish to Zapier, n8n, and other automation tools"
        action={
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-200 shadow-sm">
            <Zap className="h-5 w-5 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">REST API v1</span>
          </div>
        }
      />

      {/* Usage Stats */}
      <div className="mt-6">
        <AutomationUsageStats stats={usageStats} />
      </div>

      {/* Main Content */}
      <div className="mt-6 space-y-6">
        {/* Automation Webhooks */}
        <AutomationWebhooksPanel webhooks={webhooks} />

        {/* API Keys */}
        <ApiKeysPanel apiKeys={apiKeys} />

        {/* Scheduled Emails */}
        <ScheduledEmailsPanel scheduledEmails={scheduledEmails} />
      </div>
    </div>
  )
}
