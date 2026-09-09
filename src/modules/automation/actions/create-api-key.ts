'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import crypto from 'crypto'

interface CreateApiKeyInput {
  name: string
  permissions: string[]
  rate_limit_per_minute?: number
  expires_in_days?: number
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

/**
 * Hash an API key for storage
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Generate a new API key
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `flr_${crypto.randomBytes(32).toString('base64url')}`
  const prefix = key.substring(0, 12)
  const hash = hashApiKey(key)
  return { key, prefix, hash }
}

export async function createApiKey(
  input: CreateApiKeyInput
): Promise<{ success: boolean; data?: { key: string; apiKey: ApiKey }; error?: string }> {
  try {
    // Check permissions
    const userRole = await getCurrentUserRole()
    if (userRole !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    // Validate input
    if (!input.name || !input.permissions || input.permissions.length === 0) {
      return { success: false, error: 'Name and at least one permission are required' }
    }

    const validPermissions = ['read', 'write', 'admin']
    for (const perm of input.permissions) {
      if (!validPermissions.includes(perm)) {
        return { success: false, error: `Invalid permission: ${perm}` }
      }
    }

    // Generate the key
    const { key, prefix, hash } = generateApiKey()

    // Calculate expiration
    let expiresAt: string | null = null
    if (input.expires_in_days && input.expires_in_days > 0) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + input.expires_in_days)
      expiresAt = expDate.toISOString()
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id: organizationId,
        name: input.name,
        key_hash: hash,
        key_prefix: prefix,
        permissions: input.permissions,
        rate_limit_per_minute: input.rate_limit_per_minute || 100,
        expires_at: expiresAt,
        is_active: true,
        created_by: user?.id,
      })
      .select('id, name, key_prefix, permissions, is_active, expires_at, last_used_at, usage_count, rate_limit_per_minute, created_at')
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return { success: false, error: 'Failed to create API key' }
    }

    return {
      success: true,
      data: {
        key, // Return the full key only once
        apiKey: data as ApiKey,
      },
    }
  } catch (error) {
    console.error('Create API key error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key',
    }
  }
}
