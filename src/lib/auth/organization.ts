import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const ORGANIZATION_COOKIE_NAME = 'organization-id'

const DEMO_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Gets the current organization ID from cookies.
 * This should be called in Server Components or Server Actions.
 *
 * In BYPASS_AUTH mode, returns the demo organization ID if no cookie is set.
 *
 * @returns The organization ID or null if not set
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const cookieStore = await cookies()
  const organizationId = cookieStore.get(ORGANIZATION_COOKIE_NAME)?.value

  // In BYPASS_AUTH mode, return demo org ID if no cookie is set
  if (!organizationId && process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    return DEMO_ORGANIZATION_ID
  }

  return organizationId || null
}

/**
 * Sets the current organization ID in cookies.
 * This should be called in Server Actions when a user switches organizations.
 *
 * @param organizationId - The organization ID to set
 */
export async function setCurrentOrganizationId(organizationId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ORGANIZATION_COOKIE_NAME, organizationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}

/**
 * Clears the current organization ID from cookies.
 * This should be called when a user logs out or needs to reset their organization context.
 */
export async function clearCurrentOrganizationId(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ORGANIZATION_COOKIE_NAME)
}

/**
 * Gets all organizations that the current user is a member of.
 * Returns an array of organizations with the user's role in each.
 *
 * In BYPASS_AUTH mode, returns the demo organization.
 *
 * @returns Array of organizations with membership info
 */
export async function getUserOrganizations() {
  const supabase = await createClient()

  // In BYPASS_AUTH mode, return the demo organization
  if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    // Fetch the demo organization (without logo_url as it may not exist)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', DEMO_ORGANIZATION_ID)
      .single()

    if (orgError || !org) {
      // Return a mock organization if the demo org doesn't exist
      return [{
        id: 'demo-membership',
        role: 'admin',
        organization_id: DEMO_ORGANIZATION_ID,
        organizations: {
          id: DEMO_ORGANIZATION_ID,
          name: 'Demo Organization',
          slug: 'demo',
        }
      }]
    }

    return [{
      id: 'demo-membership',
      role: 'admin',
      organization_id: org.id,
      organizations: {
        ...org,
      }
    }]
  }

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Fetch organizations where the user is a member
  const { data: memberships, error: membershipsError } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      organization_id,
      organizations (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (membershipsError) {
    throw new Error(`Failed to fetch organizations: ${membershipsError.message}`)
  }

  return memberships || []
}

/**
 * Checks if the current user has access to a specific organization.
 *
 * @param organizationId - The organization ID to check
 * @returns True if the user has access, false otherwise
 */
export async function hasOrganizationAccess(organizationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  return !error && !!data
}

/**
 * Gets the user's role in a specific organization.
 *
 * @param organizationId - The organization ID to check
 * @returns The user's role ('admin' | 'member' | 'viewer') or null if not a member
 */
export async function getOrganizationRole(
  organizationId: string
): Promise<'admin' | 'member' | 'viewer' | null> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data.role as 'admin' | 'member' | 'viewer'
}

/**
 * Gets the current user's role in their active organization.
 * Uses the organization ID from cookies.
 *
 * @returns The user's role or null if not authenticated or no organization
 */
export async function getCurrentUserRole(): Promise<'admin' | 'member' | 'viewer' | null> {
  try {
    // In BYPASS_AUTH mode, always return admin role
    if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      return 'admin'
    }

    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return null
    }

    return await getOrganizationRole(organizationId)
  } catch (error) {
    console.error('Error getting current user role:', error)
    return null
  }
}
