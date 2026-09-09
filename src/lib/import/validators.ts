import { z } from 'zod';
import {
  createContactSchema,
  type CreateContactInput,
} from '@/modules/contacts/schemas/contact.schema';
import {
  createGiftSchema,
  type CreateGiftInput,
} from '@/modules/donors/schemas/gift.schema';
import { parseDateToISO } from './date-utils';
import { splitFullName } from './name-utils';

export type ColumnMapping = Record<string, string>

/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX).
 * Handles formats like "(571) 367-4103", "5713674103", "+1 571-367-4103"
 * Returns null if the number cannot be normalized.
 */
export function normalizePhoneToE164(phone: string): string | null {
  if (!phone) return null

  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Handle 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // Handle 11-digit US number starting with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  // Return original trimmed if we can't normalize (international numbers, etc.)
  return phone.trim() || null
}

export type ValidationResult<T> = {
  valid: boolean
  errors: string[]
  data: T | null
  rowNumber?: number
}

/**
 * Validate a single contact row from CSV
 */
export function validateContactRow(
  row: Record<string, string>,
  mapping: ColumnMapping,
  rowNumber?: number
): ValidationResult<CreateContactInput> {
  const errors: string[] = []

  try {
    // Extract and transform data based on mapping
    const contactData: Partial<CreateContactInput> = {};

    // Handle full_name mapping (from platform parsers or auto-detected)
    if (mapping.full_name && row[mapping.full_name]) {
      const { first_name, last_name } = splitFullName(row[mapping.full_name]);
      contactData.first_name = first_name;
      contactData.last_name = last_name || first_name; // fallback if no last name
    }

    // Required fields
    if (contactData.first_name) {
      // Already set from full_name above
    } else if (mapping.first_name && row[mapping.first_name]) {
      contactData.first_name = row[mapping.first_name];
    } else {
      errors.push('First name is required');
    }

    if (contactData.last_name) {
      // Already set from full_name above
    } else if (mapping.last_name && row[mapping.last_name]) {
      contactData.last_name = row[mapping.last_name];
    } else {
      errors.push('Last name is required');
    }

    // Optional fields
    if (mapping.email && row[mapping.email]) {
      contactData.email = row[mapping.email]
    }

    if (mapping.phone && row[mapping.phone]) {
      contactData.phone = normalizePhoneToE164(row[mapping.phone]) ?? row[mapping.phone]
    }

    // Address fields
    const hasAddressFields =
      (mapping.street && row[mapping.street]) ||
      (mapping.city && row[mapping.city]) ||
      (mapping.state && row[mapping.state]) ||
      (mapping.zip && row[mapping.zip])

    if (hasAddressFields) {
      contactData.address = {
        street: mapping.street ? row[mapping.street] : undefined,
        city: mapping.city ? row[mapping.city] : undefined,
        state: mapping.state ? row[mapping.state] : undefined,
        zip: mapping.zip ? row[mapping.zip] : undefined,
      }
    }

    // Tags (comma-separated or single value)
    if (mapping.tags && row[mapping.tags]) {
      const tagString = row[mapping.tags]
      contactData.tags = tagString.split(',').map((tag) => tag.trim()).filter(Boolean)
    }

    // Boolean fields
    if (mapping.is_donor && row[mapping.is_donor]) {
      const value = row[mapping.is_donor].toLowerCase()
      contactData.is_donor = ['true', 'yes', '1', 'y'].includes(value)
    }

    if (mapping.is_volunteer && row[mapping.is_volunteer]) {
      const value = row[mapping.is_volunteer].toLowerCase()
      contactData.is_volunteer = ['true', 'yes', '1', 'y'].includes(value)
    }

    // Validate with Zod schema
    const validated = createContactSchema.parse(contactData)

    return {
      valid: true,
      errors: [],
      data: validated,
      rowNumber,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        errors.push(`${err.path.join('.')}: ${err.message}`)
      })
    } else if (error instanceof Error) {
      errors.push(error.message)
    } else {
      errors.push('Unknown validation error')
    }

    return {
      valid: false,
      errors,
      data: null,
      rowNumber,
    }
  }
}

/**
 * Validate a single gift row from CSV
 */
