import type { ParseResult } from './csv-parser';

const VCF_HEADERS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'street',
  'city',
  'state',
  'zip',
  'organization',
  'notes',
];

/**
 * Unfold folded lines per RFC 6350.
 * A line starting with a space or tab is a continuation of the previous line.
 */
function unfoldLines(text: string): string[] {
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const unfolded: string[] = [];

  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.substring(1);
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

/**
 * Extract the value from a vCard property line.
 * Strips type parameters and returns just the value after the last colon.
 *
 * @param line - A vCard property line (e.g., "EMAIL;TYPE=work:user@example.com")
 * @returns The property value
 */
function extractValue(line: string): string {
  // Find the property name and params vs the value
  // The value is everything after the first colon that isn't part of the property name/params
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return '';
  return line.substring(colonIndex + 1).trim();
}

/**
 * Check if a line matches a given vCard property name (case-insensitive).
 * Handles property parameters like "EMAIL;TYPE=work:".
 */
function lineMatchesProperty(line: string, property: string): boolean {
  const upper = line.toUpperCase();
  return upper.startsWith(property + ':') || upper.startsWith(property + ';');
}

/**
 * Parse a single vCard block into a contact record.
 */
function parseVCardBlock(lines: string[]): Record<string, string> {
  const contact: Record<string, string> = {};

  for (const header of VCF_HEADERS) {
    contact[header] = '';
  }

  let foundEmail = false;
  let foundPhone = false;

  for (const line of lines) {
    if (lineMatchesProperty(line, 'N')) {
      // N:Last;First;Middle;Prefix;Suffix
      const value = extractValue(line);
      const parts = value.split(';');
      contact['last_name'] = (parts[0] || '').trim();
      contact['first_name'] = (parts[1] || '').trim();
    } else if (lineMatchesProperty(line, 'FN') && !contact['first_name'] && !contact['last_name']) {
      // FN:Full Name — fallback when N is not present
      const value = extractValue(line);
      const nameParts = value.trim().split(/\s+/);
      contact['first_name'] = nameParts[0] || '';
      contact['last_name'] = nameParts.slice(1).join(' ');
    } else if (lineMatchesProperty(line, 'EMAIL') && !foundEmail) {
      contact['email'] = extractValue(line);
      foundEmail = true;
    } else if (lineMatchesProperty(line, 'TEL') && !foundPhone) {
      contact['phone'] = extractValue(line);
      foundPhone = true;
    } else if (lineMatchesProperty(line, 'ADR')) {
      // ADR:;;Street;City;State;Zip;Country
      const value = extractValue(line);
      const parts = value.split(';');
      contact['street'] = (parts[2] || '').trim();
      contact['city'] = (parts[3] || '').trim();
      contact['state'] = (parts[4] || '').trim();
      contact['zip'] = (parts[5] || '').trim();
    } else if (lineMatchesProperty(line, 'ORG')) {
      contact['organization'] = extractValue(line);
    } else if (lineMatchesProperty(line, 'NOTE')) {
      contact['notes'] = extractValue(line);
    }
  }

  return contact;
}

/**
 * Parse a VCF (vCard) file and return headers, rows, and errors.
 * Custom RFC 6350 parser with no external dependencies.
 *
 * @param file - The VCF file to parse
 * @returns Parsed contact data
 */
export async function parseVCF(file: File): Promise<ParseResult> {
  const text = await file.text();
  const lines = unfoldLines(text);
  const errors: string[] = [];
  const rows: Record<string, string>[] = [];

  // Split into vCard blocks
  let currentBlock: string[] = [];
  let inCard = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toUpperCase() === 'BEGIN:VCARD') {
      inCard = true;
      currentBlock = [];
    } else if (trimmed.toUpperCase() === 'END:VCARD') {
      if (inCard && currentBlock.length > 0) {
        const contact = parseVCardBlock(currentBlock);

        // Only add if at least one meaningful field is present
        const hasData = Object.values(contact).some((v) => v !== '');
        if (hasData) {
          rows.push(contact);
        }
      }
      inCard = false;
      currentBlock = [];
    } else if (inCard) {
      currentBlock.push(trimmed);
    }
  }

  if (rows.length === 0) {
    errors.push('No valid vCard entries found in file');
  }

  return {
    headers: VCF_HEADERS,
    rows,
    errors,
  };
}
