/**
 * Role-Based Access Control (RBAC) for Flourish CRM
 *
 * Defines user roles and their associated permissions.
 */

export type UserRole = 'admin' | 'member' | 'viewer'

/**
 * Permission types available in the system
 */
export type Permission =
  | 'read'           // View data
  | 'write'          // Create and edit data
  | 'delete'         // Delete data
  | 'settings'       // Access settings
  | 'manage_members' // Add/remove team members
  | '*'              // All permissions

/**
 * Role-based permission matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['*'], // Full access to everything
  member: ['read', 'write', 'delete'], // Can manage data but not settings
  viewer: ['read'], // Read-only access
}

/**
 * Check if a role has a specific permission
 *
 * @param role - The user's role
 * @param permission - The permission to check
 * @returns True if the role has the permission
 */
export function canAccess(role: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role]

  // If role has wildcard permission, allow everything
  if (rolePermissions.includes('*')) {
    return true
  }

  // Check if the specific permission exists
  return rolePermissions.includes(permission)
}

/**
 * Check if a role is admin
 *
 * @param role - The user's role
 * @returns True if the role is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if a role can write (create/edit data)
 *
 * @param role - The user's role
 * @returns True if the role can write
 */
export function canWrite(role: UserRole): boolean {
  return canAccess(role, 'write')
}

/**
 * Check if a role can delete data
 *
 * @param role - The user's role
 * @returns True if the role can delete
 */
export function canDelete(role: UserRole): boolean {
  return canAccess(role, 'delete')
}

/**
 * Check if a role can access settings
 *
 * @param role - The user's role
 * @returns True if the role can access settings
 */
export function canAccessSettings(role: UserRole): boolean {
  return canAccess(role, 'settings')
}

/**
 * Check if a role can manage team members
 *
 * @param role - The user's role
 * @returns True if the role can manage members
 */
export function canManageMembers(role: UserRole): boolean {
  return canAccess(role, 'manage_members')
}

/**
 * Get a human-readable description of a role
 *
 * @param role - The user's role
 * @returns Description of the role
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Full access to all features and settings',
    member: 'Can view and edit contacts, gifts, and volunteer data',
    viewer: 'Read-only access to all data',
  }

  return descriptions[role]
}

/**
 * Get a human-readable label for a role
 *
 * @param role - The user's role
 * @returns Label for the role
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    member: 'Member',
    viewer: 'Viewer',
  }

  return labels[role]
}
