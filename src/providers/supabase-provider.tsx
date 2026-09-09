'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

/**
 * Supabase Provider Component
 *
 * This provider makes the Supabase client available throughout the React component tree.
 * It should be placed near the root of your application, typically in the layout.
 *
 * The provider also sets up auth state change listeners to keep the session in sync.
 *
 * @example
 * ```tsx
 * // In your root layout:
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SupabaseProvider>
 *           {children}
 *         </SupabaseProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Auth state change listener - refreshes handled automatically by Supabase
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

/**
 * Hook to access the Supabase client in Client Components.
 *
 * @throws Error if used outside of SupabaseProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { supabase } = useSupabase()
 *
 *   const handleSignOut = async () => {
 *     await supabase.auth.signOut()
 *   }
 *
 *   return <button onClick={handleSignOut}>Sign Out</button>
 * }
 * ```
 */
export function useSupabase() {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }

  return context
}
