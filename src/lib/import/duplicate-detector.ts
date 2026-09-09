import type { CreateContactInput } from '@/modules/contacts/schemas/contact.schema'
import type { Contact } from '@/modules/contacts/schemas/contact.schema'

export type DuplicateMatch = {
  newContact: CreateContactInput
  existingContact: Contact
  matchReason: string
  similarity: number
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy name matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1
  return 1 - distance / maxLength
}

/**
 * Normalize name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Check if two contacts match based on email
 */
function matchByEmail(
  newContact: CreateContactInput,
  existingContact: Contact
): { matches: boolean; similarity: number } {
  if (!newContact.email || !existingContact.email) {
    return { matches: false, similarity: 0 }
  }

  const matches =
    newContact.email.toLowerCase().trim() === existingContact.email.toLowerCase().trim()

  return {
    matches,
    similarity: matches ? 1 : 0,
  }
}

/**
 * Check if two contacts match based on name similarity
 */
function matchByName(
  newContact: CreateContactInput,
  existingContact: Contact,
  threshold: number = 0.85
): { matches: boolean; similarity: number } {
  const newFullName = normalizeName(`${newContact.first_name} ${newContact.last_name}`)
  const existingFullName = normalizeName(
    `${existingContact.first_name} ${existingContact.last_name}`
  )

  const similarity = similarityRatio(newFullName, existingFullName)

  return {
    matches: similarity >= threshold,
    similarity,
  }
}

/**
 * Check if two contacts match based on phone
 */
function matchByPhone(
  newContact: CreateContactInput,
  existingContact: Contact
): { matches: boolean; similarity: number } {
  if (!newContact.phone || !existingContact.phone) {
    return { matches: false, similarity: 0 }
  }

  // Normalize phone numbers (remove non-digits)
  const normalizePhone = (phone: string) => phone.replace(/\D/g, '')

  const newPhone = normalizePhone(newContact.phone)
  const existingPhone = normalizePhone(existingContact.phone)

  // Match if last 10 digits are the same (ignoring country code)
  const newLast10 = newPhone.slice(-10)
  const existingLast10 = existingPhone.slice(-10)

  const matches = newLast10 === existingLast10 && newLast10.length === 10

  return {
    matches,
    similarity: matches ? 1 : 0,
  }
}

/**
 * Find potential duplicates for a list of new contacts
 */
export async function findDuplicates(
  contacts: CreateContactInput[],
  existingContacts: Contact[]
): Promise<{
  unique: CreateContactInput[]
  duplicates: DuplicateMatch[]
}> {
  const duplicates: DuplicateMatch[] = []
  const unique: CreateContactInput[] = []

  for (const newContact of contacts) {
    let isDuplicate = false
    let bestMatch: DuplicateMatch | null = null
    let highestSimilarity = 0

    for (const existingContact of existingContacts) {
      // Skip archived contacts
      if (existingContact.archived_at) {
        continue
      }

      // Check email match (highest priority)
      const emailMatch = matchByEmail(newContact, existingContact)
      if (emailMatch.matches) {
        isDuplicate = true
        bestMatch = {
          newContact,
          existingContact,
          matchReason: 'Exact email match',
          similarity: 1,
        }
        break // Email is exact match, no need to check further
      }

      // Check phone match
      const phoneMatch = matchByPhone(newContact, existingContact)
      if (phoneMatch.matches && phoneMatch.similarity > highestSimilarity) {
        isDuplicate = true
        highestSimilarity = phoneMatch.similarity
        bestMatch = {
          newContact,
          existingContact,
          matchReason: 'Phone number match',
          similarity: phoneMatch.similarity,
        }
      }

      // Check name similarity
      const nameMatch = matchByName(newContact, existingContact)
      if (nameMatch.matches && nameMatch.similarity > highestSimilarity) {
        isDuplicate = true
        highestSimilarity = nameMatch.similarity
        bestMatch = {
          newContact,
          existingContact,
          matchReason: `Similar name (${Math.round(nameMatch.similarity * 100)}% match)`,
          similarity: nameMatch.similarity,
        }
      }
    }

    if (isDuplicate && bestMatch) {
      duplicates.push(bestMatch)
    } else {
      unique.push(newContact)
    }
  }

  return {
    unique,
    duplicates,
  }
}

/**
 * Find duplicates within a list of new contacts (before comparing with existing)
 */
export function findInternalDuplicates(
  contacts: CreateContactInput[]
): {
  unique: CreateContactInput[]
  duplicates: Array<{
    original: CreateContactInput
    duplicate: CreateContactInput
    matchReason: string
  }>
} {
  const seen = new Map<string, CreateContactInput>()
  const unique: CreateContactInput[] = []
  const duplicates: Array<{
    original: CreateContactInput
    duplicate: CreateContactInput
    matchReason: string
  }> = []

  for (const contact of contacts) {
    let isDuplicate = false

    // Check email duplicates
    if (contact.email) {
      const emailKey = contact.email.toLowerCase().trim()
      if (seen.has(`email:${emailKey}`)) {
        duplicates.push({
          original: seen.get(`email:${emailKey}`)!,
          duplicate: contact,
          matchReason: 'Duplicate email in import file',
        })
        isDuplicate = true
      } else {
        seen.set(`email:${emailKey}`, contact)
      }
    }

    // Check name duplicates (exact match only for internal)
    const nameKey = normalizeName(`${contact.first_name} ${contact.last_name}`)
    if (!isDuplicate && nameKey) {
      if (seen.has(`name:${nameKey}`)) {
        duplicates.push({
          original: seen.get(`name:${nameKey}`)!,
          duplicate: contact,
          matchReason: 'Duplicate name in import file',
        })
        isDuplicate = true
      } else {
        seen.set(`name:${nameKey}`, contact)
      }
    }

    if (!isDuplicate) {
      unique.push(contact)
    }
  }

  return {
    unique,
    duplicates,
  }
}
