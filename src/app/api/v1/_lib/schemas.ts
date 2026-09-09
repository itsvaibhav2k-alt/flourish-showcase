/**
 * API v1 Request Validation Schemas
 *
 * Strict Zod schemas for validating all API requests.
 * Using .strict() to reject any unexpected fields (defense against injection).
 *
 * OWASP Best Practices:
 * - Validate all input on the server side
 * - Use strict type checking
 * - Enforce length limits
 * - Whitelist allowed values (enums)
 * - Reject unexpected fields
 */

import { z } from 'zod'

// ============================================================================
// COMMON FIELD SCHEMAS
// ============================================================================

/**
 * UUID validation - most IDs in the system are UUIDs
 */
export const uuidField = z.string().uuid('Must be a valid UUID')

/**
 * Email validation with length limit (RFC 5321 max is 254)
 */
export const emailField = z.string().email('Must be a valid email address').max(254)

/**
 * Short text fields (names, titles, etc.)
 */
export const shortTextField = z.string().max(255, 'Maximum 255 characters')

/**
 * Long text fields (descriptions, bodies, etc.)
 */
export const longTextField = z.string().max(10000, 'Maximum 10,000 characters')

/**
 * Very long text fields (email bodies, rich content)
 */
export const richTextField = z.string().max(50000, 'Maximum 50,000 characters')

/**
 * Positive integer (counts, limits, etc.)
 */
export const positiveInt = z.number().int().positive()

/**
 * Non-negative integer (including zero)
 */
export const nonNegativeInt = z.number().int().min(0)

// ============================================================================
// EMAIL GENERATION SCHEMA
// ============================================================================

/**
 * Allowed email types for generation
 */
export const emailTypeEnum = z.enum([
  'thank_you',
  'reengagement',
  'volunteer_confirmation',
  'volunteer_reminder',
  'volunteer_thank_you',
  'custom',
  'general_thanks',
  'custom_advanced',
])

/**
 * Schema for POST /api/v1/emails/generate
 */
export const generateEmailSchema = z
  .object({
    contact_id: uuidField.optional(),
    contact_email: emailField.optional(),
    email_type: emailTypeEnum,
    gift_id: uuidField.optional(),
    shift_id: uuidField.optional(),
    count: z.number().int().min(1).max(100).optional().default(1),
    custom_params: z
      .object({
        topic: shortTextField.optional(),
        key_points: z.array(shortTextField).max(10).optional(),
        tone: z.enum(['warm', 'professional', 'casual', 'formal', 'spiritual', 'urgent']).optional(),
        call_to_action: shortTextField.optional(),
        subject_hint: shortTextField.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((data) => data.contact_id || data.contact_email, {
    message: 'Either contact_id or contact_email is required',
  })

// ============================================================================
// EMAIL SEND SCHEMA
// ============================================================================

/**
 * Schema for POST /api/v1/emails/send
 */
export const sendEmailSchema = z
  .object({
    // Option 1: Send existing drafts
    draft_ids: z.array(uuidField).max(50, 'Maximum 50 drafts per request').optional(),
    draft_id: uuidField.optional(),

    // Option 2: Send direct email (no draft)
    contact_id: uuidField.optional(),
    contact_email: emailField.optional(),
    to: emailField.optional(),
    subject: shortTextField.optional(),
    body: richTextField.optional(),
  })
  .strict()
  .refine(
    (data) => data.draft_ids?.length || data.draft_id || data.to || data.contact_id || data.contact_email,
    { message: 'Must provide draft_ids, draft_id, or recipient information (to, contact_id, contact_email)' }
  )

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

/**
 * Webhook types
 */
export const webhookTypeEnum = z.enum([
  'send_email',
  'enroll_sequence',
  'generate_custom_email',
  'create_contact',
  'update_contact',
])

/**
 * Schema for POST /api/v1/webhooks (create webhook)
 */
export const createWebhookSchema = z
  .object({
    name: shortTextField.min(1, 'Name is required'),
    description: longTextField.optional(),
    webhook_type: webhookTypeEnum,
    config: z
      .object({
        default_email_type: z.string().optional(),
        default_sequence_id: uuidField.optional(),
        auto_approve_emails: z.boolean().optional(),
        field_mapping: z.record(z.string()).optional(),
      })
      .passthrough() // Allow additional config fields
      .optional(),
    rate_limit_per_minute: z.number().int().min(1).max(1000).optional().default(60),
  })
  .strict()

/**
 * Schema for PUT /api/v1/webhooks (update webhook)
 */
export const updateWebhookSchema = z
  .object({
    name: shortTextField.optional(),
    description: longTextField.optional(),
    config: z.record(z.unknown()).optional(),
    is_active: z.boolean().optional(),
    rate_limit_per_minute: z.number().int().min(1).max(1000).optional(),
  })
  .strict()

// ============================================================================
// SEQUENCE SCHEMAS
// ============================================================================

/**
 * Schema for POST /api/v1/sequences/enroll
 */
export const enrollSequenceSchema = z
  .object({
    contact_id: uuidField.optional(),
    contact_email: emailField.optional(),
    sequence_id: uuidField,
    trigger_event_type: shortTextField.optional(),
    trigger_event_id: uuidField.optional(),
  })
  .strict()
  .refine((data) => data.contact_id || data.contact_email, {
    message: 'Either contact_id or contact_email is required',
  })

/**
 * Schema for GET /api/v1/sequences/enroll (query params)
 */
export const getSequenceEnrollmentsSchema = z
  .object({
    sequence_id: uuidField.optional(),
    contact_id: uuidField.optional(),
    status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
  })
  .strict()

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

/**
 * Schema for creating/updating contacts via webhook
 */
export const createContactSchema = z
  .object({
    email: emailField.optional(),
    first_name: shortTextField.optional(),
    last_name: shortTextField.optional(),
    phone: z.string().max(50).optional(),
    address: shortTextField.optional(),
    city: shortTextField.optional(),
    state: z.string().max(50).optional(),
    zip: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    notes: longTextField.optional(),
    tags: z.array(shortTextField).max(50).optional(),
    custom_fields: z.record(z.unknown()).optional(),
  })
  .strict()
  .refine((data) => data.email || data.first_name, {
    message: 'Either email or first_name is required',
  })

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Type-safe validation result
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] }

/**
 * Validate request body against a schema
 *
 * Usage:
 *   const validation = await validateBody(req, generateEmailSchema)
 *   if (!validation.success) {
 *     return corsErrorResponse(req, validation.error, 400)
 *   }
 *   const { data } = validation // data is typed!
 */
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return {
      success: false,
      error: 'Invalid JSON body',
    }
  }

  const result = schema.safeParse(body)

  if (!result.success) {
    // Format error messages nicely
    const issues = result.error.issues
    const errorMessage = issues
      .map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
      })
      .join('; ')

    return {
      success: false,
      error: `Validation failed: ${errorMessage}`,
      issues,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  // Convert URLSearchParams to object
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const result = schema.safeParse(params)

  if (!result.success) {
    const issues = result.error.issues
    const errorMessage = issues
      .map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
      })
      .join('; ')

    return {
      success: false,
      error: `Invalid query parameters: ${errorMessage}`,
      issues,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}
