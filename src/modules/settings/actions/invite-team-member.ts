'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/resend'
import { renderEmailTemplate, TeamInviteEmailData } from '@/lib/email/templates'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
})

export type InviteResult = {
  success: boolean
  message: string
  error?: string
}

export async function inviteTeamMember(formData: FormData): Promise<InviteResult> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  // Validate input
  const rawData = {
    email: formData.get('email') as string,
    role: (formData.get('role') as string) || 'member',
  }

  const validationResult = inviteSchema.safeParse(rawData)
  if (!validationResult.success) {
    return {
      success: false,
      message: validationResult.error.issues[0].message,
      error: 'VALIDATION_ERROR',
    }
  }

  const { email, role } = validationResult.data

  // Get current user (the inviter)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { success: false, message: 'Authentication required', error: 'AUTH_ERROR' }
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', email) // We'll need to look up by email
    .maybeSingle()

  // Get organization name for the invite
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  // Store the pending invite in the organization's settings
  // This is a simple approach - in production you'd use a proper invitations table
  const { data: currentOrg, error: fetchError } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  if (fetchError) {
    return { success: false, message: 'Failed to fetch organization settings', error: 'FETCH_ERROR' }
  }

  const settings = (currentOrg?.settings as Record<string, unknown>) || {}
  const pendingInvites = (settings.pendingInvites as Array<{ email: string; role: string; invitedAt: string }>) || []

  // Check if already invited
  if (pendingInvites.some((invite) => invite.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'This email has already been invited', error: 'ALREADY_INVITED' }
  }

  // Add new invite
  pendingInvites.push({
    email: email.toLowerCase(),
    role,
    invitedAt: new Date().toISOString(),
  })

  // Update settings with new invite
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      settings: {
        ...settings,
        pendingInvites,
      },
    })
    .eq('id', organizationId)

  if (updateError) {
    console.error('Error saving invite:', updateError)
    return { success: false, message: 'Failed to save invitation', error: 'UPDATE_ERROR' }
  }

  // Send invitation email via Resend
  const orgName = org?.name || 'your organization'
  const inviterName = currentUser.user_metadata?.full_name ||
    currentUser.user_metadata?.name ||
    currentUser.email?.split('@')[0] ||
    'A team member'
  const inviterEmail = currentUser.email || ''

  // Build the invite URL - include org ID so we can auto-join after signup
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://flourishnpo.com' : 'http://localhost:3000')
  const inviteUrl = `${baseUrl}/signup?invite=${organizationId}&email=${encodeURIComponent(email)}&role=${role}`

  try {
    const emailData: TeamInviteEmailData = {
      inviteUrl,
      orgName,
      inviterName,
      inviterEmail,
      role,
    }

    const emailHtml = await renderEmailTemplate('team_invite', emailData)

    const emailResult = await sendEmail({
      to: email,
      subject: `You're invited to join ${orgName} on Flourish`,
      body: emailHtml,
    })

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error)
      // Don't fail the entire operation - invite is saved, just log the email failure
    }
  } catch (emailError) {
    console.error('Error sending invitation email:', emailError)
    // Don't fail the entire operation - invite is saved, just log the email failure
  }

  revalidatePath('/settings')

  return {
    success: true,
    message: `Invitation sent to ${email}! They will be added to ${orgName} as a ${role} when they accept.`,
  }
}

export async function removeTeamMember(memberId: string): Promise<InviteResult> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  // Get current user to prevent self-removal
  const { data: { user } } = await supabase.auth.getUser()

  // Get the member to be removed
  const { data: member } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('id', memberId)
    .single()

  if (member?.user_id === user?.id) {
    return { success: false, message: 'You cannot remove yourself from the organization', error: 'SELF_REMOVE' }
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error removing team member:', error)
    return { success: false, message: 'Failed to remove team member', error: 'DELETE_ERROR' }
  }

  revalidatePath('/settings')

  return { success: true, message: 'Team member removed successfully' }
}

export async function cancelInvite(email: string): Promise<InviteResult> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  const settings = (currentOrg?.settings as Record<string, unknown>) || {}
  const pendingInvites = (settings.pendingInvites as Array<{ email: string; role: string; invitedAt: string }>) || []

  const updatedInvites = pendingInvites.filter(
    (invite) => invite.email.toLowerCase() !== email.toLowerCase()
  )

  const { error } = await supabase
    .from('organizations')
    .update({
      settings: {
        ...settings,
        pendingInvites: updatedInvites,
      },
    })
    .eq('id', organizationId)

  if (error) {
    return { success: false, message: 'Failed to cancel invitation', error: 'UPDATE_ERROR' }
  }

  revalidatePath('/settings')

  return { success: true, message: 'Invitation cancelled' }
}

export async function updateMemberRole(memberId: string, newRole: 'admin' | 'member' | 'viewer'): Promise<InviteResult> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error updating role:', error)
    return { success: false, message: 'Failed to update role', error: 'UPDATE_ERROR' }
  }

  revalidatePath('/settings')

  return { success: true, message: 'Role updated successfully' }
}