export function validateGiftRow(
  row: Record<string, string>,
  mapping: ColumnMapping,
  rowNumber?: number
): ValidationResult<CreateGiftInput & { contact_email?: string }> {
  const errors: string[] = []

  try {
    // Extract and transform data based on mapping
    const giftData: Partial<CreateGiftInput & { contact_email?: string }> = {}

    // Contact identification (we'll need email to match)
    if (mapping.email && row[mapping.email]) {
      giftData.contact_email = row[mapping.email]
    } else {
      errors.push('Email is required to match with existing contact')
    }

    // Required fields
    if (mapping.amount && row[mapping.amount]) {
      const amountStr = row[mapping.amount].replace(/[$,]/g, '') // Remove $ and commas
      const amount = parseFloat(amountStr)
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number')
      } else {
        giftData.amount = amount
      }
    } else {
      errors.push('Amount is required')
    }

    if (mapping.gift_date && row[mapping.gift_date]) {
      const dateStr = row[mapping.gift_date];
      const isoDate = parseDateToISO(dateStr);
      if (!isoDate) {
        errors.push('Invalid date format');
      } else {
        giftData.gift_date = isoDate;
      }
    } else {
      errors.push('Gift date is required')
    }

    // Gift type (with default)
    if (mapping.gift_type && row[mapping.gift_type]) {
      const giftType = row[mapping.gift_type].toLowerCase().replace(/\s+/g, '-')
      if (['one-time', 'recurring', 'pledge', 'in-kind'].includes(giftType)) {
        giftData.gift_type = giftType as 'one-time' | 'recurring' | 'pledge' | 'in-kind'
      } else {
        errors.push('Invalid gift type. Must be: one-time, recurring, pledge, or in-kind')
      }
    } else {
      // Default to one-time
      giftData.gift_type = 'one-time'
    }

    // Optional fields
    if (mapping.campaign && row[mapping.campaign]) {
      giftData.campaign = row[mapping.campaign]
    }

    if (mapping.payment_method && row[mapping.payment_method]) {
      giftData.payment_method = row[mapping.payment_method]
    }

    if (mapping.notes && row[mapping.notes]) {
      giftData.notes = row[mapping.notes]
    }

    // If there are errors, return early
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        data: null,
        rowNumber,
      }
    }

    // Note: We can't fully validate with createGiftSchema yet because we don't have contact_id
    // That will be resolved in the import action after matching contacts
    return {
      valid: true,
      errors: [],
      data: giftData as CreateGiftInput & { contact_email?: string },
      rowNumber,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        errors.push(`${err.path.join('.')}: ${err.message}`)
      })
    } else if (error instanceof Error) {
      errors.push(error.message)
    } else {
      errors.push('Unknown validation error')
    }

    return {
      valid: false,
      errors,
      data: null,
      rowNumber,
    }
  }
}

/**
 * Batch validate multiple rows
 */
export function validateContactRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): {
  valid: ValidationResult<CreateContactInput>[]
  invalid: ValidationResult<CreateContactInput>[]
  summary: {
    total: number
    validCount: number
    invalidCount: number
  }
} {
  const valid: ValidationResult<CreateContactInput>[] = []
  const invalid: ValidationResult<CreateContactInput>[] = []

  rows.forEach((row, index) => {
    const result = validateContactRow(row, mapping, index + 1)
    if (result.valid) {
      valid.push(result)
    } else {
      invalid.push(result)
    }
  })

  return {
    valid,
    invalid,
    summary: {
      total: rows.length,
      validCount: valid.length,
      invalidCount: invalid.length,
    },
  }
}

/**
 * Batch validate multiple gift rows
 */
export function validateGiftRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): {
  valid: ValidationResult<CreateGiftInput & { contact_email?: string }>[]
  invalid: ValidationResult<CreateGiftInput & { contact_email?: string }>[]
  summary: {
    total: number
    validCount: number
    invalidCount: number
  }
} {
  const valid: ValidationResult<CreateGiftInput & { contact_email?: string }>[] = []
  const invalid: ValidationResult<CreateGiftInput & { contact_email?: string }>[] = []

  rows.forEach((row, index) => {
    const result = validateGiftRow(row, mapping, index + 1)
    if (result.valid) {
      valid.push(result)
    } else {
      invalid.push(result)
    }
  })

  return {
    valid,
    invalid,
    summary: {
      total: rows.length,
      validCount: valid.length,
      invalidCount: invalid.length,
    },
  }
}
