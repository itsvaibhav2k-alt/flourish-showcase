import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Creates and returns a Supabase client for server-side usage.
 * This client is used in Server Components, Route Handlers, and Server Actions.
 * It properly handles cookie-based authentication with the Next.js App Router.
 *
 * In BYPASS_AUTH mode, uses service role key to bypass RLS for development.
 */
export async function createClient() {
  const cookieStore = await cookies()

  // In BYPASS_AUTH mode, use service role key to bypass RLS
  const apiKey = process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    apiKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with service role key for admin operations.
 * Use with caution - this bypasses Row Level Security (RLS).
 * Only use in server-side code where you need elevated permissions.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
