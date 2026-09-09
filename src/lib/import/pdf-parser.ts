'use server';

import type { ParseResult } from './csv-parser';

const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.\w{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

/**
 * Detect if lines are delimited by tabs or pipes and parse as tabular data.
 *
 * @param lines - Non-empty text lines from the PDF
 * @returns Parsed result if tabular data detected, null otherwise
 */
function tryParseTabular(lines: string[]): ParseResult | null {
  if (lines.length < 2) return null;

  // Check for tab-delimited data
  const tabCounts = lines.map((line) => (line.match(/\t/g) || []).length);
  const firstTabCount = tabCounts[0];

  if (firstTabCount > 0 && tabCounts.every((c) => c === firstTabCount)) {
    const headers = lines[0].split('\t').map((h) => h.trim().toLowerCase());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = (values[j] || '').trim();
      }
      rows.push(row);
    }

    return { headers, rows, errors: [] };
  }

  // Check for pipe-delimited data
  const pipeCounts = lines.map((line) => (line.match(/\|/g) || []).length);
  const firstPipeCount = pipeCounts[0];

  if (firstPipeCount > 0 && pipeCounts.every((c) => c === firstPipeCount)) {
    const headers = lines[0].split('|').map((h) => h.trim().toLowerCase());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('|');
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = (values[j] || '').trim();
      }
      rows.push(row);
    }

    return { headers, rows, errors: [] };
  }

  return null;
}

/**
 * Extract contacts from unstructured text using regex patterns.
 * Best-effort extraction of emails, phones, and names.
 *
 * @param lines - Non-empty text lines from the PDF
 * @returns Parsed result with extracted contact data
 */
function extractFromUnstructured(lines: string[]): ParseResult {
  const emails: string[] = [];
  const phones: string[] = [];
  const names: string[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const emailMatches = line.match(EMAIL_REGEX);
    if (emailMatches) {
      emails.push(...emailMatches);
    }

    const phoneMatches = line.match(PHONE_REGEX);
    if (phoneMatches) {
      phones.push(...phoneMatches);
    }

    // Lines that don't contain emails or phones might be names
    if (!emailMatches && !phoneMatches && line.trim().length > 0) {
      const trimmed = line.trim();
      // Heuristic: name-like lines are short and don't contain too many numbers
      const digitCount = (trimmed.match(/\d/g) || []).length;
      if (trimmed.length < 100 && digitCount < 3) {
        names.push(trimmed);
      }
    }
  }

  // Deduplicate
  const uniqueEmails = [...new Set(emails)];
  const uniquePhones = [...new Set(phones)];

  const headers = ['name', 'email', 'phone'];
  const rows: Record<string, string>[] = [];

  // Build rows — try to align emails, phones, and names
  const maxLen = Math.max(uniqueEmails.length, uniquePhones.length, 1);

  for (let i = 0; i < maxLen; i++) {
    const row: Record<string, string> = {
      name: names[i] || '',
      email: uniqueEmails[i] || '',
      phone: uniquePhones[i] || '',
    };

    const hasData = Object.values(row).some((v) => v !== '');
    if (hasData) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    errors.push('No contact data could be extracted from the PDF');
  } else {
    errors.push(
      'PDF data was extracted using best-effort pattern matching. Please review the results carefully.',
    );
  }

  return { headers, rows, errors };
}

/**
 * Parse a PDF file buffer and extract contact data.
 * Attempts tabular parsing first, then falls back to regex extraction.
 * This function is server-only.
 *
 * @param buffer - The PDF file as a Buffer
 * @returns Parsed contact data (best-effort)
 */
export async function parsePDFContacts(buffer: Buffer): Promise<ParseResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfParse: (buf: Buffer) => Promise<{ text: string }>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfParse = (await (Function('return import("pdf-parse")')() as Promise<any>)).default;
    } catch {
      return {
        headers: [],
        rows: [],
        errors: ['PDF support requires the "pdf-parse" package. Please run: npm install pdf-parse'],
      };
    }
    const data = await pdfParse(buffer);

    const lines = data.text.split('\n').filter((line: string) => line.trim());

    if (lines.length === 0) {
      return {
        headers: [],
        rows: [],
        errors: ['PDF contains no extractable text'],
      };
    }

    // Try tabular parsing first
    const tabularResult = tryParseTabular(lines);
    if (tabularResult) {
      return tabularResult;
    }

    // Fall back to unstructured extraction
    return extractFromUnstructured(lines);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      headers: [],
      rows: [],
      errors: [`Failed to parse PDF: ${message}`],
    };
  }
}
