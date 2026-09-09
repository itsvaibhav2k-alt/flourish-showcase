import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { CommandPaletteProvider } from '@/providers/command-palette-provider'
import { CommandPalette } from '@/components/common/command-palette'
import { PageGuideProvider } from '@/components/common/page-guide-context'
import { PageGuideWrapper } from '@/components/common/page-guide-wrapper'
import { KeyboardShortcutsProvider } from '@/components/common/keyboard-shortcuts-dialog'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { getCurrentUserRole, getCurrentOrganizationId } from '@/lib/auth/organization'
import { createClient } from '@/lib/supabase/server'
import { getVisibleNavigation } from '@/modules/settings'
import type { NavItemId } from '@/modules/settings'
import { getEnabledAddonPages } from '@/lib/addon-pages/queries'
import type { AddonPageId } from '@/lib/addon-pages/registry'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user role for RBAC
  const userRole = await getCurrentUserRole()

  // In BYPASS_AUTH mode, use mock user info
  const isBypassAuth = process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production'

  let userInfo: { email: string; name: string } | null = null

  if (isBypassAuth) {
    // Mock user for BYPASS_AUTH mode
    userInfo = {
      email: 'demo@example.com',
      name: 'Demo User',
    }
  } else {
    // Fetch current user info from Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    userInfo = user ? {
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    } : null
  }

  // Fetch organization name and ID
  let organizationName = 'My Organization'
  let organizationId: string | undefined
  let visibleNavItems: NavItemId[] | undefined
  let enabledAddonIds: AddonPageId[] = []
  try {
    organizationId = await getCurrentOrganizationId() ?? undefined
    if (organizationId) {
      // Create supabase client for org fetch (separate from user auth)
      const supabase = await createClient()
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single()
      if (org?.name) {
        organizationName = org.name
      }
      // Fetch enabled add-on page IDs (not full templates, to avoid serialization issues)
      enabledAddonIds = await getEnabledAddonPages(organizationId)
    }
    // Fetch visible navigation items
    visibleNavItems = await getVisibleNavigation()
  } catch {
    // Use default name if fetch fails
  }

  return (
    <PageGuideProvider>
      <CommandPaletteProvider>
        <KeyboardShortcutsProvider>
          <DashboardShell
            userRole={userRole}
            userInfo={userInfo}
            organizationName={organizationName}
            organizationId={organizationId}
            visibleNavItems={visibleNavItems}
            enabledAddonIds={enabledAddonIds}
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </DashboardShell>
          <CommandPalette />
          <PageGuideWrapper />
        </KeyboardShortcutsProvider>
      </CommandPaletteProvider>
    </PageGuideProvider>
  )
}
