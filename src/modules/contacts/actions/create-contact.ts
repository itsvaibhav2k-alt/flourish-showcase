'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { createContactSchema, type CreateContactInput } from '../schemas/contact.schema'
import { logContactActivity } from '@/lib/activity'

type ActionResult = {
  success: boolean
  data?: { id: string }
  error?: string
}

export async function createContact(input: CreateContactInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedData = createContactSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Insert contact
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: organizationId,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        tags: validatedData.tags || [],
        is_donor: validatedData.is_donor || false,
        is_volunteer: validatedData.is_volunteer || false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Log activity
    await logContactActivity({
      organizationId,
      contactId: data.id,
      action: 'created',
    })

    // Revalidate paths
    revalidatePath('/contacts')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('Error in createContact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contact',
    }
  }
}
