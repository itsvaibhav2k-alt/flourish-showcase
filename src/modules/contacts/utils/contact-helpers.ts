import type { Contact } from '../schemas/contact.schema'

/**
 * Get contact's full name.
 */
export function getContactFullName(contact: Contact): string {
  return `${contact.first_name} ${contact.last_name}`.trim()
}

/**
 * Get contact's initials for avatar.
 */
export function getContactInitials(contact: Contact): string {
  const firstInitial = contact.first_name.charAt(0).toUpperCase()
  const lastInitial = contact.last_name.charAt(0).toUpperCase()
  return `${firstInitial}${lastInitial}`
}
