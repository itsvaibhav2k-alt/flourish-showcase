import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Creates a Supabase admin client with service role key.
 * This client bypasses Row Level Security (RLS).
 * Use ONLY for operations that require admin access (e.g., public portals, system operations).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
