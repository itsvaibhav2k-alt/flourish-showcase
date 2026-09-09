'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface TeamMember {
  id: string
  userId: string
  email: string
  name: string | null
  role: 'admin' | 'member' | 'viewer'
  joinedAt: string
  isCurrentUser: boolean
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    throw new Error('No organization found')
  }

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Get organization members
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('id, user_id, role, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching team members:', error)
    throw new Error('Failed to fetch team members')
  }

  if (!members || members.length === 0) {
    return []
  }

  // Get user details from auth.users via admin API
  // Since we can't directly query auth.users, we'll use the user metadata
  // For now, we'll show basic info and mark role
  const teamMembers: TeamMember[] = members.map((member) => ({
    id: member.id,
    userId: member.user_id,
    email: member.user_id, // We'll need to fetch this separately or store it
    name: null,
    role: member.role as 'admin' | 'member' | 'viewer',
    joinedAt: member.created_at,
    isCurrentUser: member.user_id === currentUser?.id,
  }))

  // Try to get user emails from a view or stored data
  // For now, return what we have
  return teamMembers
}
