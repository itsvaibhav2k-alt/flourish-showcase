'use client'

import * as React from 'react'
import type { UserRole } from '@/lib/auth/roles'

interface RoleGateProps {
  /**
   * The roles that are allowed to see the children.
   * If the user's role is not in this array, the fallback will be shown.
   */
  allowedRoles: UserRole[]

  /**
   * The current user's role. Should be fetched on the server and passed in.
   */
  userRole: UserRole | null

  /**
   * Content to show if the user has the required role
   */
  children: React.ReactNode

  /**
   * Optional content to show if the user does not have the required role.
   * If not provided, nothing will be rendered.
   */
  fallback?: React.ReactNode
}

/**
 * RoleGate component - conditionally renders children based on user role.
 *
 * Usage:
 * ```tsx
 * <RoleGate allowedRoles={['admin']} userRole={userRole}>
 *   <AdminOnlyContent />
 * </RoleGate>
 * ```
 *
 * Or with a fallback:
 * ```tsx
 * <RoleGate
 *   allowedRoles={['admin', 'member']}
 *   userRole={userRole}
 *   fallback={<p>You don't have access to this feature</p>}
 * >
 *   <RestrictedContent />
 * </RoleGate>
 * ```
 */
export function RoleGate({
  allowedRoles,
  userRole,
  children,
  fallback = null,
}: RoleGateProps) {
  // If no user role, default to most restrictive
  if (!userRole) {
    return <>{fallback}</>
  }

  // Check if user's role is in the allowed roles
  const hasAccess = allowedRoles.includes(userRole)

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
