import { parse, isValid } from 'date-fns';

const STANDARD_FORMATS = [
  'MM/dd/yyyy',
  'M/d/yyyy',
  'yyyy-MM-dd',
  'MM-dd-yyyy',
  'MMM d, yyyy',
  'MMMM d, yyyy',
  'MM/dd/yyyy HH:mm:ss',
  "yyyy-MM-dd'T'HH:mm:ss",
];

/** Parse a date string in various formats and return an ISO-8601 string, or null. */
export function parseDateToISO(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return null;
  }

  const ref = new Date();

  // Try standard formats
  for (const fmt of STANDARD_FORMATS) {
    const parsed = parse(trimmed, fmt, ref);
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  }

  // Try European dd/MM/yyyy only when the day portion is > 12 to avoid ambiguity
  const euroMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euroMatch) {
    const day = parseInt(euroMatch[1], 10);
    if (day > 12) {
      const parsed = parse(trimmed, 'dd/MM/yyyy', ref);
      if (isValid(parsed)) {
        return parsed.toISOString();
      }
    }
  }

  // Fallback: native Date constructor for remaining ISO-8601 variants
  const fallback = new Date(trimmed);
  if (isValid(fallback)) {
    return fallback.toISOString();
  }

  return null;
}
