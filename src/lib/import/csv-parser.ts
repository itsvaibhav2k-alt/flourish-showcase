import Papa from 'papaparse';
import { splitFullName } from './name-utils';

export type ParseResult = {
  headers: string[]
  rows: Record<string, string>[]
  errors: string[]
}

/**
 * Strip BOM (Byte Order Mark) character from file content.
 * Google Sheets and Excel CSV exports often include a BOM at the start.
 */
function stripBOM(text: string): string {
  return text.replace(/^\uFEFF/, '')
}

/**
 * Filter out empty rows where all values are blank/whitespace
 */
function filterEmptyRows(rows: Record<string, string>[]): Record<string, string>[] {
  return rows.filter((row) =>
    Object.values(row).some((v) => v && v.trim() !== '')
  )
}

/**
 * Remove consecutive duplicate rows (artifact of merged cells in spreadsheets)
 */
function deduplicateMergedCells(rows: Record<string, string>[]): Record<string, string>[] {
  if (rows.length <= 1) return rows

  return rows.filter((row, index) => {
    if (index === 0) return true
    const prevRow = rows[index - 1]
    const keys = Object.keys(row)
    const allSame = keys.every((key) => row[key] === prevRow[key])
    return !allSame
  })
}

/**
 * Parse a CSV file and return headers, rows, and errors.
 * Handles BOM characters, empty rows, and merged-cell duplicates.
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  // Read file text first to strip BOM before parsing
  const rawText = await file.text()
  const cleanText = stripBOM(rawText)

  return new Promise((resolve) => {
    const errors: string[] = []

    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize headers: trim whitespace and convert to lowercase
        return header.trim().toLowerCase()
      },
      transform: (value: string) => {
        // Trim whitespace from all values
        return value.trim()
      },
      complete: (results) => {
        // Collect parsing errors
        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push(`Row ${error.row}: ${error.message}`)
          })
        }

        const headers = results.meta.fields || []
        let rows = results.data as Record<string, string>[]

        // Filter empty rows and deduplicate merged cells
        rows = filterEmptyRows(rows)
        rows = deduplicateMergedCells(rows)

        resolve({
          headers,
          rows,
          errors,
        })
      },
      error: (error) => {
        resolve({
          headers: [],
          rows: [],
          errors: [`Failed to parse CSV: ${error.message}`],
        })
      },
    })
  })
}

/**
 * Auto-detect column mappings based on common header names
 */
export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  // Common variations for each field
  const fieldPatterns: Record<string, string[]> = {
    full_name: ['full name', 'name', 'fullname', 'contact name', 'donor name', 'display name'],
    first_name: ['first name', 'firstname', 'first', 'given name', 'fname'],
    last_name: ['last name', 'lastname', 'last', 'surname', 'family name', 'lname'],
    email: ['email', 'email address', 'e-mail', 'mail'],
    phone: ['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell'],
    street: ['street', 'address', 'address line 1', 'address1', 'street address'],
    city: ['city', 'town'],
    state: ['state', 'province', 'region'],
    zip: ['zip', 'zip code', 'zipcode', 'postal code', 'postcode', 'postal'],
    tags: ['tags', 'tag', 'categories', 'category', 'labels'],
    notes: ['notes', 'note', 'comments', 'comment', 'description'],
    is_donor: ['is donor', 'donor', 'is_donor', 'donortype'],
    is_volunteer: ['is volunteer', 'volunteer', 'is_volunteer'],
    // Gift-specific fields
    amount: ['amount', 'gift amount', 'donation amount', 'donation', 'value'],
    gift_date: ['gift date', 'date', 'donation date', 'transaction date', 'gift_date'],
    gift_type: ['gift type', 'type', 'donation type', 'gift_type'],
    campaign: ['campaign', 'fund', 'appeal', 'project'],
    payment_method: ['payment method', 'payment', 'method', 'payment_method', 'pay method'],
  }

  // Normalize headers for matching
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())

  // Try to match each field
  Object.entries(fieldPatterns).forEach(([field, patterns]) => {
    for (const header of normalizedHeaders) {
      // Exact match or contains pattern
      const matchedPattern = patterns.find(
        (pattern) => header === pattern || header.includes(pattern)
      )

      if (matchedPattern) {
        // Find the original header (with proper casing)
        const originalHeader = headers[normalizedHeaders.indexOf(header)]
        mapping[field] = originalHeader
        break
      }
    }
  })

  return mapping
}

/**
 * Preview the first N rows of parsed data
 */
export function previewRows(
  rows: Record<string, string>[],
  limit: number = 5
): Record<string, string>[] {
  return rows.slice(0, limit)
}

/**
 * Validate that required fields are mapped
 */
export function validateMapping(
  mapping: Record<string, string>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = []

  requiredFields.forEach((field) => {
    if (!mapping[field]) {
      missingFields.push(field)
    }
  })

  return {
    valid: missingFields.length === 0,
    missingFields,
  }
}

/**
 * Apply column mapping to transform raw rows into mapped data
 */
export function applyMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): Record<string, string>[] {
  return rows.map((row) => {
    const mappedRow: Record<string, string> = {}

    Object.entries(mapping).forEach(([targetField, sourceColumn]) => {
      if (sourceColumn && row[sourceColumn] !== undefined) {
        mappedRow[targetField] = row[sourceColumn]
      }
    })

    // Auto-split full_name into first_name + last_name
    if (mappedRow.full_name && !mappedRow.first_name) {
      const { first_name, last_name } = splitFullName(mappedRow.full_name);
      mappedRow.first_name = first_name;
      mappedRow.last_name = last_name;
      delete mappedRow.full_name;
    }

    return mappedRow;
  });
}
