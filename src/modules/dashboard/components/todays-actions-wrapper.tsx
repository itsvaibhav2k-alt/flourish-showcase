import { getTodaysActions, TodayAction } from '@/modules/dashboard/queries/get-todays-actions'
import { TodaysActions } from './todays-actions'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

/**
 * Server component wrapper for Today's Actions
 * Fetches data and passes it to the client component
 */
export async function TodaysActionsWrapper() {
  let actions: TodayAction[] = []
  let hasContacts = false

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return <TodaysActions initialActions={[]} hasContacts={false} />
    }

    const supabase = await createClient()

    // Check if org has any contacts
    const { count } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('archived_at', null)

    hasContacts = (count || 0) > 0

    // Fetch actions
    actions = await getTodaysActions()
  } catch (error) {
    console.error('Error loading todays actions:', error)
    // Component will show empty state if actions fail to load
  }

  return <TodaysActions initialActions={actions} hasContacts={hasContacts} />
}
