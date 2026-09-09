/**
 * REST API v1 - Webhook Management
 *
 * GET /api/v1/webhooks - List webhooks
 * POST /api/v1/webhooks - Create webhook
 * PUT /api/v1/webhooks/:id - Update webhook (via query param)
 * DELETE /api/v1/webhooks/:id - Delete webhook (via query param)
 *
 * Security:
 * - API key authentication required
 * - CORS restricted to allowed origins
 * - Strict input validation with Zod
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '../_lib/auth'
import { handleCorsOptions, corsJsonResponse, corsErrorResponse, addCorsHeaders } from '../_lib/cors'
import { validateBody, createWebhookSchema, updateWebhookSchema, uuidField } from '../_lib/schemas'
import crypto from 'crypto'

// GET - List webhooks
export async function GET(req: NextRequest) {
  try {
    // Authenticate API key
    const auth = await validateApiKey(req)
    if (!auth.valid) {
      return corsErrorResponse(req, auth.error || 'Unauthorized', auth.status || 401)
    }

    const supabase = createAdminClient()

    // Fetch webhooks
    const { data: webhooks, error } = await supabase
      .from('automation_webhooks')
      .select(`
        id,
        name,
        description,
        webhook_type,
        config,
        is_active,
        rate_limit_per_minute,
        last_used_at,
        usage_count,
        created_at,
        updated_at
      `)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching webhooks:', error)
      return corsErrorResponse(req, 'Failed to fetch webhooks', 500)
    }

    return corsJsonResponse(req, {
      success: true,
      data: {
        webhooks: webhooks || [],
      },
    })
  } catch (error) {
    console.error('API v1 list webhooks error:', error)
    return corsErrorResponse(req, 'Internal server error', 500)
  }
}

// POST - Create webhook
export async function POST(req: NextRequest) {
  try {
    // Authenticate API key
    const auth = await validateApiKey(req)
    if (!auth.valid) {
      return corsErrorResponse(req, auth.error || 'Unauthorized', auth.status || 401)
    }

    // Check admin permission
    if (!auth.permissions.includes('admin')) {
      return corsErrorResponse(req, 'Insufficient permissions. Requires admin access.', 403)
    }

    // Validate request body with Zod schema
    const validation = await validateBody(req, createWebhookSchema)
    if (!validation.success) {
      return corsErrorResponse(req, validation.error, 400)
    }

    const { data: body } = validation

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    const supabase = createAdminClient()

    // Create webhook
    const { data: webhook, error } = await supabase
      .from('automation_webhooks')
      .insert({
        organization_id: auth.organizationId,
        name: body.name,
        description: body.description,
        webhook_token: token,
        webhook_type: body.webhook_type,
        config: body.config || {},
        rate_limit_per_minute: body.rate_limit_per_minute || 60,
        is_active: true,
      })
      .select('id, name, webhook_type, created_at')
      .single()

    if (error || !webhook) {
      console.error('Error creating webhook:', error)
      return corsErrorResponse(req, 'Failed to create webhook', 500)
    }

    // Build webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flourishnpo.com'
    const webhookUrl = `${baseUrl}/api/webhooks/automation?token=${token}`

    return corsJsonResponse(req, {
      success: true,
      data: {
        id: webhook.id,
        name: webhook.name,
        webhook_type: webhook.webhook_type,
        webhook_url: webhookUrl,
        webhook_token: token, // Only returned once on creation
        created_at: webhook.created_at,
      },
    })
  } catch (error) {
    console.error('API v1 create webhook error:', error)
    return corsErrorResponse(req, 'Internal server error', 500)
  }
}

// PUT - Update webhook
export async function PUT(req: NextRequest) {
  try {
    // Authenticate API key
    const auth = await validateApiKey(req)
    if (!auth.valid) {
      return corsErrorResponse(req, auth.error || 'Unauthorized', auth.status || 401)
    }

    // Check admin permission
    if (!auth.permissions.includes('admin')) {
      return corsErrorResponse(req, 'Insufficient permissions. Requires admin access.', 403)
    }

    // Get webhook ID from query param and validate
    const webhookId = req.nextUrl.searchParams.get('id')
    if (!webhookId) {
      return corsErrorResponse(req, 'Webhook ID is required as query parameter', 400)
    }

    // Validate UUID format
    const uuidValidation = uuidField.safeParse(webhookId)
    if (!uuidValidation.success) {
      return corsErrorResponse(req, 'Invalid webhook ID format', 400)
    }

    // Validate request body with Zod schema
    const validation = await validateBody(req, updateWebhookSchema)
    if (!validation.success) {
      return corsErrorResponse(req, validation.error, 400)
    }

    const { data: body } = validation

    const supabase = createAdminClient()

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.config !== undefined) updates.config = body.config
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.rate_limit_per_minute !== undefined) updates.rate_limit_per_minute = body.rate_limit_per_minute

    // Update webhook
    const { data: webhook, error } = await supabase
      .from('automation_webhooks')
      .update(updates)
      .eq('id', webhookId)
      .eq('organization_id', auth.organizationId)
      .select('id, name, webhook_type, is_active, updated_at')
      .single()

    if (error || !webhook) {
      console.error('Error updating webhook:', error)
      return corsErrorResponse(req, 'Webhook not found or update failed', 404)
    }

    return corsJsonResponse(req, {
      success: true,
      data: webhook,
    })
  } catch (error) {
    console.error('API v1 update webhook error:', error)
    return corsErrorResponse(req, 'Internal server error', 500)
  }
}

// DELETE - Delete webhook
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate API key
    const auth = await validateApiKey(req)
    if (!auth.valid) {
      return corsErrorResponse(req, auth.error || 'Unauthorized', auth.status || 401)
    }

    // Check admin permission
    if (!auth.permissions.includes('admin')) {
      return corsErrorResponse(req, 'Insufficient permissions. Requires admin access.', 403)
    }

    // Get webhook ID from query param and validate
    const webhookId = req.nextUrl.searchParams.get('id')
    if (!webhookId) {
      return corsErrorResponse(req, 'Webhook ID is required as query parameter', 400)
    }

    // Validate UUID format
    const uuidValidation = uuidField.safeParse(webhookId)
    if (!uuidValidation.success) {
      return corsErrorResponse(req, 'Invalid webhook ID format', 400)
    }

    const supabase = createAdminClient()

    // Delete webhook
    const { error } = await supabase
      .from('automation_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('organization_id', auth.organizationId)

    if (error) {
      console.error('Error deleting webhook:', error)
      return corsErrorResponse(req, 'Failed to delete webhook', 500)
    }

    return corsJsonResponse(req, {
      success: true,
      data: {
        deleted: true,
        webhook_id: webhookId,
      },
    })
  } catch (error) {
    console.error('API v1 delete webhook error:', error)
    return corsErrorResponse(req, 'Internal server error', 500)
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req)
}
