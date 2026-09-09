/**
 * Environment Configuration Validation
 *
 * Validates that all required environment variables are set correctly.
 * Call this at application startup to fail fast if configuration is invalid.
 *
 * This helps prevent runtime errors and security issues from misconfiguration.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate all required environment variables
 *
 * Call this in a server component or API route that runs at startup.
 * Returns validation result with errors and warnings.
 */
export function validateConfig(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // ============================================================================
  // REQUIRED: Supabase Configuration
  // ============================================================================

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should use HTTPS in production')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
  }

  // ============================================================================
  // REQUIRED: Encryption Key (for storing sensitive data)
  // ============================================================================

  if (!process.env.ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY is required for secure data storage. Generate with: openssl rand -hex 32')
  } else {
    const key = process.env.ENCRYPTION_KEY

    // Validate format: 64 hex characters (32 bytes)
    const validHex = key.length === 64 && /^[0-9a-fA-F]+$/.test(key)

    if (!validHex) {
      errors.push(
        'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes). Generate with: openssl rand -hex 32'
      )
    }
  }

  // ============================================================================
  // RECOMMENDED: External Services
  // ============================================================================

  if (!process.env.ANTHROPIC_API_KEY) {
    warnings.push('ANTHROPIC_API_KEY is not set - AI features will be disabled')
  } else if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    warnings.push('ANTHROPIC_API_KEY appears to be in an unexpected format')
  }

  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY is not set - Email sending will be disabled')
  } else if (!process.env.RESEND_API_KEY.startsWith('re_')) {
    warnings.push('RESEND_API_KEY appears to be in an unexpected format')
  }

  // ============================================================================
  // OPTIONAL: Stripe (for payments)
  // ============================================================================

  if (process.env.STRIPE_SECRET_KEY) {
    if (
      !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') &&
      !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
    ) {
      warnings.push('STRIPE_SECRET_KEY appears to be in an unexpected format')
    }

    if (
      process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') &&
      process.env.NODE_ENV !== 'production'
    ) {
      warnings.push('Using live Stripe key in non-production environment')
    }
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    warnings.push('STRIPE_WEBHOOK_SECRET appears to be in an unexpected format')
  }

  // ============================================================================
  // SECURITY CHECKS
  // ============================================================================

  // Check for dangerous development settings in production
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    if (process.env.BYPASS_AUTH === 'true') {
      errors.push('BYPASS_AUTH cannot be enabled in production')
    }

    if (process.env.INNGEST_DEV === '1') {
      warnings.push('INNGEST_DEV should not be enabled in production')
    }
  }

  // ============================================================================
  // RESULT
  // ============================================================================

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate config and throw if invalid
 * Use this in critical paths where the app should fail fast
 */
export function validateConfigOrThrow(): void {
  const result = validateConfig()

  if (!result.valid) {
    console.error('Configuration validation failed:')
    result.errors.forEach((err) => console.error(`  ERROR: ${err}`))
    result.warnings.forEach((warn) => console.warn(`  WARNING: ${warn}`))
    throw new Error(`Configuration validation failed: ${result.errors.join('; ')}`)
  }

  // Log warnings but don't throw
  if (result.warnings.length > 0) {
    console.warn('Configuration warnings:')
    result.warnings.forEach((warn) => console.warn(`  WARNING: ${warn}`))
  }
}

/**
 * Check if a specific feature is available based on config
 */
export function isFeatureAvailable(feature: 'ai' | 'email' | 'payments'): boolean {
  switch (feature) {
    case 'ai':
      return !!process.env.ANTHROPIC_API_KEY
    case 'email':
      return !!process.env.RESEND_API_KEY
    case 'payments':
      return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET
    default:
      return false
  }
}
