'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/lib/supabase/types'

export interface Snippet {
  name: string
  content: string
}

/**
 * Update the tone preset for the organization
 */
export async function updateTonePreset(preset: string): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    // Validate preset
    const validPresets = ['warm', 'professional', 'casual', 'formal', 'spiritual']
    if (!validPresets.includes(preset)) {
      return { success: false, error: 'Invalid tone preset' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('organizations')
      .update({
        tone_preset: preset,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating tone preset:', error)
      return { success: false, error: 'Failed to update tone preset' }
    }

    revalidatePath('/settings')

    return { success: true }
  } catch (error) {
    console.error('Error in updateTonePreset:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tone preset'
    }
  }
}

/**
 * Save a new snippet or update an existing one
 */
export async function saveSnippet(snippet: Snippet): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    // Validate snippet
    if (!snippet.name || snippet.name.trim().length === 0) {
      return { success: false, error: 'Snippet name is required' }
    }

    if (!snippet.content || snippet.content.trim().length === 0) {
      return { success: false, error: 'Snippet content is required' }
    }

    if (snippet.content.length > 500) {
      return { success: false, error: 'Snippet content must be 500 characters or less' }
    }

    const supabase = await createClient()

    // Get current snippets
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('snippets')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      console.error('Error fetching snippets:', fetchError)
      return { success: false, error: 'Failed to fetch snippets' }
    }

    // Parse existing snippets
    let snippets: Snippet[] = []
    try {
      snippets = org.snippets ? JSON.parse(JSON.stringify(org.snippets)) : []
    } catch (e) {
      console.error('Error parsing snippets:', e)
      snippets = []
    }

    // Check if snippet with this name already exists
    const existingIndex = snippets.findIndex(s => s.name === snippet.name)

    if (existingIndex >= 0) {
      // Update existing snippet
      snippets[existingIndex] = snippet
    } else {
      // Add new snippet
      snippets.push(snippet)
    }

    // Update database
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        snippets: snippets as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error saving snippet:', updateError)
      return { success: false, error: 'Failed to save snippet' }
    }

    revalidatePath('/settings')

    return { success: true }
  } catch (error) {
    console.error('Error in saveSnippet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save snippet'
    }
  }
}

/**
 * Delete a snippet by name
 */
export async function deleteSnippet(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Snippet name is required' }
    }

    const supabase = await createClient()

    // Get current snippets
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('snippets')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      console.error('Error fetching snippets:', fetchError)
      return { success: false, error: 'Failed to fetch snippets' }
    }

    // Parse existing snippets
    let snippets: Snippet[] = []
    try {
      snippets = org.snippets ? JSON.parse(JSON.stringify(org.snippets)) : []
    } catch (e) {
      console.error('Error parsing snippets:', e)
      snippets = []
    }

    // Filter out the snippet to delete
    const updatedSnippets = snippets.filter(s => s.name !== name)

    if (updatedSnippets.length === snippets.length) {
      return { success: false, error: 'Snippet not found' }
    }

    // Update database
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        snippets: updatedSnippets as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error deleting snippet:', updateError)
      return { success: false, error: 'Failed to delete snippet' }
    }

    revalidatePath('/settings')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteSnippet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete snippet'
    }
  }
}
