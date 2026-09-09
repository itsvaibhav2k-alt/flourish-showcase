'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateOrganizationResult {
  success: boolean
  organizationId?: string
  error?: string
}

export async function createOrganization(name: string): Promise<CreateOrganizationResult> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to create an organization' }
    }

    // Generate slug from organization name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Ensure slug is unique by adding a random suffix
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`

    // Use admin client to bypass RLS for organization creation
    const adminClient = createAdminClient()

    // Create the organization
    const { data: orgData, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name,
        slug: uniqueSlug,
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return { success: false, error: `Failed to create organization: ${orgError.message}` }
    }

    // Add user as organization admin (highest role)
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: orgData.id,
        user_id: user.id,
        role: 'admin',
      })

    if (memberError) {
      console.error('Error adding user to organization:', memberError)
      // Clean up the organization if membership failed
      await adminClient.from('organizations').delete().eq('id', orgData.id)
      return { success: false, error: `Failed to set up organization membership: ${memberError.message}` }
    }

    revalidatePath('/contacts')
    return { success: true, organizationId: orgData.id }
  } catch (err) {
    console.error('Unexpected error creating organization:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
