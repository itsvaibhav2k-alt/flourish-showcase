import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from './types'

/**
 * Updates the Supabase session in middleware.
 * This function:
 * 1. Creates a Supabase client that works with middleware
 * 2. Refreshes the session if needed
 * 3. Returns a response with updated cookies
 *
 * @param request - The incoming Next.js request
 * @returns A NextResponse with updated authentication cookies
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Skip auth if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { response, user: null, error: null }
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refreshing the auth token will update the cookies
  // This must be done before returning the response
  const { data: { user }, error } = await supabase.auth.getUser()

  return { response, user, error }
}
