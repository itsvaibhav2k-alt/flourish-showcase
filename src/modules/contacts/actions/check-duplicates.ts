'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Contact, CreateContactInput } from '../schemas/contact.schema'

export type DuplicateCheckResult = {
  hasDuplicates: boolean
  matches: DuplicateMatch[]
}

export type DuplicateMatch = {
  contact: Contact
  matchReason: string
  similarity: number
}

/**
 * Calculate Levenshtein distance between two strings
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
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
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
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Normalize phone for comparison
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

/**
 * Check for potential duplicate contacts in real-time
 */
export async function checkDuplicates(
  input: Partial<CreateContactInput>,
  excludeContactId?: string
): Promise<DuplicateCheckResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { hasDuplicates: false, matches: [] }
    }

    const supabase = await createClient()

    // Build query to fetch potential matches
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .limit(100)

    // If editing, exclude the current contact
    if (excludeContactId) {
      query = query.neq('id', excludeContactId)
    }

    const { data: contacts, error } = await query

    if (error || !contacts) {
      console.error('Error fetching contacts for duplicate check:', error)
      return { hasDuplicates: false, matches: [] }
    }

    const matches: DuplicateMatch[] = []

    for (const contact of contacts as Contact[]) {
      // Check email match (exact)
      if (input.email && contact.email) {
        if (input.email.toLowerCase().trim() === contact.email.toLowerCase().trim()) {
          matches.push({
            contact,
            matchReason: 'Exact email match',
            similarity: 1,
          })
          continue
        }
      }

      // Check phone match
      if (input.phone && contact.phone) {
        const inputPhone = normalizePhone(input.phone)
        const contactPhone = normalizePhone(contact.phone)
        if (inputPhone.length === 10 && inputPhone === contactPhone) {
          matches.push({
            contact,
            matchReason: 'Phone number match',
            similarity: 0.95,
          })
          continue
        }
      }

      // Check name similarity
      if (input.first_name && input.last_name && contact.first_name && contact.last_name) {
        const inputName = normalizeName(`${input.first_name} ${input.last_name}`)
        const contactName = normalizeName(`${contact.first_name} ${contact.last_name}`)
        const similarity = similarityRatio(inputName, contactName)

        if (similarity >= 0.85) {
          matches.push({
            contact,
            matchReason: `Similar name (${Math.round(similarity * 100)}% match)`,
            similarity,
          })
        }
      }
    }

    // Sort by similarity (highest first) and limit to top 5
    matches.sort((a, b) => b.similarity - a.similarity)
    const topMatches = matches.slice(0, 5)

    return {
      hasDuplicates: topMatches.length > 0,
      matches: topMatches,
    }
  } catch (error) {
    console.error('Error in checkDuplicates:', error)
    return { hasDuplicates: false, matches: [] }
  }
}
