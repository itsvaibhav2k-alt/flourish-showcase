import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Creates and returns a Supabase client for browser-side usage.
 * This client is used in Client Components and client-side code.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
