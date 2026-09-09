import { randomBytes } from 'crypto'

/**
 * Generates a secure random token for donor portal access.
 * Uses cryptographically strong random bytes to create a 64-character hex string.
 *
 * @returns A 64-character hexadecimal string (32 bytes)
 */
export function generatePortalToken(): string {
  return randomBytes(32).toString('hex')
}
